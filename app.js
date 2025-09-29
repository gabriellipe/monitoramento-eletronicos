// =====================
// Supabase Client
// =====================
const SUPABASE_URL  = 'https://wzzryluesqxwyijievyj.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6enJ5bHVlc3F4d3lpamlldnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTk2NjYsImV4cCI6MjA3NDU3NTY2Nn0.aqT7PaKjj9QS547HEQ7EDyl8kvCIg4GrQJ4AXvjsG0k';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =====================
// Estado Global
// =====================
let role = null;            // 'professor' | 'gestor'
let currentProfile = null;  // objeto { id, nome, papel }
let alunosCache = [];       // [{id, nome, turma}, ...]
let pendentesCache = [];    // ocorrências pendentes (para filtros)
let historicoCache = [];    // ocorrências resolvidas
let selectedOccurrence = null;

// Utilidades de DOM
const $ = (id) => document.getElementById(id);
const fmtDateTime = (d) => new Date(d).toLocaleString('pt-BR');

// =====================
// Navegação entre telas
// =====================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
}

function showLogin(nextRole) {
  role = nextRole;
  $('login-type').textContent = nextRole === 'professor' ? 'Professor' : 'Gestor';
  showScreen('login-form');
  loadProfilesIntoSelect(nextRole).catch(console.error);
}

function logout() {
  currentProfile = null;
  role = null;
  showScreen('login-screen');
}

// Abas da gestão
function showTab(tab) {
  const pend = $('tab-pendentes');
  const hist = $('tab-historico');
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
  if (tab === 'pendentes') {
    pend.classList.add('active'); pend.classList.remove('hidden');
    hist.classList.add('hidden'); hist.classList.remove('active');
    document.querySelector('.nav-tab:nth-child(1)').classList.add('active');
  } else {
    hist.classList.add('active'); hist.classList.remove('hidden');
    pend.classList.add('hidden'); pend.classList.remove('active');
    document.querySelector('.nav-tab:nth-child(2)').classList.add('active');
  }
}

// =====================
// Carregamento Inicial
// =====================
document.addEventListener('DOMContentLoaded', () => {
  // Preenche relógio do formulário do professor
  setInterval(() => {
    if ($('dataHoraField')) $('dataHoraField').value = fmtDateTime(new Date());
  }, 1000);

  // Login form
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const profileId = $('userSelect').value;
    if (!profileId) return;

    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', profileId)
      .single();
    if (error || !data) {
      toast('Erro ao carregar perfil selecionado', 'error');
      return;
    }
    currentProfile = data;

    if (role === 'professor') {
      $('professor-name').textContent = data.nome;
      $('professorField').value = data.nome;
      await ensureBaseDataLoaded();
      showScreen('professor-screen');
    } else {
      $('gestor-name').textContent = data.nome;
      await ensureBaseDataLoaded();
      await reloadDashboard();
      showScreen('gestor-screen');
    }
  });

  // Form do professor
  $('infracaoForm').addEventListener('submit', handleNovaInfracao);

  // Penalidade modal
  $('penalidadeForm').addEventListener('submit', aplicarPenalidade);

  // Filtros
  $('filtro-professor').addEventListener('change', aplicarFiltros);
  $('filtro-turma').addEventListener('change', aplicarFiltros);
  $('filtro-data').addEventListener('change', aplicarFiltros);

  // Realtime (ocorrências)
  supabase
    .channel('public:ocorrencias')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ocorrencias' }, async () => {
      if (role === 'gestor') await reloadDashboard();
    })
    .subscribe();

  // Carregar penalidades no modal
  loadPenalidadesCatalogo().catch(console.error);
});

// =====================
// Dados Base
// =====================
async function ensureBaseDataLoaded() {
  await Promise.all([
    loadAlunos(),
    loadProfessoresFiltro(),
    loadTurmasFiltro()
  ]);
}

// Perfis (login)
async function loadProfilesIntoSelect(papel) {
  const select = $('userSelect');
  select.innerHTML = '<option value="">Carregando...</option>';
  const { data, error } = await supabase
    .from('perfis')
    .select('id, nome, papel')
    .eq('papel', papel)
    .order('nome');
  if (error) {
    select.innerHTML = '<option value="">Erro ao carregar</option>';
    return;
  }
  select.innerHTML = '<option value="">Escolha...</option>' + (data || []).map(p =>
    `<option value="${p.id}">${p.nome}</option>`
  ).join('');
}

// Alunos
async function loadAlunos() {
  const { data, error } = await supabase
    .from('alunos')
    .select('id, nome, turma')
    .order('nome');
  if (error) {
    toast('Erro ao carregar alunos', 'error');
    return;
  }
  alunosCache = data || [];

  // Preencher select do professor
  const sel = $('alunoSelect');
  sel.innerHTML = '<option value="">Selecione o aluno...</option>' + alunosCache.map(a =>
    `<option value="${a.id}" data-turma="${a.turma}">${a.nome} — ${a.turma}</option>`
  ).join('');

  sel.addEventListener('change', (e) => {
    const opt = sel.selectedOptions[0];
    $('turmaField').value = opt ? (opt.dataset.turma || '') : '';
  });
}

// Filtros da Gestão
async function loadProfessoresFiltro() {
  const { data } = await supabase
    .from('perfis')
    .select('nome')
    .eq('papel', 'professor')
    .order('nome');
  const sel = $('filtro-professor');
  sel.innerHTML = '<option value="">Todos os professores</option>' + (data || []).map(p =>
    `<option value="${p.nome}">${p.nome}</option>`
  ).join('');
}

async function loadTurmasFiltro() {
  const turmasUnicas = new Set();
  // tentar obter das tabelas base
  const { data } = await supabase.from('alunos').select('turma');
  (data || []).forEach(r => turmasUnicas.add(r.turma));
  const sel = $('filtro-turma');
  sel.innerHTML = '<option value="">Todas as turmas</option>' + Array.from(turmasUnicas).sort().map(t =>
    `<option value="${t}">${t}</option>`
  ).join('');
}

function limparFiltros() {
  $('filtro-professor').value = '';
  $('filtro-turma').value = '';
  $('filtro-data').value = '';
  aplicarFiltros();
}

// =====================
// Professor — Registrar
// =====================
async function handleNovaInfracao(e) {
  e.preventDefault();
  if (!currentProfile) return;

  const alunoId = $('alunoSelect').value;
  const aluno = alunosCache.find(a => a.id === alunoId);
  if (!aluno) { toast('Selecione um aluno', 'error'); return; }

  const payload = {
    created_at: new Date().toISOString(),
    professor: currentProfile.nome,
    aluno_id: aluno.id,
    aluno_nome: aluno.nome,
    turma: aluno.turma,
    descricao: $('descricaoField').value.trim(),
    observacoes: $('observacoesField').value.trim() || null,
    status: 'pendente',
  };

  const { error } = await supabase.from('ocorrencias').insert(payload);
  if (error) { toast('Erro ao registrar: ' + error.message, 'error'); return; }

  $('descricaoField').value = 'Uso de celular durante a aula';
  $('observacoesField').value = '';
  $('alunoSelect').value = '';
  $('turmaField').value = '';
  toast('Infração registrada ✅', 'success');
}

// =====================
// Gestão — Dashboard
// =====================
async function reloadDashboard() {
  // counters
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const startOfWeek = new Date(today); // segunda-feira como início?
  const day = startOfWeek.getDay();
  const diffToMonday = (day === 0 ? 6 : day - 1);
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
  startOfWeek.setHours(0,0,0,0);

  const [{ count: countHoje }, { count: countSemana }, pendentes, resolvidas] = await Promise.all([
    supabase.from('ocorrencias').select('*', { count: 'exact', head: true }).gte('created_at', startOfDay),
    supabase.from('ocorrencias').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
    supabase.from('ocorrencias').select('*').eq('status','pendente').order('created_at', { ascending: false }),
    supabase.from('ocorrencias').select('*').eq('status','resolvida').order('resolved_at', { ascending: false }),
  ]);

  $('infracoes-hoje').textContent = countHoje ?? 0;
  $('infracoes-semana').textContent = countSemana ?? 0;
  $('infracoes-pendentes').textContent = (pendentes.data || []).length;
  $('infracoes-resolvidas').textContent = (resolvidas.data || []).length;

  pendentesCache = pendentes.data || [];
  historicoCache = resolvidas.data || [];

  renderPendentes(pendentesCache);
  renderHistorico(historicoCache);
}

function aplicarFiltros() {
  const fProf = $('filtro-professor').value;
  const fTurma = $('filtro-turma').value;
  const fData = $('filtro-data').value; // yyyy-mm-dd

  const filtered = pendentesCache.filter(o => {
    const okProf = !fProf || o.professor === fProf;
    const okTurma = !fTurma || o.turma === fTurma;
    const okData = !fData || o.created_at.startsWith(fData);
    return okProf && okTurma && okData;
  });
  renderPendentes(filtered);
}

function renderPendentes(list) {
  const el = $('infracoes-pendentes-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🗂️</div>Nenhuma infração pendente.</div>`;
    return;
  }
  el.innerHTML = list.map(o => `
    <div class="infraction-item status-pendente">
      <div class="infraction-header">
        <h4 class="infraction-title">${o.aluno_nome} — ${o.turma}</h4>
        <div class="infraction-date">${fmtDateTime(o.created_at)}</div>
      </div>
      <div class="infraction-details">
        <div class="infraction-detail">
          <span class="detail-label">Professor</span>
          <span class="detail-value">${o.professor}</span>
        </div>
        <div class="infraction-detail">
          <span class="detail-label">Descrição</span>
          <span class="detail-value">${o.descricao}</span>
        </div>
      </div>
      <div class="infraction-actions">
        <button class="btn btn--outline" onclick='abrirModal(${JSON.stringify(o).replace(/"/g, "&quot;")})'>Aplicar Penalidade</button>
      </div>
    </div>
  `).join('');
}

function renderHistorico(list) {
  const el = $('infracoes-historico-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div>Sem histórico resolvido ainda.</div>`;
    return;
  }
  el.innerHTML = list.map(o => `
    <div class="infraction-item penalty-applied status-resolvida">
      <div class="infraction-header">
        <h4 class="infraction-title">${o.aluno_nome} — ${o.turma}</h4>
        <div class="infraction-date">${fmtDateTime(o.resolved_at)}</div>
      </div>
      <div class="infraction-details">
        <div class="infraction-detail">
          <span class="detail-label">Professor</span>
          <span class="detail-value">${o.professor}</span>
        </div>
        <div class="infraction-detail">
          <span class="detail-label">Penalidade</span>
          <span class="detail-value"><span class="penalty-badge">${o.penalidade || '-'}</span></span>
        </div>
      </div>
      <div class="infraction-description">${o.descricao}</div>
      ${o.observacoes ? `<div class="penalty-info">Observação: ${o.observacoes}</div>` : ''}
    </div>
  `).join('');
}

// =====================
// Penalidades (Modal)
// =====================
async function loadPenalidadesCatalogo() {
  // Tabela opcional: penalidades_catalogo
  const { data, error } = await supabase.from('penalidades_catalogo').select('id, titulo').order('id');
  const sel = $('penalidade-select');
  if (error || !data || !data.length) {
    // fallback a uma lista default local
    const defaults = ['Advertência verbal', 'Acompanhamento com coordenação', 'Contato com responsáveis', 'Atividade reflexiva'];
    sel.innerHTML = '<option value="">Escolha a penalidade...</option>' + defaults.map(p => `<option value="${p}">${p}</option>`).join('');
    return;
  }
  sel.innerHTML = '<option value="">Escolha a penalidade...</option>' + data.map(p => `<option value="${p.titulo}">${p.titulo}</option>`).join('');
}

function abrirModal(occ) {
  selectedOccurrence = occ;
  $('infraction-summary').innerHTML = `
    <div class="summary-title">Resumo</div>
    <div class="summary-details">
      <strong>Aluno:</strong> ${occ.aluno_nome} — ${occ.turma}<br>
      <strong>Professor:</strong> ${occ.professor}<br>
      <strong>Quando:</strong> ${fmtDateTime(occ.created_at)}<br>
      <strong>Descrição:</strong> ${occ.descricao}
    </div>
  `;
  $('penalidade-modal').classList.remove('hidden');
}

function fecharModal() {
  $('penalidade-modal').classList.add('hidden');
  selectedOccurrence = null;
}

async function aplicarPenalidade(e) {
  e.preventDefault();
  if (!selectedOccurrence) return;
  const penalidade = $('penalidade-select').value;
  if (!penalidade) { toast('Escolha uma penalidade', 'error'); return; }

  const { error } = await supabase
    .from('ocorrencias')
    .update({ status: 'resolvida', penalidade, resolved_at: new Date().toISOString() })
    .eq('id', selectedOccurrence.id);

  if (error) { toast('Erro ao aplicar penalidade', 'error'); return; }
  fecharModal();
  toast('Penalidade aplicada ✅', 'success');
  await reloadDashboard();
}

// =====================
// Toasts
// =====================
function toast(msg, type='success') {
  const container = $('message-container');
  const div = document.createElement('div');
  div.className = `message ${type === 'error' ? 'error' : 'success'}`;
  div.textContent = msg;
  container.appendChild(div);
  setTimeout(() => {
    div.remove();
  }, 3500);
}

// Expor funções globais requeridas pelos handlers inline do HTML
window.showLogin = showLogin;
window.showScreen = showScreen;
window.logout = logout;
window.showTab = showTab;
window.limparFiltros = limparFiltros;
window.fecharModal = fecharModal;
