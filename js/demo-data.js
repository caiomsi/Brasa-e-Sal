// Demo data engine — clears and re-seeds a realistic "mid-service" day so the
// system looks alive when shown to people, and the live flow can be re-run cleanly.
import { db, T, todayISO } from './supabase.js';

const ALL = '2000-01-01';
const minsAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Wipe every operational row (orders cascade to order_items) and reset tables.
export async function clearAll() {
  await db.from(T.orders).delete().gte('criado_em', ALL);
  await db.from(T.oitems).delete().gte('criado_em', ALL);   // safety (orphans)
  await db.from(T.expenses).delete().gte('data', ALL);
  await db.from(T.closings).delete().gte('data', ALL);
  await db.from(T.tables).update({ status: 'fechada', aberta_em: null, fechada_em: null }).gt('numero', 0);
}

async function menuByStation() {
  const { data } = await db.from(T.items).select('*').eq('disponivel', true);
  const by = { cozinha: [], churrasqueira: [], bar: [] };
  (data || []).forEach((i) => by[i.station]?.push(i));
  return by;
}

// Build one order + its items. `status` applies to every item; `ageMin` sets timestamps.
async function makeOrder({ mesa, items, status, ageMin, origem = 'garcom' }) {
  const { data: tbl } = await db.from(T.tables).select('id').eq('numero', mesa).maybeSingle();
  const { data: order } = await db.from(T.orders).insert({
    table_id: tbl?.id ?? null, numero_mesa: mesa, origem,
    status: status === 'entregue' ? 'aberto' : 'aberto', criado_em: minsAgo(ageMin),
  }).select().single();
  const rows = items.map((it) => ({
    order_id: order.id, menu_item_id: it.id, nome: it.nome, qtd: it.qtd ?? 1,
    station: it.station, status, preco_unit: it.preco, custo_unit: it.custo,
    numero_mesa: mesa, criado_em: minsAgo(ageMin),
    pronto_em: (status === 'pronto' || status === 'entregue') ? minsAgo(Math.max(0, ageMin - rand(3, 8))) : null,
    obs: it.obs ?? '',
  }));
  await db.from(T.oitems).insert(rows);
}

// Re-seed a believable day in service. Returns a short summary.
export async function seedDemo() {
  await clearAll();
  const m = await menuByStation();
  const churr = m.churrasqueira, coz = m.cozinha, bar = m.bar;
  let sold = 0, count = 0;

  const withQty = (it, q = 1, obs = '') => ({ ...it, qtd: q, obs });

  // 1) HISTORY — earlier today, already delivered (these drive the Caixa numbers)
  for (let i = 0; i < 13; i++) {
    const items = [
      withQty(pick(churr), rand(1, 2)),
      withQty(pick(coz)),
      withQty(pick(bar), rand(1, 2)),
    ];
    if (Math.random() > 0.5) items.push(withQty(pick(churr)));
    await makeOrder({ mesa: rand(1, 12), items, status: 'entregue', ageMin: rand(45, 300), origem: pick(['garcom', 'cliente']) });
    sold += items.reduce((s, it) => s + it.preco * it.qtd, 0);
    count++;
  }

  // 2) AT THE COUNTER now — ready, waiting to be delivered (balcão)
  await db.from(T.tables).update({ status: 'aberta', aberta_em: minsAgo(40) }).in('numero', [2, 5, 7, 9]);
  await makeOrder({ mesa: 2, items: [withQty(pick(churr)), withQty(pick(coz))], status: 'pronto', ageMin: rand(6, 12) });
  await makeOrder({ mesa: 9, items: [withQty(pick(bar), 2)], status: 'pronto', ageMin: rand(4, 9) });

  // 3) IN PREP now — live tickets on the grill + kitchen (varied ages => urgency colors)
  await makeOrder({ mesa: 5, items: [withQty(pick(churr), 1, 'ao ponto'), withQty(pick(churr))], status: 'preparando', ageMin: rand(10, 16) });
  await makeOrder({ mesa: 7, items: [withQty(pick(coz)), withQty(pick(coz))], status: 'preparando', ageMin: rand(3, 7) });
  await makeOrder({ mesa: 5, items: [withQty(pick(churr), 1, 'sem sal')], status: 'pendente', ageMin: rand(1, 3) });
  await makeOrder({ mesa: 7, items: [withQty(pick(coz))], status: 'pendente', ageMin: 1 });

  // 4) Today's expenses
  await db.from(T.expenses).insert([
    { data: todayISO(), descricao: 'Carnes (açougue)', valor: 420.00 },
    { data: todayISO(), descricao: 'Gás de cozinha', valor: 90.00 },
    { data: todayISO(), descricao: 'Bebidas (distribuidora)', valor: 180.00 },
    { data: todayISO(), descricao: 'Diária — ajudante', valor: 120.00 },
  ]);

  return { orders: count + 6, brutoAprox: sold };
}
