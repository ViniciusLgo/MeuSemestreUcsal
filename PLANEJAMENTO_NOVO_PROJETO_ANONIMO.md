# MeuSemestreUCSAL — Status do Projeto

Última atualização: 2026-07-09

Plataforma pública de avaliações anônimas de professores da UCSAL (BES e ADS).
Stack: Next.js 16 App Router + Supabase + Tailwind CSS 4 + Vercel.

---

## O que já foi feito

### Banco e infraestrutura
- Todas as tabelas: `profiles`, `courses`, `curriculum_versions`, `semesters`, `subjects`, `curriculum_subjects`, `teachers`, `teacher_subjects`, `reviews`, `review_reports`, `admin_activity`, `saved_grades`, `teacher_suggestions`
- RLS completo, seeds BES (8 sem.) e ADS (5 sem.), matrizes 2023 completas
- `alert_status` em `subjects`
- SQLs rodados: `teacher_suggestions.sql`, `rating_scale_migration.sql`
- `vincular_professores.sql` — batch 1 de vínculos
- `vincular_professores_2.sql` — batch 2 (6 novos professores)
- `vincular_professores_3.sql` — batch 3 (4 vínculos faltantes + Jader Albuquerque)
- `vincular_professores_4.sql` — batch 4 (14 novos professores + BES/CST/ELE-EXT)
- `merge_professores_duplicados.sql` — criado, ⚠️ **rodar no Supabase** para remover duplicatas

### Páginas públicas
- Home com 3 feature cards (Avaliações reais, 100% anônimo, Monte sua grade)
- `/professores` — listagem completa de todos os professores com nota, nº de avaliações e disciplinas
- `/buscar`, `/curso/[codigo]` (badge de avaliações por disciplina), `/disciplina/[id]`, `/professor/[id]`
- `/avaliar` — formulário multi-step: nota geral 1–10, sub-ratings 1–5, moderação automática
- `/monte-sua-grade` — grade interativa, grade semanal visual, score, salvar/carregar via `?grade=<id>`
- `/faq` com calendário 2026.2, `/entrar` (OTP + fix mobile sessionStorage), `/perfil`, `/perfil/configurar`
- `/atualizacoes`, `/privacidade`, `/termos`

### Painel admin (`/painel-interno`)
- Dashboard com alertas, stats, cobertura, avaliações recentes, ranking
- Avaliações, Professores, Usuários, Sem professor (inline add), Sugestões de professor, Configurações

### Segurança e comportamento
- `author_id` nunca exposto publicamente, email nunca público
- Uma avaliação por usuário/professor/disciplina
- Usuário banido não pode avaliar
- `SUPABASE_SERVICE_ROLE_KEY` apenas server-side
- Repo público: `.env.example`, `LICENSE` MIT, token Telegram nunca commitado

### Notificações Telegram
- Avaliação publicada / em revisão / removida / reportada
- Novo usuário, disciplina pendente, professor criado, usuário banido, sugestão de professor

### Funcionalidades do aluno
- Login OTP @ucsal.edu.br (fix: estado restaurado via sessionStorage ao voltar do Gmail no celular)
- Avaliar, remover avaliação, salvar/carregar grades, reportar avaliação, sugerir professor

---

## Próximas tarefas

### ⚠️ SQLs pendentes (rodar no Supabase)
- [ ] `sql/merge_professores_duplicados.sql` — remove 5 pares de professores duplicados
- [ ] `sql/vincular_professores_3.sql` — se ainda não rodou (batch 3)
- [ ] `sql/vincular_professores_4.sql` — se ainda não rodou (batch 4)

### 🟡 Pendente de informação
- [ ] Vincular Glaucya → Estrutura de Dados (falta nome completo da professora)
- [ ] is_easy_to_pass "mais ou menos" — adiado (requer migração de coluna boolean → text)

### 🟠 Painel admin
- [ ] `/painel-interno/denuncias` — reports abertos, ações de ocultar/dispensar
- [ ] Alerta no dashboard quando há denúncias não revisadas

### 🟠 Produto / UX
- [ ] Busca com full-text search do Postgres (hoje usa `ilike`)
- [ ] Ranking por critérios (melhor didática, menor carga, etc.)
- [ ] Estatísticas por semestre no perfil do professor
- [ ] Revisão completa de responsividade mobile

### 🟢 Notificações Telegram
- [ ] Alerta quando professor cai abaixo de 5.0/10 após nova avaliação
- [ ] Resumo semanal automático (Vercel Cron)

### ⚪ Baixa prioridade
- [ ] Confirmação por email ao reportar / sugerir

---

## Decisões técnicas relevantes

- **Escala de notas**: `rating_general` é 1–10. Estrelas 1–4 = vermelho, 5–6 = âmbar, 7–10 = verde. Sub-ratings (didática, organização, carga) permanecem 1–5 com mesma lógica proporcional.
- **`'use server'` restriction**: constantes não-async não podem ser exportadas de arquivos com `'use server'`. `REPORT_REASONS` vive em `src/lib/review-constants.ts`.
- **Anonimato público**: nome, email e `author_id` NUNCA aparecem em páginas públicas nem no README.
- **Moderação**: publicação automática na maioria dos casos; comentários com risco vão para `em_revisao` + alerta Telegram.
- **Grade salva**: tabela `saved_grades` com JSONB; carregada via `?grade=<id>`.
- **HeroSection**: componente sync com 3 feature cards estáticos (sem queries).
- **Selects parciais Supabase**: `data` fica `never` sem cast explícito — usar `as Array<{...}>`.
- **OTP mobile**: state salvo em `sessionStorage` para sobreviver ao recarregamento do browser ao voltar do Gmail.
