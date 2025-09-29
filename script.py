# Vou criar primeiro a estrutura SQL para o Supabase
# Baseado nas pesquisas, vou criar um sistema completo e realista

sql_commands = """
-- ====================================================================
-- SISTEMA DE REGISTRO DE INFRAÇÕES DISCIPLINARES ESCOLARES
-- ESTRUTURA SQL PARA SUPABASE
-- ====================================================================

-- 1. TABELA DE PROFESSORES
-- Armazena informações dos professores/educadores
CREATE TABLE professores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    disciplina VARCHAR(50),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE ALUNOS
-- Armazena informações dos alunos
CREATE TABLE alunos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    turma VARCHAR(10) NOT NULL,
    data_nascimento DATE,
    telefone_responsavel VARCHAR(20),
    email_responsavel VARCHAR(100),
    nome_responsavel VARCHAR(100),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE TIPOS DE INFRAÇÕES
-- Define os tipos/categorias de infrações disciplinares
CREATE TABLE tipos_infracoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('LEVE', 'GRAVE', 'MUITO_GRAVE')),
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE TIPOS DE PENALIDADES
-- Define os tipos de penalidades que podem ser aplicadas
CREATE TABLE tipos_penalidades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    dias_suspensao INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE INFRAÇÕES
-- Registra as infrações cometidas pelos alunos
CREATE TABLE infracoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aluno_id UUID REFERENCES alunos(id) NOT NULL,
    professor_id UUID REFERENCES professores(id) NOT NULL,
    tipo_infracao_id UUID REFERENCES tipos_infracoes(id) NOT NULL,
    descricao TEXT NOT NULL,
    data_ocorrencia TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    local_ocorrencia VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_ANALISE', 'RESOLVIDA')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE PENALIDADES APLICADAS
-- Registra as penalidades aplicadas às infrações
CREATE TABLE penalidades_aplicadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    infracao_id UUID REFERENCES infracoes(id) NOT NULL,
    tipo_penalidade_id UUID REFERENCES tipos_penalidades(id) NOT NULL,
    data_aplicacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_inicio DATE,
    data_fim DATE,
    aplicada_por VARCHAR(100) NOT NULL,
    observacoes TEXT,
    cumprida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE USUÁRIOS PARA CONTROLE DE ACESSO
-- Vincula usuários do Supabase Auth com perfis específicos
CREATE TABLE usuarios (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('PROFESSOR', 'GESTOR', 'ADMIN')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- ====================================================================

CREATE INDEX idx_infracoes_aluno_id ON infracoes(aluno_id);
CREATE INDEX idx_infracoes_professor_id ON infracoes(professor_id);
CREATE INDEX idx_infracoes_status ON infracoes(status);
CREATE INDEX idx_infracoes_data ON infracoes(data_ocorrencia);
CREATE INDEX idx_alunos_turma ON alunos(turma);
CREATE INDEX idx_alunos_matricula ON alunos(matricula);

-- ====================================================================
-- POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
-- ====================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE infracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalidades_aplicadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política para professores - podem ver apenas seus próprios dados
CREATE POLICY "Professores podem ver seus dados" ON professores
    FOR SELECT USING (auth.uid() IN (SELECT id FROM usuarios WHERE perfil = 'PROFESSOR'));

-- Política para alunos - podem ser vistos por professores e gestores
CREATE POLICY "Ver alunos" ON alunos
    FOR SELECT USING (auth.uid() IN (SELECT id FROM usuarios WHERE perfil IN ('PROFESSOR', 'GESTOR', 'ADMIN')));

-- Política para infrações - professores veem suas infrações, gestores veem todas
CREATE POLICY "Ver infrações" ON infracoes
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM usuarios WHERE perfil IN ('GESTOR', 'ADMIN'))
        OR professor_id IN (SELECT id FROM professores WHERE id = auth.uid())
    );

-- Política para inserção de infrações - apenas professores
CREATE POLICY "Inserir infrações" ON infracoes
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM usuarios WHERE perfil = 'PROFESSOR'));

-- ====================================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMPS
-- ====================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas necessárias
CREATE TRIGGER update_professores_updated_at BEFORE UPDATE ON professores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON alunos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_infracoes_updated_at BEFORE UPDATE ON infracoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
"""

# Salvar os comandos SQL em um arquivo
with open('supabase_schema.sql', 'w', encoding='utf-8') as f:
    f.write(sql_commands)

print("✅ Arquivo SQL criado: supabase_schema.sql")
print("\n📋 Estrutura do banco de dados:")
print("- 7 tabelas principais")
print("- Índices para performance")
print("- Políticas de segurança (RLS)")
print("- Triggers para timestamps automáticos")