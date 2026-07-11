import { describe, it, expect, beforeAll } from 'vitest'
import { createAnonClient, createUserClient, createServiceClient } from '../setup'
import { v4 as uuid } from 'uuid'

// IDs de usuários fictícios — não existem em auth.users, mas os JWTs os simulam
const USER_A = uuid()
const USER_B = uuid()

// Thread criada pelo USER_A para usar nos testes
let threadId: string

beforeAll(async () => {
  // Criar thread como USER_A via service client (bypassa RLS para setup)
  const svc = await createServiceClient()
  const { data, error } = await svc
    .from('forum_threads')
    .insert({
      author_id: USER_A,
      title: '[teste] thread de RLS',
      body: 'conteúdo de teste',
      status: 'publicado',
    })
    .select('id')
    .single()

  if (error) throw new Error(`Setup falhou: ${error.message}`)
  threadId = (data as { id: string }).id
})

// ── 1. author_id nunca deve vazar ────────────────────────────────────────────

describe('author_id não vaza', () => {
  it('anon não recebe author_id ao listar threads', async () => {
    const anon = createAnonClient()
    const { data } = await anon
      .from('forum_threads')
      .select('id, title, author_id')
      .eq('id', threadId)
      .maybeSingle()

    // author_id pode não existir na resposta ou vir como null/undefined
    expect((data as any)?.author_id).toBeUndefined()
  })

  it('usuário autenticado (não admin) não recebe author_id', async () => {
    const user = await createUserClient(USER_B)
    const { data } = await user
      .from('forum_threads')
      .select('id, title, author_id')
      .eq('id', threadId)
      .maybeSingle()

    expect((data as any)?.author_id).toBeUndefined()
  })
})

// ── 2. Não-logado não pode criar thread/post ─────────────────────────────────

describe('anon não pode criar conteúdo', () => {
  it('INSERT em forum_threads falha sem autenticação', async () => {
    const anon = createAnonClient()
    const { error } = await anon.from('forum_threads').insert({
      author_id: USER_A,
      title: 'tentativa anon',
      body: 'body',
    })
    expect(error).not.toBeNull()
    expect(error?.code).toMatch(/42501|PGRST/)
  })

  it('INSERT em forum_posts falha sem autenticação', async () => {
    const anon = createAnonClient()
    const { error } = await anon.from('forum_posts').insert({
      thread_id: threadId,
      author_id: USER_A,
      body: 'tentativa anon',
    })
    expect(error).not.toBeNull()
  })
})

// ── 3. Usuário não pode deletar thread alheia ────────────────────────────────

describe('usuário não pode modificar conteúdo alheio', () => {
  it('USER_B não consegue deletar thread do USER_A', async () => {
    const userB = await createUserClient(USER_B)
    const { error } = await userB
      .from('forum_threads')
      .delete()
      .eq('id', threadId)

    // Ou erro de permissão, ou 0 rows afetadas (RLS filtra silenciosamente)
    if (!error) {
      const svc = await createServiceClient()
      const { data } = await svc.from('forum_threads').select('id').eq('id', threadId).maybeSingle()
      expect(data).not.toBeNull() // thread ainda existe → deleção foi bloqueada
    }
  })
})

// ── 4. Voto duplo deve falhar ────────────────────────────────────────────────

describe('enquete: voto duplo é bloqueado', () => {
  it('segundo INSERT em forum_poll_votes com mesmo (poll_id, user_id) retorna erro de unique', async () => {
    const svc = await createServiceClient()

    // Criar poll de teste
    const { data: thread } = await svc
      .from('forum_threads')
      .insert({ author_id: USER_A, title: '[teste] poll', body: 'x', status: 'publicado' })
      .select('id').single()

    const { data: poll } = await svc
      .from('forum_polls')
      .insert({ thread_id: (thread as any).id, question: 'Opção?' })
      .select('id').single()

    const { data: option } = await svc
      .from('forum_poll_options')
      .insert({ poll_id: (poll as any).id, label: 'Sim', order: 0 })
      .select('id').single()

    const userA = await createUserClient(USER_A)
    const vote = { poll_id: (poll as any).id, option_id: (option as any).id, user_id: USER_A }

    const { error: e1 } = await userA.from('forum_poll_votes').insert(vote)
    expect(e1).toBeNull() // primeiro voto ok

    const { error: e2 } = await userA.from('forum_poll_votes').insert(vote)
    expect(e2).not.toBeNull() // segundo voto falha (UNIQUE constraint)
    expect(e2?.code).toBe('23505')
  })
})

// ── 5. Threads ocultas não aparecem para anon ────────────────────────────────

describe('threads ocultas são invisíveis para anon', () => {
  it('thread com status=oculto não retorna para anon', async () => {
    const svc = await createServiceClient()
    const { data: hidden } = await svc
      .from('forum_threads')
      .insert({ author_id: USER_A, title: '[teste] oculto', body: 'x', status: 'oculto' })
      .select('id').single()

    const anon = createAnonClient()
    const { data } = await anon
      .from('forum_threads')
      .select('id')
      .eq('id', (hidden as any).id)
      .maybeSingle()

    expect(data).toBeNull()
  })
})
