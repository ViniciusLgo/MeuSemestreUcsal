import { NextResponse } from 'next/server'
import {
  notifyReviewPublished,
  notifyReviewInReview,
  notifyReviewDeleted,
  notifyNewUser,
  notifySubjectPendente,
  notifyTeacherCreated,
  notifyReviewReported,
  notifyTeacherSuggested,
  notifyUserBanned,
} from '@/lib/telegram'

// GET /api/telegram/test — dispara uma amostra de cada tipo de notificação
// Parâmetros: ?tipo=<nome> para testar um tipo específico, ou sem parâmetro para todos

export async function GET(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!token || !chatId) {
    return NextResponse.json({
      error: 'Variáveis não configuradas',
      faltando: [
        !token ? 'TELEGRAM_BOT_TOKEN' : null,
        !chatId ? 'TELEGRAM_ADMIN_CHAT_ID' : null,
      ].filter(Boolean),
    }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  const exemplos = {
    review_publicada: () => notifyReviewPublished({
      teacherName: 'Prof. Teste da Silva',
      subjectName: 'Cálculo I',
      subjectCode: 'MAT101',
      ratingGeneral: 8,
      comment: 'Excelente professor! Explica muito bem e é super paciente com as dúvidas.',
    }),
    review_revisao: () => notifyReviewInReview({
      teacherName: 'Prof. Teste da Silva',
      subjectName: 'Cálculo I',
      subjectCode: 'MAT101',
      ratingGeneral: 3,
      comment: 'Comentário com linguagem suspeita que foi para revisão automática.',
      adminUrl: `${base}/painel-interno/avaliacoes?status=em_revisao`,
    }),
    review_removida: () => notifyReviewDeleted({
      teacherName: 'Prof. Teste da Silva',
      subjectName: 'Cálculo I',
    }),
    review_reportada: () => notifyReviewReported({
      reviewId: 'test-id-123',
      teacherName: 'Prof. Teste da Silva',
      subjectName: 'Cálculo I',
      reason: 'Conteúdo ofensivo ou inadequado',
      adminUrl: `${base}/painel-interno/avaliacoes`,
    }),
    novo_usuario: () => notifyNewUser('aluno.teste@ucsal.edu.br', 'BES'),
    disciplina_pendente: () => notifySubjectPendente({
      subjectName: 'Estrutura de Dados',
      subjectCode: 'CC202',
      adminUrl: `${base}/painel-interno/sem-professor`,
    }),
    professor_criado: () => notifyTeacherCreated({
      teacherName: 'Prof. Novo Criado',
      subjectName: 'Estrutura de Dados',
      subjectCode: 'CC202',
    }),
    professor_sugerido: () => notifyTeacherSuggested({
      suggestedName: 'Prof. João Alguém',
      subjectName: 'Banco de Dados II',
      subjectCode: 'BD202',
      adminUrl: `${base}/painel-interno/sugestoes`,
    }),
    usuario_banido: () => notifyUserBanned('usuario.mal@ucsal.edu.br'),
  }

  try {
    if (tipo && tipo in exemplos) {
      await exemplos[tipo as keyof typeof exemplos]()
      return NextResponse.json({ status: 'ok', enviado: tipo })
    }

    // Enviar todos com 300ms de intervalo para não estressar o rate limit
    const resultados: string[] = []
    for (const [nome, fn] of Object.entries(exemplos)) {
      await fn()
      resultados.push(nome)
      await new Promise((r) => setTimeout(r, 300))
    }

    return NextResponse.json({
      status: 'ok',
      enviados: resultados,
      dica: 'Use ?tipo=<nome> para testar apenas um tipo específico',
      tipos_disponíveis: Object.keys(exemplos),
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao enviar', detalhe: err?.message }, { status: 500 })
  }
}
