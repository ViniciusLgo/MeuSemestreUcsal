import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCourseByCode, getCurriculumWithSubjects } from '@/lib/queries/courses'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ codigo: string }>
  searchParams: Promise<{ turno?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codigo } = await params
  return { title: `Curso ${codigo.toUpperCase()}` }
}

type SubjectRow = {
  id: string
  code: string
  name: string
  type: 'mandatory' | 'elective' | 'extension'
  modality: 'presencial' | 'ead' | 'hibrida'
}

type CurriculumItem = {
  id: string
  recommended_order: number | null
  is_required: boolean
  semester: { id: string; number: number } | null
  subject: SubjectRow | null
}

type CurriculumVersion = {
  id: string
  active: boolean
  name: string
  shift: string | null
  campus: string | null
}

export default async function CoursePage({ params, searchParams }: Props) {
  const { codigo } = await params
  const { turno } = await searchParams

  const course = await getCourseByCode(codigo)
  if (!course) notFound()

  const versions = ((course as { curriculum_versions?: CurriculumVersion[] }).curriculum_versions ?? [])
    .filter((v) => v.active)

  const selectedShift = turno?.toLowerCase() === 'noturno' ? 'Noturno' : 'Matutino'
  const selectedVersion = versions.find(
    (v) => v.shift?.toLowerCase() === selectedShift.toLowerCase()
  ) ?? versions[0]

  const subjects: CurriculumItem[] = selectedVersion
    ? (await getCurriculumWithSubjects(selectedVersion.id)) as CurriculumItem[]
    : []

  const mandatory = subjects.filter((s) => s.subject?.type === 'mandatory')
  const electives = subjects.filter((s) => s.subject?.type === 'elective')

  const bySemester = mandatory.reduce<Record<number, CurriculumItem[]>>((acc, item) => {
    const num = item.semester?.number ?? 0
    if (!acc[num]) acc[num] = []
    acc[num].push(item)
    return acc
  }, {})

  const semesterNumbers = Object.keys(bySemester)
    .map(Number)
    .filter((n) => n > 0)
    .sort((a, b) => a - b)

  const courseLabel = (course as { name: string }).name
  const hasNoturno = versions.some((v) => v.shift?.toLowerCase() === 'noturno')
  const hasMatutino = versions.some((v) => v.shift?.toLowerCase() === 'matutino')

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/" className="text-sm text-fg-subtle hover:text-brand-400 transition-colors">
            Início
          </Link>
          <span className="text-edge">/</span>
          <span className="text-sm text-fg-muted">{codigo.toUpperCase()}</span>
        </div>
        <Badge variant="info" className="mb-3">
          {codigo.toUpperCase()}
        </Badge>
        <h1 className="text-4xl font-bold text-fg mb-2">{courseLabel}</h1>
        {selectedVersion && (
          <p className="text-fg-subtle text-sm">
            {selectedVersion.campus} · Matriz {selectedVersion.name.split('—')[0].trim()}
          </p>
        )}
      </div>

      {/* Seletor de turno */}
      {(hasMatutino || hasNoturno) && (
        <div className="flex gap-3 mb-10">
          {hasMatutino && (
            <Link
              href={`/curso/${codigo}?turno=matutino`}
              className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl border-2 font-semibold text-base transition-all ${
                selectedShift === 'Matutino'
                  ? 'border-amber-500 bg-amber-950/30 text-amber-400'
                  : 'border-edge bg-surface text-fg-subtle hover:border-fg-muted hover:text-fg-muted'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
              Matutino
            </Link>
          )}
          {hasNoturno && (
            <Link
              href={`/curso/${codigo}?turno=noturno`}
              className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl border-2 font-semibold text-base transition-all ${
                selectedShift === 'Noturno'
                  ? 'border-accent-400 bg-accent-100 text-accent-400'
                  : 'border-edge bg-surface text-fg-subtle hover:border-fg-muted hover:text-fg-muted'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Noturno
            </Link>
          )}
        </div>
      )}

      {semesterNumbers.map((num) => (
        <div key={num} className="mb-10">
          {/* Cabeçalho do semestre com acento verde */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-sm font-bold">{num}</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-fg leading-none">{num}º Semestre</h2>
              <span className="text-xs text-fg-subtle">{bySemester[num].length} disciplinas</span>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bySemester[num].map((item) => (
              <Link key={item.id} href={`/disciplina/${item.subject?.id}`} className="group">
                {/* Card com borda esquerda verde */}
                <div className="bg-surface border border-edge rounded-xl p-4 h-full flex flex-col gap-2
                  group-hover:border-brand-600 group-hover:bg-surface-hover transition-all duration-200
                  border-l-4 border-l-brand-600">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono text-fg-subtle bg-surface-2 px-1.5 py-0.5 rounded">
                      {item.subject?.code}
                    </span>
                    {item.subject?.modality === 'ead' && (
                      <Badge variant="ead" className="flex-shrink-0">EAD</Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-fg leading-snug group-hover:text-brand-400 transition-colors">
                    {item.subject?.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {electives.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6e40c9] to-[#4a2d8a] flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-sm font-bold">E</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-fg leading-none">Disciplinas Eletivas</h2>
              <span className="text-xs text-fg-subtle">{electives.length} disponíveis · Todas EAD</span>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {electives.map((item) => (
              <Link key={item.id} href={`/disciplina/${item.subject?.id}`} className="group">
                <div className="bg-surface border border-edge rounded-xl p-4 h-full flex flex-col gap-2
                  group-hover:border-accent-500 group-hover:bg-surface-hover transition-all duration-200
                  border-l-4 border-l-accent-500">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono text-fg-subtle bg-surface-2 px-1.5 py-0.5 rounded">
                      {item.subject?.code}
                    </span>
                    <Badge variant="ead" className="flex-shrink-0">EAD</Badge>
                  </div>
                  <p className="text-sm font-semibold text-fg leading-snug group-hover:text-accent-400 transition-colors">
                    {item.subject?.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
