-- ===================================================================
-- SCRIPT DE CONFIGURAÇÃO COMPLETA DO BANCO - SUPABASE
-- Execute este script no SQL Editor do Supabase
-- ===================================================================

-- STEP 1: Criar as tabelas principais
-- Tabela de perfis de usuários (roles: teacher, manager)
CREATE TABLE IF NOT EXISTS perfis (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    papel VARCHAR(20) NOT NULL DEFAULT 'teacher', -- 'teacher' ou 'manager'
    nome VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de turmas vinculadas aos professores
CREATE TABLE IF NOT EXISTS turmas_prof (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    turma VARCHAR(10) NOT NULL,
    ano_letivo VARCHAR(10) DEFAULT EXTRACT(YEAR FROM NOW())::VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, turma)
);

-- Tabela principal de ocorrências/infrações
CREATE TABLE IF NOT EXISTS ocorrencias (
    id SERIAL PRIMARY KEY,
    professor_email VARCHAR(255) NOT NULL,
    professor_id UUID REFERENCES auth.users(id),
    turma VARCHAR(10) NOT NULL,
    aluno_nome VARCHAR(255) NOT NULL,
    tipo_ocorrencia VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    data_ocorrencia TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'resolvida', 'cancelada'
    penalidade VARCHAR(255),
    observacoes_gestor TEXT,
    data_resolucao TIMESTAMP,
    resolvido_por UUID REFERENCES auth.users(id),
    gravidade VARCHAR(20) DEFAULT 'media', -- 'leve', 'media', 'grave'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- STEP 2: Habilitar Row Level Security (RLS) - SEGURANÇA ESSENCIAL
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas_prof ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;

-- STEP 3: Criar políticas de segurança para tabela PERFIS
-- Usuários podem ver e editar seu próprio perfil
DROP POLICY IF EXISTS "Usuarios_podem_ver_proprio_perfil" ON perfis;
CREATE POLICY "Usuarios_podem_ver_proprio_perfil" ON perfis 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios_podem_inserir_proprio_perfil" ON perfis;
CREATE POLICY "Usuarios_podem_inserir_proprio_perfil" ON perfis 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios_podem_atualizar_proprio_perfil" ON perfis;
CREATE POLICY "Usuarios_podem_atualizar_proprio_perfil" ON perfis 
FOR UPDATE USING (auth.uid() = user_id);

-- Gestores podem ver e gerenciar todos os perfis
DROP POLICY IF EXISTS "Gestores_podem_ver_todos_perfis" ON perfis;
CREATE POLICY "Gestores_podem_ver_todos_perfis" ON perfis 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM perfis p 
        WHERE p.user_id = auth.uid() AND p.papel = 'manager'
    )
);

DROP POLICY IF EXISTS "Gestores_podem_gerenciar_perfis" ON perfis;
CREATE POLICY "Gestores_podem_gerenciar_perfis" ON perfis 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM perfis p 
        WHERE p.user_id = auth.uid() AND p.papel = 'manager'
    )
);

-- STEP 4: Políticas para tabela TURMAS_PROF
-- Professores podem gerenciar suas próprias turmas
DROP POLICY IF EXISTS "Professores_podem_gerenciar_suas_turmas" ON turmas_prof;
CREATE POLICY "Professores_podem_gerenciar_suas_turmas" ON turmas_prof 
FOR ALL USING (auth.uid() = user_id);

-- Gestores podem ver e gerenciar todas as turmas
DROP POLICY IF EXISTS "Gestores_podem_ver_todas_turmas" ON turmas_prof;
CREATE POLICY "Gestores_podem_ver_todas_turmas" ON turmas_prof 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM perfis p 
        WHERE p.user_id = auth.uid() AND p.papel = 'manager'
    )
);

-- STEP 5: Políticas para tabela OCORRENCIAS
-- Professores podem inserir ocorrências
DROP POLICY IF EXISTS "Professores_podem_inserir_ocorrencias" ON ocorrencias;
CREATE POLICY "Professores_podem_inserir_ocorrencias" ON ocorrencias 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM perfis p 
        WHERE p.user_id = auth.uid() AND p.papel IN ('teacher', 'manager')
    )
);

-- Professores podem ver suas próprias ocorrências
DROP POLICY IF EXISTS "Professores_podem_ver_suas_ocorrencias" ON ocorrencias;
CREATE POLICY "Professores_podem_ver_suas_ocorrencias" ON ocorrencias 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM perfis p 
        WHERE p.user_id = auth.uid() 
        AND (p.email = professor_email OR p.papel = 'manager')
    )
);

-- Professores podem atualizar suas próprias ocorrências (apenas se pendente)
DROP POLICY IF EXISTS "Professores_podem_atualizar_suas_ocorrencias" ON ocorrencias;
CREATE POLICY "Professores_podem_atualizar_suas_ocorrencias" ON ocorrencias 
FOR UPDATE USING (
    status = 'pendente' AND EXISTS (
        SELECT 1 FROM perfis p 
        WHERE p.user_id = auth.uid() AND p.email = professor_email
    )
);

-- Gestores podem fazer tudo com ocorrências
DROP POLICY IF EXISTS "Gestores_podem_gerenciar_ocorrencias" ON ocorrencias;
CREATE POLICY "Gestores_podem_gerenciar_ocorrencias" ON ocorrencias 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM perfis p 
        WHERE p.user_id = auth.uid() AND p.papel = 'manager'
    )
);

-- STEP 6: Criar funções auxiliares para triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- STEP 7: Criar triggers para atualizar campos automaticamente
DROP TRIGGER IF EXISTS update_perfis_updated_at ON perfis;
CREATE TRIGGER update_perfis_updated_at 
BEFORE UPDATE ON perfis 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ocorrencias_updated_at ON ocorrencias;
CREATE TRIGGER update_ocorrencias_updated_at 
BEFORE UPDATE ON ocorrencias 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 8: Inserir dados de exemplo (OPCIONAL - para testes)
-- Descomente as linhas abaixo após criar usuários no Authentication

-- Exemplo de inserção de perfil de gestor (ALTERE O EMAIL)
-- INSERT INTO perfis (user_id, email, papel, nome)
-- SELECT id, email, 'manager', 'Administrador Sistema'
-- FROM auth.users
-- WHERE email = 'SEU-EMAIL-GESTOR@gmail.com'
-- ON CONFLICT (user_id) DO UPDATE SET 
-- papel = 'manager', nome = 'Administrador Sistema';

-- Exemplo de inserção de perfil de professor (ALTERE O EMAIL)
-- INSERT INTO perfis (user_id, email, papel, nome)
-- SELECT id, email, 'teacher', 'Professor Exemplo'
-- FROM auth.users
-- WHERE email = 'SEU-EMAIL-PROFESSOR@gmail.com'
-- ON CONFLICT (user_id) DO UPDATE SET 
-- papel = 'teacher', nome = 'Professor Exemplo';

-- STEP 9: Verificação final
SELECT 
    'Banco configurado com sucesso!' as status,
    'Tabelas: ' || count(*) || ' criadas' as tabelas
FROM information_schema.tables 
WHERE table_name IN ('perfis', 'turmas_prof', 'ocorrencias');

-- MENSAGEM FINAL
SELECT 'IMPORTANTE: Agora configure a autenticação no painel do Supabase!' as proximos_passos;