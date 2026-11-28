'use client'
// src/app/(authed)/lancamentos/_components/LancamentosTabs.tsx
// Wrapper client das abas de Lançamentos (Fatia 2 / ROADMAP-P11-C2).
// - Estado da aba ativa vive em ?aba= (deep-link). A troca de aba preserva
//   month/empresaId espelhando o molde do MonthSelector:
//   `new URLSearchParams(searchParams.toString())` + `params.set('aba', ...)`.
// - REFRESH PÓS-MUTAÇÃO (ROADMAP-P11-C3/C6 — critério obrigatório da Fatia 2):
//   os componentes movidos (ContasFixasBloco, FixedAccountSheet, AnnualExpenseSheet,
//   InlineCategoriaTetoEditor, MarcarPagoDialog) só revalidam /visao-geral,
//   /planejamento e /contas-fixas — NUNCA /lancamentos. Sem tratamento, "gerar o
//   mês"/"marcar pago"/"salvar conta fixa"/"definir teto" não refletiriam aqui sem
//   um F5. Como os Sheets/dialogs não expõem callback de sucesso, re-sincronizamos
//   o conteúdo servidor da aba chamando `router.refresh()` no retorno de foco /
//   visibilidade da janela (o fluxo típico: abrir o Sheet → confirmar → voltar o
//   foco à página). É presentacional e dentro do escopo (não toca _lib/).
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface LancamentosTabsProps {
  /** Aba ativa atual (lida de ?aba= no servidor). */
  aba: string
  /** Conteúdo (carregado no servidor) de cada aba. */
  lancamentos: React.ReactNode
  contasFixas: React.ReactNode
  tetos: React.ReactNode
}

export function LancamentosTabs({
  aba,
  lancamentos,
  contasFixas,
  tetos,
}: LancamentosTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Refresh pós-mutação (obrigatório): re-renderiza o conteúdo servidor da aba
  // quando o foco/visibilidade volta à janela — captura o retorno de um
  // Sheet/dialog de edição (gerar o mês, marcar pago, salvar conta fixa, teto)
  // sem recarregar a página inteira.
  useEffect(() => {
    function sync() {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [router])

  function handleChange(value: string) {
    // Espelha o MonthSelector: preserva month/empresaId já presentes na query.
    const params = new URLSearchParams(searchParams.toString())
    params.set('aba', value)
    router.push(`/lancamentos?${params.toString()}`)
  }

  const hasCasaTabs = contasFixas !== null && tetos !== null

  return (
    <Tabs value={aba} onValueChange={handleChange} className="w-full">
      <TabsList className="h-auto flex-wrap">
        <TabsTrigger value="lancamentos" className="min-h-[44px]">
          Lançamentos
        </TabsTrigger>
        {hasCasaTabs && (
          <>
            <TabsTrigger value="contas-fixas" className="min-h-[44px]">
              Contas fixas
            </TabsTrigger>
            <TabsTrigger value="tetos" className="min-h-[44px]">
              Tetos &amp; categorias
            </TabsTrigger>
          </>
        )}
      </TabsList>

      <TabsContent value="lancamentos">{lancamentos}</TabsContent>
      {hasCasaTabs && (
        <>
          <TabsContent value="contas-fixas">{contasFixas}</TabsContent>
          <TabsContent value="tetos">{tetos}</TabsContent>
        </>
      )}
    </Tabs>
  )
}
