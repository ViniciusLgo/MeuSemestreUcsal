'use client'

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
  shift: string | null
  onRemove: (key: string) => void
  compact?: boolean
}

export function ScheduleGrid({ scheduleMap, shift, onRemove, compact = false }: Props) {
  const slots = shift?.toLowerCase() === 'noturno' ? NIGHT_SLOTS : MORNING_SLOTS

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className={`text-fg-subtle font-medium text-right pr-2 ${compact ? 'w-14' : 'w-20'}`} />
            {DAYS.map((d) => (
              <th key={d} className="text-center font-semibold text-fg-muted pb-1.5 px-0.5">
                {compact ? d.slice(0, 1) : d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot.id} className="border-t border-edge-muted">
              <td className="pr-2 py-0.5 text-right text-fg-subtle align-middle whitespace-nowrap">
                <span className="text-[10px]">{compact ? slot.label : slot.range}</span>
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
                          px-1 py-1.5 text-center hover:opacity-70 transition-opacity`}
                      >
                        <p className="font-bold leading-none text-[10px]">{cell.subject_code}</p>
                        {!compact && (
                          <p className="leading-none mt-0.5 text-[9px] opacity-80 truncate">
                            {cell.teacher_name.split(' ')[0]}
                          </p>
                        )}
                      </button>
                    ) : (
                      <div className={`rounded-md border border-transparent ${
                        compact ? 'h-7' : 'h-9'
                      } bg-surface-2 opacity-20`} />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
