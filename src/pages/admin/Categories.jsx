import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*, products(id, is_active)')
      .order('id')
    
    if (error) {
      toast.error('Erro ao carregar categorias')
    } else {
      // Calcular contagem de produtos localmente para facilidade
      const catsWithCount = (data || []).map(cat => ({
        ...cat,
        totalProducts: cat.products ? cat.products.length : 0,
        activeProducts: cat.products ? cat.products.filter(p => p.is_active).length : 0
      }))
      setCategories(catsWithCount)
    }
    setLoading(false)
  }

  function generateSlug(text) {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  async function handleAddCategory(e) {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    const slug = generateSlug(newCategoryName)
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newCategoryName.trim(), slug, is_active: true })
      .select()
      .single()

    if (error) {
      toast.error('Erro ao criar categoria. Talvez o slug ja exista.')
    } else {
      toast.success('Categoria criada!')
      setNewCategoryName('')
      setCategories([...categories, data])
    }
  }

  async function checkActiveProducts(categoryId) {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('is_active', true)
    return count || 0
  }

  async function checkAnyProducts(categoryId) {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
    return count || 0
  }

  async function handleToggleStatus(category) {
    if (category.is_active) {
      const activeProductsCount = await checkActiveProducts(category.id)
      if (activeProductsCount > 0) {
        const confirm = window.confirm(`ATENCAO: Existem ${activeProductsCount} produtos ativos nesta categoria. Ao desativa-la, esses produtos não serao visíveis nas buscas por categoria. Deseja continuar?`)
        if (!confirm) return
      }
    }

    const { error } = await supabase
      .from('categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id)

    if (error) {
      toast.error('Erro ao atualizar categoria')
    } else {
      toast.success(`Categoria ${category.is_active ? 'desativada' : 'ativada'}`)
      loadCategories()
    }
  }

  async function handleDelete(categoryId) {
    const productsCount = await checkAnyProducts(categoryId)
    if (productsCount > 0) {
      alert(`Existem ${productsCount} produtos (ativos ou inativos) vinculados a esta categoria. Para excluir a categoria definitivamente, voce precisa primeiro apagar ou mover esses produtos. Considere desativar a categoria em vez de exclui-la.`)
      return
    }

    const confirm = window.confirm('Deseja realmente EXCLUIR esta categoria permanentemente?')
    if (!confirm) return

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      toast.error('Erro ao excluir categoria')
    } else {
      toast.success('Categoria excluida permanentemente')
      loadCategories()
    }
  }

  async function handleEditName(category) {
    const newName = window.prompt('Digite o novo nome para a categoria:', category.name)
    if (!newName || newName.trim() === '' || newName === category.name) return

    const slug = generateSlug(newName)

    const { error } = await supabase
      .from('categories')
      .update({ name: newName.trim(), slug })
      .eq('id', category.id)

    if (error) {
      toast.error('Erro ao renomear. Talvez o slug gerado ja exista.')
    } else {
      toast.success('Categoria renomeada')
      loadCategories()
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Categorias</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Nova Categoria</h2>
        <form onSubmit={handleAddCategory} className="flex gap-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            placeholder="Nome da categoria"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newCategoryName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Adicionar
          </button>
        </form>
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-500">Nenhuma categoria encontrada.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 font-medium text-gray-600 w-16">ID</th>
                <th className="px-5 py-3 font-medium text-gray-600">Nome / Slug</th>
                <th className="px-5 py-3 font-medium text-gray-600">Produtos</th>
                <th className="px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="px-5 py-3 font-medium text-gray-600 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-500">{cat.id}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">/{cat.slug}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-gray-900 font-medium">{cat.totalProducts}</span>
                    <span className="text-xs text-gray-500 ml-1">({cat.activeProducts} ativos)</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block w-2 h-2 rounded-full ${cat.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="ml-1.5 text-gray-600">{cat.is_active !== false ? 'Ativa' : 'Inativa'}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => handleEditName(cat)} className="text-blue-600 hover:underline">
                        Renomear
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(cat)} 
                        className={cat.is_active !== false ? "text-yellow-600 hover:underline" : "text-green-600 hover:underline"}
                      >
                        {cat.is_active !== false ? 'Desativar' : 'Ativar'}
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:underline">
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
