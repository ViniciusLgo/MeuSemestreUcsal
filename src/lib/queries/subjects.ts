import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database'

export async function getSubjectById(id: string): Promise<Tables<'subjects'> | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .single()
  return data as Tables<'subjects'> | null
}

export type TeacherBasic = { id: string; name: string; slug: string }

export async function getTeachersBySubject(subjectId: string): Promise<TeacherBasic[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('teacher_subjects')
    .select('teacher:teachers(id, name, slug)')
    .eq('subject_id', subjectId)
    .eq('active', true)
  if (!data) return []
  return (data as Array<{ teacher: TeacherBasic | null }>)
    .map((ts) => ts.teacher)
    .filter((t): t is TeacherBasic => t !== null)
}

export type ReviewPublic = {
  id: string
  rating_general: number
  rating_didactics: number
  rating_organization: number
  rating_workload: number
  rating_difficulty: number
  would_recommend: boolean
  attendance_pressure: 'baixa' | 'media' | 'alta' | null
  assessment_style: 'prova' | 'projeto' | 'trabalho' | 'misto' | null
  comment: string | null
  had_in_person_event: boolean | null
  relevant_to_course: boolean | null
  created_at: string
  teacher: { id: string; name: string } | null
}

export async function getReviewsBySubject(subjectId: string): Promise<ReviewPublic[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select(`
      id, rating_general, rating_didactics, rating_organization,
      rating_workload, rating_difficulty, would_recommend,
      attendance_pressure, assessment_style, comment,
      had_in_person_event, relevant_to_course, created_at,
      teacher:teachers(id, name)
    `)
    .eq('subject_id', subjectId)
    .eq('status', 'publicada')
    .order('created_at', { ascending: false })
  return (data ?? []) as ReviewPublic[]
}
