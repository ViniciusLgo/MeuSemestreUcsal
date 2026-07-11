'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  notifySubjectPendente,
  notifyTeacherCreated,
  notifyUserBanned,
} from '@/lib/telegram'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')
  const { data: profile } = await (supabase as any).from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')
  return supabase
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Professores ──────────────────────────────────────────────

export async function createTeacher(formData: FormData): Promise<void> {
  const supabase = await requireAdmin()
  const name = (formData.get('name') as string)?.trim()
  if (!name) return

  const slug = toSlug(name)
  await (supabase as any).from('teachers').insert({ name, slug })
  revalidatePath('/painel-interno/professores')
}

export async function toggleTeacher(id: string, active: boolean) {
  const supabase = await requireAdmin()
  await (supabase as any).from('teachers').update({ active }).eq('id', id)
  revalidatePath('/painel-interno/professores')
}

export async function assignSubjects(formData: FormData): Promise<void> {
  const supabase = await requireAdmin()
  const teacher_id = formData.get('teacher_id') as string
  const subject_ids = formData.getAll('subject_ids') as string[]
  const course_id = (formData.get('course_id') as string) || null

  if (!subject_ids.length) return

  const rows = subject_ids.map((subject_id) => ({ teacher_id, subject_id, course_id, active: true }))
  await (supabase as any)
    .from('teacher_subjects')
    .upsert(rows, { onConflict: 'teacher_id,subject_id,course_id', ignoreDuplicates: true })

  revalidatePath(`/painel-interno/professores/${teacher_id}`)
}

export async function removeSubject(id: string, teacher_id: string) {
  const supabase = await requireAdmin()
  await (supabase as any).from('teacher_subjects').delete().eq('id', id)
  revalidatePath(`/painel-interno/professores/${teacher_id}`)
}

// ── Avaliações ───────────────────────────────────────────────

export async function setReviewStatus(review_id: string, status: 'publicada' | 'oculta' | 'em_revisao') {
  const supabase = await requireAdmin()
  await (supabase as any).from('reviews').update({ status }).eq('id', review_id)
  revalidatePath('/painel-interno/avaliacoes')
}

// ── Usuários ─────────────────────────────────────────────────

export async function setUserStatus(profile_id: string, status: 'active' | 'banned') {
  const supabase = await requireAdmin()

  if (status === 'banned') {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('email')
      .eq('id', profile_id)
      .single()
    await (supabase as any).from('profiles').update({ status }).eq('id', profile_id)
    if (profile?.email) await notifyUserBanned(profile.email)
  } else {
    await (supabase as any).from('profiles').update({ status }).eq('id', profile_id)
  }

  revalidatePath('/painel-interno/usuarios')
}

// ── Disciplinas sem professor ─────────────────────────────────

export async function setSubjectAlertStatus(
  subject_id: string,
  status: 'pendente' | 'ignorado' | null
): Promise<void> {
  const supabase = await requireAdmin()

  const { data: subject } = await (supabase as any)
    .from('subjects')
    .select('name, code')
    .eq('id', subject_id)
    .single()

  await (supabase as any)
    .from('subjects')
    .update({ alert_status: status })
    .eq('id', subject_id)

  if (status === 'pendente' && subject) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    await notifySubjectPendente({
      subjectName: subject.name,
      subjectCode: subject.code,
      adminUrl: `${baseUrl}/painel-interno/sem-professor?status=pendente`,
    })
  }

  revalidatePath('/painel-interno/sem-professor')
  revalidatePath('/painel-interno')
}

export async function createTeacherForSubject(formData: FormData): Promise<void> {
  const supabase = await requireAdmin()
  const name = (formData.get('name') as string)?.trim()
  const subject_id = formData.get('subject_id') as string
  if (!name || !subject_id) return

  const { data: subject } = await (supabase as any)
    .from('subjects')
    .select('name, code')
    .eq('id', subject_id)
    .single()

  const slug = toSlug(name)
  const { data: teacher } = await (supabase as any)
    .from('teachers')
    .insert({ name, slug })
    .select('id')
    .single()

  if (teacher?.id) {
    await (supabase as any)
      .from('teacher_subjects')
      .insert({ teacher_id: teacher.id, subject_id, course_id: null })
    await (supabase as any)
      .from('subjects')
      .update({ alert_status: null })
      .eq('id', subject_id)

    if (subject) {
      await notifyTeacherCreated({
        teacherName: name,
        subjectName: subject.name,
        subjectCode: subject.code,
      })
    }
  }

  revalidatePath('/painel-interno/sem-professor')
  revalidatePath('/painel-interno/professores')
  revalidatePath('/painel-interno')
}

// ── Moderação do Fórum ───────────────────────────────────────

export async function setForumThreadStatus(
  thread_id: string,
  status: 'publicado' | 'em_revisao' | 'oculto'
) {
  const supabase = await requireAdmin()
  await (supabase as any).from('forum_threads').update({ status }).eq('id', thread_id)
  revalidatePath('/painel-interno/forum')
  revalidatePath('/forum')
}

export async function setForumPostStatus(
  post_id: string,
  status: 'publicado' | 'em_revisao' | 'oculto'
) {
  const supabase = await requireAdmin()
  await (supabase as any).from('forum_posts').update({ status }).eq('id', post_id)
  revalidatePath('/painel-interno/forum')
}

export async function deleteForumThread(thread_id: string) {
  const supabase = await requireAdmin()
  await (supabase as any).from('forum_threads').delete().eq('id', thread_id)
  revalidatePath('/painel-interno/forum')
  revalidatePath('/forum')
}

export async function deleteForumPost(post_id: string) {
  const supabase = await requireAdmin()
  await (supabase as any).from('forum_posts').delete().eq('id', post_id)
  revalidatePath('/painel-interno/forum')
}

// ── Sugestões de professores ──────────────────────────────────

export async function resolveTeacherSuggestion(formData: FormData): Promise<void> {
  const supabase = await requireAdmin()
  const id = formData.get('id') as string
  const resolution = formData.get('resolution') as 'aprovado' | 'rejeitado'
  if (!id || !resolution) return

  const { data: suggestion } = await (supabase as any)
    .from('teacher_suggestions')
    .select('suggested_name, subject_id, subject:subjects(name, code)')
    .eq('id', id)
    .single()

  if (resolution === 'aprovado' && suggestion?.suggested_name && suggestion?.subject_id) {
    const slug = toSlug(suggestion.suggested_name)
    const { data: teacher } = await (supabase as any)
      .from('teachers')
      .insert({ name: suggestion.suggested_name, slug })
      .select('id')
      .single()

    if (teacher?.id) {
      await (supabase as any)
        .from('teacher_subjects')
        .insert({ teacher_id: teacher.id, subject_id: suggestion.subject_id, course_id: null })

      await notifyTeacherCreated({
        teacherName: suggestion.suggested_name,
        subjectName: suggestion.subject?.name ?? 'Desconhecida',
        subjectCode: suggestion.subject?.code ?? '',
      })
    }
  }

  await (supabase as any)
    .from('teacher_suggestions')
    .update({ status: resolution, resolved_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/painel-interno/sugestoes')
  revalidatePath('/painel-interno/professores')
  revalidatePath('/painel-interno')
}
