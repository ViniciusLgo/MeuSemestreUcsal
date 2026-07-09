import { createClient } from '@/lib/supabase/server'

export type ProfileData = {
  id: string
  email: string
  course_id: string | null
  shift: string | null
  curriculum_version_id: string | null
  role: 'student' | 'admin'
  status: 'active' | 'banned'
}

export async function getProfile(): Promise<ProfileData | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('profiles')
      .select('id, email, course_id, shift, curriculum_version_id, role, status')
      .eq('id', user.id)
      .single()

    return data as ProfileData | null
  } catch {
    return null
  }
}
