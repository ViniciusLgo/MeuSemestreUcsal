import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ThemeProvider } from '@/components/ui/ThemeProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'MeuSemestreUCSAL — Avaliações de professores',
    template: '%s | MeuSemestreUCSAL',
  },
  description:
    'Avaliações anônimas de professores da UCSAL. Compare professores, monte sua grade perfeita e tome decisões mais inteligentes sobre seu semestre.',
  icons: { icon: '/logo-icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`} data-theme="dark">
      <head>
        {/* Evita flash de tema errado antes do JS carregar */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);})();` }} />
      </head>
      <body className="min-h-screen flex flex-col bg-canvas">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
