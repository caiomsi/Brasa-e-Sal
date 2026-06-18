// Kitchen Display System — shared by cozinha.html and churrasqueira.html.
// Station is read from <body data-station="cozinha|churrasqueira">.
import { db, T, esc, $, elapsed, urgency, beep, armAudioOnFirstGesture } from './supabase.js';

const STATION = document.body.dataset.station;
const ACTIVE = ['pendente', 'preparando'];

let tickets = [];
let firstLoad = true;
const grid = $('#ticketGrid');

armAudioOnFirstGesture();

function render() {
  const active = tickets
    .filter((t) => ACTIVE.includes(t.status))
    .sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em));
  $('#counter').textContent = `${active.length} ${active.length === 1 ? 'item' : 'itens'} na fila`;

  if (!active.length) {
    grid.innerHTML = `<div class="empty"><div class="big">✨</div>Tudo em dia — nenhum pedido pendente.</div>`;
    return;
  }
  grid.innerHTML = active.map(ticketCard).join('');
  grid.querySelectorAll('[data-act]').forEach((b) =>
    b.onclick = () => act(b.dataset.id, b.dataset.act));
}

function ticketCard(t) {
  const u = urgency(t.criado_em);
  const obs = t.obs ? `<div class="obs">📝 ${esc(t.obs)}</div>` : '';
  const startBtn = t.status === 'pendente'
    ? `<button class="btn btn-sm btn-ghost" data-act="preparando" data-id="${t.id}">Iniciar</button>` : '';
  const stateLbl = t.status === 'preparando'
    ? '<span class="status-line">● Em preparo</span>' : '<span class="status-line">○ Aguardando</span>';
  return `<article class="ticket ${u}">
    <div class="t-top">
      <span class="mesa">Mesa ${t.numero_mesa ?? '—'}</span>
      <span class="when">${elapsed(t.criado_em)}</span>
    </div>
    <div class="qty-name"><b>${t.qtd}×</b> ${esc(t.nome)}</div>
    ${obs}
    ${stateLbl}
    <div class="acts">
      ${startBtn}
      <button class="btn btn-sm btn-green" data-act="pronto" data-id="${t.id}">✓ Pronto</button>
    </div>
  </article>`;
}

async function act(id, status) {
  const patch = { status };
  if (status === 'pronto') patch.pronto_em = new Date().toISOString();
  // optimistic
  const t = tickets.find((x) => x.id === id);
  if (t) { Object.assign(t, patch); render(); }
  await db.from(T.oitems).update(patch).eq('id', id);
}

async function load() {
  const { data, error } = await db.from(T.oitems)
    .select('*').eq('station', STATION).in('status', ACTIVE)
    .order('criado_em');
  if (error) { grid.innerHTML = `<div class="empty">Erro: ${esc(error.message)}</div>`; return; }
  tickets = data || [];
  firstLoad = false;
  render();
}

// Realtime: any change to order_items of this station
db.channel(`kds-${STATION}`)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: T.oitems, filter: `station=eq.${STATION}` },
    (payload) => {
      const row = payload.new || payload.old;
      const idx = tickets.findIndex((t) => t.id === row.id);
      if (payload.eventType === 'INSERT') {
        tickets.push(payload.new);
        if (!firstLoad) beep('new');
      } else if (payload.eventType === 'UPDATE') {
        if (idx >= 0) tickets[idx] = payload.new; else tickets.push(payload.new);
      } else if (payload.eventType === 'DELETE') {
        if (idx >= 0) tickets.splice(idx, 1);
      }
      render();
    })
  .subscribe();

// Refresh elapsed labels every 20s
setInterval(render, 20000);
load();
