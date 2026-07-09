'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type CurriculumVersion = {
  id: string
  name: string
  shift: string | null
  course_id: string
}

type Course = {
  id: string
  code: string
  name: string
  curriculum_versions: CurriculumVersion[]
}

function ConfigurarForm() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/'
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await (supabase as any)
        .from('courses')
        .select('id, code, name, curriculum_versions(id, name, shift, course_id)')
        .eq('active', true) as { data: Course[] | null }
      setCourses(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const selectedCourse = courses.find((c) => c.id === selectedCourseId)
  const versions = selectedCourse?.curriculum_versions ?? []

  async function handleSave() {
    if (!selectedCourseId || !selectedVersionId) {
      setError('Selecione o curso e o turno para continuar.')
      return
    }
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/entrar')
      return
    }

    const selectedVersion = versions.find((v) => v.id === selectedVersionId)

    const { error: err } = await (supabase as any)
      .from('profiles')
      .update({
        course_id: selectedCourseId,
        shift: selectedVersion?.shift ?? null,
        curriculum_version_id: selectedVersionId,
      })
      .eq('id', user.id)

    setSaving(false)
    if (err) {
      setError('Erro ao salvar. Tente novamente.')
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-canvas">
        <div className="text-fg-muted text-sm">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-canvas">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-fg">Configure seu perfil</h1>
          <p className="text-fg-muted text-sm mt-2">
            Isso nos ajuda a mostrar avaliações relevantes para você.
          </p>
        </div>

        <div className="space-y-6">
          {/* Seleção de curso */}
          <div>
            <p className="text-sm font-semibold text-fg mb-3">Qual é o seu curso?</p>
            <div className="grid grid-cols-2 gap-3">
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => {
                    setSelectedCourseId(course.id)
                    setSelectedVersionId(null)
                    setError(null)
                  }}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    selectedCourseId === course.id
                      ? 'border-brand-500 bg-brand-100'
                      : 'border-edge bg-surface hover:border-fg-muted'
                  )}
                >
                  <div className={cn(
                    'text-lg font-bold mb-1',
                    selectedCourseId === course.id ? 'text-brand-400' : 'text-fg'
                  )}>
                    {course.code}
                  </div>
                  <div className={cn(
                    'text-xs leading-tight',
                    selectedCourseId === course.id ? 'text-brand-400' : 'text-fg-muted'
                  )}>
                    {course.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Seleção de turno */}
          {selectedCourse && versions.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-fg mb-3">Qual é o seu turno?</p>
              <div className="grid grid-cols-2 gap-3">
                {versions
                  .filter((v) => v.shift)
                  .map((version) => (
                    <button
                      key={version.id}
                      type="button"
                      onClick={() => { setSelectedVersionId(version.id); setError(null) }}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        selectedVersionId === version.id
                          ? 'border-brand-500 bg-brand-100'
                          : 'border-edge bg-surface hover:border-fg-muted'
                      )}
                    >
                      <div className={cn(
                        'font-bold text-base',
                        selectedVersionId === version.id ? 'text-brand-400' : 'text-fg'
                      )}>
                        {version.shift}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-[#2d0a0a] border border-red-700 px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button
            onClick={handleSave}
            size="lg"
            className="w-full"
            disabled={saving || !selectedCourseId || !selectedVersionId}
          >
            {saving ? 'Salvando...' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ConfigurarPerfilPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <ConfigurarForm />
    </Suspense>
  )
}
