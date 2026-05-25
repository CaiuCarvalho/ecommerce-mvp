import { useState } from 'react'
import { MapPin, Plus, Star, Trash, Edit2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import toast from 'react-hot-toast'
import AddressModal from './AddressModal'

export default function AddressManager({ user }) {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [addressToEdit, setAddressToEdit] = useState(null)

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id
  })

  async function setFavorite(id) {
    try {
      const { error } = await supabase.from('addresses').update({ is_favorite: true }).eq('id', id)
      if (error) throw error
      toast.success('Endereço favorito atualizado!')
      queryClient.invalidateQueries(['addresses'])
    } catch (err) {
      toast.error('Erro ao atualizar favorito.')
    }
  }

  async function deleteAddress(id) {
    if (!confirm('Deseja excluir este endereço?')) return
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', id)
      if (error) throw error
      toast.success('Endereço removido.')
      queryClient.invalidateQueries(['addresses'])
    } catch (err) {
      toast.error('Erro ao remover endereço.')
    }
  }

  function handleAddNew() {
    setAddressToEdit(null)
    setModalOpen(true)
  }

  function handleEdit(addr) {
    setAddressToEdit(addr)
    setModalOpen(true)
  }

  return (
    <Card className="mt-8">
      <CardHeader className="pb-4 border-b border-border flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-muted-foreground" />
          Meus Endereços
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleAddNew} className="h-8 gap-1 shrink-0">
          <Plus className="w-4 h-4" /> Novo
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex justify-center py-6"><Spinner size="sm" /></div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Nenhum endereço cadastrado.
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div key={addr.id} className={`p-4 rounded-lg border ${addr.is_favorite ? 'border-agon-orange bg-agon-orange/5' : 'border-border'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{addr.label}</span>
                    {addr.is_favorite && <span className="text-[10px] bg-agon-orange text-white px-2 py-0.5 rounded-full uppercase font-bold">Favorito</span>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {addr.street}, {addr.number} {addr.complement && `- ${addr.complement}`}
                    <br/>
                    {addr.neighborhood} - {addr.city}/{addr.state} - CEP: {addr.cep}
                  </p>
                </div>
                <div className="flex flex-row sm:flex-col gap-4 sm:gap-2 items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                  <button onClick={() => handleEdit(addr)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                  {!addr.is_favorite && (
                    <button onClick={() => setFavorite(addr.id)} className="text-xs text-muted-foreground hover:text-agon-orange flex items-center gap-1 transition-colors">
                      <Star className="w-3.5 h-3.5" /> Tornar Favorito
                    </button>
                  )}
                  <button onClick={() => deleteAddress(addr.id)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                    <Trash className="w-3.5 h-3.5" /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AddressModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        addressToEdit={addressToEdit}
      />
    </Card>
  )
}
