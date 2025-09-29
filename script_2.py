# Criar script adicional para configuração de usuários de teste
usuarios_teste_sql = """
-- ====================================================================
-- SCRIPT DE CONFIGURAÇÃO DE USUÁRIOS DE TESTE
-- Execute APÓS criar os usuários no Supabase Auth
-- ====================================================================

-- IMPORTANTE: Antes de executar este script, você deve:
-- 1. Ir em Authentication > Users no Supabase
-- 2. Criar os usuários com os emails abaixo
-- 3. Então executar este script para vincular aos perfis

-- ====================================================================
-- VINCULAR USUÁRIOS DE TESTE AOS PERFIS
-- ====================================================================

-- Professor de teste
INSERT INTO usuarios (id, nome, email, perfil, ativo) 
VALUES (
  (SELECT id FROM auth.users WHERE email = 'professor@escola.com'),
  'Maria Silva Santos',
  'professor@escola.com',
  'PROFESSOR',
  true
) ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  perfil = EXCLUDED.perfil,
  ativo = EXCLUDED.ativo;

-- Gestor de teste
INSERT INTO usuarios (id, nome, email, perfil, ativo)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'gestor@escola.com'),
  'João Carlos Diretor', 
  'gestor@escola.com',
  'GESTOR',
  true
) ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  perfil = EXCLUDED.perfil,
  ativo = EXCLUDED.ativo;

-- ====================================================================
-- INSERIR ALGUMAS INFRAÇÕES DE EXEMPLO PARA DEMONSTRAÇÃO
-- ====================================================================

-- Infrações de exemplo (apenas se houver dados para demonstrar)
DO $$
DECLARE
    professor_id UUID;
    gestor_id UUID;
    infracao_id UUID;
BEGIN
    -- Buscar IDs dos usuários criados
    SELECT id INTO professor_id FROM usuarios WHERE email = 'professor@escola.com';
    SELECT id INTO gestor_id FROM usuarios WHERE email = 'gestor@escola.com';
    
    -- Só inserir se os usuários existirem
    IF professor_id IS NOT NULL THEN
        -- Infração 1: Uso de celular
        INSERT INTO infracoes (
            aluno_id,
            professor_id, 
            tipo_infracao_id,
            descricao,
            data_ocorrencia,
            local_ocorrencia,
            status
        ) VALUES (
            (SELECT id FROM alunos WHERE matricula = '2024001'),
            professor_id,
            (SELECT id FROM tipos_infracoes WHERE nome = 'Uso de celular em sala'),
            'Aluno estava usando celular durante explicação da matéria',
            NOW() - INTERVAL '2 hours',
            'Sala 7ºA',
            'PENDENTE'
        ) RETURNING id INTO infracao_id;
        
        -- Infração 2: Conversar durante aula
        INSERT INTO infracoes (
            aluno_id,
            professor_id,
            tipo_infracao_id, 
            descricao,
            data_ocorrencia,
            local_ocorrencia,
            status
        ) VALUES (
            (SELECT id FROM alunos WHERE matricula = '2024002'),
            professor_id,
            (SELECT id FROM tipos_infracoes WHERE nome = 'Conversar durante a aula'),
            'Conversando e atrapalhando colegas durante a aula de matemática',
            NOW() - INTERVAL '1 day',
            'Sala 7ºA', 
            'EM_ANALISE'
        );
        
        -- Infração 3: Desrespeito ao professor
        INSERT INTO infracoes (
            aluno_id,
            professor_id,
            tipo_infracao_id,
            descricao, 
            data_ocorrencia,
            local_ocorrencia,
            status
        ) VALUES (
            (SELECT id FROM alunos WHERE matricula = '2024011'),
            professor_id,
            (SELECT id FROM tipos_infracoes WHERE nome = 'Desrespeito ao professor'),
            'Respondeu de forma grosseira quando chamado atenção',
            NOW() - INTERVAL '3 days',
            'Sala 8ºA',
            'RESOLVIDA'
        ) RETURNING id INTO infracao_id;
        
        -- Aplicar penalidade na infração resolvida
        IF infracao_id IS NOT NULL THEN
            INSERT INTO penalidades_aplicadas (
                infracao_id,
                tipo_penalidade_id,
                data_aplicacao,
                aplicada_por,
                observacoes,
                cumprida
            ) VALUES (
                infracao_id,
                (SELECT id FROM tipos_penalidades WHERE nome = 'Advertência Escrita'),
                NOW() - INTERVAL '2 days',
                'João Carlos Diretor',
                'Advertência aplicada após conversa com responsáveis',
                true
            );
        END IF;
        
        -- Infração 4: Atraso
        INSERT INTO infracoes (
            aluno_id,
            professor_id,
            tipo_infracao_id,
            descricao,
            data_ocorrencia, 
            local_ocorrencia,
            status
        ) VALUES (
            (SELECT id FROM alunos WHERE matricula = '2024021'),
            professor_id,
            (SELECT id FROM tipos_infracoes WHERE nome = 'Atraso para aula'),
            'Chegou 15 minutos atrasado sem justificativa',
            NOW() - INTERVAL '1 hour',
            'Sala 9ºA',
            'PENDENTE'
        );
        
        -- Infração 5: Dano ao patrimônio
        INSERT INTO infracoes (
            aluno_id,
            professor_id,
            tipo_infracao_id,
            descricao,
            data_ocorrencia,
            local_ocorrencia, 
            status
        ) VALUES (
            (SELECT id FROM alunos WHERE matricula = '2024007'),
            professor_id,
            (SELECT id FROM tipos_infracoes WHERE nome = 'Dano ao patrimônio'),
            'Riscou a carteira com caneta',
            NOW() - INTERVAL '5 days',
            'Sala 7ºB',
            'EM_ANALISE'
        );
    END IF;
END $$;

-- ====================================================================
-- VERIFICAR SE TUDO FOI CRIADO CORRETAMENTE
-- ====================================================================

-- Verificar usuários criados
SELECT 'USUÁRIOS CRIADOS:' as info;
SELECT nome, email, perfil, ativo FROM usuarios ORDER BY perfil;

-- Verificar infrações de exemplo
SELECT 'INFRAÇÕES DE EXEMPLO:' as info;
SELECT 
    i.id,
    a.nome as aluno,
    a.turma,
    ti.nome as tipo_infracao,
    ti.categoria,
    i.descricao,
    i.status,
    i.data_ocorrencia
FROM infracoes i
JOIN alunos a ON i.aluno_id = a.id  
JOIN tipos_infracoes ti ON i.tipo_infracao_id = ti.id
ORDER BY i.data_ocorrencia DESC;

-- Verificar penalidades aplicadas  
SELECT 'PENALIDADES APLICADAS:' as info;
SELECT 
    pa.id,
    i.id as infracao_id,
    a.nome as aluno,
    tp.nome as penalidade,
    pa.aplicada_por,
    pa.cumprida
FROM penalidades_aplicadas pa
JOIN infracoes i ON pa.infracao_id = i.id
JOIN alunos a ON i.aluno_id = a.id
JOIN tipos_penalidades tp ON pa.tipo_penalidade_id = tp.id;

-- ====================================================================
-- SCRIPT CONCLUÍDO COM SUCESSO!
-- ====================================================================

SELECT '✅ CONFIGURAÇÃO CONCLUÍDA!' as status,
       'Agora você pode fazer login no sistema com:' as info;
       
SELECT 
    'professor@escola.com (senha: 123456789)' as professor,
    'gestor@escola.com (senha: 123456789)' as gestor;
"""

# Salvar o script de usuários de teste
with open('supabase_usuarios_teste.sql', 'w', encoding='utf-8') as f:
    f.write(usuarios_teste_sql)

print("✅ Script de usuários de teste criado: supabase_usuarios_teste.sql")
print("\n📝 Ordem de execução no Supabase:")
print("1. supabase_schema.sql (criar tabelas)")  
print("2. supabase_seed_data.sql (dados básicos)")
print("3. Criar usuários no Supabase Auth interface")
print("4. supabase_usuarios_teste.sql (vincular usuários)")
print("\n🎯 Pronto para usar o sistema!")