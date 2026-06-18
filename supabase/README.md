# Brasa & Sal — backend (Supabase)

This demo runs on **Supabase** (Postgres + Realtime). It is **stateful** — unlike the
static marketing sites in this folder, orders/tables/closings are stored in a real DB
and synced across devices in real time.

## Project

- Lives in the existing Supabase project **`caiomsi's Project`** (`hktzefkarulgoqueotun`),
  in the `public` schema, with every table prefixed **`brasa_`** so it shares the
  project cleanly without colliding with anything else.
- Frontend config is in [`../js/supabase.js`](../js/supabase.js): the project URL and the
  **publishable (anon) key** — safe to ship in client code.

## Tables

| Table | Purpose |
|-------|---------|
| `brasa_menu_items` | Menu: `preco`, `custo`, `station` (cozinha/churrasqueira/bar), `disponivel` |
| `brasa_restaurant_tables` | Dining tables 1–12, `status` aberta/fechada |
| `brasa_orders` | One order/round tied to a table (`origem`: garcom/cliente) |
| `brasa_order_items` | Each ordered item — routed by `station`, lifecycle `status` (pendente → preparando → pronto → entregue). `preco_unit`/`custo_unit` are snapshotted at order time |
| `brasa_expenses` | Daily fixed/variable expenses |
| `brasa_daily_closings` | One row per day: `bruto`, `cmv`, `despesas`, `liquido` |

## Realtime

`brasa_order_items`, `brasa_orders`, and `brasa_restaurant_tables` are added to the
`supabase_realtime` publication. The KDS / balcão screens subscribe to `postgres_changes`
and update instantly (kitchen/grill filter by `station`, balcão by `status='pronto'`).

## Money math (fechamento)

```
Bruto    = Σ (qtd × preco_unit)   de itens não cancelados do dia
CMV      = Σ (qtd × custo_unit)   dos mesmos itens
Despesas = Σ brasa_expenses.valor do dia
Líquido  = Bruto − CMV − Despesas
```

## Security note (demo)

RLS is **enabled but permissive**: a single `demo_all` policy lets `anon` read/write the
operational tables, and the admin screen is gated only by a front-end PIN (`2468`). This
is intentional for a public portfolio demo. For a real deployment you'd add Supabase Auth,
staff roles, and per-role RLS policies (e.g. only authenticated staff can write).

## Recreating the schema

The full DDL + seed lives in [`schema.sql`](schema.sql). It was applied as the migrations
`brasa_e_sal_schema` and `brasa_e_sal_seed`. To rebuild on a fresh project, run that file
against the database and update the URL/key in `../js/supabase.js`.
