import Link from 'next/link'
import { getProfile } from '@/lib/queries/profiles'
import { SignOutButton } from './SignOutButton'
import { Logo } from '@/components/ui/Logo'

export async function Header() {
  const profile = await getProfile()

  return (
    <header className="sticky top-0 z-50 bg-[#161b22]/95 backdrop-blur-sm border-b border-[#30363d]">
      <div className="container-page flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo size="sm" />
          <span className="font-semibold text-[#e6edf3] text-[15px] group-hover:text-[#3fb950] transition-colors">
            MeuSemestre<span className="text-[#3fb950]">UCSAL</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/curso/BES"
            className="px-3 py-2 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] rounded-lg transition-colors"
          >
            Eng. de Software
          </Link>
          <Link
            href="/curso/ADS"
            className="px-3 py-2 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] rounded-lg transition-colors"
          >
            ADS
          </Link>
          <Link
            href="/buscar"
            className="px-3 py-2 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] rounded-lg transition-colors"
          >
            Buscar
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {profile ? (
            <>
              {profile.role === 'admin' && (
                <Link
                  href="/painel-interno"
                  className="text-sm font-medium text-[#8b949e] hover:text-[#e6edf3] transition-colors px-3 py-2"
                >
                  Painel
                </Link>
              )}
              <Link
                href="/perfil"
                className="text-sm font-medium text-[#8b949e] hover:text-[#e6edf3] transition-colors px-3 py-2"
              >
                Meu perfil
              </Link>
              <SignOutButton />
              <Link
                href="/avaliar"
                className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-500 transition-colors"
              >
                Avaliar professor
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/entrar"
                className="text-sm font-medium text-[#8b949e] hover:text-[#e6edf3] transition-colors px-3 py-2"
              >
                Entrar
              </Link>
              <Link
                href="/entrar?redirectTo=/avaliar"
                className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-500 transition-colors"
              >
                Avaliar professor
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
