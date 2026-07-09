-- Criar professores e vincular às disciplinas
-- Execute no Supabase SQL Editor
-- Seguro: usa ON CONFLICT para não duplicar

-- ── 1. Criar professores ─────────────────────────────────────────────────────

INSERT INTO teachers (name, slug, active) VALUES
  ('Odete Amanda Guerreiro Rodrigues Martinez', 'odete-amanda-guerreiro-rodrigues-martinez', true),
  ('Elton Figueiredo da Silva',                 'elton-figueiredo-da-silva',                 true),
  ('Gilberto Souza',                            'gilberto-souza',                            true),
  ('Flávio Dusse',                              'flavio-dusse',                              true),
  ('Christianne Orrico Dalforno',               'christianne-orrico-dalforno',               true),
  ('Semíramis Ribeiro de Assis',                'semiramis-ribeiro-de-assis',                true),
  ('Alfons Heinrich Altimicks',                 'alfons-heinrich-altimicks',                 true),
  ('Artur Hemrique Kronbauer',                  'artur-hemrique-kronbauer',                  true),
  ('Glaucya Carreiro Boechat',                  'glaucya-carreiro-boechat',                  true),
  ('Vagner Oliveira Pimentel Pereira',          'vagner-oliveira-pimentel-pereira',          true),
  ('Andre Ricardo Magalhães',                   'andre-ricardo-magalhaes',                   true),
  ('Mônica Mendes de Carvalho Gantois',         'monica-mendes-de-carvalho-gantois',         true),
  ('Marcos Dessa de Oliveira',                  'marcos-dessa-de-oliveira',                  true),
  ('Marco Antonio Chaves Câmara',               'marco-antonio-chaves-camara',               true),
  ('Angela Peixoto Santana',                    'angela-peixoto-santana',                    true),
  ('Rafael Cerqueira Fornasier',                'rafael-cerqueira-fornasier',                true),
  ('Lucas Almeida de Souza',                    'lucas-almeida-de-souza',                    true),
  ('Ronilson Morais Lobo',                      'ronilson-morais-lobo',                      true),
  ('Velda Gama Alves Torres',                   'velda-gama-alves-torres',                   true),
  ('Igor Gonçalves da Silva',                   'igor-goncalves-da-silva',                   true),
  ('Maria Gorete Borges Figueiredo',            'maria-gorete-borges-figueiredo',            true),
  ('Mario Jorge Pereira',                       'mario-jorge-pereira',                       true),
  ('Maria Sampaio Almeida',                     'maria-sampaio-almeida',                     true),
  ('Luana Ribeiro Pinto Araújo',                'luana-ribeiro-pinto-araujo',                true),
  ('Janine Dias de Oliveira Melo',              'janine-dias-de-oliveira-melo',              true)
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Vincular professores às disciplinas ───────────────────────────────────
-- Usa ILIKE para tolerar variações de acento nos nomes das disciplinas

INSERT INTO teacher_subjects (teacher_id, subject_id, course_id, active)
SELECT t.id, s.id, NULL, true
FROM teachers t
CROSS JOIN subjects s
WHERE (t.name = 'Odete Amanda Guerreiro Rodrigues Martinez' AND s.name ILIKE '%lculo I%')
   OR (t.name = 'Elton Figueiredo da Silva'                 AND s.name ILIKE '%Introdu%o a Engenharia%')
   OR (t.name = 'Gilberto Souza'                            AND s.name ILIKE '%Introdu%o a Engenharia%')
   OR (t.name = 'Flávio Dusse'                              AND s.name ILIKE '%Racioc%nio L%gico%')
   OR (t.name = 'Christianne Orrico Dalforno'               AND s.name ILIKE '%gica de Programa%o%')
   OR (t.name = 'Semíramis Ribeiro de Assis'                AND s.name ILIKE '%Arquitetura%Organiza%o%')
   OR (t.name = 'Alfons Heinrich Altimicks'                 AND s.name ILIKE '%Inicia%o%Vida Universit%ria%')
   OR (t.name = 'Artur Hemrique Kronbauer'                  AND s.name ILIKE '%Programa%o Orientada a Objetos%' AND s.name NOT ILIKE '%Avan%')
   OR (t.name = 'Glaucya Carreiro Boechat'                  AND s.name ILIKE '%Engenharia de Requisitos%')
   OR (t.name = 'Vagner Oliveira Pimentel Pereira'          AND s.name ILIKE '%Bancos de Dados I%')
   OR (t.name = 'Andre Ricardo Magalhães'                   AND s.name ILIKE '%Bancos de Dados I%')
   OR (t.name = 'Glaucya Carreiro Boechat'                  AND s.name ILIKE '%Processos de Software%')
   OR (t.name = 'Mônica Mendes de Carvalho Gantois'         AND s.name ILIKE '%Empreendedorismo%')
   OR (t.name = 'Marcos Dessa de Oliveira'                  AND s.name ILIKE '%Programa%o WEB%')
   OR (t.name = 'Marco Antonio Chaves Câmara'               AND s.name ILIKE '%Sistemas Operacionais%')
   OR (t.name = 'Angela Peixoto Santana'                    AND s.name ILIKE '%Estrutura de Dados%')
   OR (t.name = 'Rafael Cerqueira Fornasier'                AND s.name ILIKE '%Inicia%o ao Pensar%')
   OR (t.name = 'Andre Ricardo Magalhães'                   AND s.name ILIKE '%Tecnologias%Intelig%ncias Artificiais%')
   OR (t.name = 'Semíramis Ribeiro de Assis'                AND s.name ILIKE '%Seguran%a%Auditoria%')
   OR (t.name = 'Lucas Almeida de Souza'                    AND s.name ILIKE '%Redes de Computadores%')
   OR (t.name = 'Ronilson Morais Lobo'                      AND s.name ILIKE '%Programa%o Front%')
   OR (t.name = 'Velda Gama Alves Torres'                   AND s.name ILIKE '%Sociedade%Cultura%Meio Ambiente%')
   OR (t.name = 'Igor Gonçalves da Silva'                   AND s.name ILIKE '%Teologia%Humanismo%')
   OR (t.name = 'Maria Gorete Borges Figueiredo'            AND s.name ILIKE '%Inclus%o%Acessibilidade%')
   OR (t.name = 'Mario Jorge Pereira'                       AND s.name ILIKE '%Programa%o Orientada a Objetos%Avan%')
   OR (t.name = 'Flávio Dusse'                              AND s.name ILIKE '%Testes%Qualidade%')
   OR (t.name = 'Maria Sampaio Almeida'                     AND s.name ILIKE '%Projeto de Vida%')
   OR (t.name = 'Luana Ribeiro Pinto Araújo'                AND s.name ILIKE '%Tomada de Decis%o%')
   OR (t.name = 'Janine Dias de Oliveira Melo'              AND s.name ILIKE '%Ci%ncia%Natureza%Sociedade%')
ON CONFLICT DO NOTHING;

-- ── 3. Verificar resultado ───────────────────────────────────────────────────
-- Rode isso depois para confirmar os vínculos criados:

/*
SELECT
  t.name AS professor,
  s.name AS materia,
  s.code AS codigo
FROM teacher_subjects ts
JOIN teachers t  ON t.id = ts.teacher_id
JOIN subjects  s ON s.id = ts.subject_id
WHERE t.name IN (
  'Odete Amanda Guerreiro Rodrigues Martinez',
  'Elton Figueiredo da Silva',
  'Gilberto Souza',
  'Flávio Dusse',
  'Christianne Orrico Dalforno',
  'Semíramis Ribeiro de Assis',
  'Alfons Heinrich Altimicks',
  'Artur Hemrique Kronbauer',
  'Glaucya Carreiro Boechat',
  'Vagner Oliveira Pimentel Pereira',
  'Andre Ricardo Magalhães',
  'Mônica Mendes de Carvalho Gantois',
  'Marcos Dessa de Oliveira',
  'Marco Antonio Chaves Câmara',
  'Angela Peixoto Santana',
  'Rafael Cerqueira Fornasier',
  'Lucas Almeida de Souza',
  'Ronilson Morais Lobo',
  'Velda Gama Alves Torres',
  'Igor Gonçalves da Silva',
  'Maria Gorete Borges Figueiredo',
  'Mario Jorge Pereira',
  'Maria Sampaio Almeida',
  'Luana Ribeiro Pinto Araújo',
  'Janine Dias de Oliveira Melo'
)
ORDER BY t.name, s.name;
*/
