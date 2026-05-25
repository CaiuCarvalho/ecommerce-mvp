import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Spinner } from '../../../components/ui/Spinner'

export default function AddressModal({ isOpen, onClose, addressToEdit, onSave }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [label, setLabel] = useState('Casa')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (addressToEdit) {
        setCep(addressToEdit.cep || '')
        setStreet(addressToEdit.street || '')
        setNumber(addressToEdit.number || '')
        setNeighborhood(addressToEdit.neighborhood || '')
        setCity(addressToEdit.city || '')
        setState(addressToEdit.state || '')
        setLabel(addressToEdit.label || 'Casa')
        
        const comp = addressToEdit.complement || ''
        if (comp.includes('| Detalhes:')) {
          const parts = comp.split('| Detalhes:')
          setComplement(parts[0].trim())
          setDeliveryInstructions(parts[1].trim())
        } else if (comp.startsWith('Detalhes:')) {
          setComplement('')
          setDeliveryInstructions(comp.replace('Detalhes:', '').trim())
        } else {
          setComplement(comp)
          setDeliveryInstructions('')
        }
      } else {
        // Reset form
        setCep('')
        setStreet('')
        setNumber('')
        setComplement('')
        setDeliveryInstructions('')
        setNeighborhood('')
        setCity('')
        setState('')
        setLabel('Casa')
      }
      setCepError('')
    }
  }, [isOpen, addressToEdit])

  if (!isOpen) return null

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

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const finalComplement = deliveryInstructions.trim() 
        ? (complement ? `${complement} | Detalhes: ${deliveryInstructions}` : `Detalhes: ${deliveryInstructions}`)
        : complement

      const addressData = {
        label,
        cep: cep.replace(/\D/g, ''),
        street,
        number,
        complement: finalComplement,
        neighborhood,
        city,
        state,
      }

      if (addressToEdit) {
        const { error } = await supabase.from('addresses')
          .update(addressData)
          .eq('id', addressToEdit.id)
        if (error) throw error
        toast.success('Endereço atualizado!')
      } else {
        // Find if this is the first one
        const { data: existing } = await supabase.from('addresses').select('id').eq('user_id', user.id)
        const isFirst = !existing || existing.length === 0
        
        const { error } = await supabase.from('addresses').insert({
          user_id: user.id,
          is_favorite: isFirst,
          ...addressData
        })
        if (error) throw error
        toast.success('Endereço adicionado!')
      }
      
      queryClient.invalidateQueries(['addresses'])
      if (onSave) onSave()
      onClose()
    } catch (err) {
      toast.error('Erro ao salvar endereço.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-background text-foreground rounded-lg shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-4">{addressToEdit ? 'Editar Endereço' : 'Adicionar Endereço'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Identificação (Ex: Casa, Trabalho)</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>CEP *</Label>
            <div className="flex gap-2">
              <Input value={cep} onChange={e => setCep(e.target.value)} onBlur={handleCepBlur} required maxLength={9} />
              {cepLoading && <Spinner size="sm" className="mt-2" />}
            </div>
            {cepError && <p className="text-xs text-destructive">{cepError}</p>}
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

          <div className="space-y-2">
            <Label>Bairro *</Label>
            <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Detalhes de Entrega (Opcional)</Label>
            <Input 
              value={deliveryInstructions} 
              onChange={e => setDeliveryInstructions(e.target.value)} 
              placeholder="Ex: Deixar na portaria, campainha quebrada..." 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cidade *</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>UF *</Label>
              <Input value={state} onChange={e => setState(e.target.value)} required maxLength={2} />
            </div>
          </div>

          <Button type="submit" className="w-full mt-2" disabled={submitting || cepLoading}>
            {submitting ? <Spinner size="sm" className="mr-2" /> : null}
            {addressToEdit ? 'Atualizar Endereço' : 'Salvar Endereço'}
          </Button>
        </form>
      </div>
    </div>
  )
}
