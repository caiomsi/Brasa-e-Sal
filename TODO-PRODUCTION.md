# Brasa & Sal — checklist para produção (antes de entregar a um restaurante real)

O sistema funciona ponta a ponta como **demo**. Os itens abaixo são o que falta para
colocá-lo com segurança na frente de um restaurante de verdade. Nenhum deles muda o
custo mensal (~$26/mo: Supabase Pro + domínio) — são trabalho de desenvolvimento.

## 🔒 Segurança (prioridade alta)

- [ ] **Login de funcionários** — hoje o Caixa é protegido só por um PIN no front-end
      (`2468` em `js/admin.js`). Trocar por **Supabase Auth** (incluso de graça) com
      contas reais de staff.
- [ ] **Travar a RLS** — hoje existe uma política `demo_all` que deixa o `anon` ler/escrever
      tudo (`supabase/schema.sql`). Substituir por políticas por papel:
      - cliente/garçom: só pode **criar** pedidos;
      - cozinha/churrasqueira: só pode **atualizar status** de itens da sua estação;
      - caixa/admin: acesso total, exigindo usuário autenticado.
- [ ] **Proteger telas internas** — cozinha/churrasqueira/balcão/admin devem exigir login
      (cardápio do cliente continua público).

## ⚙️ Infraestrutura

- [ ] **Supabase Pro ($25/mo)** — necessário em produção: sem pausa por inatividade,
      backups diários, headroom. (Free pausa após 7 dias parados e não tem backup.)
- [ ] **Domínio próprio** (ex.: `pedidos.nomedorestaurante.com.br`) + HTTPS.
- [ ] **Hospedagem estática** dedicada do cliente (Cloudflare Pages é grátis e ok comercial).

## 🧪 Robustez / qualidade (bom ter)

- [ ] **Cancelar / estornar item** na tela do caixa (status `cancelado` já existe no schema).
- [ ] **Conta da mesa / dividir conta** + registrar forma de pagamento.
- [ ] **Fechamento por intervalo** (semana/mês), não só o dia.
- [ ] **Reabrir o dia / editar fechamento** caso lancem despesa depois de fechar.
- [ ] **Tratamento de erro/offline** nas telas (rede caindo no meio do serviço).
- [ ] **Marca real** do cliente (nome, logo, cores) no lugar de "Brasa & Sal".

---
_Discutido em 2026-06-18 ao avaliar custo mensal e prontidão para venda._
