import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 🚨 NÃO EDITAR ABAIXO DESTA LINHA 🚨
const SUPABASE_URL = 'https://wzzryluesqxwyijievyj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6enJ5bHVlc3F4d3lpamlldnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTk2NjYsImV4cCI6MjA3NDU3NTY2Nn0.aqT7PaKjj9QS547HEQ7EDyl8kvCIg4GrQJ4AXvjsG0k';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// 🚨 NÃO EDITAR ACIMA DESTA LINHA 🚨

let currentUser = null;
let currentUserType = null;
let currentInfractionId = null;

document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
  await loadInitialData();
  setupFormEvents();
  updateCurrentDateTime();
  setupFilters();
  calculateStatistics();
}

async function loadInitialData() {
  const { data: professores } = await supabase.from('professores').select('*');
  const { data: alunos } = await supabase.from('alunos').select('*');
  const { data: tiposPenalidade } = await supabase.from('tipos_penalidade').select('*');
  const { data: infracoes } = await supabase.from('infracoes').select('*');

  window.appData = { professores, alunos, tiposPenalidade, infracoes };
}

function setupFormEvents() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const infracaoForm = document.getElementById('infracaoForm');
  if (infracaoForm) infracaoForm.addEventListener('submit', handleInfracaoSubmit);

  const penalidadeForm = document.getElementById('penalidadeForm');
  if (penalidadeForm) penalidadeForm.addEventListener('submit', handlePenalidadeSubmit);

  const alunoSelect = document.getElementById('alunoSelect');
  if (alunoSelect) alunoSelect.addEventListener('change', updateTurmaField);

  ['filtro-professor', 'filtro-turma', 'filtro-data'].forEach(filtroId => {
    const filtro = document.getElementById(filtroId);
    if (filtro) filtro.addEventListener('change', applyFilters);
  });
}

function updateCurrentDateTime() {
  const campoDataHora = document.getElementById('dataHoraField');
  if (campoDataHora) campoDataHora.value = new Date().toLocaleString();
}

function setupFilters() {
  const filtroProf = document.getElementById('filtro-professor');
  if (filtroProf && window.appData.professores) {
    filtroProf.innerHTML = '<option value="">Todos os professores</option>';
    window.appData.professores.forEach(prof => {
      const option = document.createElement('option');
      option.value = prof.nome;
      option.textContent = prof.nome;
      filtroProf.appendChild(option);
    });
  }

  const filtroTurma = document.getElementById('filtro-turma');
  if (filtroTurma && window.appData.alunos) {
    filtroTurma.innerHTML = '<option value="">Todas as turmas</option>';
    const turmas = [...new Set(window.appData.alunos.map(a => a.turma))];
    turmas.forEach(turma => {
      const option = document.createElement('option');
      option.value = turma;
      option.textContent = turma;
      filtroTurma.appendChild(option);
    });
  }
}

async function refreshInfractions() {
  const { data: infracoes } = await supabase.from('infracoes').select('*');
  window.appData.infracoes = infracoes;
  calculateStatistics();
  loadInfractionsList();
}

function calculateStatistics() {
  const hoje = new Date().toISOString().split('T')[0];
  const infracoes = window.appData.infracoes || [];

  const infracoesHoje = infracoes.filter(i => i.data === hoje).length;
  const semana = new Date();
  semana.setDate(semana.getDate() - 7);
  const infracoesSemana = infracoes.filter(i => new Date(i.data) >= semana).length;
  const infracoesPendentes = infracoes.filter(i => i.status === 'pendente').length;
  const infracoesResolvidas = infracoes.filter(i => i.status === 'resolvida').length;

  document.getElementById('infracoes-hoje').textContent = infracoesHoje;
  document.getElementById('infracoes-semana').textContent = infracoesSemana;
  document.getElementById('infracoes-pendentes').textContent = infracoesPendentes;
  document.getElementById('infracoes-resolvidas').textContent = infracoesResolvidas;
}

function loadInfractionsList() {
  const listaPendentes = document.getElementById('infracoes-pendentes-list');
  const listaHistorico = document.getElementById('infracoes-historico-list');
  const infracoes = window.appData.infracoes || [];

  if (listaPendentes) listaPendentes.innerHTML = '';
  if (listaHistorico) listaHistorico.innerHTML = '';

  const pendentes = infracoes.filter(i => i.status === 'pendente');
  const resolvidas = infracoes.filter(i => i.status === 'resolvida');

  pendentes.forEach(infracao => {
    const div = document.createElement('div');
    div.textContent = `${infracao.data} - ${infracao.aluno} (${infracao.turma}) - ${infracao.descricao}`;
    listaPendentes.appendChild(div);
  });

  resolvidas.forEach(infracao => {
    const div = document.createElement('div');
    div.textContent = `${infracao.data} - ${infracao.aluno} (${infracao.turma}) - ${infracao.descricao}`;
    listaHistorico.appendChild(div);
  });
}

function updateTurmaField() {
  const alunoSelect = document.getElementById('alunoSelect');
  const turmaField = document.getElementById('turmaField');
  if (!alunoSelect || !turmaField) return;

  const selectedOption = alunoSelect.options[alunoSelect.selectedIndex];
  const turma = selectedOption ? selectedOption.dataset.turma : '';
  turmaField.value = turma;
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.add('hidden');
    screen.classList.remove('active');
  });
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.remove('hidden');
    screen.classList.add('active');
  }
}

function showLogin(userType) {
  if (!window.appData || !window.appData.professores) {
    showMessage('Os dados ainda estão carregando, tente novamente.', 'error');
    return;
  }

  currentUserType = userType;
  const loginTypeSpan = document.getElementById('login-type');
  loginTypeSpan.textContent = userType === 'professor' ? 'Professor' : 'Gestor';

  const userSelect = document.getElementById('userSelect');
  userSelect.innerHTML = '<option value="">Escolha...</option>';

  if (userType === 'professor') {
    window.appData.professores.forEach(prof => {
      const option = document.createElement('option');
      option.value = prof.id;
      option.textContent = prof.nome;
      userSelect.appendChild(option);
    });
  } else {
    const option = document.createElement('option');
    option.value = 'gestor';
    option.textContent = 'Coordenação Pedagógica';
    userSelect.appendChild(option);
  }

  showScreen('login-form');
}

async function handleLogin(e) {
  e.preventDefault();
  const selectedValue = document.getElementById('userSelect').value;
  if (!selectedValue) return showMessage('Por favor, selecione um usuário', 'error');

  if (currentUserType === 'professor') {
    currentUser = window.appData.professores.find(p => p.id == selectedValue);
    document.getElementById('professor-name').textContent = currentUser.nome;
    document.getElementById('professorField').value = currentUser.nome;
    loadProfessorSelectOptions();
    showScreen('professor-screen');
  } else {
    currentUser = { nome: 'Coordenação Pedagógica' };
    document.getElementById('gestor-name').textContent = currentUser.nome;
    loadGestorSelectOptions();
    showScreen('gestor-screen');
  }

  showMessage('Login realizado com sucesso!', 'success');
}

function loadProfessorSelectOptions() {
  const alunoSelect = document.getElementById('alunoSelect');
  alunoSelect.innerHTML = '<option value="">Selecione o aluno...</option>';
  window.appData.alunos.forEach(aluno => {
    const option = document.createElement('option');
    option.value = aluno.id;
    option.textContent = aluno.nome;
    option.dataset.turma = aluno.turma;
    alunoSelect.appendChild(option);
  });
}

async function handleInfracaoSubmit(e) {
  e.preventDefault();
  const alunoId = document.getElementById('alunoSelect').value;
  const descricao = document.getElementById('descricaoField').value;
  const observacoes = document.getElementById('observacoesField').value;

  if (!alunoId) return showMessage('Por favor, selecione um aluno', 'error');

  const aluno = window.appData.alunos.find(a => a.id == alunoId);
  const now = new Date();
  const newInfraction = {
    professor: currentUser.nome,
    aluno: aluno.nome,
    turma: aluno.turma,
    data: now.toISOString().split('T')[0],
    hora: now.toTimeString().substr(0, 5),
    descricao,
    observacoes,
    status: 'pendente'
  };

  await supabase.from('infracoes').insert(newInfraction);
  await refreshInfractions();
  e.target.reset();
  updateCurrentDateTime();
  showMessage('Infração registrada com sucesso!', 'success');
}

function loadGestorSelectOptions() {
  const penalidadeSelect = document.getElementById('penalidade-select');
  penalidadeSelect.innerHTML = '<option value="">Escolha a penalidade...</option>';
  window.appData.tiposPenalidade.forEach(tipo => {
    const option = document.createElement('option');
    option.value = tipo.nome;
    option.textContent = tipo.nome;
    penalidadeSelect.appendChild(option);
  });
}

async function handlePenalidadeSubmit(e) {
  e.preventDefault();
  const penalidade = document.getElementById('penalidade-select').value;
  if (!penalidade) return showMessage('Por favor, selecione uma penalidade', 'error');

  await supabase
    .from('infracoes')
    .update({ status: 'resolvida', penalidade, dataResolucao: new Date().toISOString().split('T')[0] })
    .eq('id', currentInfractionId);

  await refreshInfractions();
  fecharModal();
  showMessage('Penalidade aplicada com sucesso!', 'success');
}

function showMessage(msg, type = 'info') {
  const messageContainer = document.getElementById('message-container');
  messageContainer.textContent = msg;
  messageContainer.className = `message-container message-${type}`;
  setTimeout(() => {
    messageContainer.textContent = '';
    messageContainer.className = 'message-container';
  }, 5000);
}

function fecharModal() {
  const modal = document.getElementById('penalidade-modal');
  if (modal) modal.classList.add('hidden');
}

function showTab(tabId) {
  const pendentesTab = document.getElementById('tab-pendentes');
  const historicoTab = document.getElementById('tab-historico');
  const tabs = document.querySelectorAll('.nav-tab');

  tabs.forEach(tab => tab.classList.remove('active'));
  if (tabId === 'pendentes') {
    pendentesTab.classList.add('active');
    historicoTab.classList.add('hidden');
    tabs[0].classList.add('active');
  } else {
    historicoTab.classList.remove('hidden');
    pendentesTab.classList.remove('active');
    tabs[1].classList.add('active');
  }
}

function applyFilters() {
  // Implementar lógica para aplicar filtros e atualizar listas na tela
}

function logout() {
  currentUser = null;
  currentUserType = null;
  showScreen('login-screen');
}

function limparFiltros() {
  document.getElementById('filtro-professor').value = '';
  document.getElementById('filtro-turma').value = '';
  document.getElementById('filtro-data').value = '';
  applyFilters();
}

window.showLogin = showLogin;
window.showScreen = showScreen;
window.logout = logout;
window.limparFiltros = limparFiltros;
window.fecharModal = fecharModal;
window.showTab = showTab;
