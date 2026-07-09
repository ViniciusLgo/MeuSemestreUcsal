'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  notifyReviewPublished,
  notifyReviewInReview,
  notifyReviewDeleted,
  notifyNewUser,
  notifyReviewReported,
  notifyTeacherSuggested,
} from '@/lib/telegram'
import { REPORT_REASONS } from '@/lib/review-constants'

export async function saveProfile(
  courseId: string,
  versionId: string,
  courseCode: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Verifica se é a primeira vez configurando (para notificar)
  const { data: existing } = await (supabase as any)
    .from('profiles')
    .select('course_id')
    .eq('id', user.id)
    .single()

  const isFirstTime = !existing?.course_id

  const { data: versionRow } = await (supabase as any)
    .from('curriculum_versions')
    .select('shift')
    .eq('id', versionId)
    .single()

  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      course_id: courseId,
      shift: versionRow?.shift ?? null,
      curriculum_version_id: versionId,
    })
    .eq('id', user.id)

  if (error) return { error: 'Erro ao salvar perfil.' }

  if (isFirstTime) {
    await notifyNewUser(user.email ?? '—', courseCode).catch(() => {})
  }

  revalidatePath('/', 'layout')
  return {}
}

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')
  return { supabase, user }
}

type ReviewPayload = {
  teacher_id: string
  subject_id: string
  curriculum_version_id: string | null
  rating_general: number
  rating_didactics: number
  rating_organization: number
  rating_workload: number
  rating_difficulty: number
  would_recommend: boolean
  teacher_absence: string | null
  teacher_is_engaging: boolean | null
  is_easy_to_pass: boolean | null
  attendance_pressure: string | null
  assessment_style: string | null
  exam_types: string[] | null
  has_assignments: boolean | null
  has_activities: boolean | null
  comment: string | null
  had_in_person_event: boolean | null
  relevant_to_course: boolean | null
}

// ─── Moderação de conteúdo ────────────────────────────────────────────────────

const BAD_WORDS = [
  // ofensas diretas
  'viado','viada','bicha','puta','putinha','prostituta','vadia','piranha','safada','safado',
  'cuzao','cuzão','arrombado','fdp','filho da puta','vsf','vai se foder','vai tomar no cu',
  'idiota','imbecil','retardado','mongoloid','estupido','estúpido','burro','cretino',
  'lixo','lixo humano','inutil','inútil','incompetente','merda','bosta','porra','caralho',
  'cacete','buceta','pau no cu','toma no cu','fuder','foder','cagar','saco','escroto',
  // ameaças / incitação
  'matar','morro','morra','assassinar','machucar','bater','surrar','estuprar',
  // discriminação
  'negro','nega','macaco','macaca','judeu','travesti','viado','gay',
]

const PERSONAL_DATA_PATTERNS = [
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/,            // CPF
  /\b\d{2}\s*9?\d{4}[-\s]?\d{4}\b/,              // telefone BR
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/, // email
  /\b(instagram|ig|insta|twitter|tiktok|whatsapp|zap)\b/i, // redes sociais
]

function moderateComment(comment: string | null): 'publicada' | 'em_revisao' {
  if (!comment || comment.trim().length < 10) return 'publicada'

  const lower = comment.toLowerCase()

  // palavrão detectado
  const hasBadWord = BAD_WORDS.some((w) => lower.includes(w))
  if (hasBadWord) return 'em_revisao'

  // dados pessoais ou redes sociais
  const hasPersonalData = PERSONAL_DATA_PATTERNS.some((p) => p.test(comment))
  if (hasPersonalData) return 'em_revisao'

  // comentário em caps excessivos (>60% maiúsculas em texto com 10+ letras)
  const letters = comment.replace(/[^a-zA-ZÀ-ÿ]/g, '')
  if (letters.length >= 10) {
    const upperRatio = letters.split('').filter((c) => c === c.toUpperCase()).length / letters.length
    if (upperRatio > 0.6) return 'em_revisao'
  }

  // comentário muito longo com riscos difusos (>1000 chars → sempre revisar)
  if (comment.length > 1000) return 'em_revisao'

  return 'publicada'
}

export async function submitReview(payload: ReviewPayload): Promise<{ error?: string }> {
  const { supabase, user } = await requireAuth()

  const status = moderateComment(payload.comment ?? null)

  const { data: inserted, error } = await (supabase as any)
    .from('reviews')
    .insert({ ...payload, author_id: user.id, status })
    .select('id, status, teacher:teachers(name), subject:subjects(name, code)')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Você já avaliou este professor nesta disciplina.' }
    return { error: 'Erro ao enviar. Tente novamente.' }
  }

  // Notificação Telegram
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const reviewData = {
    teacherName: inserted.teacher?.name ?? 'Desconhecido',
    subjectName: inserted.subject?.name ?? 'Desconhecida',
    subjectCode: inserted.subject?.code ?? '',
    ratingGeneral: payload.rating_general,
    comment: payload.comment,
  }

  if (inserted.status === 'em_revisao') {
    await notifyReviewInReview({
      ...reviewData,
      adminUrl: `${baseUrl}/painel-interno/avaliacoes?status=em_revisao`,
    })
  } else {
    await notifyReviewPublished(reviewData)
  }

  revalidatePath(`/professor/${payload.teacher_id}`)
  revalidatePath(`/disciplina/${payload.subject_id}`)
  return {}
}

export async function deleteOwnReview(review_id: string): Promise<void> {
  const { supabase, user } = await requireAuth()

  // Buscar dados antes de deletar para a notificação
  const { data: review } = await (supabase as any)
    .from('reviews')
    .select('teacher:teachers(name), subject:subjects(name)')
    .eq('id', review_id)
    .eq('author_id', user.id)
    .single()

  await (supabase as any)
    .from('reviews')
    .delete()
    .eq('id', review_id)
    .eq('author_id', user.id)

  if (review) {
    await notifyReviewDeleted({
      teacherName: review.teacher?.name ?? 'Desconhecido',
      subjectName: review.subject?.name ?? 'Desconhecida',
    })
  }

  revalidatePath('/perfil')
}

export async function reportReview(
  reviewId: string,
  reason: string,
  details?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Você precisa estar logado para reportar.' }

  // Evita reporte duplicado do mesmo usuário
  const { data: existing } = await (supabase as any)
    .from('review_reports')
    .select('id')
    .eq('review_id', reviewId)
    .eq('reporter_id', user.id)
    .single()
  if (existing) return { error: 'Você já reportou esta avaliação.' }

  const { error } = await (supabase as any)
    .from('review_reports')
    .insert({ review_id: reviewId, reporter_id: user.id, reason, details: details ?? null, status: 'open' })
  if (error) return { error: 'Erro ao enviar reporte.' }

  // Buscar dados da avaliação para notificação
  const { data: review } = await (supabase as any)
    .from('reviews')
    .select('teacher:teachers(name), subject:subjects(name)')
    .eq('id', reviewId)
    .single()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  await notifyReviewReported({
    reviewId,
    teacherName: review?.teacher?.name ?? 'Desconhecido',
    subjectName: review?.subject?.name ?? 'Desconhecida',
    reason: REPORT_REASONS[reason] ?? reason,
    adminUrl: `${baseUrl}/painel-interno/avaliacoes`,
  }).catch(() => {})

  return {}
}

export async function suggestTeacher(
  subjectId: string,
  suggestedName: string,
  details?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Você precisa estar logado.' }

  const { error } = await (supabase as any)
    .from('teacher_suggestions')
    .insert({ subject_id: subjectId, suggested_name: suggestedName.trim(), details: details ?? null, suggested_by: user.id, status: 'pendente' })
  if (error) return { error: 'Erro ao enviar sugestão.' }

  const { data: subject } = await (supabase as any)
    .from('subjects')
    .select('name, code')
    .eq('id', subjectId)
    .single()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  await notifyTeacherSuggested({
    suggestedName: suggestedName.trim(),
    subjectName: subject?.name ?? 'Desconhecida',
    subjectCode: subject?.code ?? '',
    adminUrl: `${baseUrl}/painel-interno/sugestoes`,
  }).catch(() => {})

  return {}
}
