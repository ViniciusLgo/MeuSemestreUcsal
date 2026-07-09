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

export type TeacherWithRatings = {
  id: string
  name: string
  slug: string
  avg_general: number
  avg_didactics: number
  avg_organization: number
  avg_workload: number
  avg_difficulty: number
  review_count: number
  would_recommend_pct: number | null
}

export async function getTeachersBySubject(subjectId: string): Promise<TeacherWithRatings[]> {
  const supabase = await createClient()
  const [{ data: tsRows }, { data: revRows }] = await Promise.all([
    supabase
      .from('teacher_subjects')
      .select('teacher:teachers!inner(id, name, slug)')
      .eq('subject_id', subjectId)
      .eq('teachers.active', true),
    (supabase as any)
      .from('reviews')
      .select('teacher_id, rating_general, rating_didactics, rating_organization, rating_workload, rating_difficulty, would_recommend')
      .eq('subject_id', subjectId)
      .eq('status', 'publicada'),
  ])

  const seen = new Set<string>()
  const teachers: Array<{ id: string; name: string; slug: string }> = []
  for (const row of (tsRows ?? []) as Array<{ teacher: { id: string; name: string; slug: string } | null }>) {
    if (!row.teacher || seen.has(row.teacher.id)) continue
    seen.add(row.teacher.id)
    teachers.push(row.teacher)
  }

  type RevRow = { teacher_id: string; rating_general: number; rating_didactics: number; rating_organization: number; rating_workload: number; rating_difficulty: number; would_recommend: boolean }
  const reviews: RevRow[] = revRows ?? []

  return teachers.map((t) => {
    const tr = reviews.filter((r) => r.teacher_id === t.id)
    const n = tr.length
    if (!n) {
      return { ...t, avg_general: 0, avg_didactics: 0, avg_organization: 0, avg_workload: 0, avg_difficulty: 0, review_count: 0, would_recommend_pct: null }
    }
    const avg = (key: keyof RevRow) => tr.reduce((s, r) => s + Number(r[key] ?? 0), 0) / n
    const recCount = tr.filter((r) => r.would_recommend).length
    return {
      ...t,
      avg_general: avg('rating_general'),
      avg_didactics: avg('rating_didactics'),
      avg_organization: avg('rating_organization'),
      avg_workload: avg('rating_workload'),
      avg_difficulty: avg('rating_difficulty'),
      review_count: n,
      would_recommend_pct: Math.round((recCount / n) * 100),
    }
  }).sort((a, b) => b.avg_general - a.avg_general)
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
  teacher_absence: 'nunca' | 'raramente' | 'frequente' | null
  is_easy_to_pass: boolean | null
  teacher_is_engaging: boolean | null
  exam_types: string[] | null
  has_assignments: boolean | null
  has_activities: boolean | null
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
      had_in_person_event, relevant_to_course,
      teacher_absence, is_easy_to_pass, teacher_is_engaging,
      exam_types, has_assignments, has_activities,
      created_at, teacher:teachers(id, name)
    `)
    .eq('subject_id', subjectId)
    .eq('status', 'publicada')
    .order('created_at', { ascending: false })
  return (data ?? []) as ReviewPublic[]
}
