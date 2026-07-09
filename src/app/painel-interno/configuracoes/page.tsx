import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Configurações — Painel Admin' }

const telegramConfigured =
  !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID)

export default function ConfiguracoesPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-fg mb-8">Configurações</h1>

      {/* ── Telegram ─────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-edge rounded-2xl overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-edge-muted flex items-center gap-3">
          <span className="text-2xl">✈️</span>
          <div>
            <h2 className="text-base font-bold text-fg">Notificações Telegram</h2>
            <p className="text-xs text-fg-subtle">Bot: @avaliacaoucsalbot</p>
          </div>
          <div className="ml-auto">
            {telegramConfigured ? (
              <span className="text-xs font-semibold bg-brand-100 text-brand-400 border border-brand-300 px-3 py-1 rounded-full">
                ✓ Configurado
              </span>
            ) : (
              <span className="text-xs font-semibold bg-amber-100 text-amber-500 border border-amber-300 px-3 py-1 rounded-full">
                ⚠ Não configurado
              </span>
            )}
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-fg-muted">
            Você receberá notificações no Telegram para eventos importantes da plataforma.
          </p>

          {!telegramConfigured && (
            <div className="bg-[#1a1200] border border-amber-700 rounded-xl px-4 py-4 space-y-3">
              <p className="text-sm font-semibold text-amber-400">Siga os passos para configurar:</p>
              <ol className="text-sm text-fg-muted space-y-2 list-decimal list-inside">
                <li>
                  Abra o Telegram e envie <code className="bg-surface-2 px-1.5 py-0.5 rounded text-brand-400">/start</code> para{' '}
                  <a href="https://t.me/avaliacaoucsalbot" target="_blank" className="text-brand-400 hover:underline">
                    @avaliacaoucsalbot
                  </a>
                </li>
                <li>
                  Acesse{' '}
                  <a href="/api/telegram/setup" target="_blank" className="text-brand-400 hover:underline font-mono text-xs">
                    /api/telegram/setup
                  </a>{' '}
                  para obter seu <code className="bg-surface-2 px-1.5 py-0.5 rounded text-brand-400">chat_id</code>
                </li>
                <li>
                  Adicione ao <code className="bg-surface-2 px-1.5 py-0.5 rounded text-brand-400">.env.local</code>:
                  <pre className="mt-2 bg-canvas border border-edge rounded-lg p-3 text-xs font-mono text-fg-muted overflow-x-auto">
{`TELEGRAM_BOT_TOKEN=8864992815:AAGa7H4H_07poTZXS5kJT4dizNUUD55IElQ
TELEGRAM_ADMIN_CHAT_ID=<seu_chat_id>`}
                  </pre>
                  <p className="text-xs text-red-400 mt-1">⚠️ O token acima foi exposto — regenere em @BotFather com /revoke antes do deploy.</p>
                </li>
                <li>Reinicie o servidor (<code className="bg-surface-2 px-1.5 py-0.5 rounded text-brand-400">npm run dev</code>)</li>
                <li>
                  Teste em{' '}
                  <a href="/api/telegram/test" target="_blank" className="text-brand-400 hover:underline font-mono text-xs">
                    /api/telegram/test
                  </a>
                </li>
              </ol>
            </div>
          )}

          {telegramConfigured && (
            <div className="space-y-3">
              <div className="bg-canvas border border-edge rounded-xl p-4">
                <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wide mb-2">O que dispara notificações</p>
                <ul className="text-sm text-fg-muted space-y-1.5">
                  {[
                    ['⚠️', 'Avaliação vai para revisão automática'],
                    ['✅', 'Avaliação publicada com sucesso'],
                    ['🗑', 'Aluno remove própria avaliação'],
                    ['👤', 'Novo usuário registrado'],
                    ['📚', 'Disciplina marcada como pendente de professor'],
                    ['✨', 'Professor criado e vinculado a disciplina'],
                    ['🚩', 'Avaliação reportada por aluno'],
                    ['💡', 'Aluno sugeriu professor para disciplina'],
                    ['🚫', 'Usuário banido pelo admin'],
                  ].map(([icon, label]) => (
                    <li key={label} className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a href="/api/telegram/test" target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors">
                ✈️ Enviar mensagem de teste
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Variáveis de ambiente ─────────────────────────────────────────── */}
      <div className="bg-surface border border-edge rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-edge-muted">
          <h2 className="text-base font-bold text-fg">Variáveis de ambiente</h2>
          <p className="text-xs text-fg-subtle mt-0.5">Status das configurações do servidor</p>
        </div>
        <div className="divide-y divide-edge-muted">
          {[
            { key: 'NEXT_PUBLIC_SUPABASE_URL', set: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
            { key: 'SUPABASE_SERVICE_ROLE_KEY', set: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
            { key: 'TELEGRAM_BOT_TOKEN', set: !!process.env.TELEGRAM_BOT_TOKEN },
            { key: 'TELEGRAM_ADMIN_CHAT_ID', set: !!process.env.TELEGRAM_ADMIN_CHAT_ID },
            { key: 'NEXT_PUBLIC_BASE_URL', set: !!process.env.NEXT_PUBLIC_BASE_URL },
          ].map((v) => (
            <div key={v.key} className="flex items-center justify-between px-6 py-3">
              <code className="text-xs font-mono text-fg-muted">{v.key}</code>
              {v.set ? (
                <span className="text-xs font-semibold text-brand-400">✓ Configurado</span>
              ) : (
                <span className="text-xs text-fg-subtle">— Não configurado</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
