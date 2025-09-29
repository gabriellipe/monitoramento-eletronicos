// Estado da aplicação
let currentUser = null;
let currentUserType = null;
let currentInfractionForPenalty = null;

// Dados de exemplo
const TIPOS_INFRACOES = [
    {id: 1, nome: "Uso de celular em sala", categoria: "LEVE"},
    {id: 2, nome: "Conversar durante a aula", categoria: "LEVE"},
    {id: 3, nome: "Atraso para aula", categoria: "LEVE"},
    {id: 4, nome: "Desrespeito ao professor", categoria: "GRAVE"},
    {id: 5, nome: "Dano ao patrimônio", categoria: "GRAVE"},
    {id: 6, nome: "Agressão física", categoria: "MUITO_GRAVE"},
    {id: 7, nome: "Bullying/Cyberbullying", categoria: "MUITO_GRAVE"}
];

const TIPOS_PENALIDADES = [
    {id: 1, nome: "Advertência Verbal", dias_suspensao: 0},
    {id: 2, nome: "Advertência Escrita", dias_suspensao: 0},
    {id: 3, nome: "Suspensão de Recreio", dias_suspensao: 0},
    {id: 4, nome: "Comunicado aos Pais", dias_suspensao: 0},
    {id: 5, nome: "Suspensão 1 dia", dias_suspensao: 1},
    {id: 6, nome: "Suspensão 3 dias", dias_suspensao: 3},
    {id: 7, nome: "Suspensão 5 dias", dias_suspensao: 5}
];

const ALUNOS_EXEMPLO = [
    {matricula: "2024001", nome: "Lucas Gabriel da Silva", turma: "7ºA"},
    {matricula: "2024002", nome: "Isabella Santos Oliveira", turma: "7ºA"},
    {matricula: "2024003", nome: "Enzo Miguel Costa", turma: "7ºA"},
    {matricula: "2024004", nome: "Sophia Vitória Lima", turma: "7ºA"},
    {matricula: "2024005", nome: "Arthur Henrique Souza", turma: "7ºA"},
    {matricula: "2024006", nome: "Helena Maria Pereira", turma: "7ºB"},
    {matricula: "2024007", nome: "Miguel Rafael Rocha", turma: "7ºB"},
    {matricula: "2024008", nome: "Alice Gabriela Alves", turma: "7ºB"},
    {matricula: "2024011", nome: "Gustavo Henrique Martins", turma: "8ºA"},
    {matricula: "2024012", nome: "Valentina Beatriz Santos", turma: "8ºA"},
    {matricula: "2024021", nome: "Pedro Lucas Ferreira", turma: "9ºA"},
    {matricula: "2024022", nome: "Lara Vitória Barbosa", turma: "9ºA"}
];

// Simulação de dados
let simulatedInfractions = [];
const simulatedUsers = [
    { email: 'professor@escola.com', password: '123456', name: 'Maria Silva Santos', type: 'professor' },
    { email: 'gestor@escola.com', password: '123456', name: 'João Administrador', type: 'gestor' }
];

// Utilidades
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('hidden');
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showScreen(screenId) {
    // Esconder todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.classList.add('hidden');
    });
    
    // Mostrar tela alvo
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.classList.add('active');
    }
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data inválida';
    }
}

function formatDateOnly(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    } catch (error) {
        return 'Data inválida';
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Garantir que o loading seja escondido imediatamente
    hideLoading();
    
    // Criar dados de exemplo
    createSampleData();
    
    // Verificar se há usuário logado
    checkCurrentUser();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Preencher dropdowns
    populateDropdowns();
    
    console.log('Aplicação inicializada');
});

function checkCurrentUser() {
    try {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            currentUser = JSON.parse(userData);
            currentUserType = currentUser.type;
            
            if (currentUserType === 'professor') {
                showProfessorDashboard();
            } else if (currentUserType === 'gestor') {
                showGestorDashboard();
            }
        } else {
            showScreen('login-screen');
        }
    } catch (error) {
        console.error('Erro ao verificar usuário atual:', error);
        showScreen('login-screen');
    }
}

function setupEventListeners() {
    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout buttons
    const logoutBtn = document.getElementById('logout-btn');
    const logoutGestorBtn = document.getElementById('logout-gestor-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    if (logoutGestorBtn) {
        logoutGestorBtn.addEventListener('click', handleLogout);
    }
    
    // Formulário de infração
    const infractionForm = document.getElementById('infraction-form');
    if (infractionForm) {
        infractionForm.addEventListener('submit', handleInfractionSubmit);
    }
    
    // Modal de penalidade
    const penaltyForm = document.getElementById('penalty-form');
    if (penaltyForm) {
        penaltyForm.addEventListener('submit', handlePenaltySubmit);
    }
    
    // Botões de fechar modal
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Navegação
    const viewHistoryBtn = document.getElementById('view-history-btn');
    const backToDashboardBtn = document.getElementById('back-to-dashboard');
    
    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', () => {
            loadHistory();
            showScreen('history-screen');
        });
    }
    
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => {
            showScreen('gestor-screen');
        });
    }
    
    // Filtros
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    // Tipo de penalidade change
    const penaltyType = document.getElementById('penalty-type');
    if (penaltyType) {
        penaltyType.addEventListener('change', handlePenaltyTypeChange);
    }
}

function populateDropdowns() {
    // Alunos
    const studentSelect = document.getElementById('student');
    if (studentSelect) {
        studentSelect.innerHTML = '<option value="">Selecione o aluno</option>';
        ALUNOS_EXEMPLO.forEach(aluno => {
            const option = document.createElement('option');
            option.value = aluno.matricula;
            option.textContent = `${aluno.nome} (${aluno.turma})`;
            studentSelect.appendChild(option);
        });
    }
    
    // Tipos de infração
    const infractionTypeSelect = document.getElementById('infraction-type');
    if (infractionTypeSelect) {
        infractionTypeSelect.innerHTML = '<option value="">Selecione o tipo</option>';
        TIPOS_INFRACOES.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id;
            option.textContent = tipo.nome;
            infractionTypeSelect.appendChild(option);
        });
    }
    
    // Tipos de penalidade
    const penaltyTypeSelect = document.getElementById('penalty-type');
    if (penaltyTypeSelect) {
        penaltyTypeSelect.innerHTML = '<option value="">Selecione a penalidade</option>';
        TIPOS_PENALIDADES.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id;
            option.textContent = tipo.nome;
            penaltyTypeSelect.appendChild(option);
        });
    }
    
    // Turmas para filtro
    const turmas = [...new Set(ALUNOS_EXEMPLO.map(aluno => aluno.turma))];
    const filterTurmaSelect = document.getElementById('filter-turma');
    if (filterTurmaSelect) {
        turmas.forEach(turma => {
            const option = document.createElement('option');
            option.value = turma;
            option.textContent = turma;
            filterTurmaSelect.appendChild(option);
        });
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const userType = document.getElementById('user-type').value;
    
    if (!email || !password || !userType) {
        showToast('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    showLoading();
    
    // Simular delay
    setTimeout(() => {
        // Verificar credenciais
        const user = simulatedUsers.find(u => 
            u.email === email && u.password === password && u.type === userType
        );
        
        if (user) {
            currentUser = user;
            currentUserType = userType;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            if (userType === 'professor') {
                showProfessorDashboard();
            } else {
                showGestorDashboard();
            }
            
            showToast('Login realizado com sucesso!');
        } else {
            showToast('Credenciais inválidas. Use professor@escola.com ou gestor@escola.com com senha 123456', 'error');
        }
        
        hideLoading();
    }, 800);
}

function handleLogout() {
    currentUser = null;
    currentUserType = null;
    localStorage.removeItem('currentUser');
    
    // Limpar formulários
    const forms = document.querySelectorAll('form');
    forms.forEach(form => form.reset());
    
    showScreen('login-screen');
    showToast('Logout realizado com sucesso!');
}

function showProfessorDashboard() {
    showScreen('professor-screen');
    
    const professorNameEl = document.getElementById('professor-name');
    if (professorNameEl && currentUser) {
        professorNameEl.textContent = currentUser.name;
    }
    
    loadProfessorStats();
    loadRecentInfractions();
}

function showGestorDashboard() {
    showScreen('gestor-screen');
    loadGestorStats();
    loadPendingInfractions();
}

function handleInfractionSubmit(e) {
    e.preventDefault();
    
    const alunoMatricula = document.getElementById('student').value;
    const tipoInfracaoId = parseInt(document.getElementById('infraction-type').value);
    const local = document.getElementById('local').value;
    const descricao = document.getElementById('description').value;
    
    if (!alunoMatricula || !tipoInfracaoId || !local || !descricao) {
        showToast('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    showLoading();
    
    setTimeout(() => {
        try {
            const aluno = ALUNOS_EXEMPLO.find(a => a.matricula === alunoMatricula);
            const tipoInfracao = TIPOS_INFRACOES.find(t => t.id === tipoInfracaoId);
            
            const newInfraction = {
                id: Date.now(),
                aluno_matricula: alunoMatricula,
                aluno_nome: aluno.nome,
                aluno_turma: aluno.turma,
                tipo_infracao_id: tipoInfracaoId,
                tipo_infracao_nome: tipoInfracao.nome,
                local_ocorrencia: local,
                descricao: descricao,
                data_ocorrencia: new Date().toISOString(),
                professor_nome: currentUser.name,
                status: 'PENDENTE',
                created_at: new Date().toISOString()
            };
            
            simulatedInfractions.push(newInfraction);
            
            // Reset form
            document.getElementById('infraction-form').reset();
            
            showToast('Infração registrada com sucesso!');
            loadProfessorStats();
            loadRecentInfractions();
        } catch (error) {
            showToast('Erro ao registrar infração', 'error');
        }
        
        hideLoading();
    }, 500);
}

function loadProfessorStats() {
    try {
        const hoje = new Date().toDateString();
        const semanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const infracaosProfessor = simulatedInfractions.filter(inf => 
            inf.professor_nome === currentUser.name
        );
        
        const infracacoesHoje = infracaosProfessor.filter(inf => 
            new Date(inf.data_ocorrencia).toDateString() === hoje
        ).length;
        
        const infracoesSemana = infracaosProfessor.filter(inf => 
            new Date(inf.data_ocorrencia) >= semanaAtras
        ).length;
        
        const statsHojeEl = document.getElementById('stats-hoje');
        const statsSemanaEl = document.getElementById('stats-semana');
        
        if (statsHojeEl) statsHojeEl.textContent = infracacoesHoje;
        if (statsSemanaEl) statsSemanaEl.textContent = infracoesSemana;
        
    } catch (error) {
        console.error('Erro ao carregar stats do professor:', error);
    }
}

function loadRecentInfractions() {
    const container = document.getElementById('recent-infractions');
    if (!container) return;
    
    try {
        const infracoesProfessor = simulatedInfractions
            .filter(inf => inf.professor_nome === currentUser.name)
            .slice(-5)
            .reverse();
        
        if (infracoesProfessor.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>Nenhuma infração registrada</h3>
                    <p>Registre sua primeira infração usando o formulário acima.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = infracoesProfessor.map(inf => `
            <div class="infraction-item fade-in">
                <div class="infraction-header">
                    <span class="infraction-student">${inf.aluno_nome}</span>
                    <span class="infraction-date">${formatDate(inf.data_ocorrencia)}</span>
                </div>
                <div class="infraction-type">${inf.tipo_infracao_nome}</div>
                <div class="infraction-description">${inf.descricao}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar infrações recentes:', error);
        container.innerHTML = '<div class="empty-state"><p>Erro ao carregar infrações</p></div>';
    }
}

function loadGestorStats() {
    try {
        const hoje = new Date().toDateString();
        const semanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const mesAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const pendentes = simulatedInfractions.filter(inf => inf.status === 'PENDENTE').length;
        const infracacoesHoje = simulatedInfractions.filter(inf => 
            new Date(inf.data_ocorrencia).toDateString() === hoje
        ).length;
        const infracoesSemana = simulatedInfractions.filter(inf => 
            new Date(inf.data_ocorrencia) >= semanaAtras
        ).length;
        const infracoesMes = simulatedInfractions.filter(inf => 
            new Date(inf.data_ocorrencia) >= mesAtras
        ).length;
        
        const elements = {
            'total-pendentes': pendentes,
            'total-hoje': infracacoesHoje,
            'total-semana': infracoesSemana,
            'total-mes': infracoesMes
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
        
    } catch (error) {
        console.error('Erro ao carregar stats do gestor:', error);
    }
}

function loadPendingInfractions() {
    const container = document.getElementById('pending-infractions');
    if (!container) return;
    
    try {
        const pendingInfractions = simulatedInfractions.filter(inf => 
            inf.status === 'PENDENTE' || inf.status === 'EM_ANALISE'
        );
        
        if (pendingInfractions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>Nenhuma infração pendente</h3>
                    <p>Todas as infrações foram analisadas e resolvidas.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = pendingInfractions.map(inf => `
            <div class="infraction-card ${inf.status.toLowerCase()} fade-in">
                <div class="infraction-card-header">
                    <div class="infraction-student-info">
                        <div class="infraction-student-name">${inf.aluno_nome}</div>
                        <div class="infraction-meta">
                            <span><i class="fas fa-users"></i> ${inf.aluno_turma}</span>
                            <span><i class="fas fa-clock"></i> ${formatDate(inf.data_ocorrencia)}</span>
                            <span><i class="fas fa-user-tie"></i> ${inf.professor_nome}</span>
                        </div>
                    </div>
                    <div class="infraction-actions">
                        <span class="status-badge ${inf.status.toLowerCase().replace('_', '')}">${getStatusName(inf.status)}</span>
                        ${inf.status === 'PENDENTE' ? `<button class="btn btn--primary btn--sm" onclick="openPenaltyModal(${inf.id})">
                            <i class="fas fa-gavel"></i> Aplicar Penalidade
                        </button>` : ''}
                    </div>
                </div>
                <div class="infraction-details">
                    <div class="infraction-detail-row">
                        <span class="infraction-detail-label">Tipo:</span>
                        <span class="infraction-detail-value">${inf.tipo_infracao_nome}</span>
                    </div>
                    <div class="infraction-detail-row">
                        <span class="infraction-detail-label">Local:</span>
                        <span class="infraction-detail-value">${inf.local_ocorrencia}</span>
                    </div>
                    <div class="infraction-detail-row">
                        <span class="infraction-detail-label">Descrição:</span>
                        <span class="infraction-detail-value">${inf.descricao}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar infrações pendentes:', error);
        container.innerHTML = '<div class="empty-state"><p>Erro ao carregar infrações</p></div>';
    }
}

function getStatusName(status) {
    const statusNames = {
        'PENDENTE': 'Pendente',
        'EM_ANALISE': 'Em Análise',
        'RESOLVIDA': 'Resolvida'
    };
    return statusNames[status] || status;
}

function openPenaltyModal(infractionId) {
    const infraction = simulatedInfractions.find(inf => inf.id === infractionId);
    if (!infraction) return;
    
    currentInfractionForPenalty = infraction;
    
    const detailsContainer = document.getElementById('infraction-details');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <div class="infraction-summary-title">Detalhes da Infração</div>
            <div class="infraction-summary-details">
                <div class="infraction-summary-row">
                    <span class="infraction-summary-label">Aluno:</span>
                    <span class="infraction-summary-value">${infraction.aluno_nome} (${infraction.aluno_turma})</span>
                </div>
                <div class="infraction-summary-row">
                    <span class="infraction-summary-label">Tipo:</span>
                    <span class="infraction-summary-value">${infraction.tipo_infracao_nome}</span>
                </div>
                <div class="infraction-summary-row">
                    <span class="infraction-summary-label">Data:</span>
                    <span class="infraction-summary-value">${formatDate(infraction.data_ocorrencia)}</span>
                </div>
                <div class="infraction-summary-row">
                    <span class="infraction-summary-label">Professor:</span>
                    <span class="infraction-summary-value">${infraction.professor_nome}</span>
                </div>
            </div>
        `;
    }
    
    const penaltyForm = document.getElementById('penalty-form');
    if (penaltyForm) {
        penaltyForm.reset();
    }
    
    const suspensionDates = document.getElementById('suspension-dates');
    if (suspensionDates) {
        suspensionDates.classList.add('hidden');
    }
    
    showModal('penalty-modal');
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    });
}

function handlePenaltyTypeChange() {
    const penaltyTypeId = parseInt(document.getElementById('penalty-type').value);
    const penalty = TIPOS_PENALIDADES.find(p => p.id === penaltyTypeId);
    
    const suspensionDatesDiv = document.getElementById('suspension-dates');
    const suspensionStartInput = document.getElementById('suspension-start');
    
    if (penalty && penalty.dias_suspensao > 0) {
        if (suspensionDatesDiv) suspensionDatesDiv.classList.remove('hidden');
        if (suspensionStartInput) suspensionStartInput.required = true;
    } else {
        if (suspensionDatesDiv) suspensionDatesDiv.classList.add('hidden');
        if (suspensionStartInput) suspensionStartInput.required = false;
    }
}

function handlePenaltySubmit(e) {
    e.preventDefault();
    
    const penaltyTypeId = parseInt(document.getElementById('penalty-type').value);
    const penalty = TIPOS_PENALIDADES.find(p => p.id === penaltyTypeId);
    const observations = document.getElementById('penalty-observations').value;
    const suspensionStart = document.getElementById('suspension-start').value;
    
    if (!penalty) {
        showToast('Selecione um tipo de penalidade', 'error');
        return;
    }
    
    showLoading();
    
    setTimeout(() => {
        try {
            const infractionIndex = simulatedInfractions.findIndex(inf => 
                inf.id === currentInfractionForPenalty.id
            );
            
            if (infractionIndex !== -1) {
                simulatedInfractions[infractionIndex] = {
                    ...simulatedInfractions[infractionIndex],
                    status: 'RESOLVIDA',
                    penalidade_aplicada: penalty.nome,
                    observacoes_penalidade: observations,
                    data_inicio_suspensao: suspensionStart || null,
                    data_resolucao: new Date().toISOString()
                };
            }
            
            closeModal();
            showToast('Penalidade aplicada com sucesso!');
            loadGestorStats();
            loadPendingInfractions();
        } catch (error) {
            showToast('Erro ao aplicar penalidade', 'error');
        }
        
        hideLoading();
    }, 500);
}

function applyFilters() {
    loadPendingInfractions();
    showToast('Filtros aplicados');
}

function loadHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;
    
    try {
        const allInfractions = [...simulatedInfractions].reverse();
        
        if (allInfractions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>Nenhuma infração encontrada</h3>
                    <p>Não há infrações registradas no sistema.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Aluno</th>
                        <th>Turma</th>
                        <th>Tipo</th>
                        <th>Professor</th>
                        <th>Status</th>
                        <th>Penalidade</th>
                    </tr>
                </thead>
                <tbody>
                    ${allInfractions.map(inf => `
                        <tr>
                            <td>${formatDateOnly(inf.data_ocorrencia)}</td>
                            <td>${inf.aluno_nome}</td>
                            <td>${inf.aluno_turma}</td>
                            <td>${inf.tipo_infracao_nome}</td>
                            <td>${inf.professor_nome}</td>
                            <td><span class="status-badge ${inf.status.toLowerCase().replace('_', '')}">${getStatusName(inf.status)}</span></td>
                            <td>${inf.penalidade_aplicada || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        container.innerHTML = '<div class="empty-state"><p>Erro ao carregar histórico</p></div>';
    }
}

function createSampleData() {
    const sampleInfractions = [
        {
            id: 1,
            aluno_matricula: "2024001",
            aluno_nome: "Lucas Gabriel da Silva",
            aluno_turma: "7ºA",
            tipo_infracao_id: 1,
            tipo_infracao_nome: "Uso de celular em sala",
            local_ocorrencia: "Sala de aula",
            descricao: "Aluno estava utilizando o celular durante a explicação da matéria",
            data_ocorrencia: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            professor_nome: "Maria Silva Santos",
            status: "PENDENTE",
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 2,
            aluno_matricula: "2024002",
            aluno_nome: "Isabella Santos Oliveira",
            aluno_turma: "7ºA",
            tipo_infracao_id: 2,
            tipo_infracao_nome: "Conversar durante a aula",
            local_ocorrencia: "Sala de aula",
            descricao: "Conversa excessiva atrapalhando a concentração da turma",
            data_ocorrencia: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            professor_nome: "João Carlos Oliveira",
            status: "RESOLVIDA",
            penalidade_aplicada: "Advertência Verbal",
            observacoes_penalidade: "Aluno foi orientado sobre o comportamento adequado",
            data_resolucao: new Date().toISOString(),
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 3,
            aluno_matricula: "2024003",
            aluno_nome: "Enzo Miguel Costa",
            aluno_turma: "7ºA",
            tipo_infracao_id: 3,
            tipo_infracao_nome: "Atraso para aula",
            local_ocorrencia: "Porta da sala",
            descricao: "Terceiro atraso na semana sem justificativa",
            data_ocorrencia: new Date().toISOString(),
            professor_nome: "Ana Paula Costa",
            status: "EM_ANALISE",
            created_at: new Date().toISOString()
        }
    ];
    
    simulatedInfractions.push(...sampleInfractions);
}

// Tornar função global
window.openPenaltyModal = openPenaltyModal;