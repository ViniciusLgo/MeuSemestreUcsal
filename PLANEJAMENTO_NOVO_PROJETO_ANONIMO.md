# Planejamento do novo Fale Aqui anonimo

Data: 2026-07-08

Este documento serve como base para iniciar um novo projeto, usando o projeto atual apenas como referencia. A ideia principal e parar antes de codar, revisar o fluxo completo, modelar o banco com calma e pensar no crescimento do sistema desde o inicio.

Stack proposta:

- Next.js na Vercel.
- Supabase para banco Postgres, Auth, RLS e funcoes SQL quando necessario.
- Tailwind CSS ou outro design system simples para interface.

## 1. Ideia geral

O sistema sera uma plataforma publica de avaliacoes de professores da UCSAL, inicialmente para os cursos BES e ADS.

Qualquer pessoa podera ler as avaliacoes publicamente. Para avaliar, o aluno precisara se cadastrar e fazer login, de preferencia usando e-mail institucional. A avaliacao sera anonima para o publico: nome, e-mail e identidade do aluno nao aparecem em lugar nenhum nas paginas publicas.

Internamente, o sistema deve guardar quem avaliou. Isso permite evitar spam, impedir avaliacoes repetidas, investigar abuso e banir contas problematicas se necessario. O anonimato aqui e publico, nao um anonimato absoluto contra o sistema.

Nao teremos fluxo de aprovacao manual de cadastro e tambem nao queremos depender de aprovar ou rejeitar toda avaliacao antes dela aparecer. O foco do painel admin sera acompanhar o que foi postado, ver ultimas avaliacoes, enxergar indicadores, receber denuncias e tomar acoes de seguranca quando necessario.

## 2. Objetivos principais

- Permitir leitura publica das avaliacoes.
- Permitir avaliacao apenas por usuarios cadastrados.
- Manter o aluno anonimo nas paginas publicas.
- Usar Supabase e Vercel desde o inicio.
- Modelar o banco de forma limpa para crescer.
- Comecar com BES e ADS, mas deixar o sistema preparado para novos cursos.
- Ter busca por disciplina, professor e curso.
- Criar uma pagina "Monte sua grade perfeita".
- Criar painel admin para acompanhar ultimas postagens e possiveis abusos.
- Evitar comecar a codar antes de definir fluxo, banco, regras e prioridades.

## 3. O que reaproveitar como ideia do projeto atual

O projeto atual ja ajuda com algumas decisoes:

- Uso de Next.js com App Router.
- Uso de Supabase.
- Uso de Vercel.
- Estrutura de cursos, matrizes, semestres, disciplinas e professores.
- Conceito de avaliacoes por professor e disciplina.
- Separacao entre paginas publicas e area administrativa.
- Experiencia de login com OTP/e-mail.

Mas o novo projeto nao deve nascer como uma simples copia. O banco deve ser redesenhado do zero, principalmente porque agora o fluxo desejado mudou:

- Sem aprovacao manual obrigatoria de cadastro.
- Sem moderacao obrigatoria antes de publicar cada avaliacao.
- Anonimato publico como regra central.
- Busca mais forte.
- Pagina de recomendacao de grade.
- Painel admin voltado para observacao, auditoria e seguranca.

## 4. Fluxo publico de leitura

Fluxo basico:

```text
Usuario acessa o site
-> pesquisa professor, disciplina ou curso
-> abre uma disciplina
-> ve professores que lecionam aquela disciplina
-> compara notas, comentarios e indicadores
-> abre perfil do professor se quiser detalhes
```

Paginas publicas principais:

- Home.
- Cursos: BES e ADS.
- Matriz do curso.
- Semestres.
- Disciplina.
- Professor.
- Busca.
- Monte sua grade perfeita.
- FAQ.

Qualquer visitante podera:

- Ler avaliacoes aprovadas/publicadas.
- Ver medias dos professores.
- Ver distribuicao de notas.
- Ver disciplinas de cada semestre.
- Pesquisar disciplina ou professor.
- Usar uma versao publica da busca.

Para avaliar, precisa estar logado.

## 5. Fluxo de cadastro e login

Fluxo recomendado:

```text
Aluno clica em "Avaliar"
-> sistema pede login/cadastro
-> aluno informa e-mail institucional
-> Supabase envia OTP/codigo por e-mail
-> aluno confirma o codigo
-> se for o primeiro acesso, informa nome/apelido interno e curso
-> sistema cria profile automaticamente
-> aluno pode avaliar
```

Regras importantes:

- O e-mail nao aparece publicamente.
- O nome real nao aparece publicamente.
- O usuario precisa estar autenticado para avaliar.
- O cadastro nao precisa de aprovacao manual.
- Admin pode banir, bloquear ou marcar usuario como suspeito em caso de abuso.
- Se o usuario for banido, ele ainda pode ler o site, mas nao pode avaliar.

Decisao pendente:

- Confirmar se o login sera apenas com e-mail `@ucsal.edu.br` ou se aceitaremos outros e-mails com algum tipo de verificacao. A recomendacao inicial e comecar com e-mail institucional.

## 6. Fluxo de avaliacao

Fluxo:

```text
Aluno logado escolhe disciplina
-> escolhe professor daquela disciplina
-> responde perguntas objetivas
-> escreve comentario opcional
-> confirma envio
-> avaliacao aparece publicamente ou entra em revisao automatica se tiver risco
-> admin consegue ver a postagem no painel
```

Como nao queremos aprovar/rejeitar manualmente tudo, a publicacao deve ser automatica na maioria dos casos.

Mas o sistema deve ter uma camada de seguranca:

- Filtro de palavroes e termos ofensivos.
- Limite de tamanho do comentario.
- Rate limit por usuario.
- Bloqueio de multiplas avaliacoes iguais.
- Uma avaliacao por usuario, professor e disciplina.
- Campo para denuncia publica.
- Painel admin para acompanhar ultimas postagens.
- Possibilidade de ocultar/remover uma avaliacao depois, se necessario.

Status recomendado para avaliacoes:

- `publicada`: aparece no site.
- `oculta`: admin ocultou por abuso, denuncia ou erro.
- `em_revisao`: usada apenas quando o sistema detectar risco automaticamente.

Assim, o fluxo normal nao depende do admin, mas ainda existe controle.

## 7. Anonimato

O anonimato sera publico.

Nas paginas publicas, a avaliacao deve mostrar no maximo:

- Nome do professor.
- Disciplina.
- Nota.
- Respostas objetivas.
- Comentario.
- Data aproximada, se fizer sentido.
- Curso/matriz, se isso ajudar o contexto.

Nao deve mostrar:

- Nome do aluno.
- E-mail.
- ID do usuario.
- Foto.
- Dados que permitam identificar diretamente a pessoa.

No banco, a avaliacao deve manter `author_id` ou `profile_id`. Esse vinculo e necessario para:

- Impedir duplicidade.
- Banir usuario abusivo.
- Auditar problema grave.
- Permitir que o proprio usuario edite/remova sua avaliacao no futuro.

## 8. Busca

A busca deve ser um recurso central, nao um detalhe.

O comentario recebido indica um fluxo importante:

> Em disciplinas obrigatorias, o aluno muitas vezes nao pode simplesmente evitar a disciplina. Entao o usuario filtra a disciplina primeiro e depois compara as opcoes.

Por isso, a busca deve priorizar:

1. Disciplina.
2. Professor.
3. Curso.
4. Semestre.

Fluxo recomendado da busca:

```text
Aluno pesquisa "Banco de Dados"
-> sistema mostra disciplinas encontradas
-> aluno abre a disciplina
-> sistema mostra professores vinculados
-> aluno compara notas e comentarios
-> aluno decide com quem tentar cursar
```

Para disciplinas obrigatorias, a experiencia deve deixar claro que o objetivo nao e sugerir que o aluno ignore uma materia ruim. O caminho correto e:

```text
Primeiro: encontrar a disciplina obrigatoria
Depois: comparar os professores disponiveis
Depois: aplicar filtros de perfil, como didatica, dificuldade, carga e organizacao
Depois: escolher a melhor opcao possivel para aquela disciplina
```

Esse fluxo evita uma recomendacao irrealista. O sistema entende que algumas materias precisam ser cursadas de qualquer forma; a inteligencia esta em ajudar o aluno a escolher melhor dentro das opcoes reais.

Filtros uteis:

- Curso: BES ou ADS.
- Tipo: obrigatoria, eletiva, extensionista.
- Semestre.
- Modalidade: presencial, EAD ou hibrida.
- Professor.
- Nota minima.
- Mais recomendados.
- Menor carga percebida.
- Melhor didatica.
- Melhor organizacao.
- Menos dificuldade percebida.

No Supabase, a busca pode comecar simples usando `ilike`. Se crescer, pode evoluir para full-text search do Postgres.

## 9. Monte sua grade perfeita

Essa pagina deve ajudar o aluno a montar uma grade ideal com base na matriz do curso, nas disciplinas disponiveis e nas avaliacoes dos professores.

Como disciplinas obrigatorias geralmente nao podem ser evitadas, a logica nao deve simplesmente dizer "nao pegue essa disciplina". O foco deve ser:

- Ajudar o aluno a entender quais professores combinam melhor com seu perfil.
- Comparar professores dentro da mesma disciplina.
- Sugerir combinacoes de disciplinas e professores.
- Alertar sobre carga pesada.
- Ajudar a equilibrar dificuldade, aprendizado e risco.

Para obrigatorias, a recomendacao deve partir da disciplina escolhida e nao de uma lista livre de materias. Exemplo: se o aluno precisa cursar Banco de Dados I, o sistema primeiro fixa essa disciplina e depois mostra qual professor parece mais adequado conforme as preferencias do aluno.

Fluxo da pagina:

```text
Aluno escolhe curso
-> escolhe matriz
-> escolhe semestre atual ou disciplinas que pretende cursar
-> define preferencias
-> sistema analisa professores e avaliacoes
-> sistema monta sugestao de grade
-> aluno pode ajustar manualmente
```

Preferencias do aluno:

- Quero aprender mais, mesmo que seja mais dificil.
- Quero menor risco de reprovar.
- Quero professores com melhor didatica.
- Quero menor carga de trabalhos.
- Quero professores mais organizados.
- Quero equilibrio entre dificuldade e qualidade.
- Prefiro EAD, presencial ou tanto faz.
- Quero evitar choque de carga pesada no mesmo semestre.

Resultado esperado:

- Lista de disciplinas escolhidas.
- Professor recomendado por disciplina.
- Motivo da recomendacao.
- Alertas de risco.
- Alternativas por disciplina.
- Indicador geral da grade: equilibrada, pesada, leve ou arriscada.

Exemplo:

```text
Disciplina: Banco de Dados I
Professor recomendado: Professor X
Motivo: boa didatica, nota alta e comentarios positivos sobre clareza.
Alerta: dificuldade moderada, exige pratica constante.
Alternativa: Professor Y, menor carga percebida, mas menor nota geral.
```

Importante: a pagina nao deve prometer que a sugestao e perfeita. Ela deve ser uma recomendacao baseada em dados dos alunos.

## 10. Modelo inicial do banco

Modelo proposto para redesenhar do zero:

### `profiles`

Representa o usuario cadastrado.

Campos:

- `id`: uuid, mesmo id do Supabase Auth.
- `email`: text, unico.
- `display_name_internal`: text, opcional e nao publico.
- `course_id`: uuid, opcional.
- `role`: student, admin.
- `status`: active, banned.
- `created_at`.
- `updated_at`.

### `courses`

Cursos do sistema.

Campos:

- `id`.
- `code`: BES, ADS.
- `name`.
- `active`.

### `curriculum_versions`

Matrizes curriculares.

Campos:

- `id`.
- `course_id`.
- `name`.
- `campus`.
- `shift`.
- `year`.
- `active`.

### `semesters`

Semestres de uma matriz.

Campos:

- `id`.
- `curriculum_version_id`.
- `number`.

### `subjects`

Disciplinas.

Campos:

- `id`.
- `code`.
- `name`.
- `type`: mandatory, elective, extension.
- `modality`: presencial, ead, hibrida.
- `active`.

### `curriculum_subjects`

Liga disciplinas a uma matriz e a um semestre.

Campos:

- `id`.
- `curriculum_version_id`.
- `semester_id`.
- `subject_id`.
- `recommended_order`.
- `is_required`.

Essa tabela e importante porque a mesma disciplina pode aparecer em matrizes diferentes.

### `teachers`

Professores.

Campos:

- `id`.
- `name`.
- `slug`.
- `photo_url`.
- `active`.

### `teacher_subjects`

Liga professor e disciplina.

Campos:

- `id`.
- `teacher_id`.
- `subject_id`.
- `course_id`, opcional.
- `active`.

### `reviews`

Avaliacoes.

Campos:

- `id`.
- `author_id`: referencia `profiles.id`.
- `teacher_id`.
- `subject_id`.
- `course_id`.
- `curriculum_version_id`, opcional.
- `rating_general`: 1 a 5.
- `rating_didactics`: 1 a 5.
- `rating_organization`: 1 a 5.
- `rating_workload`: 1 a 5.
- `rating_difficulty`: 1 a 5.
- `would_recommend`: boolean.
- `attendance_pressure`: baixa, media, alta, opcional.
- `assessment_style`: prova, projeto, trabalho, misto, opcional.
- `comment`: text.
- `status`: published, hidden, under_review.
- `created_at`.
- `updated_at`.

Regra:

- Um usuario so pode ter uma avaliacao ativa por professor e disciplina.

### `review_reports`

Denuncias de avaliacoes.

Campos:

- `id`.
- `review_id`.
- `reporter_id`, opcional.
- `reason`.
- `details`.
- `status`: open, reviewed, dismissed.
- `created_at`.

### `admin_activity`

Historico de acoes administrativas.

Campos:

- `id`.
- `admin_id`.
- `action`.
- `target_type`.
- `target_id`.
- `metadata`.
- `created_at`.

### `grade_plans`

Opcional para fase futura, caso o aluno possa salvar simulacoes.

Campos:

- `id`.
- `user_id`.
- `course_id`.
- `curriculum_version_id`.
- `name`.
- `preferences`.
- `created_at`.

### `grade_plan_items`

Itens de uma grade salva.

Campos:

- `id`.
- `grade_plan_id`.
- `subject_id`.
- `teacher_id`.
- `semester_number`.
- `score`.
- `reason`.

Na primeira versao, talvez nao seja necessario salvar a grade. A pagina pode calcular em tempo real.

## 11. Regras de seguranca e RLS

Regras desejadas:

- Publico pode ler apenas avaliacoes com `status = published`.
- Publico pode ler cursos, matrizes, disciplinas e professores ativos.
- Usuario logado pode criar avaliacao usando o proprio `auth.uid()`.
- Usuario logado nao pode criar avaliacao em nome de outra pessoa.
- Usuario banido nao pode criar avaliacao.
- Usuario pode editar/remover apenas a propria avaliacao, se essa feature existir.
- Admin pode ver ultimas postagens com autor interno.
- Admin pode ocultar avaliacao.
- Admin pode banir usuario.
- Admin pode gerenciar cursos, disciplinas, professores e vinculos.

No Supabase, essas regras devem ser implementadas com Row Level Security desde o inicio.

## 12. Painel admin

O painel admin nao sera centrado em aprovar e rejeitar tudo.

Funcoes principais:

- Ver ultimas avaliacoes postadas.
- Filtrar por curso, disciplina, professor e data.
- Ver avaliacoes denunciadas.
- Ocultar avaliacao abusiva.
- Reativar avaliacao se necessario.
- Banir ou reativar usuario.
- Ver usuarios recentes.
- Ver professores com mais avaliacoes.
- Ver disciplinas com mais movimento.
- Gerenciar cursos, matrizes, disciplinas e professores.

Cards uteis no dashboard:

- Avaliacoes nas ultimas 24h.
- Avaliacoes nos ultimos 7 dias.
- Professores mais avaliados.
- Disciplinas mais pesquisadas.
- Denuncias abertas.
- Usuarios banidos.

## 13. Paginas do novo projeto

Paginas publicas:

- `/`
- `/buscar`
- `/curso/[codigo]`
- `/curso/[codigo]/matriz/[matrizId]`
- `/disciplina/[id]`
- `/professor/[id]`
- `/avaliar`
- `/monte-sua-grade`
- `/faq`

Paginas de autenticacao:

- `/entrar`
- `/perfil`

Paginas admin:

- `/admin`
- `/admin/avaliacoes`
- `/admin/denuncias`
- `/admin/usuarios`
- `/admin/professores`
- `/admin/disciplinas`
- `/admin/matrizes`

## 14. Como calcular recomendacoes

No inicio, nao precisa de inteligencia artificial complexa. Uma pontuacao clara ja resolve.

Exemplo de score por professor em uma disciplina:

```text
score = media_geral * peso_nota
      + didatica * peso_didatica
      + organizacao * peso_organizacao
      + recomendacao * peso_recomendacao
      - dificuldade * peso_dificuldade
      - carga * peso_carga
```

Os pesos mudam conforme a preferencia do aluno.

Exemplo:

- Se o aluno quer aprender mais, aumentar peso de didatica e qualidade.
- Se o aluno quer menor risco, aumentar peso de dificuldade baixa e recomendacao.
- Se o aluno quer equilibrio, distribuir os pesos.

O sistema tambem deve considerar volume de dados:

- Professor com 1 avaliacao nao deve parecer mais confiavel que professor com 40 avaliacoes.
- Exibir aviso quando ha poucos dados.
- Usar "confianca baixa/media/alta" na recomendacao.

## 15. Fases de implementacao

### Fase 1: Fundacao

- Criar novo projeto Next.js.
- Configurar Supabase.
- Criar banco inicial.
- Criar RLS desde o inicio.
- Criar seeds de BES e ADS.
- Criar layout base.
- Criar paginas publicas de curso, disciplina e professor.

### Fase 2: Autenticacao e avaliacao

- Login com Supabase Auth.
- Criacao automatica de profile.
- Formulario de avaliacao.
- Publicacao automatica segura.
- Regras contra duplicidade.
- Filtro basico de comentario.

### Fase 3: Busca

- Busca por disciplina.
- Busca por professor.
- Filtros por curso, semestre, tipo e modalidade.
- Pagina de resultados.

### Fase 4: Painel admin

- Dashboard com ultimas postagens.
- Lista de avaliacoes.
- Ocultar avaliacao.
- Banir usuario.
- Gerenciar professores, disciplinas e matrizes.

### Fase 5: Monte sua grade perfeita

- Tela de escolha de curso/matriz.
- Escolha de disciplinas.
- Preferencias do aluno.
- Algoritmo inicial de recomendacao.
- Resultado com explicacao por disciplina.

### Fase 6: Melhorias futuras

- Denuncias publicas.
- Edicao/remocao da propria avaliacao.
- Salvar grades montadas.
- Estatisticas por semestre.
- Ranking por criterios.
- Full-text search no Postgres.
- Notificacoes administrativas.

## 16. Riscos e cuidados

- Supabase Auth por e-mail pode exigir SMTP externo para producao.
- Avaliacao anonima pode gerar abuso se nao houver limite e auditoria.
- Sem aprovacao manual, o filtro automatico e o painel admin precisam ser bons.
- Dados de professores podem ficar injustos se houver poucas avaliacoes.
- A pagina de grade perfeita precisa explicar que e recomendacao, nao verdade absoluta.
- RLS mal feita pode vazar dados internos, principalmente `author_id` e e-mails.
- Admin nao deve depender apenas do frontend; regras criticas precisam estar no banco/API.

## 17. Checklist antes de codar

- Confirmar se login sera somente com e-mail institucional.
- Confirmar campos exatos da avaliacao.
- Confirmar matrizes iniciais de BES e ADS.
- Confirmar se avaliacao aparece automaticamente ou se casos suspeitos entram em revisao.
- Confirmar quais dados o admin pode ver.
- Confirmar se o aluno podera editar/remover a propria avaliacao.
- Confirmar se a grade perfeita sera calculada em tempo real na primeira versao.
- Confirmar nome final do projeto.
- Confirmar identidade visual basica.

## 18. Decisoes atuais

- O novo projeto sera criado do zero.
- O projeto atual sera usado apenas como referencia.
- A stack sera Supabase + Vercel.
- Qualquer pessoa podera ler avaliacoes.
- Para avaliar, precisa cadastro/login.
- A avaliacao sera anonima publicamente.
- O sistema/admin ainda podera rastrear o autor internamente para seguranca.
- Nao havera aprovacao manual obrigatoria de cadastro.
- Nao havera aprovacao manual obrigatoria de toda avaliacao.
- O painel admin mostrara ultimas postagens e dados de acompanhamento.
- A busca deve priorizar disciplina primeiro.
- A pagina "Monte sua grade perfeita" usara matriz, notas dos professores e preferencias do aluno.
