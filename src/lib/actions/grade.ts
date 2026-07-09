'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')
  return { supabase, user }
}

export type GradeItem = {
  subject_id: string
  teacher_id: string
  subject_code: string
  subject_name: string
  teacher_name: string
  days: string[]
  slotId: number
  numSlots: number
  colorIdx: number
}

export async function saveGrade(
  name: string,
  courseCode: string,
  semesters: number[],
  items: GradeItem[]
): Promise<{ id: string } | { error: string }> {
  const { supabase, user } = await requireAuth()

  // Verificar se já existe uma grade com esse nome para upsert
  const { data: existing } = await (supabase as any)
    .from('saved_grades')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', name.trim())
    .single()

  let result
  if (existing?.id) {
    result = await (supabase as any)
      .from('saved_grades')
      .update({ course_code: courseCode, semesters, items })
      .eq('id', existing.id)
      .select('id')
      .single()
  } else {
    result = await (supabase as any)
      .from('saved_grades')
      .insert({ user_id: user.id, name: name.trim(), course_code: courseCode, semesters, items })
      .select('id')
      .single()
  }

  if (result.error) return { error: 'Erro ao salvar a grade.' }
  revalidatePath('/perfil')
  return { id: result.data.id }
}

export async function deleteSavedGrade(id: string): Promise<void> {
  const { supabase, user } = await requireAuth()
  await (supabase as any)
    .from('saved_grades')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  revalidatePath('/perfil')
}
