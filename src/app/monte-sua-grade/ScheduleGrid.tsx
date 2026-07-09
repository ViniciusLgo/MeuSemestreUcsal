'use client'

// ─── Horários reais da UCSAL (blocos de 75 min) ───────────────────────────────

export const MANHA_SLOTS = [
  { id: 0, label: '07:00', range: '07:00–08:15' },
  { id: 1, label: '08:25', range: '08:25–09:40' },
  { id: 2, label: '09:50', range: '09:50–11:05' },
  { id: 3, label: '11:15', range: '11:15–12:30' },
] as const

export const NOITE_SLOTS = [
  { id: 4, label: '19:00', range: '19:00–20:15' },
  { id: 5, label: '20:25', range: '20:25–21:40' },
] as const

export type TimeSlot = { id: number; label: string; range: string }
export const ALL_SLOTS: TimeSlot[] = [...MANHA_SLOTS, ...NOITE_SLOTS]

export const PERIODS = [
  { label: 'Manhã', slots: MANHA_SLOTS as unknown as TimeSlot[] },
  { label: 'Noite', slots: NOITE_SLOTS as unknown as TimeSlot[] },
] as const

// ─── Dias ─────────────────────────────────────────────────────────────────────

export const DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'] as const
export type Day = typeof DAYS[number]

// ─── Cores ────────────────────────────────────────────────────────────────────

export const SUBJECT_COLORS = [
  { bg: 'bg-emerald-500', hex: '#10b981' },
  { bg: 'bg-blue-500',    hex: '#3b82f6' },
  { bg: 'bg-purple-500',  hex: '#a855f7' },
  { bg: 'bg-orange-500',  hex: '#f97316' },
  { bg: 'bg-rose-500',    hex: '#f43f5e' },
  { bg: 'bg-cyan-500',    hex: '#06b6d4' },
  { bg: 'bg-amber-500',   hex: '#f59e0b' },
  { bg: 'bg-indigo-500',  hex: '#6366f1' },
  { bg: 'bg-teal-500',    hex: '#14b8a6' },
  { bg: 'bg-pink-500',    hex: '#ec4899' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScheduleSlot = {
  subject_id: string
  subject_name: string
  subject_code: string
  teacher_name: string
  colorIdx: number
}

export type ScheduleMap = Record<string, ScheduleSlot | undefined>

interface Props {
  scheduleMap: ScheduleMap
  onRemove: (key: string) => void
  compact?: boolean
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ScheduleGrid({ scheduleMap, onRemove, compact = false }: Props) {
  const hasAnyCell = Object.keys(scheduleMap).length > 0

  // Mostra só os períodos que têm aula marcada; se nada marcado, mostra todos
  const finalPeriods = hasAnyCell
    ? PERIODS.filter((period) =>
        period.slots.some((slot) => DAYS.some((day) => !!scheduleMap[`${day}:${slot.id}`]))
      )
    : [...PERIODS]

  const periodsToRender = finalPeriods.length > 0 ? finalPeriods : [...PERIODS]

  const dayLabels: Record<string, string> = {
    SEG: compact ? 'S' : 'Seg',
    TER: compact ? 'T' : 'Ter',
    QUA: compact ? 'Q' : 'Qua',
    QUI: compact ? 'Q' : 'Qui',
    SEX: compact ? 'S' : 'Sex',
    SAB: compact ? 'S' : 'Sáb',
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ fontSize: compact ? 10 : 11 }}>
        <thead>
          <tr>
            <th className={`text-fg-subtle font-medium text-right pr-2 ${compact ? 'w-12' : 'w-20'}`} />
            {DAYS.map((d) => (
              <th key={d} className="text-center font-semibold text-fg-muted pb-1.5 px-0.5 whitespace-nowrap">
                {dayLabels[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periodsToRender.map((period) => (
            <>
              {/* Header de período */}
              {!compact && (
                <tr key={`h-${period.label}`}>
                  <td colSpan={7}
                    className="text-[9px] font-bold text-fg-subtle uppercase tracking-widest py-1.5 pt-3 text-left pr-2">
                    {period.label}
                  </td>
                </tr>
              )}
              {period.slots.map((slot) => (
                <tr key={slot.id} className="border-t border-edge-muted">
                  <td className="pr-2 py-0.5 text-right text-fg-subtle align-middle whitespace-nowrap">
                    <span>{compact ? slot.label : slot.range}</span>
                  </td>
                  {DAYS.map((day) => {
                    const key = `${day}:${slot.id}`
                    const cell = scheduleMap[key]
                    return (
                      <td key={day} className="p-0.5 align-middle">
                        {cell ? (
                          <button
                            onClick={() => onRemove(key)}
                            title={`${cell.subject_name}\n${cell.teacher_name}\nClique para remover`}
                            className={`w-full ${SUBJECT_COLORS[cell.colorIdx].bg} text-white rounded-md
                              px-1 py-1.5 text-center hover:opacity-70 transition-opacity`}>
                            <p className="font-bold leading-none" style={{ fontSize: compact ? 9 : 10 }}>
                              {cell.subject_code}
                            </p>
                            {!compact && (
                              <p className="leading-none mt-0.5 opacity-80 truncate" style={{ fontSize: 9 }}>
                                {cell.teacher_name.split(' ')[0]}
                              </p>
                            )}
                          </button>
                        ) : (
                          <div className={`rounded-md border border-transparent ${compact ? 'h-6' : 'h-8'} bg-surface-2 opacity-20`} />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
