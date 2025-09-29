// ===================================================================
// SISTEMA DE INFRAÇÕES DISCIPLINARES - INTEGRAÇÃO SUPABASE COMPLETA
// Arquivo: supabase-funcoes.js
// ===================================================================

// STEP 1: Configuração do Supabase (SUAS CREDENCIAIS REAIS)
const SUPABASE_URL = 'https://wzzryluesqxwyijievyj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6enJ5bHVlc3F4d3lpamlldnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTk2NjYsImV4cCI6MjA3NDU3NTY2Nn0.aqT7PaKjj9QS547HEQ7EDyl8kvCIg4GrQJ4AXvjsG0k';

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado global da aplicação
let currentUser = null;
let userRole = null;
let userEmail = null;

// ===================================================================
// STEP 2: FUNÇÕES DE AUTENTICAÇÃO
// ===================================================================

/**
 * Fazer login no sistema
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<boolean>} - Sucesso do login
 */
async function fazerLogin(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Erro no login:', error.message);
            alert('Erro no login: ' + error.message);
            return false;
        }

        console.log('Login realizado com sucesso!');
        await atualizarEstadoUsuario();
        return true;
    } catch (error) {
        console.error('Erro inesperado no login:', error);
        alert('Erro inesperado. Tente novamente.');
        return false;
    }
}

/**
 * Cadastrar novo usuário
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<boolean>} - Sucesso do cadastro
 */
async function cadastrarUsuario(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            console.error('Erro no cadastro:', error.message);
            alert('Erro no cadastro: ' + error.message);
            return false;
        }

        console.log('Cadastro realizado com sucesso!');
        alert('Cadastro realizado! Verifique seu email para confirmação.');
        return true;
    } catch (error) {
        console.error('Erro inesperado no cadastro:', error);
        alert('Erro inesperado. Tente novamente.');
        return false;
    }
}

/**
 * Fazer logout do sistema
 */
async function fazerLogout() {
    try {
        await supabase.auth.signOut();
        currentUser = null;
        userRole = null;
        userEmail = null;
        console.log('Logout realizado com sucesso!');
        mostrarTelaLogin();
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}

/**
 * Verificar estado atual de autenticação
 * @returns {Promise<boolean>} - Se usuário está logado
 */
async function verificarAutenticacao() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            currentUser = user;
            await atualizarEstadoUsuario();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        return false;
    }
}

/**
 * Atualizar estado do usuário logado
 */
async function atualizarEstadoUsuario() {
    if (!currentUser) return;

    try {
        const { data: userData, error } = await supabase
            .from('perfis')
            .select('papel, email, nome')
            .eq('user_id', currentUser.id)
            .single();

        if (error) {
            console.log('Usuário sem perfil, redirecionando para setup...');
            mostrarSetupPerfil();
            return;
        }

        userRole = userData.papel;
        userEmail = userData.email;
        console.log(`Usuário logado: ${userEmail} (${userRole})`);
        mostrarAplicacao();
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
    }
}

// ===================================================================
// STEP 3: FUNÇÕES DE PERFIL E USUÁRIOS
// ===================================================================

/**
 * Criar perfil para usuário após cadastro
 * @param {string} email - Email do usuário
 * @param {string} papel - Papel do usuário (teacher/manager)
 * @param {string} nome - Nome do usuário (opcional)
 * @returns {Promise<boolean>} - Sucesso da criação
 */
async function criarPerfil(email, papel, nome = '') {
    try {
        const { error } = await supabase
            .from('perfis')
            .insert({
                user_id: currentUser.id,
                email: email,
                papel: papel,
                nome: nome
            });

        if (error) {
            console.error('Erro ao criar perfil:', error.message);
            alert('Erro ao criar perfil: ' + error.message);
            return false;
        }

        console.log('Perfil criado com sucesso!');
        await atualizarEstadoUsuario();
        return true;
    } catch (error) {
        console.error('Erro inesperado ao criar perfil:', error);
        return false;
    }
}

/**
 * Buscar todos os perfis (apenas gestores)
 * @returns {Promise<Array>} - Lista de perfis
 */
async function buscarTodosPerfis() {
    if (userRole !== 'manager') {
        console.error('Acesso negado: apenas gestores podem buscar todos os perfis');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('perfis')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar perfis:', error.message);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Erro inesperado ao buscar perfis:', error);
        return [];
    }
}

/**
 * Criar usuário com perfil (apenas gestores)
 * @param {string} email - Email do novo usuário
 * @param {string} password - Senha temporária
 * @param {string} papel - Papel do usuário
 * @param {string} nome - Nome do usuário
 * @returns {Promise<boolean>} - Sucesso da criação
 */
async function criarUsuarioComPerfil(email, password, papel, nome = '') {
    if (userRole !== 'manager') {
        alert('Acesso negado: apenas gestores podem criar usuários');
        return false;
    }

    try {
        // Criar usuário na autenticação
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (authError) {
            console.error('Erro ao criar usuário:', authError.message);
            alert('Erro ao criar usuário: ' + authError.message);
            return false;
        }

        // Criar perfil no banco
        if (authData.user) {
            const { error: profileError } = await supabase
                .from('perfis')
                .insert({
                    user_id: authData.user.id,
                    email: email,
                    papel: papel,
                    nome: nome
                });

            if (profileError) {
                console.error('Erro ao criar perfil:', profileError.message);
                alert('Usuário criado mas erro ao definir perfil: ' + profileError.message);
                return false;
            }

            console.log('Usuário e perfil criados com sucesso!');
            alert('Usuário criado com sucesso!');
            return true;
        }
    } catch (error) {
        console.error('Erro inesperado ao criar usuário:', error);
        alert('Erro inesperado. Tente novamente.');
        return false;
    }
}

// ===================================================================
// STEP 4: FUNÇÕES DE OCORRÊNCIAS/INFRAÇÕES
// ===================================================================

/**
 * Registrar nova ocorrência/infração
 * @param {Object} dadosOcorrencia - Dados da ocorrência
 * @returns {Promise<boolean>} - Sucesso do registro
 */
async function registrarOcorrencia(dadosOcorrencia) {
    try {
        const dados = {
            professor_email: userEmail,
            professor_id: currentUser.id,
            turma: dadosOcorrencia.turma,
            aluno_nome: dadosOcorrencia.aluno_nome,
            tipo_ocorrencia: dadosOcorrencia.tipo_ocorrencia,
            descricao: dadosOcorrencia.descricao,
            data_ocorrencia: new Date().toISOString(),
            gravidade: dadosOcorrencia.gravidade || 'media',
            status: 'pendente'
        };

        const { error } = await supabase
            .from('ocorrencias')
            .insert(dados);

        if (error) {
            console.error('Erro ao registrar ocorrência:', error.message);
            alert('Erro ao registrar ocorrência: ' + error.message);
            return false;
        }

        console.log('Ocorrência registrada com sucesso!');
        alert('Ocorrência registrada com sucesso!');
        return true;
    } catch (error) {
        console.error('Erro inesperado ao registrar ocorrência:', error);
        alert('Erro inesperado. Tente novamente.');
        return false;
    }
}

/**
 * Buscar ocorrências do usuário ou todas (se gestor)
 * @param {Object} filtros - Filtros para busca (status, turma, etc.)
 * @returns {Promise<Array>} - Lista de ocorrências
 */
async function buscarOcorrencias(filtros = {}) {
    try {
        let query = supabase
            .from('ocorrencias')
            .select('*')
            .order('data_ocorrencia', { ascending: false });

        // Se for professor, mostrar apenas suas ocorrências
        if (userRole === 'teacher') {
            query = query.eq('professor_email', userEmail);
        }

        // Aplicar filtros
        if (filtros.status) {
            query = query.eq('status', filtros.status);
        }
        if (filtros.turma) {
            query = query.eq('turma', filtros.turma);
        }
        if (filtros.professor_email) {
            query = query.eq('professor_email', filtros.professor_email);
        }
        if (filtros.data_inicio) {
            query = query.gte('data_ocorrencia', filtros.data_inicio);
        }
        if (filtros.data_fim) {
            query = query.lte('data_ocorrencia', filtros.data_fim);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar ocorrências:', error.message);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Erro inesperado ao buscar ocorrências:', error);
        return [];
    }
}

/**
 * Resolver ocorrência (apenas gestores)
 * @param {number} ocorrenciaId - ID da ocorrência
 * @param {string} penalidade - Penalidade aplicada
 * @param {string} observacoes - Observações do gestor
 * @returns {Promise<boolean>} - Sucesso da resolução
 */
async function resolverOcorrencia(ocorrenciaId, penalidade, observacoes = '') {
    if (userRole !== 'manager') {
        alert('Acesso negado: apenas gestores podem resolver ocorrências');
        return false;
    }

    try {
        const { error } = await supabase
            .from('ocorrencias')
            .update({
                status: 'resolvida',
                penalidade: penalidade,
                observacoes_gestor: observacoes,
                data_resolucao: new Date().toISOString(),
                resolvido_por: currentUser.id
            })
            .eq('id', ocorrenciaId);

        if (error) {
            console.error('Erro ao resolver ocorrência:', error.message);
            alert('Erro ao resolver ocorrência: ' + error.message);
            return false;
        }

        console.log('Ocorrência resolvida com sucesso!');
        alert('Ocorrência resolvida com sucesso!');
        return true;
    } catch (error) {
        console.error('Erro inesperado ao resolver ocorrência:', error);
        return false;
    }
}

// ===================================================================
// STEP 5: FUNÇÕES DE TURMAS
// ===================================================================

/**
 * Buscar turmas do professor atual
 * @returns {Promise<Array>} - Lista de turmas
 */
async function buscarMinhasTurmas() {
    try {
        const { data, error } = await supabase
            .from('turmas_prof')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('turma');

        if (error) {
            console.error('Erro ao buscar turmas:', error.message);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Erro inesperado ao buscar turmas:', error);
        return [];
    }
}

/**
 * Vincular turma a professor (apenas gestores)
 * @param {string} professorEmail - Email do professor
 * @param {string} turma - Nome da turma
 * @returns {Promise<boolean>} - Sucesso da vinculação
 */
async function vincularTurmaProfessor(professorEmail, turma) {
    if (userRole !== 'manager') {
        alert('Acesso negado: apenas gestores podem vincular turmas');
        return false;
    }

    try {
        // Buscar professor pelo email
        const { data: professor, error: profError } = await supabase
            .from('perfis')
            .select('user_id')
            .eq('email', professorEmail)
            .eq('papel', 'teacher')
            .single();

        if (profError || !professor) {
            alert('Professor não encontrado ou email não é de um professor');
            return false;
        }

        // Vincular turma
        const { error } = await supabase
            .from('turmas_prof')
            .insert({
                user_id: professor.user_id,
                turma: turma
            });

        if (error) {
            console.error('Erro ao vincular turma:', error.message);
            alert('Erro ao vincular turma: ' + error.message);
            return false;
        }

        console.log('Turma vinculada com sucesso!');
        alert('Turma vinculada com sucesso!');
        return true;
    } catch (error) {
        console.error('Erro inesperado ao vincular turma:', error);
        return false;
    }
}

/**
 * Buscar todas as turmas (apenas gestores)
 * @returns {Promise<Array>} - Lista de todas as turmas
 */
async function buscarTodasTurmas() {
    if (userRole !== 'manager') {
        console.error('Acesso negado: apenas gestores podem buscar todas as turmas');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('turmas_prof')
            .select(`
                *,
                perfis!inner(email, nome)
            `)
            .order('turma');

        if (error) {
            console.error('Erro ao buscar turmas:', error.message);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Erro inesperado ao buscar turmas:', error);
        return [];
    }
}

// ===================================================================
// STEP 6: FUNÇÕES DE ESTATÍSTICAS (APENAS GESTORES)
// ===================================================================

/**
 * Buscar estatísticas gerais do sistema
 * @returns {Promise<Object>} - Objeto com estatísticas
 */
async function buscarEstatisticas() {
    if (userRole !== 'manager') {
        console.error('Acesso negado: apenas gestores podem ver estatísticas');
        return {};
    }

    try {
        // Ocorrências hoje
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const { count: ocorrenciasHoje } = await supabase
            .from('ocorrencias')
            .select('*', { count: 'exact', head: true })
            .gte('data_ocorrencia', hoje.toISOString());

        // Ocorrências pendentes
        const { count: ocorrenciasPendentes } = await supabase
            .from('ocorrencias')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pendente');

        // Ocorrências resolvidas
        const { count: ocorrenciasResolvidas } = await supabase
            .from('ocorrencias')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'resolvida');

        // Total de usuários
        const { count: totalUsuarios } = await supabase
            .from('perfis')
            .select('*', { count: 'exact', head: true });

        return {
            ocorrenciasHoje: ocorrenciasHoje || 0,
            ocorrenciasPendentes: ocorrenciasPendentes || 0,
            ocorrenciasResolvidas: ocorrenciasResolvidas || 0,
            totalUsuarios: totalUsuarios || 0
        };
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return {};
    }
}

// ===================================================================
// STEP 7: FUNÇÕES DE INTERFACE (NAVEGAÇÃO)
// ===================================================================

function mostrarTelaLogin() {
    // Implementar lógica para mostrar tela de login
    console.log('Mostrando tela de login...');
}

function mostrarSetupPerfil() {
    // Implementar lógica para mostrar setup de perfil
    console.log('Mostrando setup de perfil...');
}

function mostrarAplicacao() {
    // Implementar lógica para mostrar aplicação principal
    console.log('Mostrando aplicação principal...');
}

// ===================================================================
// STEP 8: INICIALIZAÇÃO DO SISTEMA
// ===================================================================

/**
 * Inicializar sistema quando página carregar
 */
async function inicializarSistema() {
    console.log('Inicializando sistema...');
    
    // Verificar se usuário já está logado
    const logado = await verificarAutenticacao();
    
    if (logado) {
        console.log('Usuário já logado, carregando aplicação...');
        mostrarAplicacao();
    } else {
        console.log('Usuário não logado, mostrando tela de login...');
        mostrarTelaLogin();
    }

    // Escutar mudanças no estado de autenticação
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Estado de autenticação mudou:', event);
        
        if (event === 'SIGNED_IN') {
            verificarAutenticacao();
        } else if (event === 'SIGNED_OUT') {
            mostrarTelaLogin();
        }
    });
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', inicializarSistema);

// ===================================================================
// EXPORTAR FUNÇÕES PARA USO GLOBAL
// ===================================================================

// Disponibilizar funções globalmente
window.SupabaseFuncoes = {
    // Autenticação
    fazerLogin,
    cadastrarUsuario,
    fazerLogout,
    verificarAutenticacao,
    
    // Perfis
    criarPerfil,
    buscarTodosPerfis,
    criarUsuarioComPerfil,
    
    // Ocorrências
    registrarOcorrencia,
    buscarOcorrencias,
    resolverOcorrencia,
    
    // Turmas
    buscarMinhasTurmas,
    vincularTurmaProfessor,
    buscarTodasTurmas,
    
    // Estatísticas
    buscarEstatisticas,
    
    // Estado
    getCurrentUser: () => currentUser,
    getUserRole: () => userRole,
    getUserEmail: () => userEmail
};

console.log('Funções Supabase carregadas com sucesso!');