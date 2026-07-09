import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-edge-muted bg-surface">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md overflow-hidden bg-white flex-shrink-0">
                <Image src="/logo-icon.png" alt="MeuSemestreUCSAL" width={28} height={28} className="w-full h-full object-contain" />
              </div>
              <span className="font-semibold text-fg text-sm">MeuSemestreUCSAL</span>
            </div>
            <p className="text-sm text-fg-subtle leading-relaxed">
              Avaliações anônimas de professores feitas por alunos da UCSAL. Projeto independente.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-fg mb-4">Cursos</h4>
            <ul className="space-y-2.5 text-sm text-fg-muted">
              <li>
                <Link href="/curso/BES" className="hover:text-brand-400 transition-colors">
                  Engenharia de Software
                </Link>
              </li>
              <li>
                <Link href="/curso/ADS" className="hover:text-brand-400 transition-colors">
                  Análise e Desenvolvimento
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-fg mb-4">Ferramentas</h4>
            <ul className="space-y-2.5 text-sm text-fg-muted">
              <li>
                <Link href="/buscar" className="hover:text-brand-400 transition-colors">
                  Buscar disciplina
                </Link>
              </li>
              <li>
                <Link href="/monte-sua-grade" className="hover:text-brand-400 transition-colors">
                  Monte sua grade
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-brand-400 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-fg mb-4">Conta</h4>
            <ul className="space-y-2.5 text-sm text-fg-muted">
              <li>
                <Link href="/entrar" className="hover:text-brand-400 transition-colors">
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/avaliar" className="hover:text-brand-400 transition-colors">
                  Avaliar professor
                </Link>
              </li>
              <li>
                <Link href="/perfil" className="hover:text-brand-400 transition-colors">
                  Meu perfil
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-edge-muted flex flex-col sm:flex-row justify-between gap-2 text-xs text-fg-subtle">
          <p>© {new Date().getFullYear()} MeuSemestreUCSAL — Projeto independente de alunos.</p>
          <p>Não afiliado oficialmente à UCSAL.</p>
        </div>
      </div>
    </footer>
  )
}
