// Configuração do Supabase com suas chaves reais
const SUPABASE_URL = 'https://wzzryluesqxwyijievyj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6enJ5bHVlc3F4d3lpamlldnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTk2NjYsImV4cCI6MjA3NDU3NTY2Nn0.aqT7PaKjj9QS547HEQ7EDyl8kvCIg4GrQJ4AXvjsG0k';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// Estado global da aplicação
let currentUser = null
let userRole = null
let userEmail = null

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkAuthState()
    setupEventListeners()
})

// Verificar estado de autenticação
async function checkAuthState() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
        // Buscar informações do usuário na tabela perfis
        const { data: userData } = await supabase
            .from('perfis')
            .select('papel, email')
            .eq('user_id', user.id)
            .single()
        
        if (userData) {
            currentUser = user
            userRole = userData.papel
            userEmail = userData.email
            
            showApp()
            loadUserData()
        } else {
            // Usuário não tem perfil criado, redirecionar para setup
            showSetup()
        }
    } else {
        showLogin()
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Login
    document.getElementById('loginBtn')?.addEventListener('click', handleLogin)
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout)
    
    // Setup do perfil
    document.getElementById('setupProfileBtn')?.addEventListener('click', handleSetupProfile)
    
    // Navegação entre abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab
            showTab(tabName)
        })
    })
    
    // Formulário de ocorrência
    document.getElementById('reportForm')?.addEventListener('submit', handleReportSubmit)
    
    // Gestão de perfis (apenas para managers)
    document.getElementById('manageProfileBtn')?.addEventListener('click', handleManageProfile)
    
    // Gestão de turmas (apenas para managers)
    document.getElementById('manageTurmaBtn')?.addEventListener('click', handleManageTurma)
    
    // Resolução de ocorrências (apenas para managers)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('resolve-btn')) {
            handleResolveOccurrence(e.target.dataset.id)
        }
    })
}

// Login
async function handleLogin() {
    const email = document.getElementById('email')?.value
    const password = document.getElementById('password')?.value
    
    if (!email || !password) {
        alert('Por favor, preencha email e senha')
        return
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    })
    
    if (error) {
        alert('Erro no login: ' + error.message)
    } else {
        checkAuthState()
    }
}

// Logout
async function handleLogout() {
    await supabase.auth.signOut()
    currentUser = null
    userRole = null
    userEmail = null
    showLogin()
}

// Setup do perfil
async function handleSetupProfile() {
    const email = document.getElementById('setupEmail')?.value
    const papel = document.getElementById('setupRole')?.value
    
    if (!email || !papel) {
        alert('Por favor, preencha todos os campos')
        return
    }
    
    const { error } = await supabase
        .from('perfis')
        .insert({
            user_id: currentUser.id,
            email: email,
            papel: papel
        })
    
    if (error) {
        alert('Erro ao criar perfil: ' + error.message)
    } else {
        checkAuthState()
    }
}

// Carregar dados do usuário
async function loadUserData() {
    // Atualizar interface com informações do usuário
    const userInfoEl = document.getElementById('userInfo')
    if (userInfoEl) {
        userInfoEl.textContent = `${userEmail} (${userRole})`
    }
    
    // Carregar turmas do professor
    if (userRole === 'teacher') {
        await loadTeacherTurmas()
    }
    
    // Carregar ocorrências
    await loadOccurrences()
    
    // Se for manager, carregar dados de gestão
    if (userRole === 'manager') {
        await loadManagementData()
    }
}

// Carregar turmas do professor
async function loadTeacherTurmas() {
    const { data: turmas } = await supabase
        .from('turmas_prof')
        .select('turma')
        .eq('user_id', currentUser.id)
    
    const turmaSelect = document.getElementById('turma')
    if (turmaSelect) {
        turmaSelect.innerHTML = '<option value="">Selecione uma turma</option>'
        
        if (turmas) {
            turmas.forEach(turma => {
                const option = document.createElement('option')
                option.value = turma.turma
                option.textContent = turma.turma
                turmaSelect.appendChild(option)
            })
        }
    }
}

// Carregar ocorrências
async function loadOccurrences() {
    let query = supabase
        .from('ocorrencias')
        .select('*')
        .order('data_ocorrencia', { ascending: false })
    
    // Se for professor, mostrar apenas suas ocorrências
    if (userRole === 'teacher') {
        query = query.eq('professor_email', userEmail)
    }
    
    const { data: ocorrencias } = await query
    
    displayOccurrences(ocorrencias || [])
}

// Exibir ocorrências na lista
function displayOccurrences(ocorrencias) {
    const container = document.getElementById('occurrencesList')
    if (!container) return
    
    if (ocorrencias.length === 0) {
        container.innerHTML = '<p class="no-data">Nenhuma ocorrência encontrada.</p>'
        return
    }
    
    container.innerHTML = ocorrencias.map(occ => `
        <div class="occurrence-card status-${occ.status}">
            <div class="occurrence-header">
                <span class="date">${new Date(occ.data_ocorrencia).toLocaleString('pt-BR')}</span>
                <span class="status ${occ.status}">${occ.status}</span>
            </div>
            <div class="occurrence-body">
                <h4>${occ.tipo_ocorrencia}</h4>
                <p><strong>Aluno:</strong> ${occ.aluno_nome}</p>
                <p><strong>Turma:</strong> ${occ.turma}</p>
                <p><strong>Professor:</strong> ${occ.professor_email}</p>
                <p><strong>Descrição:</strong> ${occ.descricao}</p>
                ${occ.penalidade ? `<p><strong>Penalidade:</strong> ${occ.penalidade}</p>` : ''}
                ${occ.observacoes_gestor ? `<p><strong>Observações do Gestor:</strong> ${occ.observacoes_gestor}</p>` : ''}
                ${userRole === 'manager' && occ.status === 'pendente' ? 
                    `<button class="resolve-btn" data-id="${occ.id}">Resolver</button>` : ''}
            </div>
        </div>
    `).join('')
}

// Submeter nova ocorrência
async function handleReportSubmit(e) {
    e.preventDefault()
    
    const formData = new FormData(e.target)
    const data = {
        professor_email: userEmail,
        turma: formData.get('turma'),
        aluno_nome: formData.get('aluno_nome'),
        tipo_ocorrencia: formData.get('tipo_ocorrencia'),
        descricao: formData.get('descricao'),
        data_ocorrencia: new Date().toISOString(),
        status: 'pendente'
    }
    
    const { error } = await supabase
        .from('ocorrencias')
        .insert(data)
    
    if (error) {
        alert('Erro ao registrar ocorrência: ' + error.message)
    } else {
        alert('Ocorrência registrada com sucesso!')
        e.target.reset()
        loadOccurrences()
    }
}

// Resolver ocorrência (apenas managers)
async function handleResolveOccurrence(occurrenceId) {
    const penalidade = prompt('Digite a penalidade aplicada:')
    const observacoes = prompt('Observações do gestor (opcional):')
    
    if (penalidade === null) return // Usuário cancelou
    
    const { error } = await supabase
        .from('ocorrencias')
        .update({
            status: 'resolvida',
            penalidade: penalidade,
            observacoes_gestor: observacoes || null,
            data_resolucao: new Date().toISOString()
        })
        .eq('id', occurrenceId)
    
    if (error) {
        alert('Erro ao resolver ocorrência: ' + error.message)
    } else {
        alert('Ocorrência resolvida com sucesso!')
        loadOccurrences()
    }
}

// Carregar dados de gestão (apenas para managers)
async function loadManagementData() {
    // Carregar todos os perfis
    const { data: perfis } = await supabase
        .from('perfis')
        .select('*')
        .order('email')
    
    displayPerfis(perfis || [])
    
    // Carregar todas as turmas
    const { data: turmas } = await supabase
        .from('turmas_prof')
        .select('*, perfis!inner(email)')
        .order('turma')
    
    displayTurmas(turmas || [])
}

// Exibir perfis (apenas para managers)
function displayPerfis(perfis) {
    const container = document.getElementById('perfisList')
    if (!container) return
    
    container.innerHTML = perfis.map(perfil => `
        <div class="perfil-card">
            <h4>${perfil.email}</h4>
            <p>Papel: ${perfil.papel}</p>
            <p>Criado em: ${new Date(perfil.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
    `).join('')
}

// Exibir turmas (apenas para managers)
function displayTurmas(turmas) {
    const container = document.getElementById('turmasList')
    if (!container) return
    
    container.innerHTML = turmas.map(turma => `
        <div class="turma-card">
            <h4>${turma.turma}</h4>
            <p>Professor: ${turma.perfis.email}</p>
            <p>Vinculado em: ${new Date(turma.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
    `).join('')
}

// Gerenciar perfil (apenas managers)
async function handleManageProfile() {
    const email = prompt('Email do usuário:')
    const papel = prompt('Papel (teacher/manager):')
    
    if (!email || !papel) return
    
    // Primeiro, verificar se o usuário existe na tabela auth.users
    const { data: users } = await supabase.auth.admin.listUsers()
    const user = users.users.find(u => u.email === email)
    
    if (!user) {
        alert('Usuário não encontrado. O usuário precisa se registrar primeiro.')
        return
    }
    
    const { error } = await supabase
        .from('perfis')
        .upsert({
            user_id: user.id,
            email: email,
            papel: papel
        })
    
    if (error) {
        alert('Erro ao gerenciar perfil: ' + error.message)
    } else {
        alert('Perfil atualizado com sucesso!')
        loadManagementData()
    }
}

// Gerenciar turma (apenas managers)
async function handleManageTurma() {
    const email = prompt('Email do professor:')
    const turma = prompt('Nome da turma:')
    
    if (!email || !turma) return
    
    // Buscar o user_id baseado no email
    const { data: perfil } = await supabase
        .from('perfis')
        .select('user_id')
        .eq('email', email)
        .eq('papel', 'teacher')
        .single()
    
    if (!perfil) {
        alert('Professor não encontrado.')
        return
    }
    
    const { error } = await supabase
        .from('turmas_prof')
        .insert({
            user_id: perfil.user_id,
            turma: turma
        })
    
    if (error) {
        alert('Erro ao vincular turma: ' + error.message)
    } else {
        alert('Turma vinculada com sucesso!')
        loadManagementData()
    }
}

// Mostrar tela de login
function showLogin() {
    const loginScreen = document.getElementById('loginScreen')
    const setupScreen = document.getElementById('setupScreen')
    const appScreen = document.getElementById('appScreen')
    
    if (loginScreen) loginScreen.style.display = 'block'
    if (setupScreen) setupScreen.style.display = 'none'
    if (appScreen) appScreen.style.display = 'none'
}

// Mostrar tela de setup
function showSetup() {
    const loginScreen = document.getElementById('loginScreen')
    const setupScreen = document.getElementById('setupScreen')
    const appScreen = document.getElementById('appScreen')
    
    if (loginScreen) loginScreen.style.display = 'none'
    if (setupScreen) setupScreen.style.display = 'block'
    if (appScreen) appScreen.style.display = 'none'
    
    // Preencher email do usuário logado
    const setupEmail = document.getElementById('setupEmail')
    if (setupEmail && currentUser) {
        setupEmail.value = currentUser.email || ''
    }
}

// Mostrar aplicação principal
function showApp() {
    const loginScreen = document.getElementById('loginScreen')
    const setupScreen = document.getElementById('setupScreen')
    const appScreen = document.getElementById('appScreen')
    
    if (loginScreen) loginScreen.style.display = 'none'
    if (setupScreen) setupScreen.style.display = 'none'
    if (appScreen) appScreen.style.display = 'block'
    
    // Mostrar/ocultar abas baseado no papel do usuário
    const managerTabs = document.querySelectorAll('.manager-only')
    managerTabs.forEach(tab => {
        tab.style.display = userRole === 'manager' ? 'block' : 'none'
    })
    
    // Mostrar primeira aba apropriada
    showTab(userRole === 'teacher' ? 'report' : 'occurrences')
}

// Mostrar aba específica
function showTab(tabName) {
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none'
    })
    
    // Remover classe ativa de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active')
    })
    
    // Mostrar aba selecionada
    const tabContent = document.getElementById(tabName + 'Tab')
    if (tabContent) {
        tabContent.style.display = 'block'
    }
    
    // Adicionar classe ativa ao botão
    const tabBtn = document.querySelector(`[data-tab="${tabName}"]`)
    if (tabBtn) {
        tabBtn.classList.add('active')
    }
}

// Configurar real-time subscriptions
function setupRealTimeSubscriptions() {
    // Escutar mudanças em ocorrências
    supabase
        .channel('public:ocorrencias')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'ocorrencias' }, 
            (payload) => {
                console.log('Mudança em ocorrências:', payload)
                loadOccurrences()
            }
        )
        .subscribe()
}

// Inicializar subscriptions quando o app carregar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(setupRealTimeSubscriptions, 1000)
})