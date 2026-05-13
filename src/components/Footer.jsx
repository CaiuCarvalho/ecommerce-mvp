import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Loja MVP</h3>
            <p className="text-sm text-gray-500">
              Produtos selecionados com entrega para todo o Brasil.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Categorias</h3>
            <ul className="space-y-1 text-sm text-gray-500">
              <li><Link to="/categoria/utilidade-domestica" className="hover:text-gray-700">Utilidade Domestica</Link></li>
              <li><Link to="/categoria/ferramentas" className="hover:text-gray-700">Ferramentas</Link></li>
              <li><Link to="/categoria/beleza-cuidados-pessoais" className="hover:text-gray-700">Beleza e Cuidados</Link></li>
              <li><Link to="/categoria/eletronicos" className="hover:text-gray-700">Eletronicos</Link></li>
              <li><Link to="/categoria/pets" className="hover:text-gray-700">Pets</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Ajuda</h3>
            <ul className="space-y-1 text-sm text-gray-500">
              <li><Link to="/sacola" className="hover:text-gray-700">Minha Sacola</Link></li>
              <li><Link to="/login" className="hover:text-gray-700">Minha Conta</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-4 text-center text-xs text-gray-400">
          Loja MVP {new Date().getFullYear()}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
