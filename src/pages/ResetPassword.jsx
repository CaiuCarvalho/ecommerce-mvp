import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Label } from '../components/ui/Label'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Supabase automatically handles the access token from the URL hash
  // If the user lands here, they should have a session or recovery event
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event == "PASSWORD_RECOVERY") {
        console.log("Password recovery event received")
      }
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password || password.length < 6) {
      return toast.error('A senha deve ter pelo menos 6 caracteres')
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      toast.error('Erro ao redefinir senha: ' + error.message)
    } else {
      toast.success('Senha atualizada com sucesso!')
      navigate('/login')
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-16">
      <Helmet>
        <title>Nova Senha | Agon Imports</title>
      </Helmet>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Criar Nova Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-6"
            >
              {loading && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
