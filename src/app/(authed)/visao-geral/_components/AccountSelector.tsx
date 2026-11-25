'use client'

export function AccountSelector() {
  return (
    <div className="flex gap-2">
      {/* Casa — active state (this phase only implements Casa) */}
      <button
        className="bg-casa text-white rounded-lg px-4 min-h-[44px] font-semibold"
        aria-current="true"
      >
        Casa
      </button>

      {/* Empresa — always disabled with tooltip */}
      <button
        disabled
        title="Disponível na próxima fase."
        className="bg-card text-text-secondary border border-border rounded-lg px-4 min-h-[44px] opacity-50 cursor-not-allowed"
      >
        Empresa
      </button>
    </div>
  )
}
