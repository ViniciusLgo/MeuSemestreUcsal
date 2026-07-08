import { createClient } from '@/lib/supabase/server'

export async function getCourseByCode(code: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*, curriculum_versions(*)')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .single()
  return data
}

export async function getCurriculumWithSubjects(versionId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('curriculum_subjects')
    .select(`
      id, recommended_order, is_required,
      semester:semesters(id, number),
      subject:subjects(id, code, name, type, modality)
    `)
    .eq('curriculum_version_id', versionId)
    .order('recommended_order')
  return data ?? []
}
