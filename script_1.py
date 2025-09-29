# Criar script de dados de exemplo (seed data)
seed_data_sql = """
-- ====================================================================
-- DADOS DE EXEMPLO PARA O SISTEMA DE INFRAÇÕES DISCIPLINARES
-- Execute este script APÓS criar as tabelas principais
-- ====================================================================

-- 1. INSERIR TIPOS DE INFRAÇÕES
INSERT INTO tipos_infracoes (nome, categoria, descricao) VALUES
-- INFRAÇÕES LEVES
('Uso de celular em sala', 'LEVE', 'Utilizar aparelho celular durante a aula sem autorização'),
('Conversar durante a aula', 'LEVE', 'Conversar ou brincar durante a explicação do professor'),
('Atraso para aula', 'LEVE', 'Chegar atrasado para a aula sem justificativa'),
('Levantar sem autorização', 'LEVE', 'Levantar-se da carteira sem permissão do professor'),
('Não fazer tarefa', 'LEVE', 'Deixar de entregar atividades solicitadas'),
('Sujar ambiente escolar', 'LEVE', 'Deixar lixo ou sujar carteiras, mesas ou chão'),

-- INFRAÇÕES GRAVES
('Desrespeito ao professor', 'GRAVE', 'Usar linguagem inadequada ou desrespeitosa com educadores'),
('Descumprimento de ordens', 'GRAVE', 'Não acatar orientações ou ordens do professor'),
('Dano ao patrimônio', 'GRAVE', 'Danificar materiais, móveis ou equipamentos da escola'),
('Saída sem autorização', 'GRAVE', 'Sair da sala de aula ou da escola sem permissão'),
('Linguagem imprópria', 'GRAVE', 'Uso de palavrões ou linguagem ofensiva'),
('Perturbação da ordem', 'GRAVE', 'Comportamento que perturba o andamento das atividades'),

-- INFRAÇÕES MUITO GRAVES
('Agressão física', 'MUITO_GRAVE', 'Agressão física contra colegas, professores ou funcionários'),
('Bullying/Cyberbullying', 'MUITO_GRAVE', 'Prática de intimidação, humilhação ou perseguição'),
('Discriminação', 'MUITO_GRAVE', 'Atos discriminatórios por raça, religião, gênero ou orientação'),
('Porte de objetos perigosos', 'MUITO_GRAVE', 'Portar objetos que possam causar ferimentos'),
('Vandalismo', 'MUITO_GRAVE', 'Destruição intencional do patrimônio escolar'),
('Uso de substâncias ilícitas', 'MUITO_GRAVE', 'Porte, uso ou distribuição de drogas ou álcool');

-- 2. INSERIR TIPOS DE PENALIDADES
INSERT INTO tipos_penalidades (nome, descricao, dias_suspensao) VALUES
('Advertência Verbal', 'Conversa orientativa com o aluno sobre o comportamento inadequado', 0),
('Advertência Escrita', 'Registro formal da infração com comunicação aos responsáveis', 0),
('Suspensão de Recreio', 'Permanência em sala durante o intervalo com atividade educativa', 0),
('Comunicado aos Pais', 'Convocação dos responsáveis para reunião sobre o comportamento', 0),
('Suspensão 1 dia', 'Afastamento das atividades escolares por 1 dia letivo', 1),
('Suspensão 2 dias', 'Afastamento das atividades escolares por 2 dias letivos', 2),
('Suspensão 3 dias', 'Afastamento das atividades escolares por 3 dias letivos', 3),
('Suspensão 5 dias', 'Afastamento das atividades escolares por 5 dias letivos', 5),
('Transferência Educativa', 'Transferência para outra unidade escolar da rede', 0),
('Atividade Comunitária', 'Prestação de serviços educativos na comunidade escolar', 0);

-- 3. INSERIR PROFESSORES DE EXEMPLO
INSERT INTO professores (nome, email, disciplina, telefone) VALUES
('Maria Silva Santos', 'maria.santos@escola.com', 'Português', '(61) 99999-1001'),
('João Carlos Oliveira', 'joao.oliveira@escola.com', 'Matemática', '(61) 99999-1002'),
('Ana Paula Costa', 'ana.costa@escola.com', 'História', '(61) 99999-1003'),
('Pedro Henrique Lima', 'pedro.lima@escola.com', 'Geografia', '(61) 99999-1004'),
('Carla Regina Souza', 'carla.souza@escola.com', 'Ciências', '(61) 99999-1005'),
('Roberto Carlos Pereira', 'roberto.pereira@escola.com', 'Educação Física', '(61) 99999-1006'),
('Fernanda Cristina Rocha', 'fernanda.rocha@escola.com', 'Inglês', '(61) 99999-1007'),
('Marcus Vinícius Alves', 'marcus.alves@escola.com', 'Arte', '(61) 99999-1008');

-- 4. INSERIR ALUNOS DE EXEMPLO
INSERT INTO alunos (nome, matricula, turma, data_nascimento, telefone_responsavel, email_responsavel, nome_responsavel) VALUES
-- 7º ANO A
('Lucas Gabriel da Silva', '2024001', '7ºA', '2011-03-15', '(61) 98888-1001', 'silva.responsavel@email.com', 'Carlos Eduardo da Silva'),
('Isabella Santos Oliveira', '2024002', '7ºA', '2011-05-22', '(61) 98888-1002', 'oliveira.responsavel@email.com', 'Mariana Santos Oliveira'),
('Enzo Miguel Costa', '2024003', '7ºA', '2011-01-08', '(61) 98888-1003', 'costa.responsavel@email.com', 'Ricardo Miguel Costa'),
('Sophia Vitória Lima', '2024004', '7ºA', '2011-07-30', '(61) 98888-1004', 'lima.responsavel@email.com', 'Patrícia Vitória Lima'),
('Arthur Henrique Souza', '2024005', '7ºA', '2011-04-12', '(61) 98888-1005', 'souza.responsavel@email.com', 'Fernando Henrique Souza'),

-- 7º ANO B
('Helena Maria Pereira', '2024006', '7ºB', '2011-06-18', '(61) 98888-1006', 'pereira.responsavel@email.com', 'José Maria Pereira'),
('Miguel Rafael Rocha', '2024007', '7ºB', '2011-02-25', '(61) 98888-1007', 'rocha.responsavel@email.com', 'Amanda Rafael Rocha'),
('Alice Gabriela Alves', '2024008', '7ºB', '2011-09-14', '(61) 98888-1008', 'alves.responsavel@email.com', 'Roberto Gabriela Alves'),
('Davi Lucas Ferreira', '2024009', '7ºB', '2011-11-03', '(61) 98888-1009', 'ferreira.responsavel@email.com', 'Luciana Lucas Ferreira'),
('Manuela Sofia Barbosa', '2024010', '7ºB', '2011-08-21', '(61) 98888-1010', 'barbosa.responsavel@email.com', 'Thiago Sofia Barbosa'),

-- 8º ANO A
('Gustavo Henrique Martins', '2024011', '8ºA', '2010-12-07', '(61) 98888-1011', 'martins.responsavel@email.com', 'Andréa Henrique Martins'),
('Valentina Beatriz Santos', '2024012', '8ºA', '2010-03-28', '(61) 98888-1012', 'santos2.responsavel@email.com', 'Bruno Beatriz Santos'),
('Bernardo Gabriel Silva', '2024013', '8ºA', '2010-05-16', '(61) 98888-1013', 'silva2.responsavel@email.com', 'Caroline Gabriel Silva'),
('Laura Sophia Oliveira', '2024014', '8ºA', '2010-10-09', '(61) 98888-1014', 'oliveira2.responsavel@email.com', 'Diego Sophia Oliveira'),
('Rafael Miguel Costa', '2024015', '8ºA', '2010-01-24', '(61) 98888-1015', 'costa2.responsavel@email.com', 'Elaine Miguel Costa'),

-- 8º ANO B
('Giovanna Luna Lima', '2024016', '8ºB', '2010-07-11', '(61) 98888-1016', 'lima2.responsavel@email.com', 'Felipe Luna Lima'),
('Lorenzo Rafael Souza', '2024017', '8ºB', '2010-04-05', '(61) 98888-1017', 'souza2.responsavel@email.com', 'Gabriela Rafael Souza'),
('Maria Eduarda Pereira', '2024018', '8ºB', '2010-11-19', '(61) 98888-1018', 'pereira2.responsavel@email.com', 'Henrique Eduarda Pereira'),
('João Pedro Rocha', '2024019', '8ºB', '2010-09-02', '(61) 98888-1019', 'rocha2.responsavel@email.com', 'Isabela Pedro Rocha'),
('Ana Clara Alves', '2024020', '8ºB', '2010-06-27', '(61) 98888-1020', 'alves2.responsavel@email.com', 'Jefferson Clara Alves'),

-- 9º ANO A
('Pedro Lucas Ferreira', '2024021', '9ºA', '2009-08-13', '(61) 98888-1021', 'ferreira2.responsavel@email.com', 'Kelly Lucas Ferreira'),
('Lara Vitória Barbosa', '2024022', '9ºA', '2009-12-31', '(61) 98888-1022', 'barbosa2.responsavel@email.com', 'Leonardo Vitória Barbosa'),
('Theo Gabriel Martins', '2024023', '9ºA', '2009-02-18', '(61) 98888-1023', 'martins2.responsavel@email.com', 'Mônica Gabriel Martins'),
('Melissa Santos Silva', '2024024', '9ºA', '2009-05-06', '(61) 98888-1024', 'silva3.responsavel@email.com', 'Natalino Santos Silva'),
('Nicolas Henrique Santos', '2024025', '9ºA', '2009-10-22', '(61) 98888-1025', 'santos3.responsavel@email.com', 'Olivia Henrique Santos');

-- ====================================================================
-- IMPORTANTE: INFRAÇÕES DE EXEMPLO SÃO INSERIDAS APÓS LOGIN DOS USUÁRIOS
-- Pois precisam dos IDs reais dos professores vindos da autenticação
-- ====================================================================
"""

# Salvar os dados de exemplo
with open('supabase_seed_data.sql', 'w', encoding='utf-8') as f:
    f.write(seed_data_sql)

print("✅ Arquivo de dados de exemplo criado: supabase_seed_data.sql")
print("\n📊 Dados de exemplo incluem:")
print("- 18 tipos de infrações (6 leves, 6 graves, 6 muito graves)")
print("- 10 tipos de penalidades")
print("- 8 professores de diferentes disciplinas")
print("- 25 alunos distribuídos em 5 turmas")
print("\n⚠️  IMPORTANTE: Execute primeiro o schema, depois os dados de exemplo!")