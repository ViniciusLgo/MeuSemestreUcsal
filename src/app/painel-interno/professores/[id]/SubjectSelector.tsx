'use client'

import { useState, useMemo } from 'react'

type Subject = { id: string; code: string; name: string; type: string }

type Props = {
  teacherId: string
  subjects: Subject[]
  action: (formData: FormData) => Promise<any>
  courses: { id: string; code: string }[]
}

const TYPE_LABEL: Record<string, string> = {
  mandatory: 'Obrigatórias',
  elective: 'Eletivas EAD',
  extension: 'Extensão',
}

export function SubjectSelector({ teacherId, subjects, action, courses }: Props) {
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState(false)

  const filtered = useMemo(() => {
    const q = filter.toLowerCase()
    return subjects.filter(
      (s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    )
  }, [subjects, filter])

  const grouped = useMemo(() => {
    const map: Record<string, Subject[]> = {}
    for (const s of filtered) {
      ;(map[s.type] ??= []).push(s)
    }
    return map
  }, [filtered])

  function toggleAll(ids: string[], checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected.size) return
    setPending(true)
    const fd = new FormData(e.currentTarget)
    selected.forEach((id) => fd.append('subject_ids', id))
    await action(fd)
    setSelected(new Set())
    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="teacher_id" value={teacherId} />

      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar disciplinas..."
          className="flex-1 min-w-48 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          name="course_id"
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Todos os cursos</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.code}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending || selected.size === 0}
          className="px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? 'Salvando...' : `Vincular ${selected.size > 0 ? `(${selected.size})` : ''}`}
        </button>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-slate-400 py-4">Nenhuma disciplina encontrada.</p>
      )}

      <div className="space-y-5">
        {Object.entries(grouped).map(([type, list]) => {
          const allIds = list.map((s) => s.id)
          const allChecked = allIds.every((id) => selected.has(id))
          const someChecked = allIds.some((id) => selected.has(id))

          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked }}
                  onChange={(e) => toggleAll(allIds, e.target.checked)}
                  className="w-4 h-4 accent-brand-600"
                />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {TYPE_LABEL[type] ?? type} ({list.length})
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {list.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={(e) => {
                        setSelected((prev) => {
                          const next = new Set(prev)
                          e.target.checked ? next.add(s.id) : next.delete(s.id)
                          return next
                        })
                      }}
                      className="w-4 h-4 accent-brand-600 flex-shrink-0"
                    />
                    <span className="text-sm text-slate-900">
                      <span className="font-mono text-xs text-slate-400 mr-2">{s.code}</span>
                      {s.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </form>
  )
}
