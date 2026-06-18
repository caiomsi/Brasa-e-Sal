# Brasa & Sal — Sistema de Churrascaria

Demo de portfólio (marca fictícia) de um **sistema completo de churrascaria** em tempo real,
construído em HTML/CSS/JS puro no front + **Supabase** (Postgres + Realtime) no back.

## O fluxo

```
📱 Pedido (QR da mesa ou garçom)
        ↓  em tempo real
🍳 Cozinha   /   🔥 Churrasqueira   ← cada item cai na estação certa
        ↓  botão "Pronto"
🛎️ Balcão   ← aviso sonoro: "pedido pronto na mesa X"
        ↓
💰 Caixa  →  fecha as mesas, fecha o dia: Bruto − CMV − Despesas = Líquido
```

## Telas

| Página | Quem usa | O que faz |
|--------|----------|-----------|
| `index.html` | — | Portal: explica o fluxo e linka todas as telas |
| `cardapio.html` | Cliente (`?mesa=N` do QR) / Garçom | Cardápio digital + carrinho → envia o pedido |
| `cozinha.html` | Cozinha | Comandas da cozinha ao vivo, botão **Pronto** |
| `churrasqueira.html` | Churrasqueiro | Só os itens da brasa, botão **Pronto** |
| `balcao.html` | Balcão | Fila de prontos com **som**, botão **Entregue** |
| `admin.html` | Caixa (PIN `2468`) | Mesas, **fechamento do dia**, despesas, cardápio |

## Rodar local

```bash
cd Brasa-e-Sal
python3 -m http.server
# abra http://localhost:8000
```

Abra `cardapio.html` e `cozinha.html` em janelas separadas para ver a sincronização ao vivo.

## Backend

Tudo no Supabase — ver [`supabase/README.md`](supabase/README.md) para tabelas, realtime,
a conta do lucro e a nota de segurança (modo demo). Config do client em `js/supabase.js`.

> Marca fictícia, criada para o portfólio da **MSI Studio**.
