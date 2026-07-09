import type { Metadata } from 'next'
import { FaqClient } from './FaqClient'

export const metadata: Metadata = { title: 'FAQ — MeuSemestreUCSAL' }

export default function FaqPage() {
  return <FaqClient />
}
