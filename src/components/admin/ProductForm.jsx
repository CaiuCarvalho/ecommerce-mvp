import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import ImageUploader from './ImageUploader'
import toast from 'react-hot-toast'

export default function ProductForm({ productId = null }) {
  const navigate = useNavigate()
  const isEditing = Boolean(productId)

  const [categories, setCategories] = useState([])
  const [images, setImages] = useState([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [savedProductId, setSavedProductId] = useState(productId)

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    category_id: '',
    stock_status: 'available',
    is_active: true,
  })

  // Load categories
  useEffect(() => {
    supabase.from('categories').select('*').order('id').then(({ data }) => {
      setCategories(data || [])
    })
  }, [])

  // Load product data if editing
  useEffect(() => {
    if (!productId) return

    async function loadProduct() {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*)')
        .eq('id', productId)
        .single()

      if (error || !data) {
        toast.error('Produto não encontrado')
        navigate('/admin/produtos')
        return
      }

      setForm({
        name: data.name || '',
        description: data.description || '',
        price: data.price?.toString() || '',
        compare_price: data.compare_price?.toString() || '',
        category_id: data.category_id?.toString() || '',
        stock_status: data.stock_status || 'available',
        is_active: data.is_active ?? true,
      })

      const sorted = (data.product_images || []).sort((a, b) => a.position - b.position)
      setImages(sorted)
    }

    loadProduct()
  }, [productId, navigate])

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()

    if (!form.name.trim()) return toast.error('Nome é obrigatório')
    if (!form.price || parseFloat(form.price) < 0) return toast.error('Preço inválido')
    if (!form.category_id) return toast.error('Selecione uma categoria')

    setSaving(true)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      category_id: parseInt(form.category_id),
      stock_status: form.stock_status,
      is_active: form.is_active,
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', productId)

        if (error) throw error
        toast.success('Produto atualizado!')
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single()

        if (error) throw error
        setSavedProductId(data.id)
        toast.success('Produto criado! Agora adicione imagens.')
        // Navigate to edit mode so images can be uploaded
        navigate(`/admin/produtos/${data.id}`, { replace: true })
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return

    setDeleting(true)
    try {
      // Delete images from storage
      for (const image of images) {
        const urlParts = image.url.split('/product-images/')
        if (urlParts[1]) {
          await supabase.storage.from('product-images').remove([urlParts[1]])
        }
      }

      const { error } = await supabase.from('products').delete().eq('id', productId)
      if (error) throw error

      toast.success('Produto excluído')
      navigate('/admin/produtos')
    } catch (err) {
      toast.error(err.message || 'Erro ao excluir')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/produtos')}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Description */}
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título do Produto
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Ex: Fone Bluetooth Premium"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                rows={6}
                placeholder="Descreva o produto em detalhes: material, tamanho, funcionalidades..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>
          </section>

          {/* Images */}
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <ImageUploader
              productId={savedProductId}
              images={images}
              onImagesChange={setImages}
            />
          </section>

          {/* Pricing */}
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Preços</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço de venda (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={e => handleChange('price', e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço original (R$)
                  <span className="text-gray-400 font-normal ml-1">— opcional</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.compare_price}
                  onChange={e => handleChange('compare_price', e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Se preenchido, aparece riscado ao lado do preço de venda.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Status</h2>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => handleChange('is_active', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Produto ativo (visível na loja)</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estoque
              </label>
              <select
                value={form.stock_status}
                onChange={e => handleChange('stock_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Disponível</option>
                <option value="out_of_stock">Esgotado</option>
              </select>
            </div>
          </section>

          {/* Category */}
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Organização</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={form.category_id}
                onChange={e => handleChange('category_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Summary (editing only) */}
          {isEditing && (
            <section className="bg-gray-50 border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-2">Resumo</h2>
              <dl className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <dt>Imagens</dt>
                  <dd>{images.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Status</dt>
                  <dd>{form.is_active ? '🟢 Ativo' : '🔴 Inativo'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Estoque</dt>
                  <dd>{form.stock_status === 'available' ? 'Disponível' : 'Esgotado'}</dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      </div>
    </form>
  )
}
