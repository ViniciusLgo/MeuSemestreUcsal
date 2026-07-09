import type { Metadata } from 'next'
import { GradeBuilder } from './GradeBuilder'

export const metadata: Metadata = { title: 'Monte sua grade — MeuSemestreUCSAL' }

export default function MonteGradePage() {
  return <GradeBuilder />
}
