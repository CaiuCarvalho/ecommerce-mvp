import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-border mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-foreground mb-3 tracking-tight">Agon Imports</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Produtos selecionados com entrega para todo o Brasil. O melhor da utilidade e eletrônicos para você.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-foreground mb-3 tracking-tight uppercase">Categorias</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link to="/categoria/utilidade-domestica" className="hover:text-foreground transition-colors">Utilidade Doméstica</Link></li>
              <li><Link to="/categoria/ferramentas" className="hover:text-foreground transition-colors">Ferramentas</Link></li>
              <li><Link to="/categoria/beleza-cuidados-pessoais" className="hover:text-foreground transition-colors">Beleza e Cuidados</Link></li>
              <li><Link to="/categoria/eletronicos" className="hover:text-foreground transition-colors">Eletrônicos</Link></li>
              <li><Link to="/categoria/pets" className="hover:text-foreground transition-colors">Pets</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-foreground mb-3 tracking-tight uppercase">Ajuda</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link to="/sacola" className="hover:text-foreground transition-colors">Minha Sacola</Link></li>
              <li><Link to="/minha-conta" className="hover:text-foreground transition-colors">Minha Conta</Link></li>
              <li><Link to="/politica-de-privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/termos-de-uso" className="hover:text-foreground transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-muted-foreground">
          <div>
            Copyright © {new Date().getFullYear()} Agon Imports. Todos os direitos reservados.
          </div>
          <div className="flex gap-4 mt-4 md:mt-0 items-center">
            <Link to="/politica-de-privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
            <span className="border-l border-border h-3 hidden md:block"></span>
            <Link to="/termos-de-uso" className="hover:text-foreground transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
