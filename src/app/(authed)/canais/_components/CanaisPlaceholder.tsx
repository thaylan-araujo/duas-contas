// src/app/(authed)/canais/_components/CanaisPlaceholder.tsx
// Estado vazio de /canais para o contexto Casa OU empresa inexistente/não
// pertencente ao usuário (falha na guarda de posse). "Canais e caixa" é uma tela
// de empresa — aqui mostramos uma explicação, nunca cards de P&L zerados.
// Reaproveita as classes do stub original (min-h-[60vh], centralizado).

/** Placeholder simples (server) da tela /canais fora do contexto de empresa. */
export function CanaisPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2 p-4 text-center">
      <h1 className="text-[20px] font-semibold text-text-primary">
        Canais e caixa
      </h1>
      <p className="text-base text-text-secondary max-w-md">
        Esta é uma tela de empresa. Selecione uma empresa no seletor de conta (ou
        crie a primeira em Gerenciar empresas) para ver o faturamento e o lucro do
        mês.
      </p>
    </div>
  )
}
