// app.js

// 🚨 NÃO EDITAR ABAIXO DESTA LINHA 🚨
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://wzzryluesqxwyijievyj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6enJ5bHVlc3F4d3lpamlldnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTk2NjYsImV4cCI6MjA3NDU3NTY2Nn0.aqT7PaKjj9QS547HEQ7EDyl8kvCIg4GrQJ4AXvjsG0k';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// 🚨 NÃO EDITAR ACIMA DESTA LINHA 🚨

let currentUser = null;
let currentUserType = null;
let currentInfractionId = null;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
  await loadInitialData();
  setupFormEvents();
  updateCurrentDateTime();
  setupFilters();
}

async function loadInitialData() {
  // Carrega professores, alunos, turmas, tipos de penalidade e infrações
  const { data: professores } = await supabase.from('professores').select('*');
  const { data: alunos } = await supabase.from('alunos').select('*');
  const { data: tiposPenalidade } = await supabase.from('tipos_penalidade').select('*');
  const { data: infracoes } = await supabase.from('infracoes').select('*');

  window.appData = { professores, alunos, tiposPenalidade, infracoes };
}

// Configuração de eventos dos formulários
function setupFormEvents() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const infracaoForm = document.getElementById('infracaoForm');
  if (infracaoForm) infracaoForm.addEventListener('submit', handleInfracaoSubmit);

  const penalidadeForm = document.getElementById('penalidadeForm');
  if (penalidadeForm) penalidadeForm.addEventListener('submit', handlePenalidadeSubmit);

  const alunoSelect = document.getElementById('alunoSelect');
  if (alunoSelect) alunoSelect.addEventListener('change', updateTurmaField);

  const filtros = ['filtro-professor', 'filtro-turma', 'filtro-data'];
  filtros.forEach(filtroId => {
    const filtro = document.getElementById(filtroId);
    if (filtro) filtro.addEventListener('change', applyFilters);
  });
}

// Funções de login
function showLogin(userType) {
  currentUserType = userType;
  const loginTypeSpan = document.getElementById('login-type');
  loginTypeSpan.textContent = userType === 'professor' ? 'Professor' : 'Gestor';
  const userSelect = document.getElementById('userSelect');
  userSelect.innerHTML = '<option value="">Escolha...</option>';

  if (userType === 'professor') {
    appData.professores.forEach(prof => {
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

  showScreen('login-screen');
}

async function handleLogin(e) {
  e.preventDefault();
  const selectedValue = document.getElementById('userSelect').value;
  if (!selectedValue) return showMessage('Por favor, selecione um usuário', 'error');

  if (currentUserType === 'professor') {
    currentUser = appData.professores.find(p => p.id == selectedValue);
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

// Funções do Professor
function loadProfessorSelectOptions() {
  const alunoSelect = document.getElementById('alunoSelect');
  alunoSelect.innerHTML = '<option value="">Selecione o aluno...</option>';
  appData.alunos.forEach(aluno => {
    const option = document.createElement('option');
    option.value = aluno.id;
    option.textContent = aluno.nome;
    option.dataset.turma = aluno.turma;
    alunoSelect.appendChild(option);
  });
}

// Submissão de infração
async function handleInfracaoSubmit(e) {
  e.preventDefault();
  const alunoId = document.getElementById('alunoSelect').value;
  const descricao = document.getElementById('descricaoField').value;
  const observacoes = document.getElementById('observacoesField').value;

  if (!alunoId) return showMessage('Por favor, selecione um aluno', 'error');

  const aluno = appData.alunos.find(a => a.id == alunoId);
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

// Funções do Gestor
function loadGestorSelectOptions() {
  const penalidadeSelect = document.getElementById('penalidade-select');
  penalidadeSelect.innerHTML = '<option value="">Escolha a penalidade...</option>';
  appData.tiposPenalidade.forEach(tipo => {
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

// Atualização de dados após mutações
async function refreshInfractions() {
  const { data: infracoes } = await supabase.from('infracoes').select('*');
  window.appData.infracoes = infracoes;
  calculateStatistics();
  loadInfractionsList();
}

// Demais funções de interface (filtros, exibição de telas, estatísticas, modais, mensagens, etc.)
// … (permaneça com o conteúdo original, substituindo appData.infracoes por window.appData.infracoes)
// Exemplo de uso em filtros:
// const infracoesHoje = appData.infracoes.filter(i => i.data === hoje).length;
