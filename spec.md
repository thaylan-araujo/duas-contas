# Duas Contas — Instruções para o Claude Code

28/10/2026 · Thaylan

## Como usar este documento

Este documento é a especificação completa do Duas Contas, para entregar ao Claude Code no Antigravity. Siga estes passos:

1. Salve este arquivo na pasta do projeto com o nome `spec.md`.
2. Salve também o `CLAUDE.md` na raiz do projeto. O Claude Code lê esse arquivo sozinho em toda conversa: ele traz as regras fixas, como investigar antes de corrigir qualquer problema.
3. Crie uma pasta `design/` dentro do projeto e coloque nela o arquivo `telas-duas-contas.pdf`, que tem os prints de todas as telas.
4. Abra o Claude Code no **modo de planejamento** e cole o prompt principal (próxima seção).
5. Leia o plano que ele propuser, ajuste o que quiser e só então aprove a execução.
6. Construa **uma etapa por vez**, usando os prompts prontos do fim do documento. Teste cada etapa antes de passar para a próxima.

## Prompt principal

Cole este texto no modo de planejamento do Claude Code:

```text
Quero criar uma ferramenta web de organização financeira chamada "Duas Contas", para uso pessoal.
Ela organiza duas contas separadas: a CASA (meu orçamento doméstico) e a EMPRESA (minha empresa no Simples Nacional, que trabalha com afiliados Shopee e Shein por grupos de WhatsApp e anúncios no Meta).

A regra central do sistema: dinheiro da empresa só passa para a casa como pró-labore, registrado como uma transferência. As duas contas nunca se misturam.

A especificação completa está no arquivo spec.md, e os prints das telas estão em design/telas-duas-contas.pdf.
Leia os dois com atenção e, antes de escrever qualquer código:
1. Proponha a estrutura do projeto e o modelo de dados.
2. Divida o trabalho nas etapas descritas no spec.md.
3. Me diga o que ficou ambíguo e o que você sugere em cada ponto.

Tudo em português do Brasil: textos da interface, valores em R$ (formato 1.234,56) e datas em dd/mm/aaaa.
Comece só pela Etapa 1 depois que eu aprovar o plano.
```

**O que o sistema precisa resolver:**

- Planejar o mês: quanto vai para comida, lazer, combustível e o resto, dentro de um teto.
- Acompanhar semana a semana o que foi gasto e quanto ainda sobra.
- Não esquecer nenhum vencimento: DAS, parcelamento do Simples, Pronampe e contas fixas.
- Saber quais canais da empresa dão lucro depois dos anúncios.
- Prever o caixa da empresa com 3 a 6 meses de antecedência.

## Telas e funcionalidades

São 9 telas. Um menu lateral fixo agrupa as telas em Visão geral, Casa, Empresa e Geral. No celular, o menu vira uma barra no topo.

### 1. Visão geral (painel)

- Botão no topo para alternar entre **Casa** e **Empresa**.
- **Casa:** cartões com teto do mês, total planejado, folga e gasto até hoje. Mostra também barras de para onde vai o dinheiro, por categoria, e um gráfico de gasto semana a semana.
- **Empresa:** cartões com faturamento, DAS do mês, parcelas de dívidas e sobra para pró-labore. Mostra o "caminho do dinheiro" (faturamento → impostos → dívidas → caixa → pró-labore para a casa) e uma tabela de compromissos.
- Botão "+ Novo lançamento" sempre visível.

### 2. Lançamento rápido (celular)

- Escolhe a conta (Casa ou Empresa), o tipo (saída ou entrada), o valor, a categoria, a data (padrão: hoje) e uma observação opcional.
- Depois de escolher a categoria, mostra quanto ainda resta nela no mês.
- Precisa ser rápido de usar com uma mão: botões grandes, teclado numérico no campo de valor.

### 3. Planejamento e semanas (Casa)

- O usuário define o **teto de gastos do mês** (padrão R$ 3.000).
- Tabela de planejamento: cada gasto tem nome, grupo (Comida, Combustível, Lazer, Contas fixas, Outros), valor por vez e quantas vezes acontece no mês. O total do mês e a % do teto são calculados.
- Os valores iniciais vêm da rotina atual:
    - Compra do mês: R$ 1.000 × 1, na semana 1 (já inclui o mercado da 1ª semana).
    - Mercado semanal: R$ 250 × 3, nas semanas 2 a 4.
    - Combustível: R$ 100 × 4.
    - Lazer de sábado: R$ 150 × 4.
    - Outros: R$ 0.
- Resumo com total planejado, folga (ou quanto passou do teto) e barra dividida por grupo.
- **Gastos semanais:** 4 cartões, um por semana. Cada um lista só o que cai naquela semana, com o valor planejado e um campo "Gastei R$". Mostra o restante em cada item e no total da semana.
- Botão "Copiar plano do mês anterior".

### 4. Contas fixas, gastos do ano e metas (Casa)

- **Contas fixas:** luz, água, internet, celular, streaming. Cada uma tem dia de vencimento, valor e um campo de débito automático (sim/não). O total entra sozinho no planejamento do mês, no grupo Contas fixas.
- **Gastos do ano ÷ 12:** IPVA e licenciamento do carro (Goiás), manutenção do carro e presentes de fim de ano. Cada um tem valor no ano e mês de vencimento. O sistema calcula quanto guardar por mês.
- **Metas e reserva:** caixinhas com nome, valor da meta, valor guardado e prazo. Mostra barra de progresso e quanto guardar por mês. Começa com "Reserva de emergência" e "Caixinha do carro".

### 5. Canais e caixa (Empresa)

- **Faturamento por canal:** Dicas da Liz (Shopee, casa e decoração), Achadinhos da Mel (Shein, moda) e Infoproduto (em breve). Para cada canal: comissões do mês, gasto com anúncios no Meta, lucro do canal e retorno.
- **Fluxo de caixa projetado:** colunas para os próximos 3 ou 6 meses. Linhas: saldo inicial, comissões previstas, DAS, parcelamento do Simples, Pronampe, anúncios, pró-labore e saldo final.
- **Alerta de caixa:** se o saldo final de algum mês ficar negativo, mostra um aviso com o mês e quanto falta, e destaca a célula.

### 6. Dívidas (Empresa)

- Cartões resumo: total ainda devido, parcelas por mês e mês previsto para ficar livre de dívidas.
- Um cartão por dívida, começando com **Pronampe (Itaú)** e **Parcelamento do Simples** (iniciado em out/2026, 1ª parcela paga). Cada cartão mostra parcelas pagas de total, barra de progresso, saldo devedor, valor da parcela e dia de vencimento.
- Status por dívida: Em dia, Acompanhar ou Atrasada (com dias de atraso).
- Histórico de parcelas e botão "Registrar pagamento". Ao registrar um pagamento, o sistema cria automaticamente o lançamento de saída na conta Empresa.

### 7. Calendário de vencimentos (Geral)

- Calendário mensal que mostra os vencimentos e gastos programados da Casa e da Empresa, cada conta com uma cor.
- Lista lateral com os compromissos do mês e seus valores.
- Alertas configuráveis: avisar 3 dias antes, avisar no dia às 9h e, futuramente, avisar pelo WhatsApp.

### 8. Relatório mensal (Geral)

- Escolha do mês e botão "Baixar PDF".
- Cartões: gasto da casa contra o planejado, comparação com o mês anterior, faturamento da empresa e lucro após dívidas.
- Tabela da casa: planejado, gasto, diferença e comparação com o mês anterior, por categoria.
- Gráfico dos últimos 6 meses (gasto da casa e faturamento da empresa).
- Destaques: o que ficou dentro do plano, o que passou e o maior gasto do mês.

### 9. Importar extrato (Geral)

- Passo 1: enviar um arquivo .CSV ou .OFX e escolher se é da Casa ou da Empresa.
- Passo 2: conferir uma tabela com data, descrição, valor, categoria sugerida (editável) e conta. Linhas sem categoria ficam marcadas como "revisar".
- Passo 3: salvar os lançamentos selecionados.
- **Regras automáticas:** "se a descrição contém X → categoria Y, conta Z". Quando o usuário corrige uma categoria, o sistema oferece criar uma regra.
- Não importar duplicados: mesmo valor, data e descrição de um lançamento que já existe.

## Regras de cálculo e dados

### Cálculos

- **Total planejado por gasto** = valor por vez × número de vezes no mês.
- **Folga** = teto do mês − soma do planejado. Se for negativa, mostrar "Passou do teto em R$ X".
- **Planejado da semana** = soma dos gastos que caem naquela semana. Restante da semana = planejado − gasto.
- **Semanas do mês:** semana 1 = dias 1–7, semana 2 = 8–14, semana 3 = 15–21, semana 4 = 22 até o fim do mês.
- **Lucro do canal** = comissões − anúncios. **Retorno** = comissões ÷ anúncios (por exemplo, 2,0× significa que cada R$ 1 em anúncio voltou R$ 2).
- **Saldo final do mês** (fluxo de caixa) = saldo inicial + entradas previstas − todas as saídas previstas. O saldo final vira o saldo inicial do mês seguinte.
- **Guardar por mês para um gasto anual** = valor no ano ÷ 12.
- **Guardar por mês para uma meta** = (meta − guardado) ÷ meses até o prazo.
- **Pró-labore** sai da Empresa como saída e entra na Casa como entrada, em uma única operação de transferência. Não conta como gasto nem como faturamento.

### Entidades (modelo de dados)

| Entidade | Campos principais |
| --- | --- |
| Conta | nome (Casa ou Empresa) |
| Categoria | nome, grupo, conta |
| Lançamento | data, descrição, valor, tipo (entrada ou saída), categoria, conta, origem (manual ou importado), observação |
| Transferência | data, valor, conta de origem, conta de destino (usada para o pró-labore) |
| Plano do mês | mês, teto, itens (categoria, valor por vez, vezes, semanas em que cai) |
| Conta fixa | nome, dia de vencimento, valor, débito automático |
| Gasto anual | nome, valor no ano, mês de vencimento |
| Meta | nome, valor da meta, valor guardado, prazo |
| Canal | nome, plataforma, nicho, ativo |
| Comissão | canal, mês, valor |
| Anúncio | canal, mês, valor investido |
| Dívida | nome, credor, saldo devedor, valor da parcela, total de parcelas, dia de vencimento, status |
| Parcela | dívida, mês, valor, data de pagamento, status |
| Regra de importação | texto contido, categoria, conta |

### Vencimentos fixos da empresa

- DAS do Simples Nacional: dia 20 de cada mês.
- Parcelamento do Simples: confirmar o dia de vencimento no portal do Simples Nacional e deixar o campo editável.
- Pronampe (Itaú): dia de vencimento editável, a ser preenchido pelo usuário.

### Exemplo de CSV de extrato

O importador deve aceitar pelo menos este formato e permitir mapear as colunas de outros bancos:

```csv
data,descricao,valor
05/11/2026,POSTO EXEMPLO,-100.00
08/11/2026,MERCADO EXEMPLO,-250.00
10/11/2026,COMISSAO SHOPEE,450.00
```

## Visual

O visual é limpo, com fundo cinza-claro, cartões brancos e números em fonte monoespaçada. O azul identifica a Casa e o laranja identifica a Empresa.

| Elemento | Valor |
| --- | --- |
| Fundo da página | #F3F5F7 |
| Cartões | #FFFFFF, cantos arredondados de 16 px |
| Texto principal e menu lateral | #0F1B2D |
| Texto secundário | #5B6675 |
| Bordas e trilhos de barra | #E3E7EC |
| Casa (cor principal) | #1D4ED8; fundo claro #DCEBFF |
| Empresa (cor principal) | #B45309; fundo claro #FDEBD8 |
| Positivo (sobra) | #0F766E |
| Atenção (passou do plano) | #8A3A06 |
| Fonte da interface | Manrope (Google Fonts) |
| Fonte dos números | IBM Plex Mono |

- Todo valor em dinheiro usa a fonte monoespaçada e o formato R$ 1.234,56.
- Botões e campos com no mínimo 44 px de altura, para facilitar no celular.
- Responsivo: no celular, os cartões ficam empilhados e as tabelas rolam na horizontal.
- Modo escuro é opcional, pode ficar para uma etapa futura.

## Tecnologia e etapas

A sugestão é uma aplicação web única que roda no computador e no celular, com banco de dados simples para começar. O Claude Code pode propor outra stack no plano, mas deve justificar a troca.

| Parte | Sugestão | Por quê |
| --- | --- | --- |
| Aplicação | Next.js + TypeScript | Uma base só para telas e servidor |
| Estilo | Tailwind CSS | Rápido de reproduzir o visual do design |
| Banco de dados | SQLite com Prisma no início | Roda local sem configurar nada; dá para migrar para Postgres ou Supabase depois |
| Gráficos | Recharts | Simples e bom para barras e linhas |
| Celular | PWA (instalável na tela inicial) | Usa no celular sem publicar em loja |
| Login | Senha única ou login simples | Uso pessoal; protege os dados quando estiver online |

Construa nesta ordem, testando cada etapa antes de seguir:

1. **Base:** projeto, banco, menu lateral, contas Casa e Empresa, categorias e lançamentos (criar, editar, excluir, listar).
2. **Planejamento e semanas:** teto, plano do mês, gastos semanais e a tela de Visão geral da Casa.
3. **Contas fixas, gastos anuais e metas.**
4. **Empresa:** canais, comissões, anúncios, fluxo de caixa projetado com alerta, dívidas e parcelas.
5. **Calendário de vencimentos e alertas.**
6. **Relatório mensal e exportação em PDF.**
7. **Importação de extrato** CSV/OFX com regras automáticas.
8. **Celular:** PWA, tela de lançamento rápido e ajustes de responsividade.
9. **Publicar online** (por exemplo, na Vercel com Supabase) e fazer backup automático dos dados.

## Prompts prontos por etapa

Use um prompt por vez, sempre no modo de planejamento. Aprove o plano antes da execução.

**Etapa 1 — Base**

```text
Siga o spec.md. Faça a Etapa 1: crie o projeto com a stack sugerida, o banco com as entidades Conta, Categoria, Lançamento e Transferência, o menu lateral com todas as telas (as que ainda não existem mostram "em breve") e a tela de lançamentos com criar, editar, excluir e filtrar por conta e mês. Já cadastre as categorias iniciais do spec. Use o visual da seção Visual e as telas de design/telas-duas-contas.pdf.
```

**Etapa 2 — Planejamento e semanas**

```text
Faça a Etapa 2 do spec.md: tela de Planejamento e semanas, com teto do mês, tabela de planejamento com os valores iniciais do spec, resumo por grupo e os 4 cartões de gastos semanais. O "Gastei" de cada semana deve vir da soma dos lançamentos reais daquela categoria e semana, e também permitir digitar à mão. Depois monte a Visão geral da Casa usando esses dados. Siga as regras de cálculo do spec.
```

**Etapa 3 — Contas fixas e metas**

```text
Faça a Etapa 3 do spec.md: contas fixas (que entram sozinhas no plano do mês no grupo Contas fixas), gastos anuais divididos em 12 e metas com barra de progresso.
```

**Etapa 4 — Empresa**

```text
Faça a Etapa 4 do spec.md: canais, comissões e anúncios por mês com lucro e retorno; fluxo de caixa projetado de 3 e 6 meses com o alerta de saldo negativo; dívidas com parcelas e o botão "Registrar pagamento", que cria o lançamento de saída na Empresa. Inclua a transferência de pró-labore da Empresa para a Casa. Depois monte a Visão geral da Empresa.
```

**Etapa 5 — Calendário**

```text
Faça a Etapa 5 do spec.md: calendário mensal com todos os vencimentos (DAS, parcelas das dívidas, contas fixas, gastos programados do plano), cores por conta, lista lateral e alertas de notificação no navegador 3 dias antes e no dia.
```

**Etapa 6 — Relatório**

```text
Faça a Etapa 6 do spec.md: relatório mensal com os cartões, a tabela de planejado × gasto, o gráfico dos últimos 6 meses, os destaques e o botão Baixar PDF.
```

**Etapa 7 — Importar extrato**

```text
Faça a Etapa 7 do spec.md: importação de CSV e OFX em 3 passos, com mapeamento de colunas, categoria sugerida pelas regras automáticas, bloqueio de duplicados e a opção de criar uma regra quando eu corrigir uma categoria.
```

**Etapa 8 — Celular**

```text
Faça a Etapa 8 do spec.md: transforme o sistema em PWA instalável, crie a tela de lançamento rápido (veja design/telas-duas-contas.pdf) e revise todas as telas para uso no celular.
```

**Quando algo der errado**

Não precisa de prompt especial. Descreva o problema com suas palavras: em qual tela foi, o que você fez e o que aconteceu de diferente. O `CLAUDE.md` já obriga o Claude Code a investigar a causa, explicar e pedir seu ok antes de corrigir.
