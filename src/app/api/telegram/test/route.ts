import { NextResponse } from 'next/server'

// GET /api/telegram/test — helper local, sem auth (só funciona com as vars configuradas)

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!token || !chatId) {
    return NextResponse.json({
      error: 'Variáveis não configuradas',
      faltando: [
        !token ? 'TELEGRAM_BOT_TOKEN' : null,
        !chatId ? 'TELEGRAM_ADMIN_CHAT_ID' : null,
      ].filter(Boolean),
      instrucoes: 'Acesse /api/telegram/setup para obter o chat_id',
    }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '✅ <b>MeuSemestreUCSAL</b>\n\nNotificações Telegram configuradas com sucesso! 🎉\n\nVocê receberá alertas de:\n• ⚠️ Avaliações em revisão\n• 📚 Disciplinas pendentes de professor\n• 👤 Novos usuários\n• 🗑 Avaliações removidas',
        parse_mode: 'HTML',
      }),
    })

    const data = await res.json()
    if (!data.ok) {
      return NextResponse.json({ error: 'Telegram rejeitou a mensagem', detail: data }, { status: 500 })
    }

    return NextResponse.json({ status: 'ok', message: 'Mensagem enviada com sucesso!' })
  } catch (err: any) {
    return NextResponse.json({ error: 'Falha de conexão com Telegram', detalhe: err?.message }, { status: 500 })
  }
}
