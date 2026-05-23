import { useState } from 'react'
import { MapPin, Plus, Star, Trash } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Spinner } from '../../../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function AddressManager({ user }) {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [label, setLabel] = useState('Casa')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState('')

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['user_addresses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id
  })

  async function handleCepBlur() {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) {
      setCepError('CEP deve ter 8 dígitos')
      return
    }
    setCepLoading(true)
    setCepError('')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepError('CEP não encontrado')
      } else {
        setStreet(data.logradouro || '')
        setNeighborhood(data.bairro || '')
        setCity(data.localidade || '')
        setState(data.uf || '')
      }
    } catch {
      setCepError('Erro ao buscar CEP')
    } finally {
      setCepLoading(false)
    }
  }

  async function handleAddAddress(e) {
    e.preventDefault()
    try {
      const isFirst = addresses.length === 0
      const { error } = await supabase.from('user_addresses').insert({
        user_id: user.id,
        label,
        cep: cep.replace(/\D/g, ''),
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        is_favorite: isFirst // ensure first is favorite
      })
      if (error) throw error
      
      toast.success('Endereço adicionado!')
      setIsAdding(false)
      resetForm()
      queryClient.invalidateQueries(['user_addresses'])
      // Também invalida o favorito pro header
      queryClient.invalidateQueries(['user_addresses', 'favorite'])
    } catch (err) {
      toast.error('Erro ao adicionar endereço.')
      console.error(err)
    }
  }

  async function setFavorite(id) {
    try {
      const { error } = await supabase.from('user_addresses').update({ is_favorite: true }).eq('id', id)
      if (error) throw error
      toast.success('Endereço favorito atualizado!')
      queryClient.invalidateQueries(['user_addresses'])
    } catch (err) {
      toast.error('Erro ao atualizar favorito.')
    }
  }

  async function deleteAddress(id) {
    if (!confirm('Deseja excluir este endereço?')) return
    try {
      const { error } = await supabase.from('user_addresses').delete().eq('id', id)
      if (error) throw error
      toast.success('Endereço removido.')
      queryClient.invalidateQueries(['user_addresses'])
    } catch (err) {
      toast.error('Erro ao remover endereço.')
    }
  }

  function resetForm() {
    setCep('')
    setStreet('')
    setNumber('')
    setComplement('')
    setNeighborhood('')
    setCity('')
    setState('')
    setLabel('Casa')
    setCepError('')
  }

  return (
    <Card className="mt-8">
      <CardHeader className="pb-4 border-b border-border flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-muted-foreground" />
          Meus Endereços
        </CardTitle>
        {!isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="h-8 gap-1">
            <Plus className="w-4 h-4" /> Novo
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {isAdding ? (
          <form onSubmit={handleAddAddress} className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm">Adicionar Endereço</h3>
              <button type="button" onClick={() => { setIsAdding(false); resetForm(); }} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>Identificação (Ex: Casa, Trabalho)</Label>
                <Input value={label} onChange={e => setLabel(e.target.value)} required />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>CEP *</Label>
                <div className="flex gap-2">
                  <Input value={cep} onChange={e => setCep(e.target.value)} onBlur={handleCepBlur} required maxLength={9} />
                  {cepLoading && <Spinner size="sm" className="mt-2" />}
                </div>
                {cepError && <p className="text-xs text-destructive">{cepError}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rua *</Label>
              <Input value={street} onChange={e => setStreet(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número *</Label>
                <Input value={number} onChange={e => setNumber(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input value={complement} onChange={e => setComplement(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label>Bairro *</Label>
                <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} required />
              </div>
              <div className="space-y-2 col-span-1">
                <Label>Cidade *</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} required />
              </div>
              <div className="space-y-2 col-span-1">
                <Label>UF *</Label>
                <Input value={state} onChange={e => setState(e.target.value)} required maxLength={2} />
              </div>
            </div>

            <Button type="submit" className="w-full">Salvar Endereço</Button>
          </form>
        ) : isLoading ? (
          <div className="flex justify-center py-6"><Spinner size="sm" /></div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Nenhum endereço cadastrado.
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div key={addr.id} className={`p-4 rounded-lg border ${addr.is_favorite ? 'border-agon-orange bg-agon-orange/5' : 'border-border'} flex items-start justify-between gap-4`}>
                <div>
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
                <div className="flex flex-col gap-2 items-end">
                  {!addr.is_favorite && (
                    <button onClick={() => setFavorite(addr.id)} className="text-xs text-muted-foreground hover:text-agon-orange flex items-center gap-1 transition-colors">
                      <Star className="w-3 h-3" /> Tornar Favorito
                    </button>
                  )}
                  <button onClick={() => deleteAddress(addr.id)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                    <Trash className="w-3 h-3" /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
