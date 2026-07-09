import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacidade e LGPD — MeuSemestreUCSAL' }

export default function PrivacidadePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 prose-custom">
      <h1 className="text-3xl font-bold text-fg mb-2">Privacidade e LGPD</h1>
      <p className="text-sm text-fg-subtle mb-10">Última atualização: julho de 2026</p>

      <div className="space-y-8 text-sm text-fg-muted leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-fg mb-3">O que coletamos</h2>
          <p>Para que você possa avaliar professores, coletamos:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li><strong className="text-fg">E-mail institucional</strong> — usado apenas para autenticação via código OTP. Nunca é exibido publicamente.</li>
            <li><strong className="text-fg">Curso e turno</strong> — para contextualizar suas avaliações.</li>
            <li><strong className="text-fg">Avaliações enviadas</strong> — nota, comentário e badges selecionados.</li>
            <li><strong className="text-fg">Grades salvas</strong> — lista de disciplinas e professores escolhidos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-fg mb-3">Anonimato público</h2>
          <p>
            Suas avaliações aparecem no site <strong className="text-fg">sem nenhuma identificação</strong>. Não exibimos seu nome, e-mail, foto ou qualquer dado que permita identificá-lo publicamente.
          </p>
          <p className="mt-2">
            Internamente, mantemos o vínculo entre avaliação e conta para fins de segurança: evitar spam, impedir avaliações duplicadas e investigar eventuais abusos. Esse vínculo é acessível apenas a administradores.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-fg mb-3">Base legal (LGPD — Lei 13.709/2018)</h2>
          <p>O tratamento dos seus dados se baseia em:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li><strong className="text-fg">Consentimento</strong> — ao criar conta e enviar avaliações, você concorda com esta política.</li>
            <li><strong className="text-fg">Legítimo interesse</strong> — manter a integridade da plataforma e prevenir abusos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-fg mb-3">Com quem compartilhamos</h2>
          <p>Seus dados não são vendidos nem compartilhados com terceiros para fins comerciais. Utilizamos:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li><strong className="text-fg">Supabase</strong> — banco de dados e autenticação, hospedado na AWS (região sa-east-1 / EUA).</li>
            <li><strong className="text-fg">Vercel</strong> — hospedagem da aplicação web.</li>
            <li><strong className="text-fg">Telegram</strong> — notificações internas para administradores (sem dados de alunos).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-fg mb-3">Seus direitos</h2>
          <p>Conforme a LGPD, você pode a qualquer momento:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Acessar os dados que temos sobre você</li>
            <li>Solicitar a exclusão da sua conta e avaliações</li>
            <li>Revogar o consentimento</li>
            <li>Solicitar a portabilidade dos seus dados</li>
          </ul>
          <p className="mt-3">
            Para exercer esses direitos, entre em contato pelo e-mail disponível na seção de contato do site, ou acesse seu perfil e use a opção de remoção de avaliações.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-fg mb-3">Retenção de dados</h2>
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa. Avaliações removidas por você são excluídas imediatamente. Em caso de exclusão de conta, todos os dados pessoais associados são removidos em até 30 dias.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-fg mb-3">Cookies e rastreamento</h2>
          <p>
            Utilizamos apenas cookies de sessão necessários para manter seu login ativo. Não utilizamos cookies de rastreamento, analytics terceiros ou publicidade.
          </p>
        </section>

        <section className="border-t border-edge-muted pt-6">
          <p className="text-xs text-fg-subtle">
            Esta política pode ser atualizada. A data de última revisão está no topo desta página. Mudanças significativas serão comunicadas na página de{' '}
            <a href="/atualizacoes" className="text-brand-400 hover:underline">atualizações</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
