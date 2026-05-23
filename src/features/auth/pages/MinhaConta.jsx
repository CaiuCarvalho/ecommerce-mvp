import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'
import formatPrice from '../../../lib/formatPrice'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { User, Package, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../lib/queryKeys'

import AddressManager from '../components/AddressManager'

const STATUS_LABELS = {
  awaiting_payment: 'Aguardando Pagamento',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

const STATUS_VARIANTS = {
  awaiting_payment: 'outline',
  processing: 'default',
  shipped: 'secondary',
  delivered: 'default', // Ideally green/success but default is ok
  cancelled: 'destructive',
}

export default function MinhaConta() {
  const { user, profile } = useAuth()

  const { data: orders = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.orders.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, total, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <Helmet>
        <title>Minha Conta | Agon Imports</title>
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Minha Conta</h1>
        <p className="text-muted-foreground mt-1">Gerencie seus dados e acompanhe seus pedidos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Nome</p>
                <p className="text-sm font-medium">{profile?.full_name || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email</p>
                <p className="text-sm font-medium break-all">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Telefone</p>
                <p className="text-sm font-medium">{profile?.phone || '—'}</p>
              </div>
            </CardContent>
          </Card>
          <AddressManager user={user} />
        </div>

        {/* Orders List */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-muted-foreground" />
                Meus Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="md" />
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center">
                  <Package className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">Você ainda não realizou nenhum pedido.</p>
                  <Button asChild variant="outline">
                    <Link to="/">Explorar produtos</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {orders.map(order => (
                    <Link
                      key={order.id}
                      to={`/pedido/${order.id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-muted/50 transition-colors group gap-4"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">Pedido #{order.id.slice(0, 8)}</p>
                          <Badge variant={STATUS_VARIANTS[order.status] || 'outline'} className="text-[10px] uppercase">
                            {STATUS_LABELS[order.status] || order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Efetuado em {new Date(order.created_at).toLocaleDateString('pt-BR')} às {new Date(order.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                        <span className="text-sm font-bold text-foreground">{formatPrice(order.total)}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
