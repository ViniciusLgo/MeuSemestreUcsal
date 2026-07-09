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
- 25 professores inseridos e vinculados às disciplinas via `sql/vincular_professores.sql`
- SQLs rodados: `teacher_suggestions.sql`, `rating_scale_migration.sql`, `vincular_professores.sql`

### Páginas públicas
- Home (stats reais do DB), `/buscar`, `/curso/[codigo]` (badge de avaliações por disciplina), `/disciplina/[id]`, `/professor/[id]`
- `/avaliar` — formulário multi-step com nota geral 1–10 (zonas de cor), sub-ratings 1–5, moderação automática
- `/monte-sua-grade` — grade interativa, grade semanal visual, score, salvar/carregar via `?grade=<id>`
- `/faq` com calendário 2026.2, `/entrar` (OTP), `/perfil`, `/perfil/configurar`
- `/atualizacoes` — changelog público com versões
- `/privacidade` — política LGPD completa
- `/termos` — termos de uso

### Painel admin (`/painel-interno`)
- Dashboard com alertas, stats, cobertura, avaliações recentes, ranking
- Avaliações, Professores, Usuários, Sem professor (inline add), Sugestões de professor, Configurações

### Segurança e comportamento
- `author_id` nunca exposto publicamente, email nunca público
- Uma avaliação por usuário/professor/disciplina
- Usuário banido não pode avaliar, `SUPABASE_SERVICE_ROLE_KEY` apenas server-side

### Notificações Telegram (@avaliacaoucsalbot)
- Avaliação publicada / em revisão / removida / reportada
- Novo usuário, disciplina pendente, professor criado, usuário banido, sugestão de professor

### Funcionalidades do aluno
- Login OTP @ucsal.edu.br, avaliar, remover avaliação, salvar/carregar grades
- Reportar avaliação, sugerir professor para disciplina sem docente

---

## Feito em 09/07

- ✅ Telegram configurado (novo token, chat_id, testado e funcionando)
- ✅ Carregar grade salva via `?grade=<id>`
- ✅ Notificar novo usuário via Telegram ao completar perfil
- ✅ Botão "Reportar avaliação" em todas as páginas de avaliação
- ✅ Sugestão de professor por aluno com painel de aprovação no admin
- ✅ Fix: dropdown "Novo prof." no sem-professor clippado por overflow-hidden
- ✅ Rating geral expandido para escala 1–10 (zona negativa 1–4 em vermelho)
- ✅ Sub-ratings 1–5 com zonas de cor corretas (1–2 vermelho, 3 âmbar, 4–5 verde) + label `3/5 — Regular`
- ✅ Filtro de comentários reforçado (palavrões, dados pessoais, caps excessivo)
- ✅ Páginas Atualizações, Privacidade/LGPD e Termos de Uso
- ✅ Footer com links legais
- ✅ HeroSection com stats reais do banco
- ✅ CourseCards cores padronizadas (BES e ADS)
- ✅ Badge de contagem de avaliações por disciplina na página do curso
- ✅ SQL `teacher_suggestions.sql` rodado no Supabase
- ✅ SQL `rating_scale_migration.sql` rodado no Supabase
- ✅ 25 professores vinculados (`vincular_professores.sql`)
- ✅ Deploy em produção via Vercel (auto-deploy no push do master)

---

## Próximas tarefas

### 🟡 Painel admin
1. Tela `/painel-interno/denuncias` — reports abertos, ações de ocultar/dispensar
2. Alerta no dashboard quando há denúncias não revisadas

### 🟠 Produto / UX
3. Busca com full-text search do Postgres (hoje usa `ilike`)
4. Ranking por critérios (melhor didática, menor carga, etc.)
5. Estatísticas por semestre no perfil do professor
6. Revisão completa de responsividade mobile

### 🟢 Notificações Telegram
7. Alerta quando professor cai abaixo de 5.0/10 após nova avaliação
8. Resumo semanal automático (Vercel Cron)

### ⚪ Baixa prioridade
9. Confirmação por email ao reportar / sugerir
10. Vincular mais professores às disciplinas restantes

---

## Decisões técnicas relevantes

- **Escala de notas**: `rating_general` é 1–10. Estrelas 1–4 = vermelho, 5–6 = âmbar, 7–10 = verde. Sub-ratings (didática, organização, carga) permanecem 1–5 com mesma lógica proporcional.
- **`'use server'` restriction**: constantes não-async não podem ser exportadas de arquivos com `'use server'`. `REPORT_REASONS` vive em `src/lib/review-constants.ts`.
- **Anonimato público**: nome, email e `author_id` NUNCA aparecem em páginas públicas.
- **Moderação**: publicação automática na maioria dos casos; comentários com risco vão para `em_revisao` + alerta Telegram.
- **Grade salva**: tabela `saved_grades` com JSONB; carregada via `?grade=<id>`.
- **HeroSection**: Server Component async que busca stats reais — não usa hardcoded.
