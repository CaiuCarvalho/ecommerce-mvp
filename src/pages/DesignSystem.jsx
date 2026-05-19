import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { useTheme } from '../components/ThemeProvider'
import { Moon, Sun } from "lucide-react"

export default function DesignSystem() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="flex justify-between items-center border-b border-border pb-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Agon Imports</h1>
            <p className="text-muted-foreground mt-2">Design System Showcase - Minimalist Premium</p>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        {/* Cores */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Cores (Theme Tokens)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <div className="h-20 rounded-md bg-background border border-border flex items-center justify-center text-sm font-medium">Background</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-20 rounded-md bg-foreground text-background flex items-center justify-center text-sm font-medium">Foreground</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-20 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">Primary</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-20 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-medium">Secondary</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-20 rounded-md bg-muted text-muted-foreground border border-border flex items-center justify-center text-sm font-medium">Muted</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-20 rounded-md bg-accent text-accent-foreground border border-border flex items-center justify-center text-sm font-medium">Accent</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-20 rounded-md bg-destructive text-destructive-foreground flex items-center justify-center text-sm font-medium">Destructive</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-20 rounded-md border border-border flex items-center justify-center text-sm font-medium">Border</div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Tipografia (Inter)</h2>
          <div className="space-y-4 border border-border rounded-lg p-6 bg-card">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Heading 1</h1>
              <p className="text-sm text-muted-foreground mt-1">extrabold, tracking-tight, 4xl/5xl</p>
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Heading 2</h2>
              <p className="text-sm text-muted-foreground mt-1">semibold, tracking-tight, 3xl</p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">Heading 3</h3>
              <p className="text-sm text-muted-foreground mt-1">semibold, tracking-tight, 2xl</p>
            </div>
            <div>
              <h4 className="text-xl font-semibold tracking-tight">Heading 4</h4>
              <p className="text-sm text-muted-foreground mt-1">semibold, tracking-tight, xl</p>
            </div>
            <div>
              <p className="leading-7">
                Parágrafo Padrão. O design system da Agon Imports foca em minimalismo e leitura limpa. 
                Utiliza tons monocromáticos e muito espaço em branco.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium leading-none">Label Text / Small</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Muted Text / Description</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Botões</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><Sun className="h-4 w-4" /></Button>
            <Button><Spinner className="mr-2 h-4 w-4 text-primary-foreground" /> Loading</Button>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Inputs & Forms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" placeholder="nome@empresa.com" />
              <p className="text-[0.8rem] text-muted-foreground">Insira seu e-mail corporativo.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input type="password" id="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disabled">Input Desativado</Label>
              <Input disabled id="disabled" placeholder="Não editável" />
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Painel Administrativo</CardTitle>
                <CardDescription>Resumo de faturamento da semana.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">R$ 14.500,00</div>
                <p className="text-xs text-muted-foreground mt-1">+20% em relação ao último mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Novo Pedido</CardTitle>
                <CardDescription>Confirme as informações antes de prosseguir.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label>Endereço de Entrega</Label>
                  <Input readOnly value="Av. Paulista, 1000" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancelar</Button>
                <Button>Aprovar Pedido</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Loaders */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Loaders</h2>
          <div className="flex gap-4 items-center">
            <Spinner size="sm" />
            <Spinner />
            <Spinner size="lg" />
            <div className="text-sm text-muted-foreground ml-4">Spinners de carregamento assíncrono.</div>
          </div>
        </section>

      </div>
    </div>
  )
}
