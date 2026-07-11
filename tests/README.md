# Testes — MeuSemestreUCSAL

Testes de RLS (Row Level Security) do Supabase e de lógica de negócio do fórum.
Os testes rodam diretamente contra o **banco local** (`supabase start`), sem mocks.

## Pré-requisitos

```bash
# 1. Docker rodando
# 2. Supabase local iniciado
npx supabase start

# 3. Banco com migrations aplicadas
npx supabase db reset --local

# 4. Instalar dependências de teste (só na primeira vez)
npm install --save-dev vitest @vitest/coverage-v8
```

## Rodar os testes

```bash
# Todos os testes
npm test

# Apenas os testes de RLS
npm test tests/rls

# Apenas os testes do fórum
npm test tests/forum

# Com cobertura
npm run test:coverage
```

## Estrutura

```
tests/
├── README.md           ← este arquivo
├── setup.ts            ← configuração global (cliente Supabase de teste)
├── rls/
│   ├── forum.test.ts   ← testes de RLS das tabelas do fórum
│   └── reviews.test.ts ← testes de RLS das avaliações
└── forum/
    ├── nicknames.test.ts ← testes do gerador de nicknames
    └── moderation.test.ts ← testes do filtro de palavras ofensivas
```

## Como escrever um novo teste

Cada arquivo usa o cliente Supabase com a `anon key` (usuário não autenticado)
ou com um JWT forjado para simular usuário autenticado:

```typescript
import { createAnonClient, createUserClient } from '../setup'

// Cliente sem autenticação
const anon = createAnonClient()

// Cliente autenticado como um usuário qualquer
const user = createUserClient('uuid-do-usuario')

// Exemplo: RLS deve bloquear INSERT sem autenticação
const { error } = await anon.from('forum_threads').insert({ title: 'x', body: 'y' })
expect(error).not.toBeNull() // deve falhar
```

## O que está testado

| Arquivo | O que verifica |
|---|---|
| `rls/forum.test.ts` | `author_id` não vaza; não-logado não pode criar thread/post; voto duplo falha |
| `rls/reviews.test.ts` | Avaliações `oculta`/`em_revisao` não aparecem para anon |
| `forum/nicknames.test.ts` | Combinações únicas, hash de cor, formato "Adjetivo Animal" |
| `forum/moderation.test.ts` | Palavras PT e EN disparam `em_revisao`; texto limpo retorna `publicado` |

## Contribuindo com testes

1. Crie um branch: `git checkout -b test/nome-do-teste`
2. Escreva o teste seguindo os exemplos
3. Rode localmente para confirmar que passa
4. Abra um PR para `master`

Veja [CONTRIBUTING.md](../CONTRIBUTING.md) para o fluxo completo.
