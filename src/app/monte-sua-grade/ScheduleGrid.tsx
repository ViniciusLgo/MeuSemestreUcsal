'use client'

// Slots de horário por turno
export const MORNING_SLOTS = [
  { id: 0, label: '07:00', range: '07:00–07:50' },
  { id: 1, label: '07:50', range: '07:50–08:40' },
  { id: 2, label: '08:40', range: '08:40–09:30' },
  { id: 3, label: '09:30', range: '09:30–10:20' },
  { id: 4, label: '10:20', range: '10:20–11:10' },
]

export const NIGHT_SLOTS = [
  { id: 0, label: '19:00', range: '19:00–19:50' },
  { id: 1, label: '19:50', range: '19:50–20:40' },
  { id: 2, label: '20:40', range: '20:40–21:30' },
  { id: 3, label: '21:30', range: '21:30–22:20' },
]

export const DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'] as const
export type Day = typeof DAYS[number]

export const SUBJECT_COLORS = [
  { bg: 'bg-emerald-500', text: 'text-white', light: 'bg-emerald-100 text-emerald-800', hex: '#10b981' },
  { bg: 'bg-blue-500',    text: 'text-white', light: 'bg-blue-100 text-blue-800',    hex: '#3b82f6' },
  { bg: 'bg-purple-500',  text: 'text-white', light: 'bg-purple-100 text-purple-800',  hex: '#a855f7' },
  { bg: 'bg-orange-500',  text: 'text-white', light: 'bg-orange-100 text-orange-800',  hex: '#f97316' },
  { bg: 'bg-rose-500',    text: 'text-white', light: 'bg-rose-100 text-rose-800',    hex: '#f43f5e' },
  { bg: 'bg-cyan-500',    text: 'text-white', light: 'bg-cyan-100 text-cyan-800',    hex: '#06b6d4' },
  { bg: 'bg-amber-500',   text: 'text-white', light: 'bg-amber-100 text-amber-800',   hex: '#f59e0b' },
  { bg: 'bg-indigo-500',  text: 'text-white', light: 'bg-indigo-100 text-indigo-800',  hex: '#6366f1' },
  { bg: 'bg-teal-500',    text: 'text-white', light: 'bg-teal-100 text-teal-800',    hex: '#14b8a6' },
  { bg: 'bg-pink-500',    text: 'text-white', light: 'bg-pink-100 text-pink-800',    hex: '#ec4899' },
]

export type ScheduleSlot = {
  subject_id: string
  subject_name: string
  subject_code: string
  teacher_name: string
  colorIdx: number
}

// Chave da célula: "DAY:SLOT"
export type ScheduleMap = Record<string, ScheduleSlot | undefined>

interface Props {
  scheduleMap: ScheduleMap
  shift: string | null
  // Qual disciplina está "selecionada para colocar na grade"
  activeSubject: ScheduleSlot | null
  onCellClick: (key: string) => void
  onCellRemove: (key: string) => void
}

export function ScheduleGrid({ scheduleMap, shift, activeSubject, onCellClick, onCellRemove }: Props) {
  const slots = shift?.toLowerCase() === 'noturno' ? NIGHT_SLOTS : MORNING_SLOTS

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="w-20 py-2 text-fg-subtle font-medium text-right pr-3">Horário</th>
            {DAYS.map((d) => (
              <th key={d} className="py-2 text-center font-semibold text-fg-muted px-1">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot.id} className="border-t border-edge-muted">
              <td className="py-0.5 pr-3 text-right text-fg-subtle whitespace-nowrap align-middle">
                <span className="text-[10px]">{slot.range}</span>
              </td>
              {DAYS.map((day) => {
                const key = `${day}:${slot.id}`
                const cell = scheduleMap[key]

                return (
                  <td key={day} className="p-0.5 align-middle">
                    {cell ? (
                      <div
                        className={`${SUBJECT_COLORS[cell.colorIdx].bg} ${SUBJECT_COLORS[cell.colorIdx].text}
                          rounded-lg px-1.5 py-1.5 text-center cursor-pointer hover:opacity-80 transition-opacity group relative`}
                        onClick={() => onCellRemove(key)}
                        title={`${cell.subject_name} — ${cell.teacher_name}\nClique para remover`}
                      >
                        <p className="font-bold leading-none text-[10px]">{cell.subject_code}</p>
                        <p className="leading-none mt-0.5 text-[9px] opacity-80 truncate max-w-[60px]">
                          {cell.teacher_name.split(' ')[0]}
                        </p>
                      </div>
                    ) : (
                      <div
                        className={`rounded-lg h-9 transition-all cursor-pointer border border-transparent
                          ${activeSubject
                            ? `hover:border-[${SUBJECT_COLORS[activeSubject.colorIdx].hex}] hover:bg-surface-2 hover:opacity-80`
                            : 'hover:bg-surface-2 opacity-30'
                          }`}
                        onClick={() => activeSubject && onCellClick(key)}
                      />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {activeSubject && (
        <p className="mt-2 text-xs text-center text-fg-subtle">
          Clique nas células para posicionar{' '}
          <span className="font-semibold text-fg">{activeSubject.subject_code}</span>
          {' '}na grade
        </p>
      )}
    </div>
  )
}
