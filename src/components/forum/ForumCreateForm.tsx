'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createThread, recordForumAttachments } from '@/lib/actions/forum'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface Category {
  id:   string
  name: string
  icon: string
  slug: string
}

interface Props {
  categories: Category[]
  subjectId?:  string | null
  teacherId?:  string | null
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_IMAGE = 5 * 1024 * 1024  // 5 MB
const MAX_PDF   = 10 * 1024 * 1024 // 10 MB
const MAX_FILES = 3

function fileError(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return `${file.name}: tipo não permitido (use JPG, PNG, WebP ou PDF).`
  const limit = file.type === 'application/pdf' ? MAX_PDF : MAX_IMAGE
  if (file.size > limit) return `${file.name}: excede ${file.type === 'application/pdf' ? '10 MB' : '5 MB'}.`
  return null
}

export function ForumCreateForm({ categories, subjectId, teacherId }: Props) {
  const router = useRouter()

  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? '')
  const [title,      setTitle]      = useState('')
  const [body,       setBody]       = useState('')
  const [hasPoll,    setHasPoll]    = useState(false)
  const [pollQ,      setPollQ]      = useState('')
  const [pollEnds,   setPollEnds]   = useState('')
  const [options,    setOptions]    = useState(['', ''])
  const [files,      setFiles]      = useState<File[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function addOption() {
    if (options.length < 5) setOptions((v) => [...v, ''])
  }

  function setOption(i: number, val: string) {
    setOptions((v) => v.map((o, idx) => idx === i ? val : o))
  }

  function removeOption(i: number) {
    if (options.length <= 2) return
    setOptions((v) => v.filter((_, idx) => idx !== i))
  }

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return
    const next = [...files]
    for (const f of Array.from(incoming)) {
      const err = fileError(f)
      if (err) { setError(err); return }
      if (next.length >= MAX_FILES) { setError(`Máximo de ${MAX_FILES} arquivos por thread.`); return }
      next.push(f)
    }
    setError(null)
    setFiles(next)
  }

  function removeFile(i: number) {
    setFiles((v) => v.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) { setError('Título é obrigatório.'); return }
    if (!body.trim())  { setError('Conteúdo é obrigatório.'); return }

    const poll = hasPoll && pollQ.trim() && options.filter(Boolean).length >= 2
      ? { question: pollQ.trim(), ends_at: pollEnds || null, options: options.filter(Boolean) }
      : null

    setLoading(true)
    const result = await createThread({
      category_id: subjectId ? null : (categoryId || null),
      subject_id:  subjectId ?? null,
      teacher_id:  teacherId ?? null,
      title,
      body,
      poll,
    })

    if (result.error) { setLoading(false); setError(result.error); return }

    const threadId = result.thread_id!

    // Upload de anexos (se houver)
    if (files.length > 0) {
      const supabase = createClient()
      const uploaded: { storage_path: string; mime_type: string; size_bytes: number }[] = []

      for (const file of files) {
        const ext  = file.name.split('.').pop()
        const path = `${threadId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('forum-attachments')
          .upload(path, file, { contentType: file.type, upsert: false })

        if (uploadErr) { setLoading(false); setError(`Erro no upload de ${file.name}.`); return }
        uploaded.push({ storage_path: path, mime_type: file.type, size_bytes: file.size })
      }

      const { error: recErr } = await recordForumAttachments(threadId, uploaded)
      if (recErr) { setLoading(false); setError(recErr); return }
    }

    router.push(`/forum/thread/${threadId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Categoria (só se não vinculado a disciplina) */}
      {!subjectId && (
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-fg">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  categoryId === cat.id
                    ? 'bg-brand-600 border-brand-400 text-white'
                    : 'bg-surface-2 border-edge text-fg-muted hover:border-fg-muted'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Título */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-fg">Título</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do seu tópico…"
          maxLength={200}
          className="w-full text-sm bg-canvas border border-edge rounded-xl px-3 py-2.5 text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent-400"
        />
        <p className="text-xs text-fg-subtle text-right">{title.length}/200</p>
      </div>

      {/* Conteúdo */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-fg">Conteúdo</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escreva sua mensagem aqui…"
          rows={6}
          maxLength={5000}
          className="w-full text-sm bg-canvas border border-edge rounded-xl px-3 py-2.5 text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent-400 resize-none"
        />
        <p className={`text-xs text-right ${5000 - body.length < 200 ? 'text-amber-400' : 'text-fg-subtle'}`}>
          {5000 - body.length} caracteres restantes
        </p>
      </div>

      {/* Anexos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-fg">Anexos <span className="font-normal text-fg-subtle">(opcional)</span></label>
          <span className="text-xs text-fg-subtle">{files.length}/{MAX_FILES} arquivos</span>
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-surface-2 border border-edge rounded-lg px-2.5 py-1.5 text-xs text-fg-muted">
                <span>{f.type === 'application/pdf' ? '📄' : '🖼️'}</span>
                <span className="max-w-[120px] truncate">{f.name}</span>
                <button type="button" onClick={() => removeFile(i)} className="text-fg-subtle hover:text-red-400 ml-1 transition-colors">✕</button>
              </div>
            ))}
          </div>
        )}

        {files.length < MAX_FILES && (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border border-dashed border-edge rounded-xl py-3 text-sm text-fg-subtle hover:border-fg-muted hover:text-fg-muted transition-colors"
            >
              + Adicionar imagem ou PDF
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </>
        )}
        <p className="text-xs text-fg-subtle">JPG, PNG, WebP (máx 5 MB) ou PDF (máx 10 MB)</p>
      </div>

      {/* Enquete (opcional) */}
      <div className="bg-surface-2 border border-edge rounded-xl p-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasPoll}
            onChange={(e) => setHasPoll(e.target.checked)}
            className="accent-brand-400"
          />
          <span className="text-sm font-semibold text-fg">Adicionar enquete</span>
        </label>

        {hasPoll && (
          <div className="space-y-3 pt-1">
            <input
              type="text"
              value={pollQ}
              onChange={(e) => setPollQ(e.target.value)}
              placeholder="Pergunta da enquete…"
              className="w-full text-sm bg-canvas border border-edge rounded-lg px-3 py-2 text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent-400"
            />

            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Opção ${i + 1}`}
                    className="flex-1 text-sm bg-canvas border border-edge rounded-lg px-3 py-2 text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent-400"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="text-sm text-fg-subtle hover:text-red-400 px-2 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {options.length < 5 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs text-fg-subtle hover:text-fg-muted transition-colors"
                >
                  + Adicionar opção
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-fg-muted">Data de encerramento (opcional)</label>
              <input
                type="date"
                value={pollEnds}
                onChange={(e) => setPollEnds(e.target.value)}
                className="text-sm bg-canvas border border-edge rounded-lg px-3 py-2 text-fg focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Aviso de anonimato */}
      <p className="text-xs text-fg-subtle bg-surface-2 border border-edge rounded-xl px-3 py-2.5">
        🔒 Seu nome e e-mail nunca serão exibidos. Você receberá um apelido aleatório neste tópico.
      </p>

      {error && (
        <p className="text-sm text-red-400 bg-[#2d0a0a] border border-red-700 px-3 py-2 rounded-xl">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Publicando…' : 'Publicar tópico'}
      </Button>
    </form>
  )
}
