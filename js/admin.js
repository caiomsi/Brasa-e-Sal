// Caixa / Admin — mesas, fechamento do dia, despesas, cardápio.
import { db, T, brl, esc, $, $$, todayISO, STATIONS } from './supabase.js';
import { seedDemo, clearAll } from './demo-data.js';

const PIN = '2468'; // demo only — front-end gate, not real security

// ---- PIN gate ---------------------------------------------------------------
function unlock() { $('#gate').classList.add('hidden'); $('#app').hidden = false; boot(); }
if (sessionStorage.getItem('brasa_admin') === '1') unlock();
$('#pinBtn').onclick = tryPin;
$('#pin').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryPin(); });
function tryPin() {
  if ($('#pin').value === PIN) { sessionStorage.setItem('brasa_admin', '1'); unlock(); }
  else { $('#pinErr').textContent = 'PIN incorreto.'; $('#pin').value = ''; }
}

// ---- Tabs -------------------------------------------------------------------
$$('.admin-tabs button').forEach((b) => b.onclick = () => {
  $$('.admin-tabs button').forEach((x) => x.classList.toggle('active', x === b));
  ['mesas', 'fechamento', 'despesas', 'cardapio'].forEach((s) =>
    $(`#sec-${s}`).classList.toggle('hidden', s !== b.dataset.tab));
  if (b.dataset.tab === 'mesas') loadMesas();
  if (b.dataset.tab === 'fechamento') loadFechamento();
  if (b.dataset.tab === 'despesas') loadDespesas();
  if (b.dataset.tab === 'cardapio') loadCardapio();
});

// ---- Toast ------------------------------------------------------------------
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

// ============================================================================
// MESAS
// ============================================================================
async function loadMesas() {
  const grid = $('#mesaGrid');
  const [{ data: mesas }, { data: oitems }] = await Promise.all([
    db.from(T.tables).select('*').order('numero'),
    db.from(T.oitems).select('numero_mesa, qtd, preco_unit, status'),
  ]);
  const totals = {};
  (oitems || []).forEach((i) => {
    if (i.status === 'cancelado') return;
    totals[i.numero_mesa] = (totals[i.numero_mesa] || 0) + i.qtd * Number(i.preco_unit);
  });
  grid.innerHTML = (mesas || []).map((m) => {
    const tot = totals[m.numero] || 0;
    const aberta = m.status === 'aberta';
    return `<article class="mesa-card card ${m.status}">
      <div class="num">Mesa ${m.numero}</div>
      <div class="st">${aberta ? '● Aberta' : 'Fechada'}</div>
      <div class="tot">${brl(tot)}</div>
      ${aberta
        ? `<button class="btn btn-sm btn-red" data-close="${m.numero}">Fechar mesa</button>`
        : `<button class="btn btn-sm btn-ghost" data-open="${m.numero}">Abrir</button>`}
    </article>`;
  }).join('');
  grid.querySelectorAll('[data-close]').forEach((b) => b.onclick = () => closeMesa(b.dataset.close));
  grid.querySelectorAll('[data-open]').forEach((b) => b.onclick = () => openMesa(b.dataset.open));
}
async function openMesa(numero) {
  await db.from(T.tables).update({ status: 'aberta', aberta_em: new Date().toISOString(), fechada_em: null }).eq('numero', numero);
  toast(`Mesa ${numero} aberta.`); loadMesas();
}
async function closeMesa(numero) {
  await db.from(T.tables).update({ status: 'fechada', fechada_em: new Date().toISOString() }).eq('numero', numero);
  await db.from(T.orders).update({ status: 'fechado' }).eq('numero_mesa', numero).eq('status', 'aberto');
  toast(`Mesa ${numero} fechada.`); loadMesas();
}

// ============================================================================
// FECHAMENTO DO DIA
// ============================================================================
async function loadFechamento() {
  $('#fdate').textContent = new Date().toLocaleDateString('pt-BR');
  const today = todayISO();
  const start = today + 'T00:00:00';

  const [{ data: oitems }, { data: exps }, { data: closing }] = await Promise.all([
    db.from(T.oitems).select('*').gte('criado_em', start),
    db.from(T.expenses).select('valor').eq('data', today),
    db.from(T.closings).select('*').eq('data', today).maybeSingle(),
  ]);

  const sold = (oitems || []).filter((i) => i.status !== 'cancelado');
  const bruto = sold.reduce((s, i) => s + i.qtd * Number(i.preco_unit), 0);
  const cmv = sold.reduce((s, i) => s + i.qtd * Number(i.custo_unit), 0);
  const despesas = (exps || []).reduce((s, e) => s + Number(e.valor), 0);
  const liquido = bruto - cmv - despesas;

  $('#kBruto').textContent = brl(bruto);
  $('#kCmv').textContent = '− ' + brl(cmv);
  $('#kDesp').textContent = '− ' + brl(despesas);
  $('#kLiq').textContent = brl(liquido);

  // aggregate by item name
  const agg = {};
  sold.forEach((i) => {
    const k = i.nome;
    agg[k] = agg[k] || { nome: i.nome, qtd: 0, preco: Number(i.preco_unit), custo: Number(i.custo_unit), sub: 0 };
    agg[k].qtd += i.qtd;
    agg[k].sub += i.qtd * Number(i.preco_unit);
  });
  const rows = Object.values(agg).sort((a, b) => b.sub - a.sub);
  $('#salesTable tbody').innerHTML = rows.length
    ? rows.map((r) => `<tr>
        <td>${esc(r.nome)}</td><td class="num">${r.qtd}</td>
        <td class="num">${brl(r.preco)}</td><td class="num">${brl(r.custo)}</td>
        <td class="num">${brl(r.sub)}</td></tr>`).join('')
    : '<tr><td colspan="5" style="color:var(--muted)">Nenhuma venda registrada hoje.</td></tr>';

  $('#closedNote').innerHTML = closing
    ? `<div class="tag">✓ Dia já fechado às ${new Date(closing.fechado_em).toLocaleTimeString('pt-BR')}</div>`
    : '';

  // stash for the close action
  loadFechamento._vals = { data: today, bruto, cmv, despesas, liquido };
}

$('#closeDayBtn').onclick = async () => {
  const v = loadFechamento._vals;
  if (!v) return;
  const { error } = await db.from(T.closings).upsert({
    data: v.data, bruto: v.bruto, cmv: v.cmv, despesas: v.despesas, liquido: v.liquido,
    fechado_em: new Date().toISOString(),
  }, { onConflict: 'data' });
  if (error) { toast('Erro: ' + error.message); return; }
  toast(`Dia fechado! Líquido ${brl(v.liquido)} 🎉`);
  loadFechamento();
};

// ============================================================================
// DESPESAS
// ============================================================================
async function loadDespesas() {
  const today = todayISO();
  const { data } = await db.from(T.expenses).select('*').eq('data', today).order('criado_em', { ascending: false });
  const tot = (data || []).reduce((s, e) => s + Number(e.valor), 0);
  $('#expTable tbody').innerHTML = (data && data.length)
    ? data.map((e) => `<tr>
        <td>${esc(e.descricao)}</td><td class="num">${brl(e.valor)}</td>
        <td class="num"><button class="btn btn-sm btn-red" data-del="${e.id}">×</button></td></tr>`).join('')
      + `<tr><td><b>Total</b></td><td class="num"><b>${brl(tot)}</b></td><td></td></tr>`
    : '<tr><td colspan="3" style="color:var(--muted)">Nenhuma despesa hoje.</td></tr>';
  $('#expTable').querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
    await db.from(T.expenses).delete().eq('id', b.dataset.del); loadDespesas();
  });
}
$('#expAdd').onclick = async () => {
  const descricao = $('#expDesc').value.trim();
  const valor = parseFloat($('#expVal').value);
  if (!descricao || !(valor > 0)) { toast('Preencha descrição e valor.'); return; }
  await db.from(T.expenses).insert({ data: todayISO(), descricao, valor });
  $('#expDesc').value = ''; $('#expVal').value = '';
  toast('Despesa adicionada.'); loadDespesas();
};

// ============================================================================
// CARDÁPIO
// ============================================================================
async function loadCardapio() {
  const { data } = await db.from(T.items).select('*').order('ordem');
  $('#menuTable tbody').innerHTML = (data || []).map((i) => {
    const margem = Number(i.preco) - Number(i.custo);
    const st = STATIONS[i.station] || { icon: '', label: i.station };
    return `<tr style="${i.disponivel ? '' : 'opacity:.45'}">
      <td>${esc(i.nome)}</td>
      <td><span class="tag ${i.station}">${st.icon} ${st.label}</span></td>
      <td class="num">${brl(i.preco)}</td>
      <td class="num">${brl(i.custo)}</td>
      <td class="num" style="color:var(--green-2)">${brl(margem)}</td>
      <td class="num"><button class="btn btn-sm btn-ghost" data-toggle="${i.id}" data-av="${i.disponivel}">${i.disponivel ? 'Ocultar' : 'Ativar'}</button></td>
    </tr>`;
  }).join('');
  $('#menuTable').querySelectorAll('[data-toggle]').forEach((b) => b.onclick = async () => {
    await db.from(T.items).update({ disponivel: b.dataset.av !== 'true' }).eq('id', b.dataset.toggle);
    loadCardapio();
  });
}
$('#miAdd').onclick = async () => {
  const nome = $('#miNome').value.trim();
  const categoria = $('#miCat').value.trim() || 'Outros';
  const station = $('#miStation').value;
  const preco = parseFloat($('#miPreco').value) || 0;
  const custo = parseFloat($('#miCusto').value) || 0;
  if (!nome) { toast('Informe o nome do item.'); return; }
  await db.from(T.items).insert({ nome, categoria, station, preco, custo, ordem: 99 });
  ['miNome', 'miCat', 'miPreco', 'miCusto'].forEach((id) => $('#' + id).value = '');
  toast('Item adicionado ao cardápio.'); loadCardapio();
};

// ============================================================================
// DEMO controls
// ============================================================================
function activeTab() { return $('.admin-tabs button.active')?.dataset.tab; }
function refreshActive() {
  const t = activeTab();
  if (t === 'mesas') loadMesas();
  else if (t === 'fechamento') loadFechamento();
  else if (t === 'despesas') loadDespesas();
  else if (t === 'cardapio') loadCardapio();
}

$('#demoSeed').onclick = async () => {
  const btn = $('#demoSeed');
  btn.disabled = true; btn.textContent = '⏳ Montando o serviço…';
  try {
    const r = await seedDemo();
    toast(`Demo pronta! ${r.orders} pedidos no dia 🔥`);
  } catch (e) { toast('Erro: ' + e.message); }
  btn.disabled = false; btn.textContent = '🎬 Resetar demo';
  refreshActive();
};

$('#demoClear').onclick = async () => {
  const btn = $('#demoClear');
  btn.disabled = true; btn.textContent = '⏳ Limpando…';
  try { await clearAll(); toast('Tudo limpo — telas zeradas.'); }
  catch (e) { toast('Erro: ' + e.message); }
  btn.disabled = false; btn.textContent = '🧹 Limpar tudo';
  refreshActive();
};

// ---- boot -------------------------------------------------------------------
function boot() { loadMesas(); }
