// Notificações via Telegram Bot API — apenas server-side
// Requer: TELEGRAM_BOT_TOKEN e TELEGRAM_ADMIN_CHAT_ID no .env.local

const API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

async function send(text: string, silent = false) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId || !process.env.TELEGRAM_BOT_TOKEN) return

  try {
    await fetch(`${API()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_notification: silent,
      }),
    })
  } catch {
    // Falhas silenciosas — não quebrar o fluxo principal
  }
}

function esc(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── Avaliações ────────────────────────────────────────────────────────────────

export async function notifyReviewPublished(data: {
  teacherName: string
  subjectName: string
  subjectCode: string
  ratingGeneral: number
  comment?: string | null
}) {
  const stars = '★'.repeat(data.ratingGeneral) + '☆'.repeat(5 - data.ratingGeneral)
  const text = [
    `✅ <b>Nova avaliação publicada</b>`,
    `👤 ${esc(data.teacherName)}`,
    `📚 ${esc(data.subjectCode)} — ${esc(data.subjectName)}`,
    `${stars} <b>${data.ratingGeneral}/5</b>`,
    data.comment ? `💬 <i>"${esc(data.comment.slice(0, 200))}${data.comment.length > 200 ? '…' : ''}"</i>` : null,
  ].filter(Boolean).join('\n')

  await send(text, true) // silencioso, muitas avaliações
}

export async function notifyReviewInReview(data: {
  teacherName: string
  subjectName: string
  subjectCode: string
  ratingGeneral: number
  comment?: string | null
  adminUrl?: string
}) {
  const text = [
    `⚠️ <b>Avaliação em revisão</b>`,
    `👤 ${esc(data.teacherName)}`,
    `📚 ${esc(data.subjectCode)} — ${esc(data.subjectName)}`,
    `⭐ ${data.ratingGeneral}/5`,
    data.comment ? `💬 <i>"${esc(data.comment.slice(0, 200))}${data.comment.length > 200 ? '…' : ''}"</i>` : null,
    ``,
    `👉 <a href="${data.adminUrl ?? 'https://localhost:3000/painel-interno/avaliacoes?status=em_revisao'}">Revisar no painel</a>`,
  ].filter(Boolean).join('\n')

  await send(text) // com notificação sonora
}

export async function notifyReviewDeleted(data: {
  teacherName: string
  subjectName: string
}) {
  await send(
    `🗑 <b>Avaliação removida pelo aluno</b>\n👤 ${esc(data.teacherName)}\n📚 ${esc(data.subjectName)}`,
    true
  )
}

// ── Usuários ──────────────────────────────────────────────────────────────────

export async function notifyNewUser(email: string, courseCode?: string | null) {
  const text = [
    `👤 <b>Novo usuário cadastrado</b>`,
    `📧 ${esc(email)}`,
    courseCode ? `🎓 ${esc(courseCode)}` : null,
  ].filter(Boolean).join('\n')

  await send(text, true)
}

// ── Disciplinas sem professor ─────────────────────────────────────────────────

export async function notifySubjectPendente(data: {
  subjectName: string
  subjectCode: string
  adminUrl?: string
}) {
  const text = [
    `📚 <b>Disciplina marcada como pendente</b>`,
    `${esc(data.subjectCode)} — ${esc(data.subjectName)}`,
    `👉 <a href="${data.adminUrl ?? 'http://localhost:3000/painel-interno/sem-professor?status=pendente'}">Ver no painel</a>`,
  ].join('\n')

  await send(text)
}

// ── Professores ───────────────────────────────────────────────────────────────

export async function notifyTeacherCreated(data: {
  teacherName: string
  subjectName: string
  subjectCode: string
}) {
  await send(
    `✅ <b>Professor criado e vinculado</b>\n👤 ${esc(data.teacherName)}\n📚 ${esc(data.subjectCode)} — ${esc(data.subjectName)}`,
    true
  )
}

// ── Avaliação reportada ───────────────────────────────────────────────────────

export async function notifyReviewReported(data: {
  reviewId: string
  teacherName: string
  subjectName: string
  reason: string
  adminUrl?: string
}) {
  const text = [
    `🚩 <b>Avaliação reportada</b>`,
    `👤 ${esc(data.teacherName)}`,
    `📚 ${esc(data.subjectName)}`,
    `Motivo: <i>${esc(data.reason)}</i>`,
    ``,
    `👉 <a href="${data.adminUrl ?? 'http://localhost:3000/painel-interno/avaliacoes'}">Revisar no painel</a>`,
  ].join('\n')

  await send(text)
}

// ── Sugestão de professor ─────────────────────────────────────────────────────

export async function notifyTeacherSuggested(data: {
  suggestedName: string
  subjectName: string
  subjectCode: string
  adminUrl?: string
}) {
  const text = [
    `💡 <b>Sugestão de professor</b>`,
    `👤 ${esc(data.suggestedName)}`,
    `📚 ${esc(data.subjectCode)} — ${esc(data.subjectName)}`,
    ``,
    `👉 <a href="${data.adminUrl ?? 'http://localhost:3000/painel-interno/sugestoes'}">Ver sugestões</a>`,
  ].join('\n')

  await send(text)
}

// ── Usuário banido ────────────────────────────────────────────────────────────

export async function notifyUserBanned(email: string) {
  await send(`🚫 <b>Usuário banido</b>\n📧 ${esc(email)}`, true)
}
