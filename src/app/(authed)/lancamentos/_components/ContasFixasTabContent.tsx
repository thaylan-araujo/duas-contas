// src/app/(authed)/lancamentos/_components/ContasFixasTabContent.tsx
// Server Component — conteúdo da aba "Contas fixas" do hub Lançamentos (Fatia 2 /
// ROADMAP-P11-C3). Compõe componentes EXISTENTES (reuso, sem reescrever):
// - ContasFixasBloco INTERATIVO (sem readOnly) — gerar o mês / marcar pago, incl.
//   o fluxo de valor variável ("a definir") via MarcarPagoDialog.
// - CRUD de FixedAccount (FixedAccountTable + NewFixedAccountButton, com o toggle
//   isVariableAmount no FixedAccountSheet) e "Gastos do ano" (AnnualExpenseTable +
//   NewAnnualExpenseButton), espelhando as seções 3.1/3.2 de contas-fixas/page.tsx.
// NÃO inclui o bloco de metas (foi para /metas na Fatia 1). Não edita nenhum _lib/.
import { loadDashboardData } from '../../visao-geral/_lib/loader'
import { loadContasFixasData } from '../../contas-fixas/_lib/loader'
import { ContasFixasBloco } from '../../visao-geral/_components/ContasFixasBloco'
import { FixedAccountTable } from '../../contas-fixas/_components/FixedAccountTable'
import { AnnualExpenseTable } from '../../contas-fixas/_components/AnnualExpenseTable'
import {
  NewFixedAccountButton,
  NewAnnualExpenseButton,
} from '../../contas-fixas/_components/NewEntityButtons'

interface ContasFixasTabContentProps {
  userId: string
  currentMonth: string
}

export async function ContasFixasTabContent({
  userId,
  currentMonth,
}: ContasFixasTabContentProps) {
  // Dados do bloco "Contas fixas" do mês (sempre contexto Casa aqui → empresaId null)
  // + CRUD de contas fixas / gastos do ano.
  const [dashboard, contasFixasData] = await Promise.all([
    loadDashboardData(userId, currentMonth, null),
    loadContasFixasData(userId),
  ])

  const { contasFixasLinhas, temFixasCadastradas } = dashboard
  const { fixedAccounts, annualExpenses } = contasFixasData

  return (
    <div className="flex flex-col gap-6">
      {/* Bloco "Contas fixas" do mês — INTERATIVO (gerar / marcar pago) */}
      <ContasFixasBloco
        month={currentMonth}
        linhas={contasFixasLinhas}
        temFixasCadastradas={temFixasCadastradas}
      />

      {/* 3.1 Contas fixas e assinaturas */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Contas fixas e assinaturas
            </h2>
            <p className="text-sm text-text-secondary">
              Entram sozinhas no planejamento todo mês
            </p>
          </div>
          <NewFixedAccountButton />
        </div>
        <FixedAccountTable accounts={fixedAccounts} />
      </section>

      {/* 3.2 Gastos do ano, divididos em 12 */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Gastos do ano, divididos em 12
            </h2>
            <p className="text-sm text-text-secondary">
              Guarde um pouco por mês e não leve susto quando vencer
            </p>
          </div>
          <NewAnnualExpenseButton />
        </div>
        <AnnualExpenseTable expenses={annualExpenses} />
      </section>
    </div>
  )
}
