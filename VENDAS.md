# Brasa & Sal — Guia de Vendas

Material para apresentar e vender o sistema a um restaurante / churrascaria real.
Tudo aqui é para você **falar com o dono**. Decore o pitch de uma frase e o roteiro
da demo — o resto é apoio.

---

## 1. O pitch de uma frase

> **"É um sistema completo de churrascaria em tempo real: leva o pedido da mesa do
> cliente até o lucro líquido do fim do dia — sem app para instalar e com custo
> mensal baixíssimo."**

Tudo o que vem depois é só provar essa frase.

---

## 2. As 5 telas (a lista de funcionalidades)

| Tela | Quem usa | O que faz | A frase de impacto |
|------|----------|-----------|--------------------|
| **Cardápio & Pedido** | Cliente (QR da mesa) ou garçom | Cardápio digital por categoria, carrinho, envia o pedido direto pra produção | *"O cliente lê o QR da mesa e pede sozinho — ou o garçom lança pelo celular. Zero papel."* |
| **Cozinha** | Cozinha | Comandas ao vivo, só os itens da cozinha, tempo de espera, **fica amarelo aos 8 min e vermelho aos 15 min**, botões Iniciar → Pronto | *"O pedido cai aqui na hora e a comanda muda de cor — nada é esquecido."* |
| **Churrasqueira** | Churrasqueiro | A mesma coisa, mas **só os itens da brasa** — separados automaticamente | *"O sistema já sabe que a picanha vai pra brasa e a batata pra cozinha. Ele separa sozinho."* |
| **Balcão** | Quem entrega | Fila dos pratos **prontos** com **alerta sonoro** no instante em que ficam prontos, botão Entregue | *"Ele apita no segundo que o prato fica pronto — Mesa 4, pode levar."* |
| **Caixa & Fechamento** | Dono / caixa (PIN) | Abre/fecha mesas, **fechamento do dia**, despesas, cadastro de cardápio e preços | *"No fim da noite você aperta um botão e ele te diz quanto você realmente ganhou."* |

---

## 3. A funcionalidade que fecha a venda — a conta do lucro

É isto que faz o dono dizer sim. A tela de Caixa calcula, **automaticamente, todo dia:**

```
Faturamento Bruto   = tudo o que foi vendido
−  CMV               = o custo do que foi vendido (controlado por item)
−  Despesas do dia   = as despesas que você lançou
= LUCRO LÍQUIDO      ← o lucro de verdade
```

A maioria dos restaurantes pequenos **não faz ideia** de quanto ganhou na noite.
Seu sistema diz, sozinho, e ainda mostra quais pratos mais venderam.
**Na demo, termine nesta tela** — é o fechamento da venda.

---

## 4. Por que ganha da concorrência (seus diferenciais)

- **Tempo real** — o pedido aparece na cozinha na hora (não é "atualize a página").
- **Separação automática por estação** — cozinha, churrasqueira e bar, ninguém triando comanda.
- **Alerta sonoro** — prato pronto não fica esfriando no balcão.
- **Lucro e margem por item** — custo embutido no cadastro do cardápio.
- **Sem app, sem instalação** — roda em qualquer celular, tablet ou PC velho com navegador.
- **O dono controla o cardápio** — adiciona item, muda preço, esconde o que acabou, sem chamar programador.
- **Custo baixíssimo** — cerca de **R$ 130/mês** de infraestrutura (Supabase Pro + domínio).
  Sem licença por terminal, **sem comissão por venda** como os apps de delivery e os PDVs grandes.

> **Sua arma mais forte:** os sistemas grandes cobram **um percentual de cada venda**.
> O seu é um valor fixo. Em um restaurante movimentado isso é a diferença de milhares de reais por mês.

---

## 5. Roteiro da demo ao vivo (decore — ela se vende sozinha)

1. Abra o **Cardápio** e a **Cozinha** lado a lado (duas janelas/celulares).
2. Adicione uma carne + um acompanhamento, aperte **Enviar pedido**. → *"Olha a cozinha."* Aparece na hora.
3. Mostre que o item da brasa caiu na **Churrasqueira**, não na cozinha. → *"Ele separou sozinho."*
4. Aperte **Pronto**. Vá pro **Balcão** — ele **apita**. → *"Essa é a deixa de quem entrega."*
5. Vá em **Caixa → Fechamento** e aperte **Fechar o dia**. → *"E esse é o seu lucro. Toda noite, automático."*

> **Antes de cada demo:** no Caixa há o botão **"🎬 Resetar demo"** que enche o dia
> com pedidos realistas — as telas ficam vivas quando o cliente está olhando.

---

## 6. Quebra de objeções

| O dono diz… | Você responde… |
|-------------|----------------|
| *"É seguro?"* | *"A demo é 100% funcional. Pra entrar no seu restaurante eu coloco login de funcionário de verdade, tranco o banco de dados por função e ponho no seu domínio. Mesmo custo mensal."* |
| *"Meus funcionários não sabem mexer."* | *"Se sabem usar WhatsApp, sabem usar isto. Comanda com botão verde 'Pronto', e olha — a tela apita sozinha."* |
| *"Quanto vou pagar por mês?"* | *"A mensalidade é fixa, não é percentual da venda. Você não paga por terminal nem por pedido."* |
| *"E se cair a internet?"* | *"Roda em qualquer celular com 4G como backup; a operação não depende de uma máquina só."* |
| *"Já tenho um caderno/caderneta."* | *"E no fim do mês você sabe o lucro líquido por prato? Isto te dá isso sozinho, todo dia."* |

---

## 7. O que é demo vs. produção (seja honesto)

A demo é totalmente funcional. Para instalar num restaurante de verdade faltam 3 coisas
(≈ uma semana de trabalho, **sem mudar o custo mensal**):

1. **Login de funcionário** — hoje o Caixa é protegido por um PIN no front-end; troco por contas reais (Supabase Auth).
2. **Regras de acesso ao banco por função** — cliente só cria pedido; cozinha só atualiza status; caixa tem acesso total.
3. **Marca do cliente** — nome, logo e cores do restaurante no lugar de "Brasa & Sal", num domínio próprio.

(Detalhes técnicos em `TODO-PRODUCTION.md`.)

---

## 8. Modelo de preço e proposta

> ⚠️ **Os valores abaixo são um ponto de partida — ajuste à sua região e ao porte do cliente.**
> O custo real de infraestrutura é ~**R$ 130/mês**. Tudo acima disso é sua margem e seu suporte.

### Estrutura recomendada: **Implantação (uma vez) + Mensalidade**

**A. Implantação (taxa única)** — cobre setup, marca do cliente, deploy no domínio,
cadastro do cardápio inicial e treinamento da equipe.

| Porte do cliente | Implantação sugerida |
|------------------|----------------------|
| Pequeno (1 churrasqueira, até ~10 mesas) | R$ 1.500 – R$ 2.500 |
| Médio (cozinha + churrasqueira, salão cheio) | R$ 2.500 – R$ 4.000 |
| Grande / rede | R$ 4.000+ (orçamento sob medida) |

**B. Mensalidade** — cobre infraestrutura (~R$ 130), suporte, pequenos ajustes e o cardápio sempre no ar.

| Plano | Mensalidade sugerida | Inclui |
|-------|----------------------|--------|
| Essencial | R$ 199/mês | Sistema no ar, suporte por mensagem, atualizações |
| Completo | R$ 349/mês | + ajustes de cardápio por você, suporte prioritário |
| Rede / multi-loja | sob consulta | Várias unidades, relatórios consolidados |

> **Margem real:** numa mensalidade de R$ 199 com custo de R$ 130, você fica com ~R$ 70/mês
> de margem **por cliente** + a implantação. O lucro escala quando você tem vários clientes
> na **mesma** infraestrutura.

### Modelo de proposta de uma página (copie e preencha)

```
PROPOSTA — Sistema de Gestão para [NOME DO RESTAURANTE]

O que entrego:
• Cardápio digital com QR Code nas mesas (cliente pede sozinho)
• Telas de Cozinha e Churrasqueira em tempo real, com separação automática
• Balcão com alerta sonoro de prato pronto
• Caixa com fechamento do dia: faturamento, CMV, despesas e LUCRO LÍQUIDO
• Cadastro de cardápio e preços que VOCÊ controla
• Login de funcionários e seu domínio próprio (ex.: pedidos.[restaurante].com.br)

Investimento:
• Implantação (uma vez): R$ ________  (setup, sua marca, treinamento)
• Mensalidade: R$ ________ /mês  (infraestrutura, suporte e atualizações)

Sem comissão por venda. Sem licença por terminal.
Prazo de implantação: ~[5–7] dias úteis.

Validade desta proposta: [data]
MSI Studio · [seu contato]
```

---

## 9. Checklist antes de visitar o cliente

- [ ] Apertei **"Resetar demo"** no Caixa para as telas estarem cheias.
- [ ] Testei a demo: pedido → cozinha → pronto → balcão (com som) → fechamento.
- [ ] Tenho duas telas/celulares para mostrar a sincronização ao vivo.
- [ ] Sei o PIN do Caixa (`2468`) e o roteiro da seção 5 de cor.
- [ ] Levo a proposta da seção 8 pronta para preencher na hora.

---

_Marca fictícia para portfólio da MSI Studio. Adapte para a marca do cliente na venda real._
