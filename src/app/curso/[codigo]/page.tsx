import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCourseByCode, getCurriculumWithSubjects } from '@/lib/queries/courses'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ codigo: string }>
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

export default async function CoursePage({ params }: Props) {
  const { codigo } = await params
  const course = await getCourseByCode(codigo)
  if (!course) notFound()

  const versions = (course as { curriculum_versions?: Array<{ id: string; active: boolean; name: string; shift: string | null; campus: string | null }> }).curriculum_versions ?? []
  const activeVersion = versions.find((v) => v.active)
  const subjects: CurriculumItem[] = activeVersion
    ? (await getCurriculumWithSubjects(activeVersion.id)) as CurriculumItem[]
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

  return (
    <div className="container-page py-10">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/" className="text-sm text-slate-400 hover:text-brand-600 transition-colors">
            Início
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-600">{codigo.toUpperCase()}</span>
        </div>
        <Badge variant="info" className="mb-3">
          {codigo.toUpperCase()}
        </Badge>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">{courseLabel}</h1>
        {activeVersion && (
          <p className="text-slate-400 text-sm">
            {activeVersion.name} · {activeVersion.shift} · {activeVersion.campus}
          </p>
        )}
      </div>

      {semesterNumbers.map((num) => (
        <div key={num} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-brand-700 text-sm font-bold">{num}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-800">{num}º Semestre</h2>
            <span className="text-xs text-slate-400 font-medium">
              {bySemester[num].length} disciplinas
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bySemester[num].map((item) => (
              <Link key={item.id} href={`/disciplina/${item.subject?.id}`}>
                <Card hover className="p-4 h-full">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-300">{item.subject?.code}</span>
                    {item.subject?.modality === 'ead' && (
                      <Badge variant="ead" className="flex-shrink-0">EAD</Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 leading-snug">
                    {item.subject?.name}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {electives.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-purple-700 text-sm font-bold">E</span>
            </div>
            <h2 className="text-lg font-bold text-slate-800">Disciplinas Eletivas</h2>
            <Badge variant="ead">EAD</Badge>
            <span className="text-xs text-slate-400 font-medium">{electives.length} disponíveis</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {electives.map((item) => (
              <Link key={item.id} href={`/disciplina/${item.subject?.id}`}>
                <Card hover className="p-4 h-full">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-300">{item.subject?.code}</span>
                    <Badge variant="ead" className="flex-shrink-0">EAD</Badge>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 leading-snug">
                    {item.subject?.name}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
