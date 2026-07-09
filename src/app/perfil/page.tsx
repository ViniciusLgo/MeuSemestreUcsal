import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getProfile } from '@/lib/queries/profiles'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/components/layout/SignOutButton'

export const metadata: Metadata = { title: 'Meu Perfil — MeuSemestreUCSAL' }

const COURSE_LABELS: Record<string, string> = {
  BES: 'Engenharia de Software',
  ADS: 'Análise e Desenvolvimento de Sistemas',
}

export default async function PerfilPage() {
  const profile = await getProfile()
  if (!profile) redirect('/entrar?redirectTo=/perfil')

  const supabase = await createClient()

  const courseCode = profile.course_id
    ? (await (supabase as any).from('courses').select('code, name').eq('id', profile.course_id).single()).data
    : null

  return (
    <div className="container-page py-12 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[#e6edf3] mb-8">Meu perfil</h1>

      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] divide-y divide-[#21262d]">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6e7681] font-medium uppercase tracking-wide mb-1">Email</p>
            <p className="text-[#e6edf3] font-medium">{profile.email}</p>
          </div>
        </div>

        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6e7681] font-medium uppercase tracking-wide mb-1">Curso</p>
            <p className="text-[#e6edf3] font-medium">
              {courseCode
                ? `${courseCode.code} — ${courseCode.name}`
                : <span className="text-[#6e7681] italic">Não configurado</span>}
            </p>
          </div>
        </div>

        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6e7681] font-medium uppercase tracking-wide mb-1">Turno</p>
            <p className="text-[#e6edf3] font-medium">
              {profile.shift ?? <span className="text-[#6e7681] italic">Não configurado</span>}
            </p>
          </div>
        </div>

        {profile.role === 'admin' && (
          <div className="px-6 py-5">
            <span className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-400 text-xs font-semibold px-3 py-1 rounded-full border border-brand-300">
              Administrador
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Link
          href="/perfil/configurar"
          className="w-full text-center text-sm font-semibold border border-[#30363d] text-[#e6edf3] px-4 py-2.5 rounded-xl hover:bg-[#21262d] hover:border-[#8b949e] transition-colors bg-[#161b22]"
        >
          Alterar curso / turno
        </Link>
        <SignOutButton className="w-full text-center text-sm font-medium text-red-400 border border-[#30363d] px-4 py-2.5 rounded-xl hover:bg-[#2d0a0a] hover:border-red-700 transition-colors bg-[#161b22]" />
      </div>
    </div>
  )
}
