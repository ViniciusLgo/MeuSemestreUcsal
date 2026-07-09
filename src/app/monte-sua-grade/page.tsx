import type { Metadata } from 'next'
import { GradeBuilder } from './GradeBuilder'

export const metadata: Metadata = { title: 'Monte sua grade — MeuSemestreUCSAL' }

export default async function MonteGradePage({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>
}) {
  const params = await searchParams
  return <GradeBuilder gradeId={params.grade} />
}
