-- =====================
-- CURSOS
-- =====================

INSERT INTO courses (id, code, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'BES', 'Engenharia de Software'),
  ('00000000-0000-0000-0000-000000000002', 'ADS', 'Análise e Desenvolvimento de Sistemas')
ON CONFLICT (code) DO NOTHING;

-- =====================
-- MATRIZES
-- =====================

INSERT INTO curriculum_versions (id, course_id, name, campus, shift, year) VALUES
  ('00000000-0000-0001-0001-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Matriz 2023/1', 'Pituaçu', 'Matutino', 2023),
  ('00000000-0000-0001-0001-000000000002',
   '00000000-0000-0000-0000-000000000002',
   'Matriz 2023/1', 'Pituaçu', 'Noturno', 2023)
ON CONFLICT DO NOTHING;

-- =====================
-- SEMESTRES BES (1-8)
-- =====================

INSERT INTO semesters (id, curriculum_version_id, number) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0001-0001-000000000001', 1),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0001-0001-000000000001', 2),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0001-0001-000000000001', 3),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0001-0001-000000000001', 4),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0001-0001-000000000001', 5),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0001-0001-000000000001', 6),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0001-0001-000000000001', 7),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0001-0001-000000000001', 8)
ON CONFLICT DO NOTHING;

-- =====================
-- SEMESTRES ADS (1-5)
-- =====================

INSERT INTO semesters (id, curriculum_version_id, number) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0001-0001-000000000002', 1),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0001-0001-000000000002', 2),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0001-0001-000000000002', 3),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0001-0001-000000000002', 4),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0001-0001-000000000002', 5)
ON CONFLICT DO NOTHING;

-- =====================
-- DISCIPLINAS BES
-- =====================

INSERT INTO subjects (code, name, type, modality) VALUES
  ('BES001', 'Arquitetura e Organização de Computadores', 'mandatory', 'presencial'),
  ('BES004', 'Introdução à Engenharia de Software', 'mandatory', 'presencial'),
  ('BES005', 'Lógica de Programação e Algoritmos', 'mandatory', 'presencial'),
  ('BES046', 'Raciocínio Lógico', 'mandatory', 'presencial'),
  ('EFB499', 'Cálculo I', 'mandatory', 'presencial'),
  ('EFG011', 'Iniciação à Vida Universitária', 'mandatory', 'presencial'),
  ('BES008', 'Programação Orientada a Objetos', 'mandatory', 'presencial'),
  ('BES010', 'Sistemas Operacionais', 'mandatory', 'presencial'),
  ('BES016', 'Processos de Software', 'mandatory', 'presencial'),
  ('BES048', 'Programação Front End', 'mandatory', 'presencial'),
  ('EFG017', 'Empreendedorismo e Inovação', 'mandatory', 'presencial'),
  ('BES006', 'Estrutura de Dados', 'mandatory', 'presencial'),
  ('BES011', 'Bancos de Dados I', 'mandatory', 'presencial'),
  ('BES012', 'Engenharia de Requisitos', 'mandatory', 'presencial'),
  ('BES049', 'Programação Web', 'mandatory', 'presencial'),
  ('EFG201', 'Iniciação ao Pensar', 'mandatory', 'presencial'),
  ('BES009', 'Redes de Computadores', 'mandatory', 'presencial'),
  ('BES020', 'Programação para Dispositivos Móveis', 'mandatory', 'presencial'),
  ('BES021', 'Segurança e Auditoria de Sistemas', 'mandatory', 'presencial'),
  ('BES022', 'Testes e Qualidade de Software', 'mandatory', 'presencial'),
  ('BES050', 'Programação Orientada a Objetos Avançada', 'mandatory', 'presencial'),
  ('EFG013', 'Teologia e Humanismo', 'mandatory', 'presencial'),
  ('BES019', 'Estrutura Discreta e Lógica', 'mandatory', 'presencial'),
  ('BES023', 'Arquitetura de Software', 'mandatory', 'presencial'),
  ('BES026', 'Sistemas Distribuídos', 'mandatory', 'presencial'),
  ('BES051', 'Governança de Tecnologia da Informação', 'mandatory', 'presencial'),
  ('EFG018', 'Sociedade, Cultura e Meio Ambiente', 'mandatory', 'presencial'),
  ('BES024', 'Gestão do Conhecimento', 'mandatory', 'presencial'),
  ('BES027', 'Banco de Dados II', 'mandatory', 'presencial'),
  ('BES035', 'Engenharia de Software Experimental', 'mandatory', 'presencial'),
  ('BES036', 'Evolução de Software', 'mandatory', 'presencial'),
  ('BES038', 'Inteligência Artificial', 'mandatory', 'presencial'),
  ('EFB659', 'Projeto de Vida e Mundo do Trabalho', 'mandatory', 'presencial'),
  ('BES034', 'Compiladores', 'mandatory', 'presencial'),
  ('BES037', 'Gerência de Projetos', 'mandatory', 'presencial'),
  ('BES043', 'Tópicos Avançados em Banco de Dados', 'mandatory', 'presencial'),
  ('BES045', 'Tópicos Especiais em Engenharia de Software', 'mandatory', 'presencial'),
  ('BES039', 'Pesquisa Operacional', 'mandatory', 'presencial'),
  ('BES040', 'Processos de Negócio', 'mandatory', 'presencial'),
  ('BES044', 'Tópicos Avançados em Programação', 'mandatory', 'presencial'),
  ('BES052', 'Big Data e Analytics', 'mandatory', 'presencial'),
  ('BES053', 'Projeto Final', 'mandatory', 'presencial')
ON CONFLICT (code) DO NOTHING;

-- =====================
-- DISCIPLINAS ADS
-- =====================

INSERT INTO subjects (code, name, type, modality) VALUES
  ('CST302', 'Lógica de Programação e Algoritmos', 'mandatory', 'presencial'),
  ('CST303', 'Matemática I', 'mandatory', 'presencial'),
  ('CST304', 'Arquitetura e Organização de Computadores', 'mandatory', 'presencial'),
  ('CST328', 'Raciocínio Lógico', 'mandatory', 'presencial'),
  ('CST367', 'Fundamentos de Sistemas de Informação', 'mandatory', 'presencial'),
  ('CST222', 'Programação Front End', 'mandatory', 'presencial'),
  ('CST309', 'Programação Orientada a Objetos', 'mandatory', 'presencial'),
  ('CST310', 'Redes de Computadores', 'mandatory', 'presencial'),
  ('CST319', 'Sistemas Operacionais', 'mandatory', 'presencial'),
  ('CST305', 'Estrutura de Dados', 'mandatory', 'presencial'),
  ('CST311', 'Bancos de Dados', 'mandatory', 'presencial'),
  ('CST313', 'Introdução à Engenharia de Software', 'mandatory', 'presencial'),
  ('CST315', 'Programação Web', 'mandatory', 'presencial'),
  ('CST223', 'Processos de Software', 'mandatory', 'presencial'),
  ('CST314', 'Programação Orientada a Objetos Avançada', 'mandatory', 'presencial'),
  ('CST316', 'Segurança e Auditoria de Sistemas', 'mandatory', 'presencial'),
  ('CST318', 'Programação para Dispositivos Móveis', 'mandatory', 'presencial'),
  ('CST320', 'Testes e Qualidade de Software', 'mandatory', 'presencial'),
  ('CST224', 'Projeto Integrador', 'mandatory', 'presencial'),
  ('CST322', 'Arquitetura de Software', 'mandatory', 'presencial'),
  ('CST324', 'Gerência de Projetos', 'mandatory', 'presencial'),
  ('CST325', 'Processos de Negócio', 'mandatory', 'presencial'),
  ('CST327', 'Sistemas de Apoio à Decisão', 'mandatory', 'presencial')
ON CONFLICT (code) DO NOTHING;

-- =====================
-- ELETIVAS (EAD)
-- =====================

INSERT INTO subjects (code, name, type, modality) VALUES
  ('EFB207', 'Língua Brasileira de Sinais - LIBRAS', 'elective', 'ead'),
  ('ELE001', 'Inclusão e Acessibilidade', 'elective', 'ead'),
  ('ELE002', 'Educomunicação', 'elective', 'ead'),
  ('ELE003', 'Ciências, Natureza e Sociedade', 'elective', 'ead'),
  ('ELE004', 'Compliance Empresarial e Societário', 'elective', 'ead'),
  ('ELE005', 'Projeto de Extensão em Direito e Cidadania', 'elective', 'ead'),
  ('ELE006', 'Interfaces de Dashboards Interativos', 'elective', 'ead'),
  ('ELE007', 'Criação de Dashboards Inteligentes', 'elective', 'ead'),
  ('ELE008', 'Etnias e Diversidade Cultural', 'elective', 'ead'),
  ('ELE009', 'Culinárias Alternativas e Tendências Alimentares', 'elective', 'ead'),
  ('ELE010', 'Propaganda Infanto-Juvenil e o Direito da Criança e Adolescente', 'elective', 'ead'),
  ('ELE011', 'Ética Profissional', 'elective', 'ead'),
  ('ELE012', 'Tecnologia para Negócios', 'elective', 'ead'),
  ('ELE013', 'Primeiros Socorros', 'elective', 'ead'),
  ('ELE014', 'Comunicação, Cultura e Cidadania', 'elective', 'ead'),
  ('ELE015', 'Argumentação e Retórica Aplicadas às Mídias Digitais', 'elective', 'ead'),
  ('ELE016', 'Tomada de Decisão', 'elective', 'ead'),
  ('ELE017', 'Gênero, Sexualidade e Direito', 'elective', 'ead'),
  ('ELE018', 'Impacto do Ambiente Construído na Qualidade de Vida da População', 'elective', 'ead'),
  ('ELE019', 'Introdução à Toxicologia Ambiental', 'elective', 'ead')
ON CONFLICT (code) DO NOTHING;

-- =====================
-- VÍNCULOS BES — SEMESTRE 1
-- =====================
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000001', '10000000-0000-0000-0000-000000000001', s.id,
  row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('BES001','BES004','BES005','BES046','EFB499','EFG011')
ON CONFLICT DO NOTHING;

-- SEMESTRE 2
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000001', '10000000-0000-0000-0000-000000000002', s.id,
  row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('BES008','BES010','BES016','BES048','EFG017')
ON CONFLICT DO NOTHING;

-- SEMESTRE 3
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000001', '10000000-0000-0000-0000-000000000003', s.id,
  row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('BES006','BES011','BES012','BES049','EFG201')
ON CONFLICT DO NOTHING;

-- SEMESTRE 4
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000001', '10000000-0000-0000-0000-000000000004', s.id,
  row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('BES009','BES020','BES021','BES022','BES050','EFG013')
ON CONFLICT DO NOTHING;

-- SEMESTRE 5
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000001', '10000000-0000-0000-0000-000000000005', s.id,
  row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('BES019','BES023','BES026','BES051','EFG018')
ON CONFLICT DO NOTHING;

-- SEMESTRE 6
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000001', '10000000-0000-0000-0000-000000000006', s.id,
  row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('BES024','BES027','BES035','BES036','BES038','EFB659')
ON CONFLICT DO NOTHING;

-- SEMESTRE 7
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000001', '10000000-0000-0000-0000-000000000007', s.id,
  row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('BES034','BES037','BES043','BES045')
ON CONFLICT DO NOTHING;

-- SEMESTRE 8
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000001', '10000000-0000-0000-0000-000000000008', s.id,
  row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('BES039','BES040','BES044','BES052','BES053')
ON CONFLICT DO NOTHING;

-- =====================
-- VÍNCULOS ADS — SEMESTRE 1
-- =====================
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000002', '20000000-0000-0000-0000-000000000001', s.id,
  row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('CST302','CST303','CST304','CST328','CST367','EFG011')
ON CONFLICT DO NOTHING;

-- SEMESTRE 2
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000002', '20000000-0000-0000-0000-000000000002', s.id,
  row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('CST222','CST309','CST310','CST319','EFG017','EFG201')
ON CONFLICT DO NOTHING;

-- SEMESTRE 3
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000002', '20000000-0000-0000-0000-000000000003', s.id,
  row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('CST305','CST311','CST313','CST315','EFG013')
ON CONFLICT DO NOTHING;

-- SEMESTRE 4
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000002', '20000000-0000-0000-0000-000000000004', s.id,
  row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('CST223','CST314','CST316','CST318','CST320','EFG018')
ON CONFLICT DO NOTHING;

-- SEMESTRE 5
INSERT INTO curriculum_subjects (curriculum_version_id, semester_id, subject_id, recommended_order, is_required)
SELECT '00000000-0000-0001-0001-000000000002', '20000000-0000-0000-0000-000000000005', s.id,
  row_number() OVER (ORDER BY s.code), TRUE
FROM subjects s WHERE s.code IN ('CST224','CST322','CST324','CST325','CST327','EFB659')
ON CONFLICT DO NOTHING;

-- =====================
-- ELETIVAS — disponíveis para BES e ADS
-- =====================
INSERT INTO curriculum_subjects (curriculum_version_id, subject_id, is_required)
SELECT '00000000-0000-0001-0001-000000000001', s.id, FALSE
FROM subjects s WHERE s.type = 'elective'
ON CONFLICT DO NOTHING;

INSERT INTO curriculum_subjects (curriculum_version_id, subject_id, is_required)
SELECT '00000000-0000-0001-0001-000000000002', s.id, FALSE
FROM subjects s WHERE s.type = 'elective'
ON CONFLICT DO NOTHING;

-- =====================
-- ADMIN SEED
-- Executar APÓS o usuário fazer login pela primeira vez
-- UPDATE profiles SET role = 'admin' WHERE email = 'vinicruzlago@gmail.com';
-- =====================
