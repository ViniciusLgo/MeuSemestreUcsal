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
  teacher_absence: 'nunca' | 'raramente' | 'frequente' | null
  is_easy_to_pass: 'sim' | 'mais_ou_menos' | 'nao' | null
  teacher_is_engaging: boolean | null
  exam_types: string[] | null
  has_assignments: boolean | null
  has_activities: boolean | null
  comment: string | null
  created_at: string
  subject: { id: string; name: string; code: string } | null
}

// Stats por disciplina para o professor
export type SubjectStats = {
  subject_id: string
  subject_name: string
  subject_code: string
  review_count: number
  avg_general: number
  avg_didactics: number
  avg_organization: number
  avg_workload: number
  avg_difficulty: number
  would_recommend_pct: number
}

export async function getReviewsByTeacher(teacherId: string): Promise<ReviewByTeacher[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select(`
      id, rating_general, rating_didactics, rating_organization,
      rating_workload, rating_difficulty, would_recommend,
      attendance_pressure, assessment_style, comment, created_at,
      teacher_absence, is_easy_to_pass, teacher_is_engaging,
      exam_types, has_assignments, has_activities,
      subject:subjects(id, name, code)
    `)
    .eq('teacher_id', teacherId)
    .eq('status', 'publicada')
    .order('created_at', { ascending: false })
  return (data ?? []) as ReviewByTeacher[]
}

export type TeacherSummary = {
  id: string
  name: string
  slug: string
  review_count: number
  avg_general: number | null
  subject_count: number
}

export async function getAllTeachers(): Promise<TeacherSummary[]> {
  const supabase = await createClient()

  const [teachersRes, reviewsRes, subjectsRes] = await Promise.all([
    supabase.from('teachers').select('id, name, slug').eq('active', true).order('name'),
    supabase.from('reviews').select('teacher_id, rating_general').eq('status', 'publicada'),
    supabase.from('teacher_subjects').select('teacher_id').eq('active', true),
  ])

  const teachers = (teachersRes.data ?? []) as Array<{ id: string; name: string; slug: string }>
  const reviews = (reviewsRes.data ?? []) as Array<{ teacher_id: string; rating_general: number }>
  const subjects = (subjectsRes.data ?? []) as Array<{ teacher_id: string }>

  const reviewMap = new Map<string, number[]>()
  for (const r of reviews) {
    const arr = reviewMap.get(r.teacher_id) ?? []
    arr.push(r.rating_general)
    reviewMap.set(r.teacher_id, arr)
  }

  const subjectMap = new Map<string, number>()
  for (const s of subjects) {
    subjectMap.set(s.teacher_id, (subjectMap.get(s.teacher_id) ?? 0) + 1)
  }

  return teachers.map((t) => {
    const ratings = reviewMap.get(t.id) ?? []
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      review_count: ratings.length,
      avg_general: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      subject_count: subjectMap.get(t.id) ?? 0,
    }
  })
}

export function buildSubjectStats(reviews: ReviewByTeacher[]): SubjectStats[] {
  const map = new Map<string, { name: string; code: string; reviews: ReviewByTeacher[] }>()
  for (const r of reviews) {
    if (!r.subject) continue
    const entry = map.get(r.subject.id) ?? { name: r.subject.name, code: r.subject.code, reviews: [] }
    entry.reviews.push(r)
    map.set(r.subject.id, entry)
  }
  return Array.from(map.entries()).map(([subject_id, { name, code, reviews: rs }]) => {
    const n = rs.length
    const avg = (key: keyof ReviewByTeacher) => rs.reduce((s, r) => s + Number(r[key] ?? 0), 0) / n
    return {
      subject_id, subject_name: name, subject_code: code, review_count: n,
      avg_general: avg('rating_general'),
      avg_didactics: avg('rating_didactics'),
      avg_organization: avg('rating_organization'),
      avg_workload: avg('rating_workload'),
      avg_difficulty: avg('rating_difficulty'),
      would_recommend_pct: Math.round(rs.filter((r) => r.would_recommend).length / n * 100),
    }
  }).sort((a, b) => b.avg_general - a.avg_general)
}
