---
phase: "02"
status: "reviewed"
critical: 2
warning: 5
info: 4
---

# Phase 02: Relatório de Code Review

**Revisado:** 2026-11-24  
**Profundidade:** standard  
**Arquivos revisados:** 24  
**Status:** issues_found

## Resumo

A fase implementa o núcleo financeiro do aplicativo — CRUD de lançamentos, pró-labore atômico, gestão de categorias e dashboard de visão geral. O modelo de segurança está correto: `userId` sempre vem da sessão, pairId guard protege transações pareadas, e todas as queries Prisma incluem `userId` no `where`. Dois bugs críticos de dados foram encontrados: a função de dashboard usa um `end date` fixo no dia 31 que ultrapassa para o mês seguinte em 5 meses do ano (fevereiro, abril, junho, setembro, novembro), corrompendo os totais do dashboard. Além disso, o `formatDateInput` no cliente usa a timezone local do browser, fazendo a data aparecer um dia antes ao editar um lançamento no fuso UTC-3 (Brasil). Ambos os bugs afetam a correção dos dados exibidos.

---

## Problemas Críticos

### CR-01: `service.ts` (visao-geral) — `end date` com dia 31 fixo ultrapassa para o próximo mês

**Arquivo:** `src/app/(authed)/visao-geral/_lib/service.ts:52,76,118`

**Problema:** As três funções de agregação do dashboard (`getTotalSpent`, `getCategorySpending`, `getWeeklySpending`) calculam o fim do período com:

```ts
const end = new Date(year, monthNum - 1, 31, 23, 59, 59, 999)
```

Quando o mês tem menos de 31 dias, o JavaScript faz overflow automático para o mês seguinte. Para abril (`monthNum = 4`): `new Date(2026, 3, 31)` vira `2026-05-01`, e com as horas `23:59:59` o resultado final é `2026-05-02T02:59:59.999Z`. Isso faz com que transações do início de maio sejam contadas no total de abril.

**Meses afetados por ano:** fevereiro (28/29 dias), abril, junho, setembro, novembro — 5 meses.

**Impacto:** O dashboard de Visão Geral (Teto, Folga, Gasto, barras de categoria, gráfico semanal) exibe valores incorretos em 5 de cada 12 meses. Para fevereiro, a janela errada chega a incluir transações de até 3 dias do mês seguinte. Este bug **corrompe silenciosamente os totais financeiros**.

Ironicamente, `loader.ts` (usado pela página de Lançamentos) já usa a abordagem correta com `day 0`:

```ts
// loader.ts — CORRETO
const end = new Date(year, monthNum, 0, 23, 59, 59, 999)
```

**Correção:** Adotar a mesma estratégia de `loader.ts` em todas as três funções de `service.ts`:

```ts
// Trocar em getTotalSpent, getCategorySpending e getWeeklySpending:
// DE:
const end = new Date(year, monthNum - 1, 31, 23, 59, 59, 999)
// PARA:
const end = new Date(year, monthNum, 0, 23, 59, 59, 999)
```

---

### CR-02: `TransactionSheet.tsx` — `formatDateInput` usa timezone do browser, pré-preenchendo data errada ao editar

**Arquivo:** `src/app/(authed)/lancamentos/_components/TransactionSheet.tsx:59-65` e `:143`

**Problema:** A função `formatDateInput` usa `getFullYear()`, `getMonth()` e `getDate()` que retornam a data na timezone **local do browser**:

```ts
function formatDateInput(date: Date): string {
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
```

O Prisma armazena datas como timestamps UTC. `parseISO('2026-11-15')` no servidor (Vercel, UTC) gera `2026-11-15T00:00:00.000Z`. O browser do usuário no Brasil (UTC-3) interpreta isso como `2026-11-14T21:00:00 BRT` — então `getDate()` retorna **14**, não **15**.

**Resultado:** Todo usuário em UTC-3 (Brasil) verá a data pré-preenchida **1 dia antes** da data real ao abrir o formulário de edição. Se salvar sem perceber, o lançamento fica registrado com a data errada.

**Correção:** Usar o método UTC explicitamente:

```ts
function formatDateInput(date: Date): string {
  const d = new Date(date)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
```

---

## Avisos

### WR-01: `DeleteDialog.tsx` — erro da Server Action é ignorado; dialog fecha mesmo em falha

**Arquivo:** `src/app/(authed)/lancamentos/_components/DeleteDialog.tsx:30-39`

**Problema:** `handleConfirm` chama a action mas nunca verifica o resultado. `onClose()` é chamado incondicionalmente — independente de sucesso ou falha:

```ts
function handleConfirm() {
  startTransition(async () => {
    if (isPaired && transaction.pairId) {
      await deleteProLaboreAction(transaction.pairId)
    } else {
      await deleteTransactionAction(transaction.id)
    }
    onClose() // chamado mesmo se a action retornar { success: false }
  })
}
```

Se ocorrer um erro de rede ou do servidor, o dialog fecha e o usuário acredita que a exclusão foi bem-sucedida. O lançamento permanece na base de dados sem feedback visível.

**Correção:**

```ts
function handleConfirm() {
  startTransition(async () => {
    let result
    if (isPaired && transaction.pairId) {
      result = await deleteProLaboreAction(transaction.pairId)
    } else {
      result = await deleteTransactionAction(transaction.id)
    }
    if (result.success) {
      onClose()
    } else {
      setErrorMsg(result.error ?? 'Não foi possível excluir o lançamento.')
    }
  })
}
```

Adicionar `const [errorMsg, setErrorMsg] = useState('')` e renderizar abaixo do footer:

```tsx
{errorMsg && (
  <p className="text-sm text-destructive mt-2" role="alert">{errorMsg}</p>
)}
```

---

### WR-02: `actions.ts` (lancamentos) — `createTransactionAction` e `updateTransactionAction` não revalidam `/visao-geral`

**Arquivo:** `src/app/(authed)/lancamentos/_lib/actions.ts:53` e `:76`

**Problema:** `deleteTransactionAction` revalida `/visao-geral` (linha 99), mas `createTransactionAction` e `updateTransactionAction` não. Após criar ou editar um lançamento via `/lancamentos`, o dashboard de Visão Geral continua exibindo dados desatualizados até o usuário navegar manualmente para lá e de volta.

**Correção:**

```ts
// createTransactionAction (linha 53)
revalidatePath('/lancamentos')
revalidatePath('/visao-geral')  // adicionar

// updateTransactionAction (linha 76)
revalidatePath('/lancamentos')
revalidatePath('/visao-geral')  // adicionar
```

---

### WR-03: `loader.ts` e `service.ts` (lancamentos/visao-geral) — parâmetro `month` sem validação de formato

**Arquivo:** `src/app/(authed)/lancamentos/_lib/loader.ts:16` e `src/app/(authed)/visao-geral/_lib/service.ts:50`

**Problema:** O parâmetro `month` vem diretamente da URL (`searchParams`) sem validação de formato antes de `month.split('-').map(Number)`. Uma URL maliciosa como `/lancamentos?month=invalid` gera `NaN` nas variáveis `year` e `monthNum`, e `new Date(NaN, NaN, 1)` retorna `Invalid Date`. Isso faz a query Prisma com `gte: Invalid Date` que pode retornar todos os registros do usuário ou lançar erro.

Exemplo: `/lancamentos?month=2026-99` gera `new Date(2026, 98, 1)` = `2034-03-01` — carregando dados do futuro sem erro aparente.

**Correção:** Adicionar validação antes de usar o parâmetro em ambos os arquivos:

```ts
// No início de getTransactions/loader e nas funções de service
const monthRegex = /^\d{4}-(?:0[1-9]|1[0-2])$/
if (!monthRegex.test(month)) {
  throw new Error('Formato de mês inválido')
}
```

---

### WR-04: `upsertMonthlyBudgetAction` — autenticação ocorre antes da validação Zod

**Arquivo:** `src/app/(authed)/visao-geral/_lib/actions.ts:27-33`

**Problema:** `getUserId()` (que faz uma chamada ao Supabase) é executado **antes** do `ceilingUpdateSchema.safeParse(data)`. Se o input for inválido, o Supabase é consultado desnecessariamente. Todas as outras Server Actions do projeto fazem a validação Zod primeiro. Esta inconsistência desperdiça uma round-trip ao Supabase em inputs inválidos.

```ts
// Atual — auth antes de validar:
const userId = await getUserId()
const parsed = ceilingUpdateSchema.safeParse(data)
if (!parsed.success) return { ... }

// Correto — validar primeiro:
const parsed = ceilingUpdateSchema.safeParse(data)
if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
const userId = await getUserId()
```

---

### WR-05: `AccountFilterToggle.tsx` — Zustand store não é atualizado ao selecionar "Todos"

**Arquivo:** `src/app/(authed)/lancamentos/_components/AccountFilterToggle.tsx:26-35`

**Problema:** Ao selecionar "Todos", o parâmetro `account` é removido da URL corretamente, mas `setContaAtiva` não é chamado — deixando o Zustand store com o valor anterior (`'CASA'` ou `'EMPRESA'`). Ao selecionar "EMPRESA" ou "CASA" a store é atualizada; ao voltar para "Todos" não é resetada.

```ts
function handleChange(value: FilterOption) {
  const params = new URLSearchParams(searchParams.toString())
  if (value === 'ALL') {
    params.delete('account')
    // Zustand store não é resetado aqui — inconsistência
  } else {
    params.set('account', value)
    setContaAtiva(value as 'CASA' | 'EMPRESA')
  }
  router.push(`/lancamentos?${params.toString()}`)
}
```

Se o Zustand store for usado em outros componentes para leitura do filtro ativo, ele pode exibir um estado incorreto.

**Correção:** Adicionar reset da store no branch `ALL`:

```ts
if (value === 'ALL') {
  params.delete('account')
  setContaAtiva(null) // ou o valor de reset correto para o tipo do store
}
```

---

## Informativo

### IN-01: `DashboardCards.tsx` — label "Gasto hoje" está incorreto (mostra total do mês)

**Arquivo:** `src/app/(authed)/visao-geral/_components/DashboardCards.tsx:48-54`

**Problema:** O Card 4 é rotulado "Gasto hoje" mas exibe `totalSpentCents`, que é o **total do mês inteiro** (retornado por `getTotalSpent` que agrega todas as SAIDAs da CASA no mês). Não há nenhum filtro por data de hoje.

**Sugestão:** Renomear o label para "Gasto no mês" ou implementar um `getTodaySpent` separado se "hoje" for a intenção real.

---

### IN-02: `actions.ts` (lancamentos) — detecção de violação de unique key por string frágil

**Arquivo:** `src/app/(authed)/lancamentos/_lib/actions.ts:178`

**Problema:** A detecção de conflito de nome de categoria usa `err.message.includes('Unique constraint')`:

```ts
if (err instanceof Error && err.message.includes('Unique constraint')) {
```

Isso depende do texto interno de erro do Prisma v6, que pode mudar entre versões. A forma correta é verificar o código de erro `P2002` via `PrismaClientKnownRequestError`.

**Sugestão:**

```ts
import { Prisma } from '@prisma/client'

if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
  return { success: false, error: 'Já existe uma categoria com este nome nesta conta.' }
}
```

---

### IN-03: `DeleteDialog.tsx` — `isPaired` declarado após `handleConfirm` que o usa

**Arquivo:** `src/app/(authed)/lancamentos/_components/DeleteDialog.tsx:30-41`

**Problema:** `isPaired` é declarado na linha 41 com `const`, mas é referenciado na linha 32 dentro de `handleConfirm`. Funciona em runtime porque a closure só lê `isPaired` quando o botão é clicado (após a render completa), mas viola a convenção de declarar variáveis antes de usá-las e poderia confundir ferramentas de análise estática.

**Sugestão:** Mover a declaração de `isPaired` para antes da definição de `handleConfirm` (linha 29).

---

### IN-04: `ManageCategoriesSheet.tsx` — `isPending` compartilhado bloqueia todos os botões durante qualquer operação

**Arquivo:** `src/app/(authed)/lancamentos/_components/ManageCategoriesSheet.tsx:33,109,140,151`

**Problema:** `isPending` de um único `useTransition` é compartilhado entre `confirmEdit` e `handleDelete`. Enquanto uma categoria está sendo editada ou excluída, **todos** os botões de edição e exclusão de **todas** as outras categorias ficam desabilitados. Isso é desorientante para o usuário.

**Sugestão:** Usar `deletingId` (já existente) como único indicador visual para o item em operação, e remover `isPending` das checagens de `disabled` nos botões das demais categorias. Se necessário, criar um `useTransition` separado para edição.

---

_Revisado: 2026-11-24_  
_Revisor: Claude (gsd-code-reviewer)_  
_Profundidade: standard_
