import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-100 bg-white">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">MS</span>
              </div>
              <span className="font-semibold text-slate-900 text-sm">MeuSemestreUCSAL</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Avaliações anônimas de professores feitas por alunos da UCSAL. Projeto independente.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Cursos</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li>
                <Link href="/curso/BES" className="hover:text-brand-600 transition-colors">
                  Engenharia de Software
                </Link>
              </li>
              <li>
                <Link href="/curso/ADS" className="hover:text-brand-600 transition-colors">
                  Análise e Desenvolvimento
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Ferramentas</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li>
                <Link href="/buscar" className="hover:text-brand-600 transition-colors">
                  Buscar disciplina
                </Link>
              </li>
              <li>
                <Link href="/monte-sua-grade" className="hover:text-brand-600 transition-colors">
                  Monte sua grade
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-brand-600 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Conta</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li>
                <Link href="/entrar" className="hover:text-brand-600 transition-colors">
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/avaliar" className="hover:text-brand-600 transition-colors">
                  Avaliar professor
                </Link>
              </li>
              <li>
                <Link href="/perfil" className="hover:text-brand-600 transition-colors">
                  Meu perfil
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} MeuSemestreUCSAL — Projeto independente de alunos.</p>
          <p>Não afiliado oficialmente à UCSAL.</p>
        </div>
      </div>
    </footer>
  )
}
