-- ============================================================
-- Brasa & Sal — full schema + seed (idempotent)
-- Run against the Supabase Postgres DB, then set URL/key in ../js/supabase.js
-- ============================================================

create table if not exists brasa_menu_items (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  descricao   text default '',
  categoria   text not null default 'Pratos',
  preco       numeric(10,2) not null default 0,
  custo       numeric(10,2) not null default 0,
  station     text not null default 'cozinha' check (station in ('cozinha','churrasqueira','bar')),
  disponivel  boolean not null default true,
  imagem_url  text default '',
  ordem       int not null default 0,
  criado_em   timestamptz not null default now()
);

create table if not exists brasa_restaurant_tables (
  id          uuid primary key default gen_random_uuid(),
  numero      int not null unique,
  apelido     text default '',
  status      text not null default 'fechada' check (status in ('aberta','fechada')),
  aberta_em   timestamptz,
  fechada_em  timestamptz
);

create table if not exists brasa_orders (
  id          uuid primary key default gen_random_uuid(),
  table_id    uuid references brasa_restaurant_tables(id) on delete set null,
  numero_mesa int,
  origem      text not null default 'garcom' check (origem in ('garcom','cliente')),
  status      text not null default 'aberto' check (status in ('aberto','fechado')),
  criado_em   timestamptz not null default now()
);

create table if not exists brasa_order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references brasa_orders(id) on delete cascade,
  menu_item_id  uuid references brasa_menu_items(id) on delete set null,
  nome          text not null,
  qtd           int not null default 1 check (qtd > 0),
  station       text not null default 'cozinha',
  status        text not null default 'pendente' check (status in ('pendente','preparando','pronto','entregue','cancelado')),
  preco_unit    numeric(10,2) not null default 0,
  custo_unit    numeric(10,2) not null default 0,
  obs           text default '',
  numero_mesa   int,
  criado_em     timestamptz not null default now(),
  pronto_em     timestamptz
);

create table if not exists brasa_expenses (
  id         uuid primary key default gen_random_uuid(),
  data       date not null default current_date,
  descricao  text not null default '',
  valor      numeric(10,2) not null default 0,
  criado_em  timestamptz not null default now()
);

create table if not exists brasa_daily_closings (
  id         uuid primary key default gen_random_uuid(),
  data       date not null unique,
  bruto      numeric(12,2) not null default 0,
  cmv        numeric(12,2) not null default 0,
  despesas   numeric(12,2) not null default 0,
  liquido    numeric(12,2) not null default 0,
  fechado_em timestamptz not null default now()
);

create index if not exists idx_brasa_order_items_station_status on brasa_order_items(station, status);
create index if not exists idx_brasa_order_items_order on brasa_order_items(order_id);
create index if not exists idx_brasa_orders_mesa on brasa_orders(numero_mesa, status);

-- ---- RLS (demo: open to anon) -------------------------------
alter table brasa_menu_items        enable row level security;
alter table brasa_restaurant_tables enable row level security;
alter table brasa_orders            enable row level security;
alter table brasa_order_items       enable row level security;
alter table brasa_expenses          enable row level security;
alter table brasa_daily_closings    enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'brasa_menu_items','brasa_restaurant_tables','brasa_orders',
    'brasa_order_items','brasa_expenses','brasa_daily_closings'
  ] loop
    execute format('drop policy if exists demo_all on %I;', t);
    execute format('create policy demo_all on %I for all to anon, authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- ---- Realtime ------------------------------------------------
do $$ begin alter publication supabase_realtime add table brasa_order_items;       exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table brasa_orders;            exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table brasa_restaurant_tables; exception when duplicate_object then null; end $$;

-- ---- Seed ----------------------------------------------------
insert into brasa_restaurant_tables (numero, status)
select g, 'fechada' from generate_series(1,12) g
on conflict (numero) do nothing;

insert into brasa_menu_items (nome, descricao, categoria, preco, custo, station, ordem) values
  ('Picanha na Brasa (300g)', 'Picanha selada na brasa, farofa e vinagrete', 'Churrasco', 89.00, 38.00, 'churrasqueira', 1),
  ('Costela Fogo de Chão', 'Costela bovina assada lentamente na brasa', 'Churrasco', 76.00, 30.00, 'churrasqueira', 2),
  ('Fraldinha Premium (300g)', 'Fraldinha grelhada ao ponto', 'Churrasco', 72.00, 28.00, 'churrasqueira', 3),
  ('Espetinho de Frango', 'Espeto de frango temperado na brasa', 'Churrasco', 18.00, 6.00, 'churrasqueira', 4),
  ('Linguiça Artesanal', 'Linguiça de pernil grelhada', 'Churrasco', 32.00, 11.00, 'churrasqueira', 5),
  ('Pão de Alho na Brasa', 'Pão de alho dourado na grelha', 'Entradas', 16.00, 4.50, 'churrasqueira', 6),
  ('Arroz Branco', 'Porção de arroz soltinho', 'Acompanhamentos', 14.00, 3.00, 'cozinha', 7),
  ('Farofa da Casa', 'Farofa amanteigada com bacon', 'Acompanhamentos', 15.00, 4.00, 'cozinha', 8),
  ('Fritas Rústicas', 'Batata frita rústica com alecrim', 'Acompanhamentos', 24.00, 7.00, 'cozinha', 9),
  ('Salada Verde', 'Mix de folhas, tomate e cebola roxa', 'Acompanhamentos', 19.00, 5.50, 'cozinha', 10),
  ('Vinagrete', 'Molho vinagrete fresco', 'Acompanhamentos', 9.00, 2.00, 'cozinha', 11),
  ('Pudim de Leite', 'Pudim cremoso da casa', 'Sobremesas', 16.00, 4.00, 'cozinha', 12),
  ('Refrigerante Lata', 'Lata 350ml', 'Bebidas', 7.00, 2.50, 'bar', 13),
  ('Suco Natural', 'Suco da fruta 400ml', 'Bebidas', 12.00, 4.00, 'bar', 14),
  ('Cerveja Long Neck', 'Cerveja gelada 355ml', 'Bebidas', 13.00, 5.00, 'bar', 15),
  ('Água Mineral', 'Com ou sem gás 500ml', 'Bebidas', 5.00, 1.50, 'bar', 16)
on conflict do nothing;
