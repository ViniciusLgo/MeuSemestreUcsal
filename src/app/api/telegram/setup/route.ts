import { NextResponse } from 'next/server'

// GET /api/telegram/setup
// Helper local — retorna o chat_id do último update recebido pelo bot.
// 1. Envie /start para @avaliacaoucsalbot no Telegram
// 2. Acesse http://localhost:3000/api/telegram/setup
// 3. Copie o chat_id e adicione ao .env.local como TELEGRAM_ADMIN_CHAT_ID

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN

  if (!token) {
    return NextResponse.json({
      error: 'TELEGRAM_BOT_TOKEN não configurado',
      instrucoes: 'Adicione TELEGRAM_BOT_TOKEN=<seu_token> no .env.local e reinicie o servidor',
    }, { status: 400 })
  }

  // Remove webhook ativo (se houver) para poder usar getUpdates
  try {
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`, {
      cache: 'no-store',
    })
  } catch {
    // ignora falha — getUpdates vai indicar o problema
  }

  let res: Response
  let data: any

  try {
    res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=10&timeout=0`, {
      cache: 'no-store',
    })
  } catch (err: any) {
    return NextResponse.json({
      error: 'Falha de rede ao chamar API do Telegram',
      detalhe: err?.message ?? String(err),
    }, { status: 500 })
  }

  try {
    data = await res.json()
  } catch {
    return NextResponse.json({
      error: 'Resposta inválida da API do Telegram',
      status_http: res.status,
    }, { status: 500 })
  }

  if (!data.ok) {
    return NextResponse.json({
      error: 'API do Telegram recusou a requisição',
      telegram_error: data.description,
      error_code: data.error_code,
      dica: data.error_code === 401
        ? 'Token inválido. Verifique TELEGRAM_BOT_TOKEN no .env.local'
        : 'Verifique o token e tente novamente',
    }, { status: 400 })
  }

  const updates: any[] = data.result ?? []

  if (!updates.length) {
    return NextResponse.json({
      status: 'sem_updates',
      instrucoes: [
        '1. Abra o Telegram e busque @avaliacaoucsalbot',
        '2. Clique em START ou envie /start',
        '3. Volte aqui e recarregue a página',
      ],
    })
  }

  const chats = updates
    .map((u: any) => u.message?.chat ?? u.callback_query?.message?.chat)
    .filter(Boolean)
    .map((c: any) => ({ id: c.id, first_name: c.first_name, username: c.username, type: c.type }))

  const chatId = chats[chats.length - 1]?.id

  return NextResponse.json({
    status: 'ok',
    chat_id: chatId,
    proximo_passo: `Adicione ao .env.local: TELEGRAM_ADMIN_CHAT_ID=${chatId}`,
    chats,
  })
}
