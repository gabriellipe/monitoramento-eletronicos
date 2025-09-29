import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL  = 'https://wzzryluesqxwyijievyj.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6enJ5bHVlc3F4d3lpamlldnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTk2NjYsImV4cCI6MjA3NDU3NTY2Nn0.aqT7PaKjj9QS547HEQ7EDyl8kvCIg4GrQJ4AXvjsG0k';
const supabase      = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentUserType = null;
let currentInfractionId = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadData();
  bindEvents();
  updateTime();
  fillFilters();
  updateStats();
}

async function loadData() {
  const { data: professores }   = await supabase.from('professores').select('*');
  const { data: alunos }        = await supabase.from('alunos').select('*');
  const { data: tipos }         = await supabase.from('tipos_penalidade').select('*');
  const { data: infracoes }     = await supabase.from('infracoes').select('*');
  window.appData = { professores, alunos, tipos, infracoes };
}

function bindEvents() {
  document.getElementById('loginForm')      ?.addEventListener('submit', handleLogin);
  document.getElementById('infracaoForm')   ?.addEventListener('submit', handleInfraction);
  document.getElementById('penalidadeForm') ?.addEventListener('submit', handlePenalty);
  document.getElementById('alunoSelect')    ?.addEventListener('change', updateTurma);

  ['filtro-professor','filtro-turma','filtro-data'].forEach(id=>{
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });
}

/* ------------------------------ Login ------------------------------ */
function showLogin(type){
  if(!window.appData?.professores) return;
  currentUserType = type;
  document.getElementById('login-type').textContent = type==='professor'?'Professor':'Gestor';
  const sel = document.getElementById('userSelect');
  sel.innerHTML = '';
  if(type==='professor'){
    window.appData.professores.forEach(p=>{
      sel.innerHTML += `<option value="${p.id}">${p.nome}</option>`;
    });
  } else {
    sel.innerHTML = `<option value="gestor">Coordenação Pedagógica</option>`;
  }
  showScreen('login-form');
}
window.showLogin = showLogin;

function handleLogin(e){
  e.preventDefault();
  const id = document.getElementById('userSelect').value;
  if(!id) return;
  if(currentUserType==='professor'){
    currentUser = window.appData.professores.find(p=>p.id==id);
    document.getElementById('professor-name').textContent = currentUser.nome;
    document.getElementById('professorField').value = currentUser.nome;
    fillAlunos();
    showScreen('professor-screen');
  } else {
    currentUser = { nome:'Coordenação Pedagógica'};
    document.getElementById('gestor-name').textContent = currentUser.nome;
    fillPenalidades();
    showScreen('gestor-screen');
  }
  showMsg('Login realizado!','success');
}
function logout(){ currentUser=null; showScreen('login-screen'); }
window.logout = logout;

/* --------------------------- Professor ----------------------------- */
function fillAlunos(){
  const sel = document.getElementById('alunoSelect');
  sel.innerHTML='<option value="">Selecione</option>';
  window.appData.alunos.forEach(a=>{
    sel.innerHTML += `<option value="${a.id}" data-turma="${a.turma}">${a.nome}</option>`;
  });
}
function updateTurma(){
  const sel   = document.getElementById('alunoSelect');
  const turma = sel.options[sel.selectedIndex]?.dataset.turma||'';
  document.getElementById('turmaField').value = turma;
}
function updateTime(){
  const f = document.getElementById('dataHoraField');
  if(f) f.value = new Date().toLocaleString();
}
async function handleInfraction(e){
  e.preventDefault();
  const alunoId = document.getElementById('alunoSelect').value;
  if(!alunoId) return showMsg('Escolha um aluno','error');
  const aluno   = window.appData.alunos.find(a=>a.id==alunoId);
  const now     = new Date();
  const inf = {
    professor : currentUser.nome,
    aluno     : aluno.nome,
    turma     : aluno.turma,
    data      : now.toISOString().split('T')[0],
    hora      : now.toTimeString().substr(0,5),
    descricao : document.getElementById('descricaoField').value,
    observacoes: document.getElementById('observacoesField').value,
    status    : 'pendente'
  };
  await supabase.from('infracoes').insert(inf);
  await loadData(); updateStats(); loadLists();
  e.target.reset(); updateTime();
  showMsg('Infração registrada','success');
}

/* ----------------------------- Gestor ------------------------------ */
function fillPenalidades(){
  const sel = document.getElementById('penalidade-select');
  sel.innerHTML='<option value="">Escolha</option>';
  window.appData.tipos.forEach(t=>{
    sel.innerHTML += `<option value="${t.nome}">${t.nome}</option>`;
  });
}
async function handlePenalty(e){
  e.preventDefault();
  const pen = document.getElementById('penalidade-select').value;
  await supabase.from('infracoes')
    .update({status:'resolvida',penalidade:pen,dataResolucao:new Date().toISOString().split('T')[0]})
    .eq('id',currentInfractionId);
  fecharModal(); await loadData(); updateStats(); loadLists();
  showMsg('Penalidade aplicada','success');
}
window.fecharModal = ()=>document.getElementById('penalidade-modal')?.classList.add('hidden');

/* ----------------------- Filtros / listagem ----------------------- */
function fillFilters(){
  const fp = document.getElementById('filtro-professor');
  const ft = document.getElementById('filtro-turma');
  if(fp){ fp.innerHTML='<option value="">Todos</option>';
    window.appData.professores.forEach(p=>fp.innerHTML+=`<option>${p.nome}</option>`); }
  if(ft){ ft.innerHTML='<option value="">Todas</option>';
    [...new Set(window.appData.alunos.map(a=>a.turma))]
      .forEach(t=>ft.innerHTML+=`<option>${t}</option>`); }
}
function limparFiltros(){['filtro-professor','filtro-turma','filtro-data'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});applyFilters();}
window.limparFiltros = limparFiltros;
function applyFilters(){ loadLists(); }

function loadLists(){
  const pend = document.getElementById('ocorrencia-pendentes-list');
  const hist = document.getElementById('ocorrencia-historico-list');
  if(!pend||!hist) return;
  pend.innerHTML=''; hist.innerHTML='';
  let data = [...window.appData.infracoes];
  const fProf = document.getElementById('filtro-professor').value;
  const fTurma= document.getElementById('filtro-turma').value;
  const fData = document.getElementById('filtro-data').value;
  if(fProf)  data=data.filter(i=>i.professor===fProf);
  if(fTurma) data=data.filter(i=>i.turma===fTurma);
  if(fData)  data=data.filter(i=>i.data===fData);

  data.filter(i=>i.status==='pendente').forEach(i=>{
    pend.innerHTML+=`<div>${i.data} - ${i.aluno} (${i.turma})</div>`;
  });
  data.filter(i=>i.status==='resolvida').forEach(i=>{
    hist.innerHTML+=`<div>${i.data} - ${i.aluno} (${i.turma})</div>`;
  });
}
function showTab(t){
  document.querySelectorAll('.nav-tab').forEach(btn=>btn.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(tab=>tab.classList.add('hidden'));
  if(t==='pendentes'){
    document.getElementById('tab-pendentes').classList.remove('hidden');
    document.querySelector('.nav-tab').classList.add('active');
  } else {
    document.getElementById('tab-historico').classList.remove('hidden');
    document.querySelectorAll('.nav-tab')[1].classList.add('active');
  }
}
window.showTab = showTab;

/* ------------------------- Estatísticas --------------------------- */
function updateStats(){
  const hoje = new Date().toISOString().split('T')[0];
  const todos = window.appData.infracoes || [];
  const numHoje   = todos.filter(i=>i.data===hoje).length;
  const numPend   = todos.filter(i=>i.status==='pendente').length;
  const numRes    = todos.filter(i=>i.status==='resolvida').length;
  const semanaIni = new Date(); semanaIni.setDate(semanaIni.getDate()-7);
  const numSem    = todos.filter(i=>new Date(i.data)>=semanaIni).length;

  if(document.getElementById('ocorrencia-hoje'))        document.getElementById('ocorrencia-hoje').textContent        = numHoje;
  if(document.getElementById('ocorrencia-semana'))      document.getElementById('ocorrencia-semana').textContent      = numSem;
  if(document.getElementById('ocorrencia-pendentes'))   document.getElementById('ocorrencia-pendentes').textContent   = numPend;
  if(document.getElementById('ocorrencia-resolvidas'))  document.getElementById('ocorrencia-resolvidas').textContent  = numRes;
}

/* --------------------------- Utilidades --------------------------- */
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
  document.getElementById(id)?.classList.remove('hidden');
}
function showMsg(msg,type='info'){
  const box=document.getElementById('message-container');
  box.textContent=msg; box.className=`msg ${type}`; setTimeout(()=>box.textContent='',4000);
}

/* Expor funções usadas no HTML */
window.showScreen = showScreen;
