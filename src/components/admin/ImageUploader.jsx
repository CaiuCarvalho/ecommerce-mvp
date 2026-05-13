import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function ImageUploader({ productId, images = [], onImagesChange }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  async function uploadFiles(files) {
    if (!productId) {
      toast.error('Salve o produto antes de adicionar imagens.')
      return
    }

    setUploading(true)
    const newImages = []

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name}: formato não suportado`)
        continue
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name}: maior que 2MB`)
        continue
      }

      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const path = `products/${productId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file)

      if (uploadError) {
        toast.error(`Erro ao enviar ${file.name}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(path)

      const nextPosition = images.length + newImages.length + 1

      const { data: imgData, error: dbError } = await supabase
        .from('product_images')
        .insert({ product_id: productId, url: publicUrl, position: nextPosition })
        .select()
        .single()

      if (dbError) {
        toast.error(`Erro ao registrar ${file.name}`)
        continue
      }

      newImages.push(imgData)
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages])
      toast.success(`${newImages.length} imagem(ns) enviada(s)`)
    }

    setUploading(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) uploadFiles(files)
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files)
    if (files.length > 0) uploadFiles(files)
    e.target.value = ''
  }

  async function handleDelete(image) {
    // Extract path from URL for storage deletion
    const urlParts = image.url.split('/product-images/')
    if (urlParts[1]) {
      await supabase.storage.from('product-images').remove([urlParts[1]])
    }

    await supabase.from('product_images').delete().eq('id', image.id)

    const updated = images
      .filter(i => i.id !== image.id)
      .map((img, idx) => ({ ...img, position: idx + 1 }))

    // Update positions in DB
    for (const img of updated) {
      await supabase.from('product_images').update({ position: img.position }).eq('id', img.id)
    }

    onImagesChange(updated)
    toast.success('Imagem removida')
  }

  async function handleSetPrimary(image) {
    const reordered = images.map(img => ({
      ...img,
      position: img.id === image.id ? 1 : img.position >= image.position ? img.position : img.position + 1,
    }))

    // Rebuild positions sequentially
    const sorted = [...reordered].sort((a, b) => {
      if (a.id === image.id) return -1
      if (b.id === image.id) return 1
      return a.position - b.position
    }).map((img, idx) => ({ ...img, position: idx + 1 }))

    for (const img of sorted) {
      await supabase.from('product_images').update({ position: img.position }).eq('id', img.id)
    }

    onImagesChange(sorted)
    toast.success('Imagem principal definida')
  }

  async function handleMoveLeft(index) {
    if (index === 0) return
    const updated = [...images]
    const temp = updated[index].position
    updated[index].position = updated[index - 1].position
    updated[index - 1].position = temp;
    [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]]

    for (const img of updated) {
      await supabase.from('product_images').update({ position: img.position }).eq('id', img.id)
    }
    onImagesChange(updated)
  }

  async function handleMoveRight(index) {
    if (index === images.length - 1) return
    const updated = [...images]
    const temp = updated[index].position
    updated[index].position = updated[index + 1].position
    updated[index + 1].position = temp;
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]

    for (const img of updated) {
      await supabase.from('product_images').update({ position: img.position }).eq('id', img.id)
    }
    onImagesChange(updated)
  }

  const sortedImages = [...images].sort((a, b) => a.position - b.position)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Imagens do Produto
      </label>

      {/* Upload area */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploading ? (
          <p className="text-sm text-gray-500">Enviando imagens...</p>
        ) : (
          <>
            <p className="text-sm text-gray-600 font-medium">
              Clique ou arraste imagens aqui
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WEBP — máx. 2MB</p>
          </>
        )}
      </div>

      {/* Image grid */}
      {sortedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
          {sortedImages.map((image, index) => (
            <div
              key={image.id}
              className={`relative group rounded-lg overflow-hidden border-2 ${
                index === 0 ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              <div className="aspect-square bg-gray-100">
                <img
                  src={image.url}
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Badge for primary */}
              {index === 0 && (
                <span className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Principal
                </span>
              )}

              {/* Action overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {index !== 0 && (
                  <button
                    onClick={() => handleSetPrimary(image)}
                    title="Definir como principal"
                    className="p-1.5 bg-white rounded text-xs hover:bg-gray-100"
                  >
                    ★
                  </button>
                )}
                {index > 0 && (
                  <button
                    onClick={() => handleMoveLeft(index)}
                    title="Mover para esquerda"
                    className="p-1.5 bg-white rounded text-xs hover:bg-gray-100"
                  >
                    ←
                  </button>
                )}
                {index < sortedImages.length - 1 && (
                  <button
                    onClick={() => handleMoveRight(index)}
                    title="Mover para direita"
                    className="p-1.5 bg-white rounded text-xs hover:bg-gray-100"
                  >
                    →
                  </button>
                )}
                <button
                  onClick={() => handleDelete(image)}
                  title="Remover"
                  className="p-1.5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
