# 🎓 Sistema de Registro de Infrações Disciplinares Escolares

## 📋 Instruções de Configuração

### 1. CONFIGURAÇÃO NO SUPABASE

#### Passo 1: Acessar o Supabase
1. Acesse https://supabase.com
2. Faça login com sua conta
3. Acesse seu projeto existente ou crie um novo

#### Passo 2: Executar o Schema do Banco (OBRIGATÓRIO)
⚠️ **IMPORTANTE: Execute no Supabase EXATAMENTE nesta ordem**

1. **No Supabase, vá em "SQL Editor"**
2. **Cole e execute o arquivo `supabase_schema.sql`** (criação das tabelas)
3. **Depois, cole e execute o arquivo `supabase_seed_data.sql`** (dados de exemplo)

#### Passo 3: Configurar Autenticação
1. No Supabase, vá em **"Authentication" > "Settings"**
2. Em **"Auth Providers"**, certifique-se que **"Email"** está habilitado
3. Desabilite **"Confirm email"** para facilitar os testes
4. Em **"URL Configuration"**, adicione sua URL da aplicação

#### Passo 4: Verificar Políticas de Segurança
1. Vá em **"Authentication" > "Policies"**
2. As políticas RLS foram criadas automaticamente pelo script
3. Verifique se estão ativas nas tabelas principais

### 2. CREDENCIAIS CONFIGURADAS

O sistema já está configurado com suas credenciais:
```javascript
SUPABASE_URL = 'https://wzzryluesqxwyijievyj.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6enJ5bHVlc3F4d3lpamlldnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTk2NjYsImV4cCI6MjA3NDU3NTY2Nn0.aqT7PaKjj9QS547HEQ7EDyl8kvCIg4GrQJ4AXvjsG0k'
```

### 3. CRIAÇÃO DE USUÁRIOS PARA TESTE

#### No Supabase Auth:
1. Vá em **"Authentication" > "Users"**
2. Clique em **"Add user"**
3. Crie os seguintes usuários:

**Professor de teste:**
- Email: `professor@escola.com`
- Senha: `123456789`

**Gestor de teste:**
- Email: `gestor@escola.com`
- Senha: `123456789`

#### Vincular usuários aos perfis:
Após criar os usuários, execute no SQL Editor:

```sql
-- Inserir professor na tabela usuarios
INSERT INTO usuarios (id, nome, email, perfil) 
VALUES (
  (SELECT id FROM auth.users WHERE email = 'professor@escola.com'),
  'Maria Silva Santos',
  'professor@escola.com',
  'PROFESSOR'
);

-- Inserir gestor na tabela usuarios  
INSERT INTO usuarios (id, nome, email, perfil)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'gestor@escola.com'),
  'João Carlos Diretor', 
  'gestor@escola.com',
  'GESTOR'
);
```

### 4. TESTANDO O SISTEMA

#### Login como Professor:
- Email: `professor@escola.com`
- Senha: `123456789`
- Perfil: Professor

**Funcionalidades disponíveis:**
- ✅ Registrar infrações de alunos
- ✅ Ver histórico de suas infrações
- ✅ Estatísticas pessoais

#### Login como Gestor:
- Email: `gestor@escola.com`
- Senha: `123456789`
- Perfil: Gestor

**Funcionalidades disponíveis:**
- ✅ Dashboard completo com estatísticas
- ✅ Gerenciar todas as infrações
- ✅ Aplicar penalidades
- ✅ Filtros avançados
- ✅ Relatórios gerenciais

### 5. ESTRUTURA DO SISTEMA

#### Arquivos incluídos:
- `supabase_schema.sql` - Estrutura completa do banco
- `supabase_seed_data.sql` - Dados de exemplo
- `index.html` - Interface principal
- `style.css` - Estilos do sistema
- `app.js` - Lógica da aplicação

#### Funcionalidades principais:
1. **Sistema de Login** com diferentes perfis
2. **Para Professores**: Registro rápido de infrações
3. **Para Gestores**: Dashboard completo e gestão de penalidades
4. **Histórico completo** de infrações
5. **Estatísticas em tempo real**
6. **Interface responsiva** para mobile/tablet

### 6. TIPOS DE INFRAÇÕES CONFIGURADAS

#### Leves:
- Uso de celular em sala
- Conversar durante a aula
- Atraso para aula
- Levantar sem autorização
- Não fazer tarefa
- Sujar ambiente escolar

#### Graves:
- Desrespeito ao professor
- Descumprimento de ordens
- Dano ao patrimônio
- Saída sem autorização
- Linguagem imprópria
- Perturbação da ordem

#### Muito Graves:
- Agressão física
- Bullying/Cyberbullying
- Discriminação
- Porte de objetos perigosos
- Vandalismo
- Uso de substâncias ilícitas

### 7. PENALIDADES DISPONÍVEIS

- Advertência Verbal
- Advertência Escrita
- Suspensão de Recreio
- Comunicado aos Pais
- Suspensão 1, 2, 3 ou 5 dias
- Transferência Educativa
- Atividade Comunitária

### 8. SUPORTE E RESOLUÇÃO DE PROBLEMAS

#### Problemas comuns:

**Erro de login:**
- Verifique se executou os scripts SQL
- Confirme se criou os usuários no Supabase Auth
- Verifique se vinculou os usuários à tabela `usuarios`

**Dados não aparecem:**
- Execute o arquivo `supabase_seed_data.sql`
- Verifique as políticas RLS no Supabase

**Erro de conexão:**
- Confirme se suas credenciais estão corretas
- Verifique se o projeto Supabase está ativo

#### Logs úteis:
Abra o Console do navegador (F12) para ver mensagens de erro detalhadas.

---

## ✅ CHECKLIST FINAL

- [ ] Executei `supabase_schema.sql` no SQL Editor
- [ ] Executei `supabase_seed_data.sql` no SQL Editor  
- [ ] Criei usuários de teste no Supabase Auth
- [ ] Vinculei usuários à tabela `usuarios`
- [ ] Testei login como professor
- [ ] Testei login como gestor
- [ ] Sistema funcionando perfeitamente!

---

**🎯 Objetivo:** Facilitar o registro e gestão de infrações disciplinares, permitindo que professores registrem rapidamente ocorrências sem sair da sala de aula, e gestores tenham visão completa para aplicar penalidades adequadas.