# 🚀 GUIA RÁPIDO DE INSTALAÇÃO

## ⚡ 5 PASSOS SIMPLES PARA FUNCIONAR

### 🔧 PASSO 1: SUPABASE - SQL EDITOR
1. Acesse https://supabase.com
2. Entre no seu projeto 
3. Vá em **"SQL Editor"**
4. **EXECUTE EM ORDEM:**

```sql
-- 1º: Copie e execute todo o arquivo: supabase_schema.sql
-- 2º: Copie e execute todo o arquivo: supabase_seed_data.sql  
```

### 👥 PASSO 2: SUPABASE - CRIAR USUÁRIOS
1. Vá em **"Authentication" → "Users"**
2. Clique **"Add user"**
3. **Crie estes 2 usuários:**

```
📧 Email: professor@escola.com
🔑 Senha: 123456789

📧 Email: gestor@escola.com  
🔑 Senha: 123456789
```

### ⚙️ PASSO 3: SUPABASE - CONFIGURAR AUTH
1. Vá em **"Authentication" → "Settings"**
2. **Desabilite** "Confirm email"
3. Mantenha "Email" habilitado

### 🔗 PASSO 4: SUPABASE - VINCULAR USUÁRIOS
1. Volte ao **"SQL Editor"**
2. **Execute:** arquivo `supabase_usuarios_teste.sql`

### 🎉 PASSO 5: TESTAR O SISTEMA
1. **Abra a aplicação web**
2. **Teste os logins:**

```
👨‍🏫 PROFESSOR:
   Email: professor@escola.com
   Senha: 123456789
   
👨‍💼 GESTOR:  
   Email: gestor@escola.com
   Senha: 123456789
```

---

## ✅ VERIFICAR SE FUNCIONOU

### Como Professor:
- ✅ Consegue ver formulário de infrações
- ✅ Lista de alunos aparece no dropdown
- ✅ Pode registrar nova infração
- ✅ Vê histórico de suas infrações

### Como Gestor:
- ✅ Dashboard com estatísticas
- ✅ Lista de infrações pendentes  
- ✅ Pode aplicar penalidades
- ✅ Acesso a relatórios completos

---

## 🔧 ARQUIVOS IMPORTANTES

```
📁 EXECUÇÃO NO SUPABASE:
   📄 supabase_schema.sql (1º - criar tabelas)
   📄 supabase_seed_data.sql (2º - dados exemplo)  
   📄 supabase_usuarios_teste.sql (4º - usuários teste)

📁 APLICAÇÃO WEB:
   🌐 index.html (interface principal)
   🎨 style.css (estilos visuais)
   ⚙️ app.js (lógica do sistema)
```

---

## 🆘 PROBLEMAS COMUNS

**❌ "Não consigo fazer login"**
- Verifique se executou TODOS os scripts SQL
- Confirme se criou os usuários no Supabase Auth
- Execute o script de usuários de teste

**❌ "Dados não aparecem"**  
- Execute o arquivo `supabase_seed_data.sql`
- Verifique no Supabase se as tabelas foram criadas

**❌ "Erro de conexão"**
- Suas credenciais já estão configuradas no sistema
- Verifique se o projeto Supabase está ativo

---

## 🎯 RESUMO DO SISTEMA

### 👨‍🏫 PARA PROFESSORES:
- **Registrar infrações rapidamente** sem sair da sala
- Escolher aluno, tipo de infração e descrever o ocorrido
- Ver histórico das infrações que registrou
- Estatísticas pessoais de infrações

### 👨‍💼 PARA GESTORES:
- **Dashboard completo** com visão geral
- **Aplicar penalidades** (advertências, suspensões, etc.)
- **Filtros avançados** por data, turma, professor
- **Relatórios detalhados** para tomada de decisão
- **Gestão completa** de todas as infrações da escola

### 📊 TIPOS DE INFRAÇÕES:
- **LEVES:** Celular, conversa, atraso, etc.
- **GRAVES:** Desrespeito, danos, desobediência  
- **MUITO GRAVES:** Agressão, bullying, discriminação

### ⚖️ PENALIDADES DISPONÍVEIS:
- Advertência Verbal/Escrita
- Suspensão de Recreio
- Comunicado aos Pais  
- Suspensões (1, 2, 3, 5 dias)
- Transferência Educativa

---

## 🏆 BENEFÍCIOS DO SISTEMA

✅ **EFICIÊNCIA:** Professor registra em 30 segundos
✅ **CENTRALIZAÇÃO:** Tudo em um local único  
✅ **AGILIDADE:** Gestores decidem rapidamente
✅ **TRANSPARÊNCIA:** Histórico completo de ações
✅ **SEM PAPEL:** Elimina burocracia manual
✅ **RESPONSIVO:** Funciona em qualquer dispositivo

---

**🎓 PRONTO! SEU SISTEMA DE INFRAÇÕES ESTÁ FUNCIONANDO!**