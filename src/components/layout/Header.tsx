import Link from 'next/link'

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-100">
      <div className="container-page flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs tracking-tight">MS</span>
          </div>
          <span className="font-semibold text-slate-900 text-[15px] group-hover:text-brand-600 transition-colors">
            MeuSemestre<span className="text-brand-600">UCSAL</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/curso/BES"
            className="px-3 py-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
          >
            Eng. de Software
          </Link>
          <Link
            href="/curso/ADS"
            className="px-3 py-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
          >
            ADS
          </Link>
          <Link
            href="/buscar"
            className="px-3 py-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
          >
            Buscar
          </Link>
          <Link
            href="/monte-sua-grade"
            className="px-3 py-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
          >
            Grade Perfeita
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/entrar"
            className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors px-3 py-2"
          >
            Entrar
          </Link>
          <Link
            href="/avaliar"
            className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors"
          >
            Avaliar professor
          </Link>
        </div>
      </div>
    </header>
  )
}
