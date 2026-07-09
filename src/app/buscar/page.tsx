import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SearchBox } from './SearchBox'

export const metadata: Metadata = { title: 'Buscar — MeuSemestreUCSAL' }

type Props = { searchParams: Promise<{ q?: string; curso?: string; tipo?: string }> }

type TeacherResult = {
  id: string
  name: string
  slug: string
  exact_match: boolean
}

type SubjectResult = {
  id: string
  code: string
  name: string
  subject_type: string
  modality: string
  exact_match: boolean
}

async function Results({ q, curso, tipo }: { q: string; curso: string; tipo: string }) {
  if (!q || q.length < 2) return null

  const supabase = await createClient()
  const cursoArg = curso || null

  const showTeachers = tipo !== 'disciplina'
  const showSubjects = tipo !== 'professor'

  const [teachersRes, subjectsRes] = await Promise.all([
    showTeachers
      ? (supabase as any).rpc('search_teachers', { p_query: q, p_curso: curso ?? '', p_limit: 10 })
      : { data: [] },
    showSubjects
      ? (supabase as any).rpc('search_subjects', { p_query: q, p_curso: curso ?? '', p_limit: 20 })
      : { data: [] },
  ])

  const teachers: TeacherResult[] = teachersRes.data ?? []
  const subjects: SubjectResult[] = subjectsRes.data ?? []

  // Separar exatos de sugestões
  const exactTeachers = teachers.filter((t) => t.exact_match)
  const fuzzyTeachers = teachers.filter((t) => !t.exact_match)
  const exactSubjects = subjects.filter((s) => s.exact_match)
  const fuzzySubjects = subjects.filter((s) => !s.exact_match)

  const hasExact = exactTeachers.length > 0 || exactSubjects.length > 0
  const hasFuzzy = fuzzyTeachers.length > 0 || fuzzySubjects.length > 0
  const total = exactTeachers.length + exactSubjects.length

  if (!hasExact && !hasFuzzy) {
    return (
      <div className="text-center py-16">
        <p className="text-2xl mb-3">🤔</p>
        <p className="text-fg-muted text-sm">
          Nenhum resultado para <strong className="text-fg">"{q}"</strong>
          {curso && ` no curso ${curso}`}.
        </p>
        <p className="text-fg-subtle text-xs mt-2">Tente um termo diferente ou verifique a ortografia.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-8">
      {hasExact && (
        <p className="text-sm text-fg-subtle">
          {total} resultado{total !== 1 ? 's' : ''} para{' '}
          <strong className="text-fg">"{q}"</strong>
          {curso && ` · ${curso}`}
          {tipo === 'professor' && ' · Professores'}
          {tipo === 'disciplina' && ' · Disciplinas'}
        </p>
      )}

      {/* Resultados exatos — Professores */}
      {exactTeachers.length > 0 && (
        <TeacherSection teachers={exactTeachers} supabase={null} />
      )}

      {/* Resultados exatos — Disciplinas */}
      {exactSubjects.length > 0 && (
        <SubjectSection subjects={exactSubjects} />
      )}

      {/* Sugestões "Você quis dizer?" */}
      {!hasExact && hasFuzzy && (
        <div className="bg-[#2d1f00] border border-amber-700 rounded-2xl px-6 py-5">
          <p className="text-sm font-semibold text-amber-400 mb-4">
            Você quis dizer...?
          </p>
          {fuzzyTeachers.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-amber-600 font-medium uppercase tracking-wide mb-2">Professores</p>
              <div className="flex flex-wrap gap-2">
                {fuzzyTeachers.map((t) => (
                  <Link
                    key={t.id}
                    href={`/professor/${t.id}`}
                    className="px-3 py-1.5 bg-surface border border-edge rounded-full text-sm font-medium text-fg hover:border-brand-400 hover:text-brand-400 transition-colors"
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {fuzzySubjects.length > 0 && (
            <div>
              <p className="text-xs text-amber-600 font-medium uppercase tracking-wide mb-2">Disciplinas</p>
              <div className="flex flex-wrap gap-2">
                {fuzzySubjects.map((s) => (
                  <Link
                    key={s.id}
                    href={`/disciplina/${s.id}`}
                    className="px-3 py-1.5 bg-surface border border-edge rounded-full text-sm font-medium text-fg hover:border-brand-400 hover:text-brand-400 transition-colors"
                  >
                    <span className="font-mono text-xs text-fg-subtle mr-1">{s.code}</span>
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sugestões adicionais quando há resultados exatos */}
      {hasExact && hasFuzzy && (
        <details className="group">
          <summary className="text-xs text-fg-subtle cursor-pointer hover:text-fg-muted list-none flex items-center gap-1">
            <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Ver também resultados similares
          </summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...fuzzyTeachers, ...fuzzySubjects].map((item: any) => (
              <Link
                key={item.id}
                href={'slug' in item ? `/professor/${item.id}` : `/disciplina/${item.id}`}
                className="px-3 py-1.5 bg-surface border border-edge rounded-full text-sm text-fg-muted hover:text-brand-400 hover:border-brand-400 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function TeacherSection({ teachers }: { teachers: TeacherResult[]; supabase: any }) {
  return (
    <section>
      <h2 className="text-xs font-bold text-fg-subtle uppercase tracking-widest mb-3">
        Professores ({teachers.length})
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {teachers.map((t) => (
          <Link
            key={t.id}
            href={`/professor/${t.id}`}
            className="flex items-center gap-4 bg-surface border border-edge rounded-2xl px-5 py-4 hover:border-brand-400 transition-all"
          >
            <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-brand-400 font-bold text-lg">{t.name[0]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-fg truncate">{t.name}</p>
              <p className="text-xs text-fg-subtle mt-0.5">Ver perfil e avaliações →</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function SubjectSection({ subjects }: { subjects: SubjectResult[] }) {
  return (
    <section>
      <h2 className="text-xs font-bold text-fg-subtle uppercase tracking-widest mb-3">
        Disciplinas ({subjects.length})
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {subjects.map((s) => (
          <Link
            key={s.id}
            href={`/disciplina/${s.id}`}
            className="bg-surface border border-edge rounded-2xl px-4 py-3.5 hover:border-accent-400 transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="font-mono text-xs text-fg-subtle">{s.code}</span>
              {s.modality === 'ead' && (
                <span className="text-xs bg-[#1a0533] text-purple-400 font-semibold px-2 py-0.5 rounded-full flex-shrink-0 border border-purple-700">
                  EAD
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-fg leading-snug">{s.name}</p>
            <p className="text-xs text-fg-subtle mt-1">
              {s.subject_type === 'mandatory' ? 'Obrigatória' : s.subject_type === 'elective' ? 'Eletiva' : 'Extensão'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default async function BuscarPage({ searchParams }: Props) {
  const { q = '', curso = '', tipo = '' } = await searchParams

  return (
    <div className="container-page py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-fg mb-2">Buscar</h1>
      <p className="text-fg-muted text-sm mb-8">Encontre professores e disciplinas da UCSAL Pituaçu.</p>

      <Suspense>
        <SearchBox />
      </Suspense>

      <Suspense
        fallback={
          <div className="mt-12 text-center text-fg-subtle text-sm animate-pulse">Buscando...</div>
        }
      >
        <Results q={q} curso={curso} tipo={tipo} />
      </Suspense>

      {!q && (
        <div className="mt-16 text-center">
          <p className="text-fg-subtle text-sm">
            Digite o nome de um professor ou disciplina para começar.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['Cálculo', 'POO', 'Estrutura de Dados', 'Banco de Dados', 'Redes', 'TCC'].map((s) => (
              <Link
                key={s}
                href={`/buscar?q=${encodeURIComponent(s)}`}
                className="text-xs bg-surface border border-edge text-fg-muted px-3 py-1.5 rounded-full hover:bg-surface-2 hover:border-brand-400 hover:text-brand-400 transition-colors"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
