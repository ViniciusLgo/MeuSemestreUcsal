'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateNickname, getNicknameColor } from '@/lib/forum/nicknames'
import { moderateForumContent } from '@/lib/forum/moderation'

async function requireActiveUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single()

  if ((profile as { status: string } | null)?.status !== 'active') {
    return { error: 'Conta suspensa.' } as never
  }

  return { supabase, user }
}

async function getOrCreateIdentity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  threadId: string,
  userId: string
): Promise<{ nickname: string; color: string }> {
  const db = supabase as any

  const { data: existing } = await db
    .from('forum_thread_identities')
    .select('nickname, color')
    .eq('thread_id', threadId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) return existing as { nickname: string; color: string }

  const nickname = generateNickname()
  const color    = getNicknameColor(nickname)

  await db
    .from('forum_thread_identities')
    .insert({ thread_id: threadId, user_id: userId, nickname, color })

  return { nickname, color }
}

async function checkRateLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  table: string,
  limit: number
): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await (supabase as any)
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('author_id', userId)
    .gte('created_at', since)

  return ((count as number | null) ?? 0) < limit
}

// ── Criar thread ──────────────────────────────────────────────────────────────

type CreateThreadPayload = {
  category_id?: string | null
  subject_id?:  string | null
  teacher_id?:  string | null
  title:  string
  body:   string
  poll?: {
    question: string
    ends_at?: string | null
    options: string[]
  } | null
}

export async function createThread(payload: CreateThreadPayload): Promise<{ error?: string; thread_id?: string }> {
  const { supabase, user } = await requireActiveUser()
  const db = supabase as any

  const withinLimit = await checkRateLimit(supabase, user.id, 'forum_threads', 5)
  if (!withinLimit) return { error: 'Limite diário de 5 threads atingido. Tente amanhã.' }

  if (!payload.title?.trim()) return { error: 'Título é obrigatório.' }
  if (!payload.body?.trim())  return { error: 'Conteúdo é obrigatório.' }
  if (payload.title.length > 200) return { error: 'Título muito longo (máx 200 caracteres).' }
  if (payload.body.length > 5000) return { error: 'Conteúdo muito longo (máx 5000 caracteres).' }

  const titleStatus = moderateForumContent(payload.title, 200)
  const bodyStatus  = moderateForumContent(payload.body,  5000)
  const status = (titleStatus === 'em_revisao' || bodyStatus === 'em_revisao')
    ? 'em_revisao'
    : 'publicado'

  const { data: thread, error } = await db
    .from('forum_threads')
    .insert({
      category_id: payload.category_id ?? null,
      subject_id:  payload.subject_id  ?? null,
      teacher_id:  payload.teacher_id  ?? null,
      author_id:   user.id,
      title:       payload.title.trim(),
      body:        payload.body.trim(),
      status,
    })
    .select('id')
    .single()

  if (error || !thread) return { error: 'Erro ao criar thread. Tente novamente.' }

  const { id: threadId } = thread as { id: string }

  await getOrCreateIdentity(supabase, threadId, user.id)

  if (payload.poll && payload.poll.question && payload.poll.options.filter(Boolean).length >= 2) {
    const { data: poll } = await db
      .from('forum_polls')
      .insert({
        thread_id: threadId,
        question:  payload.poll.question.trim(),
        ends_at:   payload.poll.ends_at ?? null,
      })
      .select('id')
      .single()

    if (poll) {
      const { id: pollId } = poll as { id: string }
      await db.from('forum_poll_options').insert(
        payload.poll.options
          .filter(Boolean)
          .map((label: string, i: number) => ({ poll_id: pollId, label: label.trim(), order: i }))
      )
    }
  }

  revalidatePath('/forum')
  if (payload.category_id) revalidatePath(`/forum/${payload.category_id}`)

  return { thread_id: threadId }
}

// ── Criar post ────────────────────────────────────────────────────────────────

type CreatePostPayload = {
  thread_id: string
  parent_id?: string | null
  body: string
}

export async function createPost(payload: CreatePostPayload): Promise<{ error?: string; post_id?: string }> {
  const { supabase, user } = await requireActiveUser()
  const db = supabase as any

  const withinLimit = await checkRateLimit(supabase, user.id, 'forum_posts', 20)
  if (!withinLimit) return { error: 'Limite diário de 20 respostas atingido. Tente amanhã.' }

  if (!payload.body?.trim()) return { error: 'Resposta não pode ser vazia.' }
  if (payload.body.length > 2000) return { error: 'Resposta muito longa (máx 2000 caracteres).' }

  const status = moderateForumContent(payload.body, 2000)

  const { data: post, error } = await db
    .from('forum_posts')
    .insert({
      thread_id: payload.thread_id,
      parent_id: payload.parent_id ?? null,
      author_id: user.id,
      body:      payload.body.trim(),
      status,
    })
    .select('id')
    .single()

  if (error || !post) return { error: 'Erro ao enviar resposta.' }

  const { id: postId } = post as { id: string }

  await getOrCreateIdentity(supabase, payload.thread_id, user.id)

  revalidatePath(`/forum/thread/${payload.thread_id}`)
  return { post_id: postId }
}

// ── Deletar thread própria ────────────────────────────────────────────────────

export async function deleteOwnThread(threadId: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireActiveUser()

  const { error } = await (supabase as any)
    .from('forum_threads')
    .delete()
    .eq('id', threadId)
    .eq('author_id', user.id)

  if (error) return { error: 'Erro ao deletar thread.' }

  revalidatePath('/forum')
  return {}
}

// ── Deletar post próprio ──────────────────────────────────────────────────────

export async function deleteOwnPost(postId: string, threadId: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireActiveUser()

  const { error } = await (supabase as any)
    .from('forum_posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', user.id)

  if (error) return { error: 'Erro ao deletar resposta.' }

  revalidatePath(`/forum/thread/${threadId}`)
  return {}
}

// ── Votar em enquete ──────────────────────────────────────────────────────────

export async function voteOnPoll(pollId: string, optionId: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireActiveUser()
  const db = supabase as any

  const { data: poll } = await db
    .from('forum_polls')
    .select('ends_at')
    .eq('id', pollId)
    .single()

  if ((poll as { ends_at: string | null } | null)?.ends_at &&
      new Date((poll as { ends_at: string }).ends_at) < new Date()) {
    return { error: 'Esta enquete já foi encerrada.' }
  }

  const { error } = await db
    .from('forum_poll_votes')
    .insert({ poll_id: pollId, option_id: optionId, user_id: user.id })

  if ((error as { code?: string } | null)?.code === '23505') return { error: 'Você já votou nesta enquete.' }
  if (error) return { error: 'Erro ao registrar voto.' }

  return {}
}

// ── Reagir a post/thread ──────────────────────────────────────────────────────

export async function toggleReaction(
  target: { thread_id?: string; post_id?: string }
): Promise<{ error?: string; action?: 'added' | 'removed' }> {
  const { supabase, user } = await requireActiveUser()
  const db = supabase as any

  const baseQuery = target.thread_id
    ? db.from('forum_reactions').select('id').eq('thread_id', target.thread_id).eq('user_id', user.id)
    : db.from('forum_reactions').select('id').eq('post_id', target.post_id!).eq('user_id', user.id)

  const { data: existing } = await baseQuery.maybeSingle()

  if (existing) {
    await db.from('forum_reactions').delete().eq('id', (existing as { id: string }).id)
    return { action: 'removed' }
  }

  await db.from('forum_reactions').insert({
    thread_id: target.thread_id ?? null,
    post_id:   target.post_id   ?? null,
    user_id:   user.id,
  })
  return { action: 'added' }
}

// ── Denunciar conteúdo ────────────────────────────────────────────────────────

export async function reportForumContent(
  target: { thread_id?: string; post_id?: string },
  reason: string
): Promise<{ error?: string }> {
  const { supabase, user } = await requireActiveUser()

  const { error } = await (supabase as any).from('forum_reports').insert({
    thread_id:   target.thread_id ?? null,
    post_id:     target.post_id   ?? null,
    reporter_id: user.id,
    reason,
  })

  if (error) return { error: 'Erro ao registrar denúncia.' }
  return {}
}

// ── Incrementar visualizações ─────────────────────────────────────────────────

export async function incrementThreadViews(threadId: string): Promise<void> {
  const supabase = await createClient()
  await (supabase as any).rpc('increment_forum_views', { thread_id: threadId }).catch(() => {})
}
