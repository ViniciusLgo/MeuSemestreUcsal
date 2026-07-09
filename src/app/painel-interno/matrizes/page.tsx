import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Matrizes — Painel Admin' }

type Subject = { id: string; code: string; name: string; type: string; modality: string }
type CurriculumSubject = { subject: Subject | null; semester: { number: number } | null; is_required: boolean }
type Version = {
  id: string
  name: string
  shift: string | null
  campus: string | null
  year: number | null
  active: boolean
  course: { code: string; name: string } | null
  curriculum_subjects: CurriculumSubject[]
}

export default async function MatrizesPage() {
  const supabase = await createClient()

  const { data: versions } = await (supabase as any)
    .from('curriculum_versions')
    .select(`
      id, name, shift, campus, year, active,
      course:courses(code, name),
      curriculum_subjects(
        is_required,
        semester:semesters(number),
        subject:subjects(id, code, name, type, modality)
      )
    `)
    .eq('active', true)
    .order('name') as { data: Version[] | null }

  if (!versions?.length) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Matrizes</h1>
        <p className="text-slate-400 text-sm">Nenhuma matriz ativa encontrada.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Matrizes curriculares ativas</h1>

      <div className="space-y-10">
        {versions.map((version) => {
          const allSubjects = version.curriculum_subjects ?? []
          const mandatory = allSubjects.filter((cs) => cs.subject?.type === 'mandatory')
          const electives = allSubjects.filter((cs) => cs.subject?.type === 'elective')
          const total = allSubjects.length

          // Agrupar obrigatórias por semestre
          const bySemester: Record<number, CurriculumSubject[]> = {}
          for (const cs of mandatory) {
            const num = cs.semester?.number ?? 0
            if (!bySemester[num]) bySemester[num] = []
            bySemester[num].push(cs)
          }
          const semNums = Object.keys(bySemester).map(Number).sort((a, b) => a - b)

          const shiftColor = version.shift === 'Noturno'
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'

          return (
            <div key={version.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* Header da versão */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {version.course?.code}
                    </span>
                    {version.shift && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${shiftColor}`}>
                        {version.shift === 'Noturno' ? '🌙' : '☀️'} {version.shift}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{version.course?.name}</h2>
                  <p className="text-sm text-slate-400">{version.name} · {version.campus}</p>
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">{mandatory.length}</p>
                    <p className="text-xs text-slate-400">obrigatórias</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">{electives.length}</p>
                    <p className="text-xs text-slate-400">eletivas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-brand-600 tabular-nums">{total}</p>
                    <p className="text-xs text-slate-400">total</p>
                  </div>
                </div>
              </div>

              {/* Semestres */}
              <div className="divide-y divide-slate-50">
                {semNums.map((num) => {
                  const items = bySemester[num]
                  return (
                    <div key={num} className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-700 text-xs font-bold">{num}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-700">{num}º Semestre</p>
                        <span className="text-xs text-slate-400">{items.length} disciplinas</span>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {items.map((cs, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                              cs.subject?.modality === 'ead'
                                ? 'bg-purple-50'
                                : 'bg-slate-50'
                            }`}
                          >
                            <span className="font-mono text-xs text-slate-300 flex-shrink-0 w-14 truncate">
                              {cs.subject?.code}
                            </span>
                            <span className="text-slate-700 leading-tight truncate">
                              {cs.subject?.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Eletivas */}
                {electives.length > 0 && (
                  <div className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-700 text-xs font-bold">E</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Eletivas EAD</p>
                      <span className="text-xs text-slate-400">{electives.length} disponíveis</span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {electives.map((cs, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 text-sm">
                          <span className="font-mono text-xs text-slate-300 flex-shrink-0 w-14 truncate">
                            {cs.subject?.code}
                          </span>
                          <span className="text-slate-700 leading-tight truncate">
                            {cs.subject?.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
