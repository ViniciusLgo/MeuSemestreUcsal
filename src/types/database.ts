export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Row types
type ProfileRow = {
  id: string
  email: string
  display_name_internal: string | null
  course_id: string | null
  role: 'student' | 'admin'
  status: 'active' | 'banned'
  created_at: string
  updated_at: string
}

type CourseRow = {
  id: string
  code: string
  name: string
  active: boolean
  created_at: string
}

type CurriculumVersionRow = {
  id: string
  course_id: string
  name: string
  campus: string | null
  shift: string | null
  year: number | null
  active: boolean
  created_at: string
}

type SemesterRow = {
  id: string
  curriculum_version_id: string
  number: number
}

type SubjectRow = {
  id: string
  code: string
  name: string
  type: 'mandatory' | 'elective' | 'extension'
  modality: 'presencial' | 'ead' | 'hibrida'
  active: boolean
  created_at: string
}

type CurriculumSubjectRow = {
  id: string
  curriculum_version_id: string
  semester_id: string | null
  subject_id: string
  recommended_order: number | null
  is_required: boolean
}

type TeacherRow = {
  id: string
  name: string
  slug: string
  active: boolean
  created_at: string
}

type TeacherSubjectRow = {
  id: string
  teacher_id: string
  subject_id: string
  course_id: string | null
  active: boolean
}

type ReviewRow = {
  id: string
  author_id: string
  teacher_id: string
  subject_id: string
  course_id: string | null
  curriculum_version_id: string | null
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
  // Novos campos v2
  teacher_absence: 'nunca' | 'raramente' | 'frequente' | null
  is_easy_to_pass: 'sim' | 'mais_ou_menos' | 'nao' | null
  teacher_is_engaging: boolean | null
  exam_types: string[] | null
  has_assignments: boolean | null
  has_activities: boolean | null
  status: 'publicada' | 'oculta' | 'em_revisao'
  created_at: string
  updated_at: string
}

type ReviewReportRow = {
  id: string
  review_id: string
  reporter_id: string | null
  reason: string
  details: string | null
  status: 'open' | 'reviewed' | 'dismissed'
  created_at: string
}

type AdminActivityRow = {
  id: string
  admin_id: string
  action: string
  target_type: string
  target_id: string | null
  metadata: Json | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'>>
      }
      courses: {
        Row: CourseRow
        Insert: Omit<CourseRow, 'id' | 'created_at'>
        Update: Partial<Omit<CourseRow, 'id' | 'created_at'>>
      }
      curriculum_versions: {
        Row: CurriculumVersionRow
        Insert: Omit<CurriculumVersionRow, 'id' | 'created_at'>
        Update: Partial<Omit<CurriculumVersionRow, 'id' | 'created_at'>>
      }
      semesters: {
        Row: SemesterRow
        Insert: Omit<SemesterRow, 'id'>
        Update: Partial<Omit<SemesterRow, 'id'>>
      }
      subjects: {
        Row: SubjectRow
        Insert: Omit<SubjectRow, 'id' | 'created_at'>
        Update: Partial<Omit<SubjectRow, 'id' | 'created_at'>>
      }
      curriculum_subjects: {
        Row: CurriculumSubjectRow
        Insert: Omit<CurriculumSubjectRow, 'id'>
        Update: Partial<Omit<CurriculumSubjectRow, 'id'>>
      }
      teachers: {
        Row: TeacherRow
        Insert: Omit<TeacherRow, 'id' | 'created_at'>
        Update: Partial<Omit<TeacherRow, 'id' | 'created_at'>>
      }
      teacher_subjects: {
        Row: TeacherSubjectRow
        Insert: Omit<TeacherSubjectRow, 'id'>
        Update: Partial<Omit<TeacherSubjectRow, 'id'>>
      }
      reviews: {
        Row: ReviewRow
        Insert: Omit<ReviewRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ReviewRow, 'id' | 'created_at' | 'updated_at'>>
      }
      review_reports: {
        Row: ReviewReportRow
        Insert: Omit<ReviewReportRow, 'id' | 'created_at'>
        Update: Partial<Omit<ReviewReportRow, 'id' | 'created_at'>>
      }
      admin_activity: {
        Row: AdminActivityRow
        Insert: Omit<AdminActivityRow, 'id' | 'created_at'>
        Update: Partial<Omit<AdminActivityRow, 'id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      is_active_user: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
