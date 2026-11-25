# Phase 4 (Fatia 1): Fundação multi-empresa — Pattern Map

**Mapped:** 2026-11-25
**Files analyzed:** 18 new/modified (schema+migration, store, CRUD slice `/empresas`, dropdown, seed, lançamentos refactor)
**Analogs found:** 17 / 18 (1 novo componente shadcn sem analog local — DropdownMenu)

> Esta fatia é 90% reaproveitamento. Praticamente todo arquivo novo copia um analog direto das Fases 2/3.
> Convenção estrutural canônica da feature-slice: `_lib/{schema.ts,service.ts,actions.ts,loader.ts}` +
> `_components/*.tsx`, com a divisão **schema (zod puro) → service (Prisma + funções puras) → actions
> ('use server' finas: parse → getUserId → service → revalidatePath) → loader (leitura p/ Server Components)**.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `prisma/schema.prisma` (+ `Empresa`, `empresaId`, remover `ContaType`) | model | transform (migração) | `prisma/schema.prisma` atual (`Category`/`Transaction`/`ContaType`) | role-match |
| `prisma/migrations/<ts>_multi_empresa/migration.sql` | migration | batch/transform | `prisma/migrations/20261124103918_core_crud/migration.sql` + RESEARCH §Code Examples | role-match |
| `prisma/seed.ts` (+ 3 empresas + categorias por tipo) | config | batch | `prisma/seed.ts` atual (upsert idempotente de categorias) | exact |
| `src/store/conta.ts` (generalizar `contaAtiva`) | store | event-driven | `src/store/conta.ts` atual | exact (mesmo arquivo) |
| `src/app/(authed)/empresas/_lib/schema.ts` | config | validation | `contas-fixas/_lib/schema.ts` + `lancamentos/_lib/schema.ts` (categoryCreate) | exact |
| `src/app/(authed)/empresas/_lib/service.ts` | service | CRUD + batch (seed) | `contas-fixas/_lib/service.ts` + `lancamentos/_lib/service.ts` (deleteCategory) + `planejamento` getOrSeedGoals | exact |
| `src/app/(authed)/empresas/_lib/actions.ts` | controller | request-response | `contas-fixas/_lib/actions.ts` | exact |
| `src/app/(authed)/empresas/_lib/loader.ts` | loader | CRUD (read) | `contas-fixas/_lib/loader.ts` / `lancamentos/_lib/loader.ts` | exact |
| `src/app/(authed)/empresas/page.tsx` | route | request-response | `contas-fixas/page.tsx` | role-match |
| `src/app/(authed)/empresas/_components/EmpresaSheet.tsx` | component | request-response | `contas-fixas/_components/FixedAccountSheet.tsx` | exact |
| `src/app/(authed)/empresas/_components/DeleteEmpresaDialog.tsx` | component | request-response | `lancamentos/_components/DeleteDialog.tsx` (Caso A/B bloqueio) + `contas-fixas/DeleteEntityDialog.tsx` | exact |
| `src/app/(authed)/empresas/_components/NewEmpresaButton.tsx` (+ add-card) | component | event-driven | `contas-fixas/_components/NewEntityButtons.tsx` (`NewGoalAddCard`) | exact |
| `src/app/(authed)/empresas/_components/EmpresaCategoriesSection.tsx` | component | CRUD | `lancamentos/_components/ManageCategoriesSheet.tsx` | role-match |
| `src/app/(authed)/empresas/_components/ColorPicker.tsx` | component | event-driven | — (novo; usa radiogroup a11y da UI-SPEC §3) | no analog |
| `src/app/(authed)/_components/ContaSelector.tsx` | component | event-driven | `visao-geral/AccountSelector.tsx` + `lancamentos/AccountFilterToggle.tsx` (store write) | role-match |
| `src/components/ui/dropdown-menu.tsx` | component | — | — (shadcn add; registry oficial) | no analog |
| `src/app/(authed)/lancamentos/_lib/{schema,service,actions,loader}.ts` (refactor `account`→`empresaId`) | service/loader | CRUD | os mesmos arquivos (editar in-place) | exact (self) |
| `src/app/(authed)/visao-geral/_lib/loader.ts` (filtrar por `empresaId`) | loader | CRUD | o mesmo arquivo + `lancamentos/_lib/loader.ts` | exact (self) |

---

## Pattern Assignments

### `src/store/conta.ts` (store, event-driven) — MODIFY in place

**Analog:** o próprio arquivo atual (`src/store/conta.ts` linhas 1-26).

Forma atual (a substituir):
```typescript
type ContaAtiva = 'CASA' | 'EMPRESA'                          // linha 5
interface ContaStore { contaAtiva: ContaAtiva; mesSelecionado: string; ... }  // 7-12
export const useContaStore = create<ContaStore>()(
  persist((set) => ({ contaAtiva: 'CASA', mesSelecionado: ..., setContaAtiva: (c) => set({ contaAtiva: c }), ... }),
    { name: 'duas-contas-store' })                            // 22-24 — SEM version/migrate hoje
)
```

Mudança (RESEARCH Pattern 2 + Pitfall 5): `ContaAtiva` vira união discriminada
`{ tipo: 'CASA' } | { tipo: 'EMPRESA'; empresaId: string }`; acrescentar `version: 1` + `migrate` ao
objeto de opções do `persist` (hoje só tem `name`). `mesSelecionado` preservado. Isolar helper **puro**
`empresaIdDoContexto(contaAtiva) → string | null` (null = Casa) para o loader usar — testável (RESEARCH §Validation D-06).

**Error handling:** N/A (store client). `migrate(v0)` mapeia o antigo `'EMPRESA'`/`'CASA'` → `{ tipo: 'CASA' }`.

---

### `src/app/(authed)/empresas/_lib/schema.ts` (config, validation)

**Analog:** `contas-fixas/_lib/schema.ts` (linhas 7-24) + `lancamentos/_lib/schema.ts` categoryCreate (35-47).

Padrão a copiar — schema base + variante `update` via `.extend({ id })`:
```typescript
// contas-fixas/_lib/schema.ts:7-24
export const fixedAccountSchema = z.object({ name: z.string().min(1, 'O nome é obrigatório.'), ... })
export type FixedAccountFormData = z.infer<typeof fixedAccountSchema>
export const updateFixedAccountSchema = fixedAccountSchema.extend({ id: z.string().min(1, 'ID obrigatório') })
```

Para `empresaSchema` (UI-SPEC §2 / D-02/D-03): `nome` string min 1 ("O nome é obrigatório.") max 60;
`tipo` `z.enum(['AFILIADO','JURIDICO_SERVICOS','INFOPRODUTO','GENERICO'])` ("Selecione um tipo.");
`cor` `z.enum([...6 chaves da paleta])` default 'laranja'. Mensagens exatas em UI-SPEC §Copywriting.

---

### `src/app/(authed)/empresas/_lib/service.ts` (service, CRUD + seed batch)

**Analogs:** `contas-fixas/_lib/service.ts` (CRUD ownership-guarded), `lancamentos/_lib/service.ts:202-227`
(deleteCategory com proteção D-08), `contas-fixas/_lib/service.ts:144-158` (getOrSeedGoals idempotente).

**CRUD ownership-guarded** (copiar `contas-fixas/_lib/service.ts:77-91`):
```typescript
export async function updateFixedAccountService(id, userId, data) {
  const record = await prisma.fixedAccount.findFirst({ where: { id, userId } })  // ownership
  if (!record) throw new Error('Conta fixa não encontrada.')
  return prisma.fixedAccount.update({ where: { id }, data })
}
```
→ `updateEmpresaService` / `createEmpresaService` análogos. Toda query inclui `where: { userId }` (ASVS V4).

**Proteção de exclusão D-08** (copiar `lancamentos/_lib/service.ts:202-224`, adaptar para contar transactions):
```typescript
const count = await prisma.transaction.count({ where: { categoryId: id, userId } })
if (count > 0) {
  const word = count === 1 ? 'lançamento' : 'lançamentos'
  throw new Error(`Esta categoria tem ${count} ${word} e não pode ser excluída.`)
}
```
→ `deleteEmpresaService`: contar `prisma.transaction.count({ where: { empresaId: id, userId } })`; se > 0
lançar erro com contagem (UI-SPEC Caso B); se 0, apagar categorias + empresa em `prisma.$transaction`
(RESEARCH §Code Examples deleteEmpresaService). Isolar `canDeleteEmpresa(count): boolean` puro (RESEARCH D-03/D-08 test).

**getOrSeed de categorias por tipo** (espírito de `contas-fixas/_lib/service.ts:144-158` getOrSeedGoals +
`prisma/seed.ts:59-72` upsert por chave composta). Funções **puras** `categoriasPadrao(tipo)` /
`receitasPorTipo(tipo)` isoladas sem Prisma (RESEARCH §Code Examples + §Validation). Custos comuns:
Imposto, Funcionário, Ferramentas, Anúncios, Investimento. Receitas por tipo em UI-SPEC §3.

> **NOTA (Open Question 1 / A3):** decidir se `Category` ganha `kind CategoryKind?` (RECEITA/CUSTO) para os
> grupos "Receitas"/"Custos" da UI-SPEC §3, ou se deriva do `type` do lançamento. Recomendação RESEARCH:
> adicionar `kind` nullable (não afeta a Casa).

---

### `src/app/(authed)/empresas/_lib/actions.ts` (controller, request-response)

**Analog:** `contas-fixas/_lib/actions.ts` (arquivo inteiro — padrão canônico).

Copiar o cabeçalho `getUserId()` (linhas 40-47) e o helper `revalidate()` (49-53) + o shape `ActionResult`:
```typescript
async function getUserId(): Promise<string> {                      // 40-47
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user.id                                                   // NUNCA do input (ASVS V4 / IDOR)
}
const GENERIC_ERROR = 'Não foi possível salvar. Verifique sua conexão e tente novamente.'
```

Padrão de cada action (copiar `contas-fixas/_lib/actions.ts:61-77`): `safeParse` → retornar
`parsed.error.issues[0].message` em falha → `getUserId()` → service → `revalidate()` → `try/catch`
devolvendo `GENERIC_ERROR`. O `delete` reencaminha a mensagem de bloqueio do service (ver
`contas-fixas/_lib/actions.ts:101-113` que repassa `err.message` conhecido). Para `deleteEmpresaAction`,
repassar a mensagem "A empresa tem N lançamento(s)…" como faz o lançamentos action com erros nomeados
(`lancamentos/_lib/actions.ts:205-208`).

`revalidatePath` deve cobrir `/empresas`, `/lancamentos`, `/visao-geral` (contexto muda em todas).

---

### `src/app/(authed)/empresas/_lib/loader.ts` (loader, read)

**Analog:** `contas-fixas/_lib/loader.ts` / `lancamentos/_lib/loader.ts:40-45` (`getCategories`).

`getEmpresas(userId)`: `prisma.empresa.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })`
(ordem de criação = ordem no dropdown, UI-SPEC §1). Categorias por empresa:
`prisma.category.findMany({ where: { userId, empresaId } })`.

---

### `src/app/(authed)/empresas/_components/EmpresaSheet.tsx` (component, request-response)

**Analog:** `contas-fixas/_components/FixedAccountSheet.tsx` (arquivo inteiro — padrão Sheet criar/editar).

Copiar integralmente a estrutura (linhas 1-191): `useForm` + `zodResolver` + `useTransition`;
`isEditing = !!empresa`; `useEffect([open, empresa, reset])` para popular/limpar (60-73); `onSubmit`
ramificando create/update action (78-90); `setError('root', …)` no erro; CTA com
`{isPending ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Salvar empresa'}` (173-175). Dois
`SheetContent` (`side="bottom" lg:hidden` / `side="right" hidden lg:flex w-[420px]`, linhas 179-189).
Campos: `Input` Nome, `Select` Tipo (usar `src/components/ui/select.tsx`), e o novo `ColorPicker`
(via `Controller`, como o `Switch` em 152-164).

---

### `src/app/(authed)/empresas/_components/DeleteEmpresaDialog.tsx` (component, request-response)

**Analog:** `lancamentos/_components/DeleteDialog.tsx` (Caso A confirmar + mensagem condicional) +
`contas-fixas/_components/DeleteEntityDialog.tsx` (estrutura Dialog + estado de erro inline).

Copiar `lancamentos/_components/DeleteDialog.tsx:27-96`: `useTransition` + `errorMsg`, `handleConfirm`
chamando a action, `Dialog`/`DialogContent sm:max-w-md`, footer com `variant="outline"` (manter) +
`variant="destructive"` (`{isPending ? 'Excluindo…' : 'Excluir empresa'}`), erro em `<p role="alert">`.

**Caso B (bloqueio, D-08)** — dois caminhos possíveis:
- (a) action retorna erro com contagem e o Dialog mostra em `errorMsg` sem oferecer destrutivo (padrão
  inline do `ManageCategoriesSheet`), ou
- (b) a página passa a contagem de lançamentos por empresa e o Dialog escolhe entre body destrutivo
  (Caso A) e body de bloqueio "Não é possível excluir" + CTA único "Entendi" (UI-SPEC §4). Preferir (b)
  para casar com a UI-SPEC que especifica títulos distintos.

---

### `src/app/(authed)/empresas/_components/NewEmpresaButton.tsx` + add-card (component, event-driven)

**Analog:** `contas-fixas/_components/NewEntityButtons.tsx` (`NewFixedAccountButton` 12-23, `NewGoalAddCard` 42-58).

Add-card tracejado (copiar 46-54): `<button … className="… rounded-2xl border-2 border-dashed border-border … hover:bg-bg/60">` + `Plus` + "+ Nova empresa", abrindo o `EmpresaSheet` em modo criação.

---

### `src/app/(authed)/empresas/_components/EmpresaCategoriesSection.tsx` (component, CRUD)

**Analog:** `lancamentos/_components/ManageCategoriesSheet.tsx` (edição inline + proteção D-08).

Reaproveitar `renderCategoryRow` (linhas 81-171): edição inline por `Enter`/`Escape` (95-98), botões
`Pencil`/`Trash2` `min-h-[44px]`, badge "Padrão" para `isDefault`, erro inline `<p role="alert">` (164-168).
Em vez de filtrar por `account === 'CASA'/'EMPRESA'` (36-37), filtrar por **grupo RECEITA/CUSTO** da empresa
ativa (ver Open Question `kind`), com headings "Receitas"/"Custos" (UI-SPEC §3) no lugar de "Casa"/"Empresa"
(176-205). Reusa `createCategoryAction`/`updateCategoryAction`/`deleteCategoryAction` adaptadas a `empresaId`.

---

### `src/app/(authed)/_components/ContaSelector.tsx` (component, event-driven) — substitui AccountSelector + AccountFilterToggle

**Analogs:** `visao-geral/_components/AccountSelector.tsx` (o que substitui — swatch/cor Casa) +
`lancamentos/_components/AccountFilterToggle.tsx:13-36` (padrão de escrever no store + navegar).

Do `AccountFilterToggle` copiar o fluxo de troca de contexto:
```typescript
const { setContaAtiva } = useContaStore()      // linha 16
function handleChange(value) { setContaAtiva(...) ; router.push(...) }  // 26-36
```
Agora `setContaAtiva({ tipo: 'CASA' })` ou `{ tipo: 'EMPRESA', empresaId }`. Montado com o novo
`DropdownMenu` (shadcn) conforme UI-SPEC §1: trigger `Button variant="ghost"` com swatch+nome+ChevronDown,
item "Casa" + separator + 1 item por empresa (cor própria) + separator + "Gerenciar empresas" → `/empresas`.
As empresas precisam ser carregadas (Server Component pai passa a lista como prop, já que o store só guarda
o contexto ativo, não a lista). `min-h-[44px]` em trigger e cada item.

---

### `src/components/ui/dropdown-menu.tsx` (component) — NO ANALOG

Instalar via `npx shadcn@latest add dropdown-menu` (registry oficial; puxa `@radix-ui/react-dropdown-menu@2.2.1`).
Único componente novo. Sem analog local — seguir a saída do gerador shadcn (estilo "default" já em `components.json`).

---

### `prisma/seed.ts` (config, batch) — MODIFY

**Analog:** o próprio `prisma/seed.ts` atual (upsert idempotente, linhas 59-72).

Manter o preâmbulo de env (1-33: `normalizeEnvUrl`, forçar `DATABASE_URL = DIRECT_URL`). Trocar a troca de import
`ContaType` (linha 31) — removido. Adicionar upsert das 3 empresas (D-05) por `@@unique([nome, userId])`:
Elite Juris (JURIDICO_SERVICOS, cinza-azulado), Achadinhos (AFILIADO, laranja), Infoproduto (INFOPRODUTO, roxo)
— cores em UI-SPEC §Color. Para cada empresa, chamar o `getOrSeedCategorias`/upsert por chave composta
`name_empresaId_userId` (mesmo padrão de 60-72, agora com `empresaId` em vez de `account`). As categorias da
Casa passam a usar `empresaId: null`.

---

### `prisma/migrations/<ts>_multi_empresa/migration.sql` (migration, batch) — HAND-EDITED

**Analog:** `prisma/migrations/20261124103918_core_crud/migration.sql` (estrutura CREATE TYPE/TABLE/INDEX) +
RESEARCH §Code Examples (SQL completo já esboçado, linhas 312-351).

Gerar com `prisma migrate dev --create-only --name multi_empresa` (DIRECT_URL/5432) e editar à mão:
(1) `CREATE TYPE "EmpresaTipo"` + `CREATE TABLE "Empresa"` + FK Restrict; (2) `DELETE FROM "Category" WHERE
account='EMPRESA'`; (3) `ADD COLUMN "empresaId"` em Category/Transaction + FKs `ON DELETE RESTRICT`;
(4) **`CREATE UNIQUE INDEX … NULLS NOT DISTINCT`** para a Casa (Pitfall 1 — crítico); (5) `DROP COLUMN account` +
`DROP TYPE "ContaType"`. Exigir checkpoint de **backup** antes de aplicar (Pitfall 3 / regra CLAUDE.md).

---

### Refactor `account` → `empresaId` (lançamentos + visão geral) — MODIFY in place

Arquivos: `lancamentos/_lib/{schema.ts,service.ts,actions.ts,loader.ts}`, `visao-geral/_lib/loader.ts`,
e os componentes `TransactionSheet.tsx`, `ManageCategoriesSheet.tsx`, `AccountFilterToggle.tsx`.

Pontos exatos a mudar (identificados por grep):
- `lancamentos/_lib/schema.ts:10,37` — `account: z.enum(['CASA','EMPRESA'])` → `empresaId: z.string().nullable()`.
- `lancamentos/_lib/loader.ts:4,29` — remover `import { ContaType }`; filtro `account` → `empresaId` (null = Casa).
- `lancamentos/_lib/service.ts:99-133` — **`createProLaboreService` tem `account:'EMPRESA'`/`'CASA'` hardcoded
  (linhas 107, 120)** → **neutralizar** nesta fatia (Open Question 3 / RESEARCH): desabilitar o fluxo pró-labore
  ou apontar para uma empresa padrão; **não deixar nenhuma referência a `account:'EMPRESA'` após a migração**
  (o enum deixa de existir → não compila).
- `createCategoryService:155-166` / `deleteCategoryService:215` — `account` → `empresaId`.
- `lancamentos/_components/TransactionSheet.tsx:45,180-187,475-478` — toggle CASA/EMPRESA e o lookup
  `c.name === 'Pró-labore' && c.account === 'EMPRESA'` → repensar por `empresaId` do contexto ativo.
- `lancamentos/_components/ManageCategoriesSheet.tsx:36-37` — `c.account === 'CASA'/'EMPRESA'`.
- `visao-geral/_lib/loader.ts` / `service.ts` — filtros por `account` → `empresaId` do contexto.

**Deprecar e remover:** `visao-geral/_components/AccountSelector.tsx` e
`lancamentos/_components/AccountFilterToggle.tsx` (substituídos pelo `ContaSelector`).

---

## Shared Patterns

### Autenticação / ownership (ASVS V4, aplicar a TODA action e service novos)
**Source:** `contas-fixas/_lib/actions.ts:40-47` (`getUserId`) + todo service com `findFirst({ where: { id, userId } })`.
`userId` SEMPRE da sessão (`supabase.auth.getUser()`), nunca do input. `empresaId` recebido do cliente deve ser
validado como pertencente ao usuário (`findFirst({ where: { id: empresaId, userId } })`) antes de lançar/criar
categoria nele (RESEARCH §Security — IDOR).

### Server Action fina: parse → getUserId → service → revalidatePath
**Source:** `contas-fixas/_lib/actions.ts:61-77` (canônico). Aplica a `empresas/_lib/actions.ts` e às actions de
categoria adaptadas. `safeParse` devolve `parsed.error.issues[0].message`; `catch` devolve `GENERIC_ERROR`;
erros de domínio nomeados (bloqueio D-08) são repassados explicitamente.

### Divisão service puro vs. Prisma + teste de funções puras (Vitest)
**Source:** `contas-fixas/_lib/service.ts:22-58` (`computeAnnualMonthly`/`computeGoalMonthly`) +
`planejamento/_lib/service.test.ts`. Isolar `categoriasPadrao`, `receitasPorTipo`, `canDeleteEmpresa`,
`empresaIdDoContexto`, `empresaSchema`, `migrate(v0)` como funções puras testáveis sem Prisma
(RESEARCH §Validation — alvos de teste Wave 0).

### Sheet criar/editar (form)
**Source:** `contas-fixas/_components/FixedAccountSheet.tsx` (inteiro). Duplo `SheetContent`
(`bottom lg:hidden` / `right hidden lg:flex w-[420px]`), `useForm`+`zodResolver`, `useEffect` reset,
`aria-busy` + "Salvando…".

### Dialog de exclusão + proteção D-08
**Source:** `lancamentos/_components/DeleteDialog.tsx` (body condicional) +
`lancamentos/_lib/service.ts:215-222` (contagem bloqueia) + `contas-fixas/DeleteEntityDialog.tsx` (erro inline).

### Add-card tracejado
**Source:** `contas-fixas/_components/NewEntityButtons.tsx:42-58` (`NewGoalAddCard`).

### Seed / getOrSeed idempotente
**Source:** `prisma/seed.ts:59-72` (upsert por chave composta) + `contas-fixas/_lib/service.ts:144-158`
(`getOrSeedGoals` em `$transaction`).

### Formatação e libs base
**Source:** `src/lib/format.ts` (`formatBRL` + `font-mono`), `src/lib/prisma.ts` (client), `parseISO`
(date-fns) para datas — já herdado; sem campos de data próprios nesta fatia.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/ui/dropdown-menu.tsx` | component | — | Componente shadcn novo; gerado pelo registry oficial (`shadcn add dropdown-menu`). Sem analog local. |
| `src/app/(authed)/empresas/_components/ColorPicker.tsx` | component | event-driven | Nenhum seletor de cor existe no codebase. Seguir UI-SPEC §3 (radiogroup a11y, 6 swatches, `ring-2`+`Check`); montar com primitivas existentes (`Label`/button). |

---

## Metadata

**Analog search scope:** `src/store/`, `src/app/(authed)/{lancamentos,contas-fixas,planejamento,visao-geral}/`,
`src/components/ui/`, `prisma/`.
**Files scanned:** ~25 (4 feature-slices + store + schema + seed + ui inventory).
**Pattern extraction date:** 2026-11-25
