import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'
import { ChevronRight, FolderOpen, Tag, Pencil, Trash2, Power, Plus } from 'lucide-react'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryParent, setNewCategoryParent] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*, products(id, is_active)')
      .order('name')

    if (error) {
      toast.error('Erro ao carregar categorias')
    } else {
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

  // Organizar categorias em árvore: pais com seus filhos
  const parentCategories = categories.filter(c => c.parent_id === null)
  const getChildren = (parentId) => categories.filter(c => c.parent_id === parentId)

  async function handleAddCategory(e) {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    const slug = generateSlug(newCategoryName)
    const payload = {
      name: newCategoryName.trim(),
      slug,
      is_active: true,
      parent_id: newCategoryParent ? parseInt(newCategoryParent) : null
    }

    const { error } = await supabase
      .from('categories')
      .insert(payload)
      .select()
      .single()

    if (error) {
      toast.error('Erro ao criar categoria. Talvez o slug já exista.')
    } else {
      toast.success(newCategoryParent ? 'Subcategoria criada!' : 'Categoria criada!')
      setNewCategoryName('')
      setNewCategoryParent('')
      loadCategories()
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
      const activeCount = await checkActiveProducts(category.id)
      if (activeCount > 0) {
        const confirm = window.confirm(
          `ATENÇÃO: Existem ${activeCount} produtos ativos nesta categoria. Ao desativá-la, esses produtos não serão visíveis nas buscas por categoria. Deseja continuar?`
        )
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

  async function handleDelete(category) {
    // Se é uma categoria pai, verificar se tem filhos
    const children = getChildren(category.id)
    if (children.length > 0) {
      alert(
        `Esta categoria possui ${children.length} subcategoria(s). Você precisa primeiro excluir ou mover as subcategorias antes de excluir a categoria pai.`
      )
      return
    }

    const productsCount = await checkAnyProducts(category.id)
    if (productsCount > 0) {
      alert(
        `Existem ${productsCount} produto(s) vinculados a esta categoria. Para excluí-la, primeiro apague ou mova esses produtos. Considere desativar a categoria em vez de excluí-la.`
      )
      return
    }

    const confirm = window.confirm('Deseja realmente EXCLUIR esta categoria permanentemente?')
    if (!confirm) return

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id)

    if (error) {
      toast.error('Erro ao excluir categoria')
    } else {
      toast.success('Categoria excluída permanentemente')
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
      toast.error('Erro ao renomear. Talvez o slug gerado já exista.')
    } else {
      toast.success('Categoria renomeada')
      loadCategories()
    }
  }

  async function handleChangeParent(category) {
    // Apenas subcategorias podem ser movidas
    const parentOptions = parentCategories
      .filter(p => p.id !== category.id && p.id !== category.parent_id)
      .map(p => `${p.id}: ${p.name}`)
      .join('\n')

    const input = window.prompt(
      `Mover "${category.name}" para outra categoria pai.\n\nDigite o ID da nova categoria pai (ou deixe vazio para torná-la uma categoria principal):\n\nCategorias disponíveis:\n${parentOptions}`
    )

    if (input === null) return // Cancelou

    const newParentId = input.trim() === '' ? null : parseInt(input.trim())

    if (newParentId !== null && isNaN(newParentId)) {
      toast.error('ID inválido')
      return
    }

    // Verificar que não está se atribuindo como pai de si mesmo
    if (newParentId === category.id) {
      toast.error('Uma categoria não pode ser pai de si mesma')
      return
    }

    const { error } = await supabase
      .from('categories')
      .update({ parent_id: newParentId })
      .eq('id', category.id)

    if (error) {
      toast.error('Erro ao mover categoria')
    } else {
      toast.success(newParentId ? 'Categoria movida!' : 'Categoria tornada principal!')
      loadCategories()
    }
  }

  // Componente de linha para uma categoria (pai ou filha)
  function CategoryRow({ cat, isChild = false }) {
    const children = isChild ? [] : getChildren(cat.id)

    return (
      <>
        <tr className={`hover:bg-gray-50 ${isChild ? 'bg-gray-50/50' : ''}`}>
          <td className="px-5 py-3 text-gray-400 text-xs">{cat.id}</td>
          <td className="px-5 py-3">
            <div className={`flex items-center gap-2 ${isChild ? 'pl-6' : ''}`}>
              {isChild ? (
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              ) : (
                <FolderOpen className="w-4 h-4 text-agon-orange flex-shrink-0" />
              )}
              <div>
                <p className={`font-medium ${isChild ? 'text-gray-700 text-sm' : 'text-gray-900'}`}>
                  {cat.name}
                </p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">/{cat.slug}</p>
              </div>
            </div>
          </td>
          <td className="px-5 py-3">
            {isChild ? (
              <span className="text-xs text-gray-400 italic">
                {parentCategories.find(p => p.id === cat.parent_id)?.name}
              </span>
            ) : (
              <span className="text-xs text-gray-500 font-medium">
                —
              </span>
            )}
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
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => handleEditName(cat)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Renomear"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleToggleStatus(cat)}
                className={`p-1.5 rounded transition-colors ${
                  cat.is_active !== false
                    ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                }`}
                title={cat.is_active !== false ? 'Desativar' : 'Ativar'}
              >
                <Power className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleChangeParent(cat)}
                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                title="Mover"
              >
                <Tag className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(cat)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Excluir"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        </tr>
        {/* Renderizar subcategorias logo abaixo do pai */}
        {children.map(child => (
          <CategoryRow key={child.id} cat={child} isChild />
        ))}
      </>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Categorias</h1>

      {/* Formulário de Nova Categoria */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </h2>
        <form onSubmit={handleAddCategory} className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            placeholder="Nome da categoria"
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newCategoryParent}
            onChange={e => setNewCategoryParent(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Categoria Principal (sem pai)</option>
            {parentCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                ↳ Subcategoria de: {cat.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!newCategoryName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            Adicionar
          </button>
        </form>
      </div>

      {/* Tabela de Categorias */}
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
                <th className="px-5 py-3 font-medium text-gray-600">Pai</th>
                <th className="px-5 py-3 font-medium text-gray-600">Produtos</th>
                <th className="px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="px-5 py-3 font-medium text-gray-600 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parentCategories.map(cat => (
                <CategoryRow key={cat.id} cat={cat} />
              ))}
              {/* Categorias órfãs (parent_id aponta para pai inexistente) — caso improvaável */}
              {categories
                .filter(c => c.parent_id !== null && !parentCategories.find(p => p.id === c.parent_id))
                .map(cat => (
                  <CategoryRow key={cat.id} cat={cat} isChild />
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Legenda */}
      <div className="mt-4 flex items-center gap-6 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <FolderOpen className="w-3.5 h-3.5 text-agon-orange" /> Categoria Principal
        </span>
        <span className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" /> Subcategoria
        </span>
      </div>
    </div>
  )
}
