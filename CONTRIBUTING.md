# Como contribuir — MeuSemestreUCSAL

Obrigado pelo interesse em contribuir! Este é um projeto aberto feito por estudantes da UCSAL para estudantes da UCSAL.

## Antes de começar

- Leia o [README](./README.md) para entender o projeto
- Confira as [issues abertas](../../issues) — pode haver algo em andamento
- Para features novas, abra uma issue primeiro para discutir antes de implementar

## Configurar o ambiente local

### 1. Pré-requisitos

- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Supabase CLI](https://supabase.com/docs/guides/cli): `npm install -g supabase`

### 2. Clonar e instalar

```bash
git clone https://github.com/seu-usuario/MeuSemestreuUCSAL.git
cd MeuSemestreuUCSAL
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

O `.env.example` já vem pré-preenchido para o banco local. Não é necessário alterar nada para desenvolvimento.

### 4. Subir o banco local

```bash
# Inicia Docker + Supabase (containers)
npx supabase start

# Aplica migrations e seed (cria tabelas, dados iniciais, categorias do fórum etc.)
npx supabase db reset --local
```

Se for seu primeiro login no ambiente local:
1. Acesse `http://localhost:3000/entrar`
2. Use seu email (qualquer email funciona localmente)
3. O código OTP aparece em `http://localhost:54324` (Mailpit — captura emails localmente)
4. Após o primeiro login, rode `npx supabase db reset --local` novamente para ativar permissões de admin (só necessário se for o email `vinicruzlago@gmail.com`)

### 5. Rodar o projeto

```bash
npm run dev
# Acesse http://localhost:3000
```

## Fluxo de contribuição

```
master (protegido)
  └─ feat/minha-feature   ← crie aqui, abra PR para master
```

1. **Crie um branch** a partir de `master`:
   ```bash
   git checkout master && git pull
   git checkout -b feat/nome-da-feature
   ```

2. **Implemente** seguindo as convenções do projeto (veja abaixo)

3. **Rode os testes** antes de abrir o PR:
   ```bash
   npm test
   ```

4. **Abra um PR** para `master` com:
   - Título curto e descritivo (ex: `feat: adicionar aba de histórico de avaliações`)
   - Descrição do que foi feito e por quê
   - Screenshots se for mudança visual

## Convenções de código

### Commits (Conventional Commits)

```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
chore: ajuste de config, deps etc.
test: adiciona ou corrige testes
refactor: refatoração sem mudança de comportamento
```

### Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js App Router (Server Components por padrão) |
| Banco | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (OTP por email) |
| Estilização | Tailwind CSS |
| Deploy | Vercel (auto-deploy via push para `master`) |

### Regras importantes

- **Nunca exponha `author_id`** de threads/posts do fórum em queries públicas
- **Nunca commite `.env.local`** — está no `.gitignore`
- Use `(supabase as any).from('tabela')` para tabelas novas não refletidas nos tipos gerados
- Server Actions ficam em `src/lib/actions/`, queries de leitura em `src/lib/queries/`
- Migrations SQL ficam em `supabase/migrations/` com prefixo numérico (`011_nome.sql`)

## Testes

Veja [tests/README.md](./tests/README.md) para detalhes sobre como rodar e escrever testes.

## Dúvidas?

Abra uma [issue](../../issues) ou entre em contato pelo fórum da própria plataforma.
