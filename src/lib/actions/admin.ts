'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  const rows = subject_ids.map((subject_id) => ({ teacher_id, subject_id, course_id }))
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
  await (supabase as any).from('profiles').update({ status }).eq('id', profile_id)
  revalidatePath('/painel-interno/usuarios')
}
