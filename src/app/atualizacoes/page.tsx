import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Atualizações — MeuSemestreUCSAL' }

type Entry = {
  version: string
  date: string
  badge?: 'novo' | 'melhoria' | 'correção'
  items: string[]
}

const CHANGELOG: Entry[] = [
  {
    version: '1.5',
    date: '11/07/2026',
    badge: 'melhoria',
    items: [
      'Fórum: upload de imagens (JPG, PNG, WebP até 5 MB) e PDFs (até 10 MB) nos tópicos',
      'Fórum: seção "Discussões" na página de cada disciplina — veja e crie tópicos vinculados',
      'Fórum: aba de moderação no painel admin com filtros por status e ações de publicar/ocultar/deletar',
      'Fórum: email de código OTP reformulado com visual alinhado ao tema da plataforma',
      'Infraestrutura: ambiente de desenvolvimento local com Supabase CLI + Docker documentado',
      'Infraestrutura: suite de testes automatizados (RLS, nicknames, moderação) com Vitest',
      'Documentação: guia de contribuição (CONTRIBUTING.md) para colaboradores externos',
    ],
  },
  {
    version: '1.4',
    date: '10/07/2026',
    badge: 'novo',
    items: [
      'Fórum anônimo de discussões — crie tópicos, responda e vote em enquetes sem revelar sua identidade',
      'Nicknames por tópico: você recebe um apelido aleatório único em cada thread (ex: "Tucano Veloz")',
      'Categorias de discussão: Geral, Dúvidas Acadêmicas, Estágio e Mercado, Desabafos, Projetos e Grupos',
      'Enquetes opcionais nos tópicos com prazo, percentuais e bloqueio de voto duplo',
      'Filtro de moderação automático em PT e EN — conteúdo suspeito vai para revisão, não é bloqueado',
      'Rate limit: máx 5 tópicos e 20 respostas por dia por usuário',
      'Fórum visível a todos, mas criação e leitura de discussões exige login com @ucsal.edu.br',
    ],
  },
  {
    version: '1.3',
    date: '09/07/2026',
    badge: 'novo',
    items: [
      'Escala de avaliação geral expandida para 1–10 estrelas (zona negativa 1–4 destacada em vermelho)',
      'Botão "Reportar avaliação" em todas as avaliações públicas',
      'Alunos podem sugerir professores para disciplinas sem docente',
      'Notificações Telegram para reportes, sugestões e novos usuários',
      'Grade salva pode ser carregada diretamente via link',
      'Filtro de comentários reforçado: detecta palavrões, dados pessoais e redes sociais',
      'Página de atualizações (você está aqui)',
      'Política de privacidade / LGPD no rodapé',
    ],
  },
  {
    version: '1.2',
    date: '08/07/2026',
    badge: 'melhoria',
    items: [
      'Painel admin reformulado: dashboard com alertas, cobertura de professores e rankings',
      'Nova seção "Disciplinas sem professor" com alertas pendente/ignorado',
      'Integração com bot Telegram @avaliacaoucsalbot para notificações em tempo real',
      'Painel de sugestões de professores no admin',
      'Calendário de rematrícula 2026.2 no FAQ',
      'Monte sua grade: suporte a Manhã + Noite no mesmo semestre',
      'Grade semanal visual atualiza em tempo real ao selecionar professor e horário',
      'Salvar e carregar grades montadas no perfil',
    ],
  },
  {
    version: '1.1',
    date: '2026-06',
    badge: 'melhoria',
    items: [
      'Formulário de avaliação multi-step com badges contextuais',
      'Página de perfil com histórico de avaliações e grades salvas',
      'Monte sua grade: seleção de semestres, professores e horários',
      'Score de qualidade da grade baseado nas avaliações',
      'Filtros por curso, status e e-mail no painel admin',
      'Deduplicação de disciplinas na página do professor',
    ],
  },
  {
    version: '1.0',
    date: '2026-05',
    badge: 'novo',
    items: [
      'Lançamento da plataforma MeuSemestreUCSAL',
      'Cursos BES (8 semestres) e ADS (5 semestres) com matrizes 2023 completas',
      'Login com OTP por e-mail institucional @ucsal.edu.br',
      'Avaliações anônimas de professores por disciplina',
      'Publicação automática com filtro de revisão para conteúdo suspeito',
      'Páginas públicas de disciplina, professor e busca',
      'Painel admin inicial',
    ],
  },
]

const badgeStyle: Record<string, string> = {
  novo: 'bg-brand-100 text-brand-400 border-brand-300',
  melhoria: 'bg-blue-900 text-blue-300 border-blue-700',
  correção: 'bg-amber-900 text-amber-400 border-amber-700',
}

export default function AtualizacoesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-fg mb-2">Atualizações</h1>
      <p className="text-fg-subtle mb-10">Histórico de melhorias e novidades da plataforma.</p>

      <div className="relative">
        {/* linha vertical */}
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-edge-muted" aria-hidden />

        <div className="space-y-10">
          {CHANGELOG.map((entry) => (
            <div key={entry.version} className="relative pl-10">
              {/* bolinha */}
              <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-surface border-2 border-brand-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-brand-400" />
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-sm font-bold text-fg">v{entry.version}</span>
                <span className="text-xs text-fg-subtle">{entry.date}</span>
                {entry.badge && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeStyle[entry.badge]}`}>
                    {entry.badge}
                  </span>
                )}
              </div>

              <ul className="space-y-1.5">
                {entry.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-fg-muted">
                    <span className="text-brand-400 mt-0.5 flex-shrink-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
