// Cardápio + pedido (cliente via QR ?mesa=N  |  garçom escolhe a mesa)
import { db, T, brl, esc, $, el, STATIONS } from './supabase.js';

const params = new URLSearchParams(location.search);
let mesa = parseInt(params.get('mesa'), 10) || null; // mesa fixa via QR
const origem = mesa ? 'cliente' : 'garcom';

let items = [];
let cart = new Map(); // menu_item_id -> { item, qtd }
let activeCat = 'Todos';

const grid = $('#menuGrid');
const catBar = $('#catBar');
const cartBar = $('#cartBar');

// ---- Mesa display -----------------------------------------------------------
function renderMesa() {
  $('#mesaNum').textContent = mesa ?? '—';
  const picker = $('#mesaPicker');
  if (mesa) { picker.innerHTML = ''; return; }
  // Garçom mode: choose a table
  picker.innerHTML = `<div class="field" style="margin:0">
    <label>Atendimento (garçom) — escolha a mesa</label>
    <select id="mesaSel"></select></div>`;
  const sel = $('#mesaSel');
  sel.innerHTML = '<option value="">Selecione…</option>' +
    Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">Mesa ${i + 1}</option>`).join('');
  sel.onchange = () => { mesa = parseInt(sel.value, 10) || null; $('#mesaNum').textContent = mesa ?? '—'; };
}

// ---- Load menu --------------------------------------------------------------
async function loadMenu() {
  const { data, error } = await db.from(T.items)
    .select('*').eq('disponivel', true).order('ordem');
  if (error) { grid.innerHTML = `<div class="empty">Erro ao carregar: ${esc(error.message)}</div>`; return; }
  items = data || [];
  const cats = ['Todos', ...new Set(items.map((i) => i.categoria))];
  catBar.innerHTML = cats.map((c) =>
    `<button data-cat="${esc(c)}" class="${c === activeCat ? 'active' : ''}">${esc(c)}</button>`).join('');
  catBar.querySelectorAll('button').forEach((b) => b.onclick = () => {
    activeCat = b.dataset.cat;
    catBar.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
    renderMenu();
  });
  renderMenu();
}

function renderMenu() {
  const list = activeCat === 'Todos' ? items : items.filter((i) => i.categoria === activeCat);
  if (!list.length) { grid.innerHTML = '<div class="empty">Nada por aqui.</div>'; return; }
  // group by category for headers when "Todos"
  const groups = activeCat === 'Todos'
    ? [...new Set(list.map((i) => i.categoria))]
    : [activeCat];
  grid.innerHTML = groups.map((cat) => {
    const dishes = list.filter((i) => i.categoria === cat).map(dishCard).join('');
    return `<h3 class="cat-title">${esc(cat)}</h3>${dishes}`;
  }).join('');
  grid.querySelectorAll('.add').forEach((b) => b.onclick = () => addToCart(b.dataset.id));
}

function dishCard(i) {
  const st = STATIONS[i.station];
  return `<article class="dish card">
    <div class="info">
      <h3>${esc(i.nome)} <span class="tag ${i.station}" title="${st.label}">${st.icon}</span></h3>
      <p class="desc">${esc(i.descricao || '')}</p>
      <span class="price">${brl(i.preco)}</span>
    </div>
    <button class="btn btn-primary add" data-id="${i.id}" aria-label="Adicionar ${esc(i.nome)}">+</button>
  </article>`;
}

// ---- Cart -------------------------------------------------------------------
function addToCart(id) {
  const item = items.find((i) => i.id === id);
  if (!item) return;
  const row = cart.get(id) || { item, qtd: 0 };
  row.qtd += 1;
  cart.set(id, row);
  renderCart();
}
function changeQty(id, delta) {
  const row = cart.get(id);
  if (!row) return;
  row.qtd += delta;
  if (row.qtd <= 0) cart.delete(id);
  renderCart();
}
function renderCart() {
  const rows = [...cart.values()];
  const total = rows.reduce((s, r) => s + r.item.preco * r.qtd, 0);
  cartBar.classList.toggle('show', rows.length > 0);
  $('#cartTotal').textContent = brl(total);
  $('#cartItems').innerHTML = rows.map((r) => `
    <div class="cart-row">
      <span class="nm">${esc(r.item.nome)}</span>
      <span class="price" style="color:var(--cream-dim)">${brl(r.item.preco * r.qtd)}</span>
      <span class="qty">
        <button class="qbtn" data-id="${r.item.id}" data-d="-1">−</button>
        <b>${r.qtd}</b>
        <button class="qbtn" data-id="${r.item.id}" data-d="1">+</button>
      </span>
    </div>`).join('');
  $('#cartItems').querySelectorAll('.qbtn').forEach((b) =>
    b.onclick = () => changeQty(b.dataset.id, parseInt(b.dataset.d, 10)));
}

// ---- Send order -------------------------------------------------------------
async function sendOrder() {
  if (!mesa) { toast('Selecione a mesa primeiro.'); return; }
  if (!cart.size) return;
  const btn = $('#sendBtn');
  btn.disabled = true; btn.textContent = 'Enviando…';

  // Ensure the table is "aberta"
  await db.from(T.tables).update({ status: 'aberta', aberta_em: new Date().toISOString() })
    .eq('numero', mesa).eq('status', 'fechada');
  const { data: tbl } = await db.from(T.tables).select('id').eq('numero', mesa).maybeSingle();

  const { data: order, error: oErr } = await db.from(T.orders).insert({
    table_id: tbl?.id ?? null, numero_mesa: mesa, origem, status: 'aberto',
  }).select().single();
  if (oErr) { toast('Erro: ' + oErr.message); btn.disabled = false; btn.textContent = 'Enviar pedido →'; return; }

  const payload = [...cart.values()].map((r) => ({
    order_id: order.id,
    menu_item_id: r.item.id,
    nome: r.item.nome,
    qtd: r.qtd,
    station: r.item.station,
    status: 'pendente',
    preco_unit: r.item.preco,
    custo_unit: r.item.custo,
    numero_mesa: mesa,
  }));
  const { error: iErr } = await db.from(T.oitems).insert(payload);
  if (iErr) { toast('Erro: ' + iErr.message); btn.disabled = false; btn.textContent = 'Enviar pedido →'; return; }

  cart.clear(); renderCart();
  btn.disabled = false; btn.textContent = 'Enviar pedido →';
  toast('Pedido enviado para a cozinha! 🔥');
}

// ---- Toast ------------------------------------------------------------------
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---- Init -------------------------------------------------------------------
renderMesa();
loadMenu();
$('#sendBtn').onclick = sendOrder;
