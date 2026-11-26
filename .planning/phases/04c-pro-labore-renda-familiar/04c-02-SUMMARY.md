# Plan 04c-02 — SUMMARY (Aplicar pró-labore multi-empresa)
**Status:** complete (verificado pelo usuário) · **Date:** 2026-11-26
- Reabilitado `createProLaboreService`/`deleteProLaboreService` para multi-empresa (desabilitados na Fatia 1). Par atômico (`prisma.$transaction`): SAÍDA na empresa ativa (categoria "Pró-labore", custo) + ENTRADA na Casa (empresaId null), mesmo `pairId`, `origemEmpresaId` = empresa de origem. getOrCreate categoria "Pró-labore".
- `TransactionSheet`: opção "Pró-labore (saída → Casa)" reabilitada, habilitada só no contexto de empresa (origem = empresa ativa); desabilitada na Casa. Par bloqueado para edição individual; exclusão remove os dois.
- Verificado: SAÍDA 8.500 na Elite Juris ↔ ENTRADA 8.500 na Casa; lucro reduziu; Dinheiro do mês subiu. 107/107 testes, build verde. Commits 3006e9c, 4d42d1e, 07aec35.
