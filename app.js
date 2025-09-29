// Configuração do Supabase com suas chaves reais
const SUPABASE_URL = 'https://wzzryluesqxwyijievyj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6enJ5bHVlc3F4d3lpamlldnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTk2NjYsImV4cCI6MjA3NDU3NTY2Nn0.aqT7PaKjj9QS547HEQ7EDyl8kvCIg4GrQJ4AXvjsG0k';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// Estado global da aplicação
let currentUser = null
let userRole = null
let userEmail = null

// Elementos das telas
const loginScreen = document.getElementById('loginScreen')
const signupScreen = document.getElementById('signupScreen')
const setupScreen = document.getElementById('setupScreen')
const appScreen = document.getElementById('appScreen')

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
            currentUser = user
            showSetup()
        }
    } else {
        showLogin()
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Navegação entre login e cadastro
    document.getElementById('showSignupLink')?.addEventListener('click', (e) => {
        e.preventDefault()
        showSignup()
    })
    
    document.getElementById('showLoginLink')?.addEventListener('click', (e) => {
        e.preventDefault()
        showLogin()
    })
    
    // Login
    document.getElementById('loginBtn')?.addEventListener('click', handleLogin)
    
    // Cadastro
    document.getElementById('signupBtn')?.addEventListener('click', handleSignup)
    
    // Logout
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
    
    // Criar usuário (apenas para managers)
    document.getElementById('createUserBtn')?.addEventListener('click', handleCreateUser)
    
    // Atualizar usuário (apenas para managers)
    document.getElementById('updateUserBtn')?.addEventListener('click', handleUpdateUser)
    
    // Gestão de turmas (apenas para managers)
    document.getElementById('manageTurmaBtn')?.addEventListener('click', handleManageTurma)
    
    // Filtros
    document.getElementById('filterBtn')?.addEventListener('click', () => loadOccurrences())
    document.getElementById('filterAllBtn')?.addEventListener('click', () => loadAllOccurrences())
    
    // Relatórios
    document.getElementById('generateReportBtn')?.addEventListener('click', generateReport)
    
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

// Cadastro
async function handleSignup() {
    const email = document.getElementById('signupEmail')?.value
    const password = document.getElementById('signupPassword')?.value
    const confirmPassword = document.getElementById('signupConfirm')?.value
    
    if (!email || !password || !confirmPassword) {
        alert('Por favor, preencha todos os campos')
        return
    }
    
    if (password !== confirmPassword) {
        alert('As senhas não coincidem')
        return
    }
    
    if (password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres')
        return
    }
    
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    })
    
    if (error) {
        alert('Erro no cadastro: ' + error.message)
    } else {
        alert('Cadastro realizado com sucesso! Verifique seu email para confirmação.')
        showLogin()
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

// Criar usuário (apenas managers)
async function handleCreateUser() {
    if (userRole !== 'manager') {
        alert('Apenas gestores podem criar usuários')
        return
    }
    
    const email = document.getElementById('newUserEmail')?.value
    const password = document.getElementById('newUserPassword')?.value
    const papel = document.getElementById('newUserRole')?.value
    
    if (!email || !password || !papel) {
        alert('Por favor, preencha todos os campos')
        return
    }
    
    // Criar usuário na autenticação
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password
    })
    
    if (authError) {
        alert('Erro ao criar usuário: ' + authError.message)
        return
    }
    
    // Criar perfil no banco
    if (authData.user) {
        const { error: profileError } = await supabase
            .from('perfis')
            .insert({
                user_id: authData.user.id,
                email: email,
                papel: papel
            })
        
        if (profileError) {
            alert('Usuário criado mas erro ao definir perfil: ' + profileError.message)
        } else {
            alert('Usuário criado com sucesso!')
            document.getElementById('createUserForm').reset()
            loadManagementData()
        }
    }
}

// Atualizar usuário (apenas managers)
async function handleUpdateUser() {
    if (userRole !== 'manager') {
        alert('Apenas gestores podem atualizar usuários')
        return
    }
    
    const email = document.getElementById('updateUserEmail')?.value
    const papel = document.getElementById('updateUserRole')?.value
    
    if (!email || !papel) {
        alert('Por favor, preencha todos os campos')
        return
    }
    
    const { error } = await supabase
        .from('perfis')
        .update({ papel: papel })
        .eq('email', email)
    
    if (error) {
        alert('Erro ao atualizar usuário: ' + error.message)
    } else {
        alert('Usuário atualizado com sucesso!')
        document.getElementById('updateUserForm').reset()
        loadManagementData()
    }
}

// Carregar dados do usuário
async function loadUserData() {
    // Atualizar interface com informações do usuário
    const userInfoEl = document.getElementById('userInfo')
    if (userInfoEl) {
        userInfoEl.textContent = `${userEmail} (${userRole === 'manager' ? 'Gestor' : 'Professor'})`
    }
    
    // Carregar turmas do professor
    if (userRole === 'teacher') {
        await loadTeacherTurmas()
    }
    
    // Carregar ocorrências
    await loadOccurrences()
    
    // Se for manager, carregar dados de gestão
    if (userRole === 'manager') {
        await loadAllOccurrences()
        await loadManagementData()
        await updateStats()
    }
}

// Carregar turmas do professor
async function loadTeacherTurmas() {
    const { data: turmas } = await supabase
        .from('turmas_prof')
        .select('turma')
        .eq('user_id', currentUser.id)
    
    const turmaSelects = ['turma', 'turmaFilter']
    
    turmaSelects.forEach(selectId => {
        const turmaSelect = document.getElementById(selectId)
        if (turmaSelect) {
            const currentValue = turmaSelect.value
            turmaSelect.innerHTML = selectId === 'turmaFilter' ? 
                '<option value="">Todas as Turmas</option>' :
                '<option value="">Selecione uma turma</option>'
            
            if (turmas) {
                turmas.forEach(turma => {
                    const option = document.createElement('option')
                    option.value = turma.turma
                    option.textContent = turma.turma
                    turmaSelect.appendChild(option)
                })
            }
            
            if (currentValue) turmaSelect.value = currentValue
        }
    })
}

// Carregar ocorrências do usuário
async function loadOccurrences() {
    let query = supabase
        .from('ocorrencias')
        .select('*')
        .order('data_ocorrencia', { ascending: false })
    
    // Se for professor, mostrar apenas suas ocorrências
    if (userRole === 'teacher') {
        query = query.eq('professor_email', userEmail)
    }
    
    // Aplicar filtros
    const statusFilter = document.getElementById('statusFilter')?.value
    const turmaFilter = document.getElementById('turmaFilter')?.value
    
    if (statusFilter) query = query.eq('status', statusFilter)
    if (turmaFilter) query = query.eq('turma', turmaFilter)
    
    const { data: ocorrencias } = await query
    
    displayOccurrences(ocorrencias || [], 'occurrencesList')
}

// Carregar todas as ocorrências (apenas managers)
async function loadAllOccurrences() {
    if (userRole !== 'manager') return
    
    let query = supabase
        .from('ocorrencias')
        .select('*')
        .order('data_ocorrencia', { ascending: false })
    
    // Aplicar filtros
    const statusFilter = document.getElementById('allStatusFilter')?.value
    const turmaFilter = document.getElementById('allTurmaFilter')?.value
    const professorFilter = document.getElementById('professorFilter')?.value
    
    if (statusFilter) query = query.eq('status', statusFilter)
    if (turmaFilter) query = query.eq('turma', turmaFilter)
    if (professorFilter) query = query.eq('professor_email', professorFilter)
    
    const { data: ocorrencias } = await query
    
    displayOccurrences(ocorrencias || [], 'allOccurrencesList', true)
}

// Exibir ocorrências na lista
function displayOccurrences(ocorrencias, containerId, showResolveButton = false) {
    const container = document.getElementById(containerId)
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
                ${showResolveButton && userRole === 'manager' && occ.status === 'pendente' ? 
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
        if (userRole === 'manager') {
            loadAllOccurrences()
            updateStats()
        }
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
        loadAllOccurrences()
        updateStats()
    }
}

// Carregar dados de gestão (apenas para managers)
async function loadManagementData() {
    if (userRole !== 'manager') return
    
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
    
    // Preencher filtro de professores
    const professorFilter = document.getElementById('professorFilter')
    if (professorFilter && perfis) {
        professorFilter.innerHTML = '<option value="">Todos os Professores</option>'
        perfis.filter(p => p.papel === 'teacher').forEach(professor => {
            const option = document.createElement('option')
            option.value = professor.email
            option.textContent = professor.email
            professorFilter.appendChild(option)
        })
    }
}

// Exibir perfis (apenas para managers)
function displayPerfis(perfis) {
    const container = document.getElementById('perfisList')
    if (!container) return
    
    container.innerHTML = `
        <h3>Usuários do Sistema (${perfis.length})</h3>
        ${perfis.map(perfil => `
            <div class="perfil-card">
                <h4>${perfil.email}</h4>
                <p><strong>Papel:</strong> ${perfil.papel === 'manager' ? 'Gestor' : 'Professor'}</p>
                <p><strong>Criado em:</strong> ${new Date(perfil.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
        `).join('')}
    `
}

// Exibir turmas (apenas para managers)
function displayTurmas(turmas) {
    const container = document.getElementById('turmasList')
    if (!container) return
    
    container.innerHTML = `
        <h3>Turmas Vinculadas (${turmas.length})</h3>
        ${turmas.map(turma => `
            <div class="turma-card">
                <h4>${turma.turma}</h4>
                <p><strong>Professor:</strong> ${turma.perfis.email}</p>
                <p><strong>Vinculado em:</strong> ${new Date(turma.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
        `).join('')}
    `
}

// Gerenciar turma (apenas managers)
async function handleManageTurma() {
    if (userRole !== 'manager') {
        alert('Apenas gestores podem gerenciar turmas')
        return
    }
    
    const email = document.getElementById('professorEmail')?.value
    const turma = document.getElementById('turmaNome')?.value
    
    if (!email || !turma) {
        alert('Por favor, preencha todos os campos')
        return
    }
    
    // Buscar o user_id baseado no email
    const { data: perfil } = await supabase
        .from('perfis')
        .select('user_id')
        .eq('email', email)
        .eq('papel', 'teacher')
        .single()
    
    if (!perfil) {
        alert('Professor não encontrado ou email não é de um professor.')
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
        document.getElementById('turmaForm').reset()
        loadManagementData()
    }
}

// Atualizar estatísticas (apenas managers)
async function updateStats() {
    if (userRole !== 'manager') return
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Ocorrências hoje
    const { count: todayCount } = await supabase
        .from('ocorrencias')
        .select('*', { count: 'exact', head: true })
        .gte('data_ocorrencia', today.toISOString())
    
    // Pendentes
    const { count: pendingCount } = await supabase
        .from('ocorrencias')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente')
    
    // Resolvidas
    const { count: resolvedCount } = await supabase
        .from('ocorrencias')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolvida')
    
    // Usuários ativos
    const { count: usersCount } = await supabase
        .from('perfis')
        .select('*', { count: 'exact', head: true })
    
    // Atualizar interface
    document.getElementById('todayCount').textContent = todayCount || 0
    document.getElementById('pendingCount').textContent = pendingCount || 0
    document.getElementById('resolvedCount').textContent = resolvedCount || 0
    document.getElementById('totalUsersCount').textContent = usersCount || 0
}

// Gerar relatório
async function generateReport() {
    if (userRole !== 'manager') return
    
    const startDate = document.getElementById('reportStartDate')?.value
    const endDate = document.getElementById('reportEndDate')?.value
    
    if (!startDate || !endDate) {
        alert('Por favor, selecione as datas para o relatório')
        return
    }
    
    let query = supabase
        .from('ocorrencias')
        .select('*')
        .gte('data_ocorrencia', startDate)
        .lte('data_ocorrencia', endDate + 'T23:59:59')
        .order('data_ocorrencia', { ascending: false })
    
    const { data: reportData } = await query
    
    const reportResults = document.getElementById('reportResults')
    if (reportResults && reportData) {
        const totalOcorrencias = reportData.length
        const pendentes = reportData.filter(o => o.status === 'pendente').length
        const resolvidas = reportData.filter(o => o.status === 'resolvida').length
        
        const tiposOcorrencia = {}
        reportData.forEach(o => {
            tiposOcorrencia[o.tipo_ocorrencia] = (tiposOcorrencia[o.tipo_ocorrencia] || 0) + 1
        })
        
        reportResults.innerHTML = `
            <h3>Relatório do período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}</h3>
            <div class="report-summary">
                <p><strong>Total de ocorrências:</strong> ${totalOcorrencias}</p>
                <p><strong>Pendentes:</strong> ${pendentes}</p>
                <p><strong>Resolvidas:</strong> ${resolvidas}</p>
            </div>
            <h4>Tipos de ocorrência mais comuns:</h4>
            <ul>
                ${Object.entries(tiposOcorrencia)
                    .sort(([,a], [,b]) => b - a)
                    .map(([tipo, count]) => `<li>${tipo}: ${count}</li>`)
                    .join('')}
            </ul>
        `
    }
}

// Mostrar tela de login
function showLogin() {
    loginScreen.style.display = 'block'
    signupScreen.style.display = 'none'
    setupScreen.style.display = 'none'
    appScreen.style.display = 'none'
}

// Mostrar tela de cadastro
function showSignup() {
    loginScreen.style.display = 'none'
    signupScreen.style.display = 'block'
    setupScreen.style.display = 'none'
    appScreen.style.display = 'none'
}

// Mostrar tela de setup
function showSetup() {
    loginScreen.style.display = 'none'
    signupScreen.style.display = 'none'
    setupScreen.style.display = 'block'
    appScreen.style.display = 'none'
    
    // Preencher email do usuário logado
    const setupEmail = document.getElementById('setupEmail')
    if (setupEmail && currentUser) {
        setupEmail.value = currentUser.email || ''
    }
}

// Mostrar aplicação principal
function showApp() {
    loginScreen.style.display = 'none'
    signupScreen.style.display = 'none'
    setupScreen.style.display = 'none'
    appScreen.style.display = 'block'
    
    // Mostrar/ocultar elementos baseado no papel do usuário
    const managerElements = document.querySelectorAll('.manager-only')
    managerElements.forEach(el => {
        el.style.display = userRole === 'manager' ? 'block' : 'none'
    })
    
    // Mostrar primeira aba apropriada
    showTab(userRole === 'teacher' ? 'report' : 'management')
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
                if (userRole === 'manager') {
                    loadAllOccurrences()
                    updateStats()
                }
            }
        )
        .subscribe()
}

// Inicializar subscriptions quando o app carregar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(setupRealTimeSubscriptions, 2000)
})