// Balcão — fila de itens PRONTOS aguardando entrega, com alerta sonoro.
import { db, T, esc, $, elapsed, beep, armAudioOnFirstGesture, STATIONS } from './supabase.js';

let ready = [];
let firstLoad = true;
const grid = $('#ticketGrid');

armAudioOnFirstGesture();

function render() {
  ready.sort((a, b) => new Date(a.pronto_em || a.criado_em) - new Date(b.pronto_em || b.criado_em));
  $('#counter').textContent = `${ready.length} ${ready.length === 1 ? 'item pronto' : 'itens prontos'}`;
  if (!ready.length) {
    grid.innerHTML = `<div class="empty"><div class="big">🛎️</div>Nenhum item aguardando no balcão.</div>`;
    return;
  }
  grid.innerHTML = ready.map((t) => {
    const st = STATIONS[t.station] || { icon: '' };
    return `<article class="ticket fresh">
      <div class="t-top">
        <span class="mesa">Mesa ${t.numero_mesa ?? '—'}</span>
        <span class="when">pronto ${elapsed(t.pronto_em)}</span>
      </div>
      <div class="qty-name"><b>${t.qtd}×</b> ${esc(t.nome)} <span class="tag ${t.station}">${st.icon}</span></div>
      <div class="acts">
        <button class="btn btn-sm btn-primary btn-block" data-id="${t.id}">✓ Entregue na mesa</button>
      </div>
    </article>`;
  }).join('');
  grid.querySelectorAll('[data-id]').forEach((b) => b.onclick = () => deliver(b.dataset.id));
}

async function deliver(id) {
  const idx = ready.findIndex((t) => t.id === id);
  if (idx >= 0) ready.splice(idx, 1);
  render();
  await db.from(T.oitems).update({ status: 'entregue' }).eq('id', id);
}

async function load() {
  const { data, error } = await db.from(T.oitems)
    .select('*').eq('status', 'pronto').order('pronto_em');
  if (error) { grid.innerHTML = `<div class="empty">Erro: ${esc(error.message)}</div>`; return; }
  ready = data || [];
  firstLoad = false;
  render();
}

db.channel('balcao')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: T.oitems },
    (payload) => {
      const row = payload.new || payload.old;
      const idx = ready.findIndex((t) => t.id === row.id);
      const isReady = payload.new && payload.new.status === 'pronto';
      if (isReady && idx < 0) {
        ready.push(payload.new);
        if (!firstLoad) beep('ready');
      } else if (isReady && idx >= 0) {
        ready[idx] = payload.new;
      } else if (!isReady && idx >= 0) {
        ready.splice(idx, 1);
      }
      render();
    })
  .subscribe();

setInterval(render, 20000);
load();
