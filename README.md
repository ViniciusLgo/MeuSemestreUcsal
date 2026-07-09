# MeuSemestreUCSAL

Plataforma independente onde alunos da UCSAL (Universidade Católica do Salvador) avaliam professores de forma anônima e montam sua grade ideal de horários.

> Projeto criado por alunos, para alunos. Sem vínculo oficial com a universidade.

---

## O que é

O MeuSemestreUCSAL resolve dois problemas reais dos alunos do campus Pituaçu:

1. **Escolher professores com informação** — antes de se matricular, veja nota geral (1–10), didática, organização, dificuldade, se o professor falta, se é fácil de passar, estilo de prova e mais.
2. **Montar a grade com clareza** — visualize semana a semana com os horários reais da UCSAL (blocos de 75 min) e compare as notas dos professores enquanto monta.

**Cursos suportados:** BES (Bacharelado em Engenharia de Software) e ADS (Tecnólogo em Análise e Desenvolvimento de Sistemas), campus Pituaçu, matrizes 2023.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components) |
| Banco de dados | Supabase (PostgreSQL + RLS) |
| Autenticação | Supabase Auth (OTP por e-mail, sem senha) |
| E-mail | Resend (SMTP para OTP) |
| Notificações | Telegram Bot API |
| Estilos | Tailwind CSS 4 |
| Deploy | Vercel |
| Linguagem | TypeScript |

---

## Funcionalidades

### Área pública
- Lista completa de professores com nota, disciplinas vinculadas e contagem de avaliações
- Perfil de professor com nota geral (1–10) e notas por disciplina
- Página de disciplina com professores e suas notas, badge de quantidade de avaliações
- Busca por professor ou disciplina
- Páginas de curso (BES e ADS) com grade curricular
- FAQ com calendário de rematrícula
- Changelog público, Política de Privacidade/LGPD e Termos de Uso

### Área do aluno (login com @ucsal.edu.br)
- Avaliar professor anonimamente: nota geral 1–10, sub-ratings 1–5 (didática, organização, carga, dificuldade), recomendação, faltas, engajamento, estilo de prova
- Reportar avaliação inadequada com motivo e detalhes
- Sugerir professor para disciplina sem docente cadastrado
- Montar grade semanal interativa (Manhã/Noite, Segunda a Sábado)
- Salvar e carregar grades no perfil

### Painel admin (/painel-interno)
- Dashboard com stats em tempo real e atividade recente
- Moderar avaliações (publicar, ocultar, marcar para revisão)
- Gerenciar professores e disciplinas (criar, vincular, alertas de cobertura)
- Revisar sugestões de novos professores (aprovar cria o professor automaticamente)
- Gerenciar usuários (banir/reativar)
- Notificações Telegram para todas as ações relevantes

### Notificações Telegram
O bot Telegram envia mensagens ao admin para:
- Nova avaliação publicada ou enviada para revisão
- Avaliação removida pelo aluno
- Avaliação reportada por outro aluno
- Novo usuário cadastrado
- Disciplina pendente de professor
- Sugestão de professor enviada por aluno
- Usuário banido

---

## Estrutura do banco de dados

```
courses                  Cursos disponíveis
curriculum_versions      Versões da matriz (ano, turno, campus)
semesters                Períodos dentro de cada versão
subjects                 Disciplinas (obrigatórias + eletivas EAD)
curriculum_subjects      Vínculo semestre ↔ disciplina
teachers                 Professores
teacher_subjects         Vínculo professor ↔ disciplina
profiles                 Perfil do aluno (estende auth.users)
reviews                  Avaliações (author_id nunca exposto publicamente)
review_reports           Denúncias de avaliação
teacher_suggestions      Sugestões de novos professores por alunos
saved_grades             Grades salvas pelo aluno
admin_activity           Log de ações administrativas
```

Todas as tabelas com dados de usuário têm **Row Level Security (RLS)** ativo no Supabase.

---

## Rodando localmente

### Pré-requisitos
- Node.js 20+
- Conta no [Supabase](https://supabase.com) (plano free é suficiente)
- Conta no [Resend](https://resend.com) para envio de OTP
- Bot do Telegram (opcional, para notificações admin)

### 1. Clone e instale

```bash
git clone <repo-url>
cd meusemestre-ucsal
npm install
```

### 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

> A `SUPABASE_SERVICE_ROLE_KEY` é usada apenas server-side (Server Actions). Nunca a exponha no client.

Para obter o `TELEGRAM_ADMIN_CHAT_ID`: inicie uma conversa com o bot, acesse `/api/telegram/setup` e copie o `chat_id` retornado.

### 3. Banco de dados

Execute os arquivos SQL na pasta `/sql` no **SQL Editor do Supabase**, nesta ordem:

```
sql/schema.sql                    Tabelas principais + RLS + triggers
sql/seed_courses.sql              Cursos
sql/seed_curriculum.sql           Matrizes, semestres, disciplinas
sql/saved_grades.sql              Tabela de grades salvas
sql/subject_alert_status.sql      Coluna de alerta para disciplinas sem professor
sql/teacher_suggestions.sql       Tabela de sugestões de professores
sql/rating_scale_migration.sql    Migração da escala 1-5 → 1-10 (só se já tiver dados)
sql/vincular_professores.sql      Vínculos professor ↔ disciplina (batch 1)
sql/vincular_professores_2.sql    Vínculos professor ↔ disciplina (batch 2)
sql/vincular_professores_3.sql    Vínculos professor ↔ disciplina (batch 3)
sql/vincular_professores_4.sql    Vínculos professor ↔ disciplina (batch 4)
sql/merge_professores_duplicados.sql  Remove professores duplicados (roda após vincular)
```

### 4. Configurar admin

No Supabase SQL Editor, defina seu e-mail como admin após o primeiro login:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'seu@email.com';
```

### 5. Configurar OTP (Supabase Auth)

No painel do Supabase → Authentication → Settings → SMTP:
- **Host:** `smtp.resend.com`
- **Port:** `465`
- **User:** `resend`
- **Password:** sua API key do Resend
- **From email:** `noreply@seudominio.com`

A validação de domínio `@ucsal.edu.br` está implementada no frontend em `src/app/entrar/page.tsx`.

### 6. Rodar

```bash
npm run dev
```

Acesse `http://localhost:3000`. O painel admin fica em `http://localhost:3000/painel-interno`.

---

## Deploy no Vercel

1. Suba o repositório no GitHub
2. Importe no [Vercel](https://vercel.com/new)
3. Configure as variáveis de ambiente no painel do Vercel (veja `.env.example`)
4. Deploy automático a cada push na branch `master`

---

## Estrutura de pastas

```
src/
  app/
    api/telegram/          Rotas de setup e teste do bot Telegram
    avaliar/               Formulário de avaliação multi-step
    atualizacoes/          Changelog público
    buscar/                Busca global
    curso/[codigo]/        Página do curso com badge de avaliações
    disciplina/[id]/       Página da disciplina
    entrar/                Login OTP
    faq/                   Perguntas frequentes + calendário
    monte-sua-grade/       Construtor de grade semanal
    painel-interno/        Painel administrativo completo
    perfil/                Perfil e configuração do aluno
    privacidade/           Política de privacidade / LGPD
    professor/[id]/        Página do professor
    professores/           Listagem pública de todos os professores
    termos/                Termos de uso
  components/
    home/                  HeroSection, CourseCards
    layout/                Header, Footer, SignOut
    ui/                    Avatar, Badge, Card, StarRating, ReportButton, SuggestTeacherButton
  lib/
    actions/               Server Actions (admin, grade, student)
    queries/               Funções de leitura do banco
    review-constants.ts    Constantes compartilhadas (REPORT_REASONS)
    supabase/              Clients (server e client)
    telegram.ts            Funções de notificação Telegram
  types/
    database.ts            Tipos do banco de dados
sql/
  *.sql                    Migrações, seeds e vínculos
```

---

## Segurança

- `author_id` das avaliações **nunca** é exposto em rotas públicas
- E-mails de usuários **nunca** aparecem publicamente
- `SUPABASE_SERVICE_ROLE_KEY` usada exclusivamente server-side
- RLS garante que cada usuário acessa/modifica apenas os próprios dados
- Avaliações suspeitas vão para `em_revisao` automaticamente via filtro server-side
- Token do Telegram mantido apenas em variáveis de ambiente server-side

---

## Licença

MIT License — veja `LICENSE` para detalhes.
