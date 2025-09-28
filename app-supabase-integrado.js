// Configuração do Supabase com suas chaves existentes
const SUPABASE_URL = 'https://wzzryluesqxwyijievyj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6enJ5bHVlc3F4d3lpamlldnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTk2NjYsImV4cCI6MjA3NDU3NTY2Nn0.aqT7PaKjj9QS547HEQ7EDyl8kvCIg4GrQJ4AXvjsG0k'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
            showUserInterface(userData.papel, userData.email)
        } else {
            // Criar perfil básico se não existir
            await createUserProfile(user)
        }
    }
}

// Criar perfil de usuário
async function createUserProfile(user) {
    const { error } = await supabase.from('perfis').insert([{
        user_id: user.id,
        papel: 'teacher', // padrão como professor
        email: user.email || ''
    }])
    
    if (!error) {
        currentUser = user
        userRole = 'teacher'
        userEmail = user.email
        showUserInterface('teacher', user.email)
    }
}

// Event Listeners
function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin)
    
    // Ocorrência form (professor)
    document.getElementById('ocorrencia-form').addEventListener('submit', handleOcorrenciaSubmit)
    
    // Usuário form (gestor)
    document.getElementById('usuario-form').addEventListener('submit', handleUsuarioSubmit)
}

// Login
async function handleLogin(e) {
    e.preventDefault()
    showLoading(true)
    
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    })
    
    if (error) {
        showMessage(error.message, 'error')
        showLoading(false)
        return
    }
    
    // Buscar informações do usuário
    const { data: userData } = await supabase
        .from('perfis')
        .select('papel, email')
        .eq('user_id', data.user.id)
        .single()
    
    if (userData) {
        currentUser = data.user
        userRole = userData.papel
        userEmail = userData.email
        showUserInterface(userData.papel, userData.email)
        showMessage(`Bem-vindo!`, 'success')
    } else {
        // Criar perfil se não existir
        await createUserProfile(data.user)
    }
    
    showLoading(false)
}

// Logout
async function logout() {
    await supabase.auth.signOut()
    currentUser = null
    userRole = null
    userEmail = null
    showScreen('login-screen')
    showMessage('Logout realizado com sucesso', 'success')
}

// Mostrar interface do usuário
function showUserInterface(role, email) {
    if (role === 'manager') {
        showScreen('gestor-screen')
        document.getElementById('gestor-name').textContent = email
        loadGestorData()
    } else {
        showScreen('professor-screen')
        document.getElementById('professor-name').textContent = email
        loadProfessorData()
    }
}

// Carregar dados do professor
async function loadProfessorData() {
    await loadTurmasProfessor()
    await populateTurmasSelect()
}

// Carregar turmas do professor
async function loadTurmasProfessor() {
    const { data: turmas, error } = await supabase
        .from('turmas_prof')
        .select('turma')
        .eq('user_id', currentUser.id)
    
    if (error) {
        console.error('Erro ao carregar turmas:', error)
        return
    }
    
    const container = document.getElementById('turmas-professor')
    container.innerHTML = ''
    
    turmas.forEach(turmaObj => {
        const chip = document.createElement('div')
        chip.className = 'chip'
        chip.innerHTML = `
            ${turmaObj.turma}
            <button onclick="removerTurma('${turmaObj.turma}')" class="chip-remove">×</button>
        `
        container.appendChild(chip)
    })
    
    // Atualizar select de turmas
    await populateTurmasSelect()
}

// Popular select de turmas
async function populateTurmasSelect() {
    const { data: turmas } = await supabase
        .from('turmas_prof')
        .select('turma')
        .eq('user_id', currentUser.id)
    
    const select = document.getElementById('turma-select')
    select.innerHTML = '<option value="">Selecione uma turma</option>'
    
    turmas.forEach(turmaObj => {
        const option = document.createElement('option')
        option.value = turmaObj.turma
        option.textContent = turmaObj.turma
        select.appendChild(option)
    })
}

// Adicionar turma
async function adicionarTurma() {
    const input = document.getElementById('nova-turma')
    const turma = input.value.trim().toUpperCase()
    
    if (!turma) {
        showMessage('Digite o nome da turma', 'error')
        return
    }
    
    // Validar formato da turma (ex: 7°A, 8°B)
    const regex = /^[0-9]°[A-Z]$/
    if (!regex.test(turma)) {
        showMessage('Formato inválido. Use: 7°A, 8°B, etc.', 'error')
        return
    }
    
    showLoading(true)
    
    const { error } = await supabase.from('turmas_prof').insert([{
        user_id: currentUser.id,
        turma: turma
    }])
    
    if (error) {
        if (error.code === '23505') { // duplicate key
            showMessage('Turma já adicionada', 'error')
        } else {
            showMessage('Erro ao adicionar turma', 'error')
        }
    } else {
        showMessage('Turma adicionada com sucesso!', 'success')
        input.value = ''
        await loadTurmasProfessor()
    }
    
    showLoading(false)
}

// Remover turma
async function removerTurma(turma) {
    if (!confirm(`Remover turma ${turma}?`)) return
    
    showLoading(true)
    
    const { error } = await supabase
        .from('turmas_prof')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('turma', turma)
    
    if (error) {
        showMessage('Erro ao remover turma', 'error')
    } else {
        showMessage('Turma removida com sucesso!', 'success')
        await loadTurmasProfessor()
    }
    
    showLoading(false)
}

// Registrar ocorrência
async function handleOcorrenciaSubmit(e) {
    e.preventDefault()
    showLoading(true)
    
    const turma = document.getElementById('turma-select').value
    const aluno = document.getElementById('aluno-nome').value.trim()
    const tipo = document.getElementById('tipo-ocorrencia').value
    const descricao = document.getElementById('descricao').value.trim()
    
    if (!turma || !aluno || !tipo || !descricao) {
        showMessage('Preencha todos os campos', 'error')
        showLoading(false)
        return
    }
    
    const now = new Date()
    const dataHora = now.toISOString()
    
    const { error } = await supabase.from('ocorrencias').insert([{
        professor_email: userEmail,
        turma: turma,
        aluno_nome: aluno,
        tipo_ocorrencia: tipo,
        descricao: descricao,
        data_ocorrencia: dataHora,
        status: 'pendente'
    }])
    
    if (error) {
        showMessage('Erro ao registrar ocorrência', 'error')
        console.error(error)
    } else {
        showMessage('Ocorrência registrada com sucesso!', 'success')
        document.getElementById('ocorrencia-form').reset()
    }
    
    showLoading(false)
}

// Carregar dados do gestor
async function loadGestorData() {
    await loadOcorrencias()
    await loadStats()
    await loadFilterOptions()
    await loadUsuarios()
}

// Carregar ocorrências
async function loadOcorrencias() {
    showLoading(true)
    
    let query = supabase.from('ocorrencias').select('*').order('data_ocorrencia', { ascending: false })
    
    // Aplicar filtros
    const statusFilter = document.getElementById('filter-status').value
    const turmaFilter = document.getElementById('filter-turma').value
    const dataFilter = document.getElementById('filter-data').value
    
    if (statusFilter) {
        query = query.eq('status', statusFilter)
    }
    if (turmaFilter) {
        query = query.eq('turma', turmaFilter)
    }
    if (dataFilter) {
        query = query.gte('data_ocorrencia', dataFilter + 'T00:00:00')
        query = query.lt('data_ocorrencia', dataFilter + 'T23:59:59')
    }
    
    const { data: ocorrencias, error } = await query
    
    if (error) {
        showMessage('Erro ao carregar ocorrências', 'error')
        showLoading(false)
        return
    }
    
    renderOcorrencias(ocorrencias)
    showLoading(false)
}

// Renderizar ocorrências
function renderOcorrencias(ocorrencias) {
    const container = document.getElementById('ocorrencias-list')
    container.innerHTML = ''
    
    if (ocorrencias.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhuma ocorrência encontrada</p>'
        return
    }
    
    ocorrencias.forEach(ocorrencia => {
        const ocorrenciaCard = document.createElement('div')
        ocorrenciaCard.className = `infracao-card ${ocorrencia.status}`
        
        const statusClass = ocorrencia.status === 'pendente' ? 'status-pendente' : 'status-resolvida'
        const dataFormatada = new Date(ocorrencia.data_ocorrencia).toLocaleString('pt-BR')
        
        ocorrenciaCard.innerHTML = `
            <div class="infracao-header">
                <div class="infracao-info">
                    <h4>${ocorrencia.aluno_nome} (${ocorrencia.turma})</h4>
                    <span class="infracao-date">${dataFormatada}</span>
                </div>
                <span class="status-badge ${statusClass}">${ocorrencia.status}</span>
            </div>
            <div class="infracao-details">
                <p><strong>Professor:</strong> ${ocorrencia.professor_email}</p>
                <p><strong>Tipo:</strong> ${ocorrencia.tipo_ocorrencia}</p>
                <p><strong>Descrição:</strong> ${ocorrencia.descricao}</p>
                ${ocorrencia.penalidade ? `<p><strong>Penalidade:</strong> ${ocorrencia.penalidade}</p>` : ''}
                ${ocorrencia.observacoes_gestor ? `<p><strong>Observações do Gestor:</strong> ${ocorrencia.observacoes_gestor}</p>` : ''}
            </div>
            ${ocorrencia.status === 'pendente' ? `
                <div class="infracao-actions">
                    <select class="penalidade-select" id="penalidade-${ocorrencia.id}">
                        <option value="">Selecionar penalidade</option>
                        <option value="Advertência Verbal">Advertência Verbal</option>
                        <option value="Advertência Escrita">Advertência Escrita</option>
                        <option value="Suspensão de Recreio">Suspensão de Recreio</option>
                        <option value="Comunicado aos Pais">Comunicado aos Pais</option>
                        <option value="Suspensão de 1 dia">Suspensão de 1 dia</option>
                        <option value="Suspensão de 3 dias">Suspensão de 3 dias</option>
                    </select>
                    <input type="text" class="observacoes-input" id="observacoes-${ocorrencia.id}" placeholder="Observações do gestor (opcional)">
                    <button class="btn btn--primary btn--sm" onclick="aplicarPenalidade(${ocorrencia.id})">
                        Aplicar Penalidade
                    </button>
                </div>
            ` : ''}
        `
        
        container.appendChild(ocorrenciaCard)
    })
}

// Aplicar penalidade
async function aplicarPenalidade(ocorrenciaId) {
    const penalidade = document.getElementById(`penalidade-${ocorrenciaId}`).value
    const observacoes = document.getElementById(`observacoes-${ocorrenciaId}`).value
    
    if (!penalidade) {
        showMessage('Selecione uma penalidade', 'error')
        return
    }
    
    showLoading(true)
    
    const { error } = await supabase
        .from('ocorrencias')
        .update({ 
            status: 'resolvida', 
            penalidade: penalidade,
            observacoes_gestor: observacoes,
            data_resolucao: new Date().toISOString()
        })
        .eq('id', ocorrenciaId)
    
    if (error) {
        showMessage('Erro ao aplicar penalidade', 'error')
    } else {
        showMessage('Penalidade aplicada com sucesso!', 'success')
        await loadOcorrencias()
        await loadStats()
    }
    
    showLoading(false)
}

// Carregar estatísticas
async function loadStats() {
    const hoje = new Date().toISOString().split('T')[0]
    
    // Ocorrências de hoje
    const { count: hojeCont } = await supabase
        .from('ocorrencias')
        .select('*', { count: 'exact', head: true })
        .gte('data_ocorrencia', hoje + 'T00:00:00')
        .lt('data_ocorrencia', hoje + 'T23:59:59')
    
    // Ocorrências pendentes
    const { count: pendentesCont } = await supabase
        .from('ocorrencias')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente')
    
    // Ocorrências resolvidas
    const { count: resolvidasCont } = await supabase
        .from('ocorrencias')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolvida')
    
    document.getElementById('stats-hoje').textContent = hojeCont || 0
    document.getElementById('stats-pendentes').textContent = pendentesCont || 0
    document.getElementById('stats-resolvidas').textContent = resolvidasCont || 0
}

// Carregar opções de filtro
async function loadFilterOptions() {
    const { data: turmas } = await supabase
        .from('ocorrencias')
        .select('turma')
        .order('turma')
    
    const turmaFilter = document.getElementById('filter-turma')
    const uniqueTurmas = [...new Set(turmas.map(item => item.turma))]
    
    turmaFilter.innerHTML = '<option value="">Todas as Turmas</option>'
    uniqueTurmas.forEach(turma => {
        const option = document.createElement('option')
        option.value = turma
        option.textContent = turma
        turmaFilter.appendChild(option)
    })
}

// Gerenciar usuários
async function handleUsuarioSubmit(e) {
    e.preventDefault()
    showLoading(true)
    
    const email = document.getElementById('usuario-email').value
    const papel = document.getElementById('usuario-papel').value
    
    // Primeiro, verificar se o usuário existe na auth
    const { data: users } = await supabase.auth.admin.listUsers()
    const user = users.users.find(u => u.email === email)
    
    if (!user) {
        showMessage('Usuário não encontrado. O usuário deve se registrar primeiro.', 'error')
        showLoading(false)
        return
    }
    
    // Inserir ou atualizar perfil
    const { error } = await supabase.from('perfis').upsert([{
        user_id: user.id,
        email: email,
        papel: papel
    }])
    
    if (error) {
        showMessage('Erro ao gerenciar usuário', 'error')
    } else {
        showMessage('Usuário atualizado com sucesso!', 'success')
        document.getElementById('usuario-form').reset()
        await loadUsuarios()
    }
    
    showLoading(false)
}

// Carregar usuários
async function loadUsuarios() {
    const { data: usuarios, error } = await supabase
        .from('perfis')
        .select('*')
        .order('email')
    
    if (error) {
        console.error('Erro ao carregar usuários:', error)
        return
    }
    
    const container = document.getElementById('usuarios-list')
    container.innerHTML = ''
    
    if (usuarios.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum usuário encontrado</p>'
        return
    }
    
    usuarios.forEach(usuario => {
        const userCard = document.createElement('div')
        userCard.className = 'user-card'
        userCard.innerHTML = `
            <div class="user-info">
                <strong>${usuario.email}</strong>
                <span class="pill ${usuario.papel === 'manager' ? 'pill-manager' : 'pill-teacher'}">
                    ${usuario.papel === 'manager' ? 'Gestor' : 'Professor'}
                </span>
            </div>
        `
        container.appendChild(userCard)
    })
}

// Gerenciamento de abas
function showTab(tabName) {
    // Remover classe active de todas as abas
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'))
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'))
    
    // Ativar aba selecionada
    event.target.classList.add('active')
    document.getElementById(`tab-${tabName}`).classList.remove('hidden')
    
    // Carregar dados específicos da aba
    if (tabName === 'ocorrencias') {
        loadOcorrencias()
        loadStats()
    } else if (tabName === 'usuarios') {
        loadUsuarios()
    }
}

// Utility functions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active')
        screen.classList.add('hidden')
    })
    
    const targetScreen = document.getElementById(screenId)
    targetScreen.classList.remove('hidden')
    targetScreen.classList.add('active')
}

function showLoading(show) {
    const loading = document.getElementById('loading')
    if (show) {
        loading.classList.remove('hidden')
    } else {
        loading.classList.add('hidden')
    }
}

function showMessage(text, type = 'info') {
    const messageEl = document.getElementById('message')
    messageEl.textContent = text
    messageEl.className = `message ${type}`
    messageEl.classList.remove('hidden')
    
    setTimeout(() => {
        messageEl.classList.add('hidden')
    }, 4000)
}