import Link from 'next/link'
import Image from 'next/image'
import { getProfile } from '@/lib/queries/profiles'
import { SignOutButton } from './SignOutButton'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export async function Header() {
  const profile = await getProfile()

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-edge">
      <div className="container-page flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white">
            <Image src="/logo-icon.png" alt="MeuSemestreUCSAL" width={32} height={32} className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-fg text-[15px] group-hover:text-brand-400 transition-colors">
            MeuSemestre<span className="text-brand-400">UCSAL</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/curso/BES"
            className="px-3 py-2 text-fg-muted hover:text-fg hover:bg-surface-2 rounded-lg transition-colors"
          >
            Eng. de Software
          </Link>
          <Link
            href="/curso/ADS"
            className="px-3 py-2 text-fg-muted hover:text-fg hover:bg-surface-2 rounded-lg transition-colors"
          >
            ADS
          </Link>
          <Link
            href="/professores"
            className="px-3 py-2 text-fg-muted hover:text-fg hover:bg-surface-2 rounded-lg transition-colors"
          >
            Professores
          </Link>
          <Link
            href="/buscar"
            className="px-3 py-2 text-fg-muted hover:text-fg hover:bg-surface-2 rounded-lg transition-colors"
          >
            Buscar
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {profile ? (
            <>
              {profile.role === 'admin' && (
                <Link
                  href="/painel-interno"
                  className="text-sm font-medium text-fg-muted hover:text-fg transition-colors px-3 py-2"
                >
                  Painel
                </Link>
              )}
              <Link
                href="/perfil"
                className="text-sm font-medium text-fg-muted hover:text-fg transition-colors px-3 py-2"
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
                className="text-sm font-medium text-fg-muted hover:text-fg transition-colors px-3 py-2"
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
