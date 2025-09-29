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
let currentProfile = null;  // { user_id, nome, papel }
let alunosCache = [];
let pendentesCache = [];
let historicoCache = [];
let selectedOccurrence = null;

// Utilidades de DOM
const $ = (id) => document.getElementById(id);
const fmtDateTime = (d) => new Date(d).toLocaleString('pt-BR');
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
}
function showTab(tab) {
  const tabs = { pendentes: 'tab-pendentes', historico: 'tab-historico', aprovacoes: 'tab-aprovacoes', cadastros: 'tab-cadastros' };
  document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
  const id = tabs[tab];
  if (id) {
    $(id).classList.remove('hidden'); $(id).classList.add('active');
    const index = ['pendentes','historico','aprovacoes','cadastros'].indexOf(tab);
    document.querySelectorAll('.nav-tab')[index].classList.add('active');
    if (tab === 'aprovacoes') loadPendencias().catch(console.error);
    if (tab === 'cadastros') loadCadastros().catch(console.error);
  }
}

// =====================
// Auth + Roteamento
// =====================
document.addEventListener('DOMContentLoaded', () => {
  // Relógio
  setInterval(() => {
    if ($('dataHoraField')) $('dataHoraField').value = fmtDateTime(new Date());
  }, 1000);

  // Forms de Auth
  if ($('authForm')) $('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('authEmail').value.trim();
    const password = $('authPassword').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return toast('Login falhou: ' + error.message, 'error');
    await routeAfterLogin();
  });

  if ($('signupForm')) $('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('signupEmail').value.trim();
    const password = $('signupPassword').value;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return toast('Falha no cadastro: ' + error.message, 'error');
    toast('Conta criada. Faça login com seu e-mail e senha.');
  });

  if ($('btnLogoutFromRequest')) $('btnLogoutFromRequest').addEventListener('click', async () => await logout());
  if ($('btnLogoutProfessor')) $('btnLogoutProfessor').addEventListener('click', async () => await logout());
  if ($('btnLogoutGestor')) $('btnLogoutGestor').addEventListener('click', async () => await logout());

  // Form de ocorrência e penalidade
  if ($('infracaoForm')) $('infracaoForm').addEventListener('submit', handleNovaInfracao);
  if ($('penalidadeForm')) $('penalidadeForm').addEventListener('submit', aplicarPenalidade);

  // Filtros
  if ($('filtro-professor')) $('filtro-professor').addEventListener('change', aplicarFiltros);
  if ($('filtro-turma')) $('filtro-turma').addEventListener('change', aplicarFiltros);
  if ($('filtro-data')) $('filtro-data').addEventListener('change', aplicarFiltros);

  // Realtime
  supabase
    .channel('public:ocorrencias')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ocorrencias' }, async () => {
      if (role === 'gestor') await reloadDashboard();
    })
    .subscribe();

  // Penalidades
  loadPenalidadesCatalogo().catch(console.error);

  // Sessão
  supabase.auth.onAuthStateChange(async (event) => {
    if (event === 'SIGNED_IN') await routeAfterLogin();
    if (event === 'SIGNED_OUT') {
      role = null; currentProfile = null;
      showScreen('login-screen');
    }
  });

  // CRUD Cadastros listeners
  const alunoForm = $('alunoForm'); if (alunoForm) alunoForm.addEventListener('submit', submitAluno);
  const alunoCancelBtn = $('alunoCancelBtn'); if (alunoCancelBtn) alunoCancelBtn.addEventListener('click', resetAlunoForm);
  const penForm = $('penalidadeCatForm'); if (penForm) penForm.addEventListener('submit', submitPen);
  const penCancelBtn = $('penCancelBtn'); if (penCancelBtn) penCancelBtn.addEventListener('click', resetPenForm);

  // Primeira checagem
  routeAfterLogin();
});

async function routeAfterLogin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { showScreen('login-screen'); return; }

  // tenta obter o perfil
  const { data: perfil } = await supabase.from('perfis').select('*').eq('user_id', user.id).maybeSingle();

  if (!perfil) {
    // sem perfil: mostra tela de solicitação e status (se já existir pendência)
    await showRequestAccess(user);
    return;
  }

  currentProfile = perfil;
  role = perfil.papel;

  if (role === 'professor') {
    $('professor-name').textContent = perfil.nome;
    $('professorField').value = perfil.nome;
    await ensureBaseDataLoaded();
    showScreen('professor-screen');
  } else if (role === 'gestor') {
    $('gestor-name').textContent = perfil.nome;
    await ensureBaseDataLoaded();
    await reloadDashboard();
    showScreen('gestor-screen');
  } else {
    await logout();
    toast('Papel inválido.', 'error');
  }
}

async function showRequestAccess(user) {
  showScreen('request-access-screen');
  $('requestStatus').textContent = 'Verificando pendências...';

  const { data: pend, error } = await supabase.from('perfil_pendentes').select('*').eq('user_id', user.id).maybeSingle();
  if (error) { $('requestStatus').textContent = ''; }

  if (pend) {
    $('requestStatus').textContent = 'Sua solicitação já foi registrada. Aguarde aprovação do gestor.';
  } else {
    $('requestStatus').textContent = 'Você ainda não enviou solicitação.';
  }

  $('requestAccessForm').onsubmit = async (e) => {
    e.preventDefault();
    const nome = $('solicitanteNome').value.trim();
    if (!nome) return;
    const { error } = await supabase.rpc('request_access', { p_nome: nome });
    if (error) return toast('Erro ao solicitar: ' + error.message, 'error');
    $('requestStatus').textContent = 'Solicitação enviada. Aguarde aprovação.';
    toast('Solicitação enviada ✅');
  };
}

async function logout() {
  await supabase.auth.signOut();
}

// =====================
// Dados Base
// =====================
async function ensureBaseDataLoaded() {
  await Promise.all([
    loadAlunos(),
    loadProfessoresFiltro(),
    loadTurmasFiltro(),
  ]);
}

// Perfis (apenas nomes de professores para filtro)
async function loadProfessoresFiltro() {
  const { data } = await supabase
    .from('perfis')
    .select('nome, papel')
    .eq('papel', 'professor')
    .order('nome');
  const sel = $('filtro-professor');
  if (!sel) return;
  sel.innerHTML = '<option value=\"\">Todos os professores</option>' + (data || []).map(p =>
    `<option value=\"${p.nome}\">${p.nome}</option>`
  ).join('');
}

// Alunos
async function loadAlunos() {
  const { data, error } = await supabase
    .from('alunos')
    .select('id, nome, turma')
    .order('nome');
  if (error) { toast('Erro ao carregar alunos', 'error'); return; }
  alunosCache = data || [];

  const sel = $('alunoSelect');
  if (!sel) return;
  sel.innerHTML = '<option value=\"\">Selecione o aluno...</option>' + alunosCache.map(a =>
    `<option value=\"${a.id}\" data-turma=\"${a.turma}\">${a.nome} — ${a.turma}</option>`
  ).join('');

  sel.addEventListener('change', () => {
    const opt = sel.selectedOptions[0];
    $('turmaField').value = opt ? (opt.dataset.turma || '') : '';
  });
}

async function loadTurmasFiltro() {
  const { data } = await supabase.from('alunos').select('turma');
  const turmas = Array.from(new Set((data || []).map(r => r.turma))).sort();
  const sel = $('filtro-turma');
  if (!sel) return;
  sel.innerHTML = '<option value=\"\">Todas as turmas</option>' + turmas.map(t =>
    `<option value=\"${t}\">${t}</option>`
  ).join('');
}

function limparFiltros() {
  if ($('filtro-professor')) $('filtro-professor').value = '';
  if ($('filtro-turma')) $('filtro-turma').value = '';
  if ($('filtro-data')) $('filtro-data').value = '';
  aplicarFiltros();
}

// =====================
// Professor — Registrar
// =====================
async function handleNovaInfracao(e) {
  e.preventDefault();
  if (!currentProfile) return;

  const sel = $('alunoSelect');
  const alunoId = sel ? sel.value : '';
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
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const startOfWeek = new Date(today);
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
  const fProf = $('filtro-professor') ? $('filtro-professor').value : '';
  const fTurma = $('filtro-turma') ? $('filtro-turma').value : '';
  const fData = $('filtro-data') ? $('filtro-data').value : ''; // yyyy-mm-dd

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
  if (!el) return;
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
        <div class="infraction-detail"><span class="detail-label">Professor</span><span class="detail-value">${o.professor}</span></div>
        <div class="infraction-detail"><span class="detail-label">Descrição</span><span class="detail-value">${o.descricao}</span></div>
      </div>
      <div class="infraction-actions">
        <button class="btn btn--outline" onclick='abrirModal(${JSON.stringify(o).replace(/"/g, "&quot;")})'>Aplicar Penalidade</button>
      </div>
    </div>
  `).join('');
}

function renderHistorico(list) {
  const el = $('infracoes-historico-list');
  if (!el) return;
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
        <div class="infraction-detail"><span class="detail-label">Professor</span><span class="detail-value">${o.professor}</span></div>
        <div class="infraction-detail"><span class="detail-label">Penalidade</span><span class="detail-value"><span class="penalty-badge">${o.penalidade || '-'}</span></span></div>
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
  const sel = $('penalidade-select');
  if (!sel) return;
  const { data, error } = await supabase.from('penalidades_catalogo').select('id, titulo').order('id');
  if (error || !data || !data.length) {
    const defaults = ['Advertência verbal', 'Acompanhamento com coordenação', 'Contato com responsáveis', 'Atividade reflexiva'];
    sel.innerHTML = '<option value=\"\">Escolha a penalidade...</option>' + defaults.map(p => `<option value=\"${p}\">${p}</option>`).join('');
    return;
  }
  sel.innerHTML = '<option value=\"\">Escolha a penalidade...</option>' + data.map(p => `<option value=\"${p.titulo}\">${p.titulo}</option>`).join('');
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
// Aprovações (Gestor)
// =====================
async function loadPendencias() {
  const { data, error } = await supabase
    .from('perfil_pendentes')
    .select('user_id, nome_solicitado, criado_em')
    .order('criado_em', { ascending: true });
  if (error) {
    $('pendencias-list').innerHTML = `<div class=\"empty-state\">Erro ao carregar pendências.</div>`;
    return;
  }

  if (!data || !data.length) {
    $('pendencias-list').innerHTML = `<div class=\"empty-state\"><div class=\"empty-icon\">✅</div>Sem solicitações no momento.</div>`;
    return;
  }

  $('pendencias-list').innerHTML = data.map(p => `
    <div class=\"infraction-item\">
      <div class=\"infraction-header\">
        <h4 class=\"infraction-title\">${p.nome_solicitado}</h4>
        <div class=\"infraction-date\">${fmtDateTime(p.criado_em)}</div>
      </div>
      <div class=\"infraction-details\">
        <div class=\"infraction-detail\"><span class=\"detail-label\">User ID</span><span class=\"detail-value\">${p.user_id}</span></div>
        <div class=\"infraction-detail\">
          <span class=\"detail-label\">Papel</span>
          <span class=\"detail-value\">
            <select id=\"papel-${p.user_id}\" class=\"form-control\" style=\"max-width:220px;\">
              <option value=\"professor\">Professor</option>
              <option value=\"gestor\">Gestor</option>
            </select>
          </span>
        </div>
      </div>
      <div class=\"infraction-actions\">
        <button class=\"btn btn--primary\" onclick=\"approve('${p.user_id}','${p.nome_solicitado.replace(\"'\",\"&#39;\")}')\">Aprovar</button>
        <button class=\"btn btn--outline\" onclick=\"reject('${p.user_id}')\">Rejeitar</button>
      </div>
    </div>
  `).join('');
}

async function approve(userId, nome) {
  const papelSel = document.getElementById(`papel-${userId}`);
  const papel = papelSel ? papelSel.value : 'professor';
  const { error } = await supabase.rpc('approve_access', { p_user_id: userId, p_nome: nome, p_papel: papel });
  if (error) return toast('Erro ao aprovar: ' + error.message, 'error');
  toast('Aprovado ✅');
  await loadPendencias();
}

async function reject(userId) {
  const { error } = await supabase.rpc('reject_access', { p_user_id: userId });
  if (error) return toast('Erro ao rejeitar: ' + error.message, 'error');
  toast('Solicitação rejeitada');
  await loadPendencias();
}

// =====================
// Cadastros (Gestor) - Alunos & Penalidades
// =====================
async function loadCadastros() {
  await Promise.all([loadAlunosCRUD(), loadPenalidadesCRUD()]);
}

// ------- Alunos -------
function resetAlunoForm() {
  if (!$('alunoIdEdit')) return;
  $('alunoIdEdit').value = '';
  $('alunoNome').value = '';
  $('alunoTurma').value = '';
  $('alunoSubmitBtn').textContent = 'Salvar';
  $('alunoCancelBtn').style.display = 'none';
}
async function loadAlunosCRUD() {
  const box = $('alunosList'); if (!box) return;
  const { data, error } = await supabase.from('alunos').select('id, nome, turma').order('nome');
  if (error) { box.innerHTML = `<div class=\"empty-state\">Erro ao carregar alunos.</div>`; return; }
  if (!data || !data.length) {
    box.innerHTML = `<div class=\"empty-state\"><div class=\"empty-icon\">👨‍🎓</div>Nenhum aluno cadastrado.</div>`;
    return;
  }
  box.innerHTML = data.map(a => `
    <div class=\"infraction-item\">
      <div class=\"infraction-header\">
        <h4 class=\"infraction-title\">${a.nome}</h4>
        <div class=\"infraction-date\">${a.turma}</div>
      </div>
      <div class=\"infraction-actions\">
        <button class=\"btn btn--outline\" onclick=\"editAluno('${a.id}','${a.nome.replace(/\"/g,'&quot;')}','${a.turma.replace(/\"/g,'&quot;')}')\">Editar</button>
        <button class=\"btn btn--outline\" onclick=\"deleteAluno('${a.id}')\">Excluir</button>
      </div>
    </div>
  `).join('');
}
async function submitAluno(e) {
  e.preventDefault();
  const id = $('alunoIdEdit').value;
  const nome = $('alunoNome').value.trim();
  const turma = $('alunoTurma').value.trim();
  if (!nome || !turma) return;
  if (id) {
    const { error } = await supabase.from('alunos').update({ nome, turma }).eq('id', id);
    if (error) return toast('Erro ao atualizar aluno', 'error');
    toast('Aluno atualizado ✅');
  } else {
    const { error } = await supabase.from('alunos').insert({ nome, turma });
    if (error) return toast('Erro ao criar aluno', 'error');
    toast('Aluno criado ✅');
  }
  resetAlunoForm();
  await Promise.all([loadAlunosCRUD(), loadAlunos(), loadTurmasFiltro()]);
}
function editAluno(id, nome, turma) {
  $('alunoIdEdit').value = id;
  $('alunoNome').value = nome;
  $('alunoTurma').value = turma;
  $('alunoSubmitBtn').textContent = 'Salvar alterações';
  $('alunoCancelBtn').style.display = 'inline-block';
}
async function deleteAluno(id) {
  if (!confirm('Excluir este aluno?')) return;
  const { error } = await supabase.from('alunos').delete().eq('id', id);
  if (error) return toast('Erro ao excluir aluno', 'error');
  toast('Aluno excluído');
  await Promise.all([loadAlunosCRUD(), loadAlunos(), loadTurmasFiltro()]);
}

// ------- Penalidades -------
function resetPenForm() {
  if (!$('penIdEdit')) return;
  $('penIdEdit').value = '';
  $('penTitulo').value = '';
  $('penSubmitBtn').textContent = 'Salvar';
  $('penCancelBtn').style.display = 'none';
}
async function loadPenalidadesCRUD() {
  const box = $('penalidadesList'); if (!box) return;
  const { data, error } = await supabase.from('penalidades_catalogo').select('id, titulo').order('id');
  if (error) { box.innerHTML = `<div class=\"empty-state\">Erro ao carregar penalidades.</div>`; return; }
  if (!data || !data.length) {
    box.innerHTML = `<div class=\"empty-state\"><div class=\"empty-icon\">⚖️</div>Nenhuma penalidade cadastrada.</div>`;
    return;
  }
  box.innerHTML = data.map(p => `
    <div class=\"infraction-item\">
      <div class=\"infraction-header\">
        <h4 class=\"infraction-title\">${p.titulo}</h4>
      </div>
      <div class=\"infraction-actions\">
        <button class=\"btn btn--outline\" onclick=\"editPen('${p.id}','${p.titulo.replace(/\"/g,'&quot;')}')\">Editar</button>
        <button class=\"btn btn--outline\" onclick=\"deletePen('${p.id}')\">Excluir</button>
      </div>
    </div>
  `).join('');
}
async function submitPen(e) {
  e.preventDefault();
  const id = $('penIdEdit').value;
  const titulo = $('penTitulo').value.trim();
  if (!titulo) return;
  if (id) {
    const { error } = await supabase.from('penalidades_catalogo').update({ titulo }).eq('id', id);
    if (error) return toast('Erro ao atualizar penalidade', 'error');
    toast('Penalidade atualizada ✅');
  } else {
    const { error } = await supabase.from('penalidades_catalogo').insert({ titulo });
    if (error) return toast('Erro ao criar penalidade', 'error');
    toast('Penalidade criada ✅');
  }
  resetPenForm();
  await Promise.all([loadPenalidadesCRUD(), loadPenalidadesCatalogo()]);
}
function editPen(id, titulo) {
  $('penIdEdit').value = id;
  $('penTitulo').value = titulo;
  $('penSubmitBtn').textContent = 'Salvar alterações';
  $('penCancelBtn').style.display = 'inline-block';
}
async function deletePen(id) {
  if (!confirm('Excluir esta penalidade?')) return;
  const { error } = await supabase.from('penalidades_catalogo').delete().eq('id', id);
  if (error) return toast('Erro ao excluir penalidade', 'error');
  toast('Penalidade excluída');
  await Promise.all([loadPenalidadesCRUD(), loadPenalidadesCatalogo()]);
}

// =====================
// Toasts
// =====================
function toast(msg, type='success') {
  const container = $('message-container');
  if (!container) return;
  const div = document.createElement('div');
  div.className = `message ${type === 'error' ? 'error' : 'success'}`;
  div.textContent = msg;
  container.appendChild(div);
  setTimeout(() => { div.remove(); }, 3500);
}

// Expor funções globais
window.showScreen = showScreen;
window.showTab = showTab;
window.limparFiltros = limparFiltros;
window.fecharModal = fecharModal;
window.approve = approve;
window.reject = reject;
window.editAluno = editAluno;
window.deleteAluno = deleteAluno;
window.editPen = editPen;
window.deletePen = deletePen;
window.resetAlunoForm = resetAlunoForm;
window.resetPenForm = resetPenForm;
