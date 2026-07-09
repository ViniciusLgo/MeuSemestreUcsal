import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Termos de Uso — MeuSemestreUCSAL',
  description: 'Condições de uso da plataforma MeuSemestreUCSAL.',
}

export default function TermosPage() {
  return (
    <div className="container-page py-12 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-8 text-sm text-fg-subtle">
        <Link href="/" className="hover:text-brand-400 transition-colors">Início</Link>
        <span>/</span>
        <span>Termos de Uso</span>
      </div>

      <h1 className="text-3xl font-bold text-fg mb-2">Termos de Uso</h1>
      <p className="text-sm text-fg-subtle mb-10">Última atualização: julho de 2025</p>

      <div className="prose-custom space-y-8 text-fg-muted leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-fg mb-3">1. Sobre a plataforma</h2>
          <p>
            O MeuSemestreUCSAL é um projeto independente criado por alunos, sem vínculo oficial com a
            Universidade Católica do Salvador (UCSAL). A plataforma tem como objetivo permitir que alunos
            compartilhem avaliações anônimas sobre professores e disciplinas, com base em experiências
            acadêmicas reais.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg mb-3">2. Elegibilidade</h2>
          <p>
            O acesso é restrito a pessoas com e-mail institucional da UCSAL (<code>@ucsal.edu.br</code>).
            Ao se cadastrar, você confirma que é aluno ou ex-aluno da instituição e que as informações
            fornecidas são verdadeiras.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg mb-3">3. Conteúdo publicado</h2>
          <p>Ao enviar uma avaliação, você concorda que:</p>
          <ul className="list-disc list-inside space-y-1.5 mt-2 text-sm">
            <li>O conteúdo reflete sua experiência pessoal e honesta com o professor avaliado.</li>
            <li>Você não utilizará a plataforma para difamar, assediar ou expor dados pessoais de terceiros.</li>
            <li>Não serão tolerados conteúdos ofensivos, discriminatórios, ameaçadores ou que identifiquem o avaliador ou o avaliado de forma não autorizada.</li>
            <li>Avaliações que violem estas regras poderão ser removidas ou marcadas para revisão sem aviso prévio.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg mb-3">4. Anonimato</h2>
          <p>
            Sua identidade não é exibida publicamente. Internamente, as avaliações são associadas ao seu
            usuário para fins de moderação e controle de duplicidade, mas esse vínculo nunca é exposto
            a outros usuários. Consulte nossa <Link href="/privacidade" className="text-brand-400 hover:underline">Política de Privacidade</Link> para
            detalhes sobre tratamento de dados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg mb-3">5. Moderação</h2>
          <p>
            A plataforma utiliza filtros automáticos de moderação. Avaliações suspeitas são retidas para
            revisão manual antes de serem publicadas. Usuários que enviem conteúdo abusivo de forma
            reiterada poderão ter o acesso suspenso.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg mb-3">6. Disponibilidade</h2>
          <p>
            O serviço é fornecido sem garantias de disponibilidade contínua. Podemos modificar,
            suspender ou encerrar a plataforma a qualquer momento, sem obrigação de aviso prévio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg mb-3">7. Isenção de responsabilidade</h2>
          <p>
            As opiniões expressas nas avaliações são dos próprios usuários e não representam a posição
            do MeuSemestreUCSAL nem da UCSAL. Não nos responsabilizamos por decisões tomadas com base
            nas avaliações publicadas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg mb-3">8. Alterações nestes termos</h2>
          <p>
            Podemos atualizar estes termos periodicamente. O uso continuado da plataforma após alterações
            publicadas implica concordância com os novos termos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-fg mb-3">9. Contato</h2>
          <p>
            Dúvidas ou denúncias podem ser enviadas pelo botão "Reportar" presente em cada avaliação,
            ou diretamente para o e-mail de contato do projeto.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-edge-muted flex gap-4 text-sm text-fg-subtle">
        <Link href="/privacidade" className="hover:text-brand-400 transition-colors">Privacidade & LGPD</Link>
        <Link href="/atualizacoes" className="hover:text-brand-400 transition-colors">Atualizações</Link>
      </div>
    </div>
  )
}
