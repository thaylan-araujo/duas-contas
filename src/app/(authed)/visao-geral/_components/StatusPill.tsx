// src/app/(authed)/visao-geral/_components/StatusPill.tsx
// Pílula de status reutilizável (apresentacional) — pago (verde) / em aberto
// (âmbar). Contraste AA sobre fundo claro. Fatia 10-02 (C6/UI-SPEC §2).

interface StatusPillProps {
  status: 'PAGO' | 'EM_ABERTO'
}

export function StatusPill({ status }: StatusPillProps) {
  const isPago = status === 'PAGO'
  const label = isPago ? 'Pago' : 'Em aberto'

  const classes = isPago
    ? 'bg-[var(--color-casa-light)] text-positive'
    : 'bg-[var(--color-empresa-ambar-light)] text-warning'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  )
}
