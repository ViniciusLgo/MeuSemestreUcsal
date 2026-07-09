import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database'

export async function getTeacherById(id: string): Promise<Tables<'teachers'> | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .single()
  return data as Tables<'teachers'> | null
}

export type SubjectBasic = {
  id: string
  code: string
  name: string
  modality: 'presencial' | 'ead' | 'hibrida'
}

export async function getSubjectsByTeacher(teacherId: string): Promise<SubjectBasic[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('teacher_subjects')
    .select('subject:subjects(id, code, name, modality)')
    .eq('teacher_id', teacherId)
    .eq('active', true)
  if (!data) return []
  const seen = new Set<string>()
  return (data as Array<{ subject: SubjectBasic | null }>)
    .map((ts) => ts.subject)
    .filter((s): s is SubjectBasic => {
      if (!s || seen.has(s.id)) return false
      seen.add(s.id)
      return true
    })
}

export type ReviewByTeacher = {
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
  created_at: string
  subject: { id: string; name: string; code: string } | null
}

export async function getReviewsByTeacher(teacherId: string): Promise<ReviewByTeacher[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select(`
      id, rating_general, rating_didactics, rating_organization,
      rating_workload, rating_difficulty, would_recommend,
      attendance_pressure, assessment_style, comment, created_at,
      subject:subjects(id, name, code)
    `)
    .eq('teacher_id', teacherId)
    .eq('status', 'publicada')
    .order('created_at', { ascending: false })
  return (data ?? []) as ReviewByTeacher[]
}
