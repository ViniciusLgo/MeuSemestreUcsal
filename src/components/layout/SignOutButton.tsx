'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className={className ?? 'text-sm font-medium text-[#8b949e] hover:text-red-400 transition-colors px-3 py-2'}
    >
      Sair
    </button>
  )
}
