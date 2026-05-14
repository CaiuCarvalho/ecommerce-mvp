import { Helmet } from 'react-helmet-async'

export default function TermsOfUse() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Helmet>
        <title>Termos de Uso | Agon Imports</title>
        <meta name="description" content="Leia os Termos de Uso da Agon Imports antes de utilizar a plataforma." />
      </Helmet>

      <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
      <p className="text-sm text-gray-500 mb-8">Última atualização: maio de 2026</p>

      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Aceitação dos termos</h2>
          <p>
            Ao acessar ou utilizar a plataforma <strong>Agon Imports</strong>, você concorda com estes Termos de Uso. Se não concordar, não utilize o site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Cadastro e conta</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Você deve fornecer informações verdadeiras e completas no cadastro.</li>
            <li>É responsável por manter a confidencialidade da sua senha.</li>
            <li>Uma conta por pessoa física. É proibido criar contas automatizadas.</li>
            <li>Reservamo-nos o direito de suspender contas que violem estes termos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Produtos e preços</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Todas as informações de produto (descrição, imagem e preço) são fornecidas de boa-fé.</li>
            <li>Os preços podem ser alterados sem aviso prévio, mas o preço exibido no momento do checkout é o que prevalece.</li>
            <li>O frete grátis é válido para compras acima de R$ 100,00.</li>
            <li>Em caso de erro de preço evidente (ex: produto de R$ 200 por R$ 0,01), nos reservamos o direito de cancelar o pedido.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Pagamentos</h2>
          <p>
            Os pagamentos são processados exclusivamente pelo <strong>Mercado Pago</strong>. Não armazenamos dados de cartão de crédito. O pedido só é confirmado após aprovação do pagamento.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Entrega e prazos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Os prazos de entrega são estimativas e podem variar conforme localidade e disponibilidade.</li>
            <li>Após o despacho, o rastreio será enviado por e-mail.</li>
            <li>Atrasos causados por transportadoras, eventos climáticos ou greves não são de nossa responsabilidade direta.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Trocas e devoluções</h2>
          <p>
            Seguimos o Código de Defesa do Consumidor (Lei 8.078/90). Você tem direito ao arrependimento em até 7 dias após o recebimento. Entre em contato pelo e-mail <strong>contato@agonimports.com</strong> para iniciar o processo.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Conduta proibida</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Tentar fraudar ou manipular preços, carrinho ou fluxo de pagamento.</li>
            <li>Usar bots ou scripts automatizados para criar contas ou fazer pedidos.</li>
            <li>Qualquer atividade que comprometa a segurança ou disponibilidade da plataforma.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Limitação de responsabilidade</h2>
          <p>
            A Agon Imports não se responsabiliza por danos indiretos decorrentes do uso (ou impossibilidade de uso) da plataforma, além do valor do pedido em questão.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Lei aplicável</h2>
          <p>
            Estes termos são regidos pelas leis brasileiras. Foro eleito: comarca de São Paulo/SP.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Contato</h2>
          <p>
            Dúvidas sobre estes termos: <strong>contato@agonimports.com</strong>
          </p>
        </section>

      </div>
    </div>
  )
}
