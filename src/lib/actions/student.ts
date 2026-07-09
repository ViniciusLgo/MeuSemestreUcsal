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

export async function deleteOwnReview(review_id: string): Promise<void> {
  const { supabase, user } = await requireAuth()
  // RLS garante que só o autor pode deletar, mas verificamos explicitamente
  await (supabase as any)
    .from('reviews')
    .delete()
    .eq('id', review_id)
    .eq('author_id', user.id)
  revalidatePath('/perfil')
}
