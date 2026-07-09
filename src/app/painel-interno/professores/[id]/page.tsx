import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { assignSubjects, removeSubject } from '@/lib/actions/admin'
import { SubjectSelector } from './SubjectSelector'

type Props = { params: Promise<{ id: string }> }

export default async function ProfessorDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [teacherRes, linksRes, subjectsRes, coursesRes] = await Promise.all([
    (supabase as any).from('teachers').select('id, name').eq('id', id).single(),
    (supabase as any)
      .from('teacher_subjects')
      .select('id, subject:subjects(id, code, name), course:courses(id, code)')
      .eq('teacher_id', id)
      .order('created_at'),
    (supabase as any)
      .from('subjects')
      .select('id, code, name, type')
      .eq('active', true)
      .order('name'),
    (supabase as any).from('courses').select('id, code').eq('active', true).order('code'),
  ])

  if (!teacherRes.data) notFound()

  const teacher = teacherRes.data
  const links: any[] = linksRes.data ?? []
  const allSubjects: any[] = subjectsRes.data ?? []
  const courses: any[] = coursesRes.data ?? []

  const linkedSubjectIds = new Set(links.map((l: any) => l.subject?.id))
  const availableSubjects = allSubjects.filter((s: any) => !linkedSubjectIds.has(s.id))

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/painel-interno/professores" className="text-sm text-fg-subtle hover:text-fg-muted">
          ← Professores
        </Link>
        <span className="text-edge">/</span>
        <h1 className="text-xl font-bold text-fg">{teacher.name}</h1>
      </div>

      {/* Disciplinas já vinculadas */}
      {links.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-3">
            Disciplinas vinculadas ({links.length})
          </p>
          <div className="bg-surface rounded-xl border border-edge divide-y divide-edge-muted">
            {links.map((link: any) => (
              <div key={link.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="font-mono text-xs text-fg-subtle mr-2">{link.subject?.code}</span>
                  <span className="text-sm text-fg">{link.subject?.name}</span>
                  {link.course && (
                    <span className="ml-2 text-xs bg-surface-2 text-fg-muted px-1.5 py-0.5 rounded">
                      {link.course.code}
                    </span>
                  )}
                </div>
                <form action={removeSubject.bind(null, link.id, id)}>
                  <button type="submit" className="text-xs text-red-400 hover:text-red-600 font-medium ml-4">
                    Remover
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seletor de novas disciplinas */}
      {availableSubjects.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-3">
            Adicionar disciplinas
          </p>
          <SubjectSelector
            teacherId={id}
            subjects={availableSubjects}
            action={assignSubjects}
            courses={courses}
          />
        </div>
      ) : (
        <p className="text-sm text-fg-subtle">Todas as disciplinas já estão vinculadas.</p>
      )}
    </div>
  )
}
