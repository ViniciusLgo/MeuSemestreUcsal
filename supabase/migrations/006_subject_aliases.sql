-- Campo de apelidos/siglas para busca por abreviações
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS aliases TEXT;

-- Atualiza aliases das disciplinas mais buscadas por sigla
UPDATE subjects SET aliases = 'POO programacao orientada objetos' WHERE name ILIKE '%orientada a objetos%';
UPDATE subjects SET aliases = 'TCC trabalho conclusao curso projeto final' WHERE name ILIKE '%trabalho de conclus%' OR name ILIKE '%projeto final%' OR name ILIKE '%TCC%';
UPDATE subjects SET aliases = 'BD SGBD banco dados' WHERE name ILIKE '%banco de dado%';
UPDATE subjects SET aliases = 'ED EDA estrutura dados algoritmo' WHERE name ILIKE '%estrutura de dado%';
UPDATE subjects SET aliases = 'SO sistemas operacionais' WHERE name ILIKE '%sistemas operacional%';
UPDATE subjects SET aliases = 'LP logica programacao' WHERE name ILIKE '%l%gica de programa%';
UPDATE subjects SET aliases = 'IHC interface humano computador' WHERE name ILIKE '%interface humano%' OR name ILIKE '%interacao humano%';
UPDATE subjects SET aliases = 'IA inteligencia artificial' WHERE name ILIKE '%intelig%ncia artificial%';
UPDATE subjects SET aliases = 'ES engenharia software' WHERE name ILIKE '%engenharia de software%';
UPDATE subjects SET aliases = 'redes computadores internet' WHERE name ILIKE '%redes de computador%';
UPDATE subjects SET aliases = 'calculo matematica' WHERE name ILIKE '%c%lculo%';
UPDATE subjects SET aliases = 'POO2 POO II programacao orientada objetos' WHERE name ILIKE '%orientada a objetos ii%' OR name ILIKE '%orientada a objetos 2%';
