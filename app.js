// Dados da aplicação
const appData = {
  "professores": [
    {"id": 1, "nome": "Prof. Maria Silva", "disciplina": "Matemática"},
    {"id": 2, "nome": "Prof. João Santos", "disciplina": "História"},
    {"id": 3, "nome": "Prof. Ana Costa", "disciplina": "Português"},
    {"id": 4, "nome": "Prof. Carlos Lima", "disciplina": "Ciências"},
    {"id": 5, "nome": "Prof. Paula Oliveira", "disciplina": "Geografia"}
  ],
  "alunos": [
    {"id": 1, "nome": "Pedro Henrique", "turma": "9°A"},
    {"id": 2, "nome": "Amanda Silva", "turma": "8°B"},
    {"id": 3, "nome": "Lucas Ferreira", "turma": "9°A"},
    {"id": 4, "nome": "Júlia Santos", "turma": "7°C"},
    {"id": 5, "nome": "Gabriel Costa", "turma": "8°A"},
    {"id": 6, "nome": "Mariana Lima", "turma": "9°B"},
    {"id": 7, "nome": "Rafael Oliveira", "turma": "7°A"},
    {"id": 8, "nome": "Isabela Souza", "turma": "8°B"},
    {"id": 9, "nome": "Thiago Pereira", "turma": "9°A"},
    {"id": 10, "nome": "Larissa Martins", "turma": "7°B"},
    {"id": 11, "nome": "Bruno Alves", "turma": "8°C"},
    {"id": 12, "nome": "Camila Rocha", "turma": "9°B"},
    {"id": 13, "nome": "Diego Silva", "turma": "7°A"},
    {"id": 14, "nome": "Fernanda Costa", "turma": "8°A"},
    {"id": 15, "nome": "Mateus Santos", "turma": "9°C"}
  ],
  "turmas": ["7°A", "7°B", "7°C", "8°A", "8°B", "8°C", "9°A", "9°B", "9°C"],
  "tiposPenalidade": [
    "Advertência Verbal",
    "Advertência Escrita", 
    "Suspensão de Recreio",
    "Comunicado aos Pais",
    "Suspensão de 1 dia",
    "Suspensão de 3 dias"
  ],
  "infracoes": [
    {
      "id": 1,
      "professor": "Prof. Maria Silva",
      "aluno": "Pedro Henrique",
      "turma": "9°A",
      "data": "2025-09-28",
      "hora": "10:30",
      "descricao": "Uso de celular durante explicação de matemática",
      "observacoes": "Aluno estava jogando durante a aula",
      "status": "pendente"
    },
    {
      "id": 2,
      "professor": "Prof. João Santos", 
      "aluno": "Amanda Silva",
      "turma": "8°B",
      "data": "2025-09-28",
      "hora": "14:15",
      "descricao": "Uso de celular durante a aula",
      "observacoes": "Estava enviando mensagens",
      "status": "pendente"
    },
    {
      "id": 3,
      "professor": "Prof. Ana Costa",
      "aluno": "Lucas Ferreira", 
      "turma": "9°A",
      "data": "2025-09-27",
      "hora": "08:45",
      "descricao": "Uso de celular durante a aula",
      "observacoes": "Terceira ocorrência do aluno",
      "status": "resolvida",
      "penalidade": "Comunicado aos Pais",
      "dataResolucao": "2025-09-27"
    },
    {
      "id": 4,
      "professor": "Prof. Carlos Lima",
      "aluno": "Júlia Santos",
      "turma": "7°C", 
      "data": "2025-09-28",
      "hora": "11:20",
      "descricao": "Uso de celular durante experimento",
      "observacoes": "Filmando a aula sem autorização",
      "status": "pendente"
    },
    {
      "id": 5,
      "professor": "Prof. Paula Oliveira",
      "aluno": "Gabriel Costa",
      "turma": "8°A",
      "data": "2025-09-26",
      "hora": "16:00",
      "descricao": "Uso de celular durante a aula",
      "observacoes": "Atendeu ligação durante aula",
      "status": "resolvida", 
      "penalidade": "Advertência Escrita",
      "dataResolucao": "2025-09-27"
    },
    {
      "id": 6,
      "professor": "Prof. Maria Silva",
      "aluno": "Mariana Lima",
      "turma": "9°B",
      "data": "2025-09-25",
      "hora": "09:15",
      "descricao": "Uso de celular durante a aula", 
      "observacoes": "Primeira ocorrência",
      "status": "resolvida",
      "penalidade": "Advertência Verbal",
      "dataResolucao": "2025-09-25"
    },
    {
      "id": 7,
      "professor": "Prof. João Santos",
      "aluno": "Rafael Oliveira",
      "turma": "7°A",
      "data": "2025-09-28",
      "hora": "13:30",
      "descricao": "Uso de celular durante a aula",
      "observacoes": "Ouvindo música com fones",
      "status": "pendente"
    },
    {
      "id": 8,
      "professor": "Prof. Ana Costa", 
      "aluno": "Isabela Souza",
      "turma": "8°B",
      "data": "2025-09-26",
      "hora": "07:50",
      "descricao": "Uso de celular durante a aula",
      "observacoes": "Segunda ocorrência da semana",
      "status": "resolvida",
      "penalidade": "Suspensão de Recreio", 
      "dataResolucao": "2025-09-26"
    }
  ]
};

// Estado da aplicação
let currentUser = null;
let currentUserType = null;
let currentInfractionId = null;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Configurar eventos de formulários
    setupFormEvents();
    
    // Atualizar data e hora atual
    updateCurrentDateTime();
}

function setupFormEvents() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Infração form
    const infracaoForm = document.getElementById('infracaoForm');
    if (infracaoForm) {
        infracaoForm.addEventListener('submit', handleInfracaoSubmit);
    }
    
    // Penalidade form
    const penalidadeForm = document.getElementById('penalidadeForm');
    if (penalidadeForm) {
        penalidadeForm.addEventListener('submit', handlePenalidadeSubmit);
    }
    
    // Aluno select change
    const alunoSelect = document.getElementById('alunoSelect');
    if (alunoSelect) {
        alunoSelect.addEventListener('change', updateTurmaField);
    }
    
    // Filtros
    setupFilters();
}

function setupFilters() {
    const filtros = ['filtro-professor', 'filtro-turma', 'filtro-data'];
    filtros.forEach(filtroId => {
        const filtro = document.getElementById(filtroId);
        if (filtro) {
            filtro.addEventListener('change', applyFilters);
        }
    });
}

// Navegação entre telas
function showScreen(screenId) {
    // Esconder todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.classList.add('hidden');
    });
    
    // Mostrar tela solicitada
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.classList.add('active');
    }
}

function showLogin(userType) {
    currentUserType = userType;
    
    // Atualizar título
    const loginTypeSpan = document.getElementById('login-type');
    if (loginTypeSpan) {
        loginTypeSpan.textContent = userType === 'professor' ? 'Professor' : 'Gestor';
    }
    
    // Carregar opções do select
    const userSelect = document.getElementById('userSelect');
    if (userSelect) {
        userSelect.innerHTML = '<option value="">Escolha...</option>';
        
        if (userType === 'professor') {
            appData.professores.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id;
                option.textContent = prof.nome;
                userSelect.appendChild(option);
            });
        } else {
            // Para gestor, adicionar opção genérica
            const option = document.createElement('option');
            option.value = 'gestor';
            option.textContent = 'Coordenação Pedagógica';
            userSelect.appendChild(option);
        }
    }
    
    showScreen('login-form');
}

function handleLogin(e) {
    e.preventDefault();
    
    const userSelect = document.getElementById('userSelect');
    const selectedValue = userSelect.value;
    
    if (!selectedValue) {
        showMessage('Por favor, selecione um usuário', 'error');
        return;
    }
    
    if (currentUserType === 'professor') {
        const professor = appData.professores.find(p => p.id == selectedValue);
        currentUser = professor;
        
        // Atualizar interface do professor
        const professorNameElement = document.getElementById('professor-name');
        const professorFieldElement = document.getElementById('professorField');
        
        if (professorNameElement) professorNameElement.textContent = professor.nome;
        if (professorFieldElement) professorFieldElement.value = professor.nome;
        
        // Carregar opções para o professor
        loadProfessorSelectOptions();
        
        showScreen('professor-screen');
    } else {
        currentUser = { nome: 'Coordenação Pedagógica', tipo: 'gestor' };
        
        // Atualizar interface do gestor
        const gestorNameElement = document.getElementById('gestor-name');
        if (gestorNameElement) gestorNameElement.textContent = 'Coordenação Pedagógica';
        
        // Carregar dados do gestor
        loadGestorData();
        
        showScreen('gestor-screen');
    }
    
    showMessage('Login realizado com sucesso!', 'success');
}

function logout() {
    currentUser = null;
    currentUserType = null;
    showScreen('login-screen');
    showMessage('Logout realizado com sucesso!', 'success');
}

// Funções do Professor
function loadProfessorSelectOptions() {
    // Carregar alunos
    const alunoSelect = document.getElementById('alunoSelect');
    if (alunoSelect) {
        alunoSelect.innerHTML = '<option value="">Selecione o aluno...</option>';
        appData.alunos.forEach(aluno => {
            const option = document.createElement('option');
            option.value = aluno.id;
            option.textContent = aluno.nome;
            option.dataset.turma = aluno.turma;
            alunoSelect.appendChild(option);
        });
    }
}

function loadGestorSelectOptions() {
    // Carregar penalidades
    const penalidadeSelect = document.getElementById('penalidade-select');
    if (penalidadeSelect) {
        penalidadeSelect.innerHTML = '<option value="">Escolha a penalidade...</option>';
        appData.tiposPenalidade.forEach(penalidade => {
            const option = document.createElement('option');
            option.value = penalidade;
            option.textContent = penalidade;
            penalidadeSelect.appendChild(option);
        });
    }
}

function updateTurmaField() {
    const alunoSelect = document.getElementById('alunoSelect');
    const turmaField = document.getElementById('turmaField');
    
    if (alunoSelect && turmaField && alunoSelect.value) {
        const selectedOption = alunoSelect.options[alunoSelect.selectedIndex];
        turmaField.value = selectedOption.dataset.turma || '';
    } else if (turmaField) {
        turmaField.value = '';
    }
}

function updateCurrentDateTime() {
    const now = new Date();
    const dataHoraField = document.getElementById('dataHoraField');
    
    if (dataHoraField) {
        const formatted = now.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        dataHoraField.value = formatted;
    }
}

function handleInfracaoSubmit(e) {
    e.preventDefault();
    
    const alunoSelect = document.getElementById('alunoSelect');
    const turmaField = document.getElementById('turmaField');
    const descricaoField = document.getElementById('descricaoField');
    const observacoesField = document.getElementById('observacoesField');
    
    if (!alunoSelect || !alunoSelect.value) {
        showMessage('Por favor, selecione um aluno', 'error');
        return;
    }
    
    const aluno = appData.alunos.find(a => a.id == alunoSelect.value);
    const now = new Date();
    
    const novaInfracao = {
        id: Math.max(...appData.infracoes.map(i => i.id)) + 1,
        professor: currentUser.nome,
        aluno: aluno.nome,
        turma: aluno.turma,
        data: now.toISOString().split('T')[0],
        hora: now.toTimeString().substring(0, 5),
        descricao: descricaoField ? descricaoField.value : 'Uso de celular durante a aula',
        observacoes: observacoesField ? observacoesField.value : '',
        status: 'pendente'
    };
    
    appData.infracoes.push(novaInfracao);
    
    // Limpar formulário
    const infracaoForm = document.getElementById('infracaoForm');
    if (infracaoForm) {
        infracaoForm.reset();
        updateCurrentDateTime();
        const professorField = document.getElementById('professorField');
        if (professorField) professorField.value = currentUser.nome;
    }
    
    showMessage('Infração registrada com sucesso!', 'success');
}

// Funções do Gestor
function loadGestorData() {
    calculateStatistics();
    loadFiltersOptions();
    loadGestorSelectOptions();
    loadInfractionsList();
}

function calculateStatistics() {
    const hoje = new Date().toISOString().split('T')[0];
    const inicioSemana = getStartOfWeek(new Date()).toISOString().split('T')[0];
    
    const infracoesHoje = appData.infracoes.filter(i => i.data === hoje).length;
    const infrucoesSemana = appData.infracoes.filter(i => i.data >= inicioSemana).length;
    const infracoesPendentes = appData.infracoes.filter(i => i.status === 'pendente').length;  
    const infracoesResolvidas = appData.infracoes.filter(i => i.status === 'resolvida').length;
    
    const elements = {
        'infracoes-hoje': infracoesHoje,
        'infracoes-semana': infrucoesSemana,
        'infracoes-pendentes': infracoesPendentes,
        'infracoes-resolvidas': infracoesResolvidas
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function getStartOfWeek(date) {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    return new Date(startOfWeek.setDate(diff));
}

function loadFiltersOptions() {
    // Filtro de professores
    const filtroProfessor = document.getElementById('filtro-professor');
    if (filtroProfessor) {
        filtroProfessor.innerHTML = '<option value="">Todos os professores</option>';
        const professoresUnicos = [...new Set(appData.infracoes.map(i => i.professor))];
        professoresUnicos.forEach(prof => {
            const option = document.createElement('option');
            option.value = prof;
            option.textContent = prof;
            filtroProfessor.appendChild(option);
        });
    }
    
    // Filtro de turmas
    const filtroTurma = document.getElementById('filtro-turma');
    if (filtroTurma) {
        filtroTurma.innerHTML = '<option value="">Todas as turmas</option>';
        appData.turmas.forEach(turma => {
            const option = document.createElement('option');
            option.value = turma;
            option.textContent = turma;
            filtroTurma.appendChild(option);
        });
    }
}

function loadInfractionsList() {
    loadPendingInfractions();
    loadHistoryInfractions();
}

function loadPendingInfractions() {
    const container = document.getElementById('infracoes-pendentes-list');
    if (!container) return;
    
    const infractions = appData.infracoes.filter(i => i.status === 'pendente');
    
    if (infractions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <p>Nenhuma infração pendente no momento</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = infractions.map(infraction => createInfractionHTML(infraction, true)).join('');
}

function loadHistoryInfractions() {
    const container = document.getElementById('infracoes-historico-list');
    if (!container) return;
    
    const infractions = appData.infracoes.filter(i => i.status === 'resolvida');
    
    if (infractions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <p>Nenhuma infração resolvida ainda</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = infractions.map(infraction => createInfractionHTML(infraction, false)).join('');
}

function createInfractionHTML(infraction, showActions = true) {
    const dataFormatada = new Date(infraction.data + 'T00:00:00').toLocaleDateString('pt-BR');
    const statusClass = infraction.status === 'pendente' ? 'status-pendente' : 'status-resolvida penalty-applied';
    
    return `
        <div class="infraction-item ${statusClass}">
            <div class="infraction-header">
                <h4 class="infraction-title">${infraction.aluno}</h4>
                <span class="infraction-date">${dataFormatada} às ${infraction.hora}</span>
            </div>
            
            <div class="infraction-details">
                <div class="infraction-detail">
                    <span class="detail-label">Professor:</span>
                    <span class="detail-value">${infraction.professor}</span>
                </div>
                <div class="infraction-detail">
                    <span class="detail-label">Turma:</span>
                    <span class="detail-value">${infraction.turma}</span>
                </div>
            </div>
            
            <div class="infraction-description">
                <strong>Descrição:</strong> ${infraction.descricao}
                ${infraction.observacoes ? `<br><strong>Observações:</strong> ${infraction.observacoes}` : ''}
            </div>
            
            ${showActions ? `
                <div class="infraction-actions">
                    <button class="btn btn--primary" onclick="abrirModalPenalidade(${infraction.id})">
                        Aplicar Penalidade
                    </button>
                </div>
            ` : `
                <div class="penalty-info">
                    <span class="penalty-badge">${infraction.penalidade}</span>
                    <span>Aplicada em ${new Date(infraction.dataResolucao + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
            `}
        </div>
    `;
}

// Navegação por abas
function showTab(tabName) {
    // Atualizar navegação
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Mostrar conteúdo
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
    });
    
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
        targetTab.classList.add('active');
    }
}

// Sistema de filtros
function applyFilters() {
    const filtroProfessor = document.getElementById('filtro-professor');
    const filtroTurma = document.getElementById('filtro-turma');
    const filtroData = document.getElementById('filtro-data');
    
    const filtroProfessorValue = filtroProfessor ? filtroProfessor.value : '';
    const filtroTurmaValue = filtroTurma ? filtroTurma.value : '';
    const filtroDataValue = filtroData ? filtroData.value : '';
    
    let infracoesFiltradas = appData.infracoes.filter(i => i.status === 'pendente');
    
    if (filtroProfessorValue) {
        infracoesFiltradas = infracoesFiltradas.filter(i => i.professor === filtroProfessorValue);
    }
    
    if (filtroTurmaValue) {
        infracoesFiltradas = infracoesFiltradas.filter(i => i.turma === filtroTurmaValue);
    }
    
    if (filtroDataValue) {
        infracoesFiltradas = infracoesFiltradas.filter(i => i.data === filtroDataValue);
    }
    
    const container = document.getElementById('infracoes-pendentes-list');
    if (!container) return;
    
    if (infracoesFiltradas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>Nenhuma infração encontrada com os filtros aplicados</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = infracoesFiltradas.map(infraction => createInfractionHTML(infraction, true)).join('');
}

function limparFiltros() {
    const elements = ['filtro-professor', 'filtro-turma', 'filtro-data'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    loadPendingInfractions();
}

// Sistema de modal para penalidades
function abrirModalPenalidade(infracaoId) {
    currentInfractionId = infracaoId;
    const infraction = appData.infracoes.find(i => i.id === infracaoId);
    
    if (!infraction) return;
    
    // Preencher resumo da infração
    const summary = document.getElementById('infraction-summary');
    if (summary) {
        summary.innerHTML = `
            <div class="summary-title">Infração de ${infraction.aluno}</div>
            <div class="summary-details">
                <strong>Professor:</strong> ${infraction.professor}<br>
                <strong>Turma:</strong> ${infraction.turma}<br>
                <strong>Data:</strong> ${new Date(infraction.data + 'T00:00:00').toLocaleDateString('pt-BR')} às ${infraction.hora}<br>
                <strong>Descrição:</strong> ${infraction.descricao}<br>
                ${infraction.observacoes ? `<strong>Observações:</strong> ${infraction.observacoes}` : ''}
            </div>
        `;
    }
    
    // Limpar select de penalidade
    const penalidadeSelect = document.getElementById('penalidade-select');
    if (penalidadeSelect) penalidadeSelect.value = '';
    
    // Mostrar modal
    const modal = document.getElementById('penalidade-modal');
    if (modal) modal.classList.remove('hidden');
}

function fecharModal() {
    const modal = document.getElementById('penalidade-modal');
    if (modal) modal.classList.add('hidden');
    currentInfractionId = null;
}

function handlePenalidadeSubmit(e) {
    e.preventDefault();
    
    const penalidadeSelect = document.getElementById('penalidade-select');
    const penalidade = penalidadeSelect ? penalidadeSelect.value : '';
    
    if (!penalidade) {
        showMessage('Por favor, selecione uma penalidade', 'error');
        return;
    }
    
    // Atualizar infração
    const infraction = appData.infracoes.find(i => i.id === currentInfractionId);
    if (infraction) {
        infraction.status = 'resolvida';
        infraction.penalidade = penalidade;
        infraction.dataResolucao = new Date().toISOString().split('T')[0];
    }
    
    // Atualizar interface
    calculateStatistics();
    loadInfractionsList();
    
    // Fechar modal
    fecharModal();
    
    showMessage('Penalidade aplicada com sucesso!', 'success');
}

// Sistema de mensagens
function showMessage(text, type = 'success') {
    const container = document.getElementById('message-container');
    if (!container) return;
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    container.appendChild(message);
    
    // Remover mensagem após 3 segundos
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 3000);
}

// Inicialização da data e hora a cada minuto
setInterval(updateCurrentDateTime, 60000);