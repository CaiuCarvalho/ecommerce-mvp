import { Helmet } from 'react-helmet-async'

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Helmet>
        <title>Política de Privacidade | Agon Imports</title>
        <meta name="description" content="Saiba como a Agon Imports coleta, usa e protege seus dados pessoais." />
      </Helmet>

      <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
      <p className="text-sm text-gray-500 mb-8">Última atualização: maio de 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Quem somos</h2>
          <p>
            A <strong>Agon Imports</strong> é uma loja virtual brasileira de dropshipping. Somos responsáveis pelo tratamento dos seus dados pessoais conforme descrito nesta política, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Quais dados coletamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dados de cadastro:</strong> nome completo, e-mail e telefone.</li>
            <li><strong>Dados de endereço:</strong> informados durante o checkout para entrega.</li>
            <li><strong>Dados de pedido:</strong> itens comprados, valores e status de pagamento.</li>
            <li><strong>Dados técnicos:</strong> carrinho salvo no localStorage do seu navegador (não enviado ao servidor até o checkout).</li>
          </ul>
          <p className="mt-2">Não coletamos dados de cartão de crédito. Os pagamentos são processados diretamente pelo Mercado Pago.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Para que usamos seus dados</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Criar e gerenciar sua conta.</li>
            <li>Processar seus pedidos e notificá-lo por e-mail sobre o status.</li>
            <li>Enviar o e-mail de boas-vindas e e-mails transacionais (aprovação, envio, entrega).</li>
            <li>Cumprir obrigações legais e fiscais.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Com quem compartilhamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Mercado Pago:</strong> para processamento seguro do pagamento.</li>
            <li><strong>Supabase:</strong> banco de dados e autenticação (infraestrutura em nuvem).</li>
            <li><strong>Resend:</strong> serviço de envio de e-mails transacionais.</li>
          </ul>
          <p className="mt-2">Não vendemos nem cedemos seus dados a terceiros para fins de marketing.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Cookies e armazenamento local</h2>
          <p>
            Usamos exclusivamente cookies e localStorage essenciais para manter sua sessão autenticada e preservar sua sacola de compras. Não usamos cookies de rastreamento ou publicidade.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Seus direitos (LGPD)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Acessar seus dados pessoais.</li>
            <li>Corrigir dados incompletos ou desatualizados.</li>
            <li>Solicitar a exclusão da sua conta e dados (via suporte).</li>
            <li>Revogar consentimento a qualquer momento.</li>
          </ul>
          <p className="mt-2">Para exercer esses direitos, entre em contato: <strong>contato@agonimports.com</strong></p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Segurança</h2>
          <p>
            Adotamos medidas técnicas de segurança como controle de acesso por linha (Row Level Security) no banco de dados, autenticação segura via JWT e criptografia em trânsito (HTTPS/TLS).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Alterações nesta política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Em caso de alterações relevantes, notificaremos você por e-mail ou mediante aviso no site.
          </p>
        </section>

      </div>
    </div>
  )
}
