import { formatBRL } from '@/lib/format'

/**
 * Hero "posso gastar ainda" da Casa (UI-SPEC §1, 10-01). Card de destaque em
 * azul (tokens casa), com o valor grande do quanto ainda dá pra gastar no mês,
 * a barra de % comprometido e 3 chips (Contas fixas / Variável gasto / Já pago).
 *
 * Apresentacional (sem Prisma): recebe tudo já calculado pelo loader (as funções
 * puras computeComprometido/computePossoGastar — R-2). Toda formatação de R$ via
 * src/lib/format.ts. Estado comprometido ≥ 100% → realce de alerta (destructive)
 * e "posso gastar" fica negativo. Alvos ≥ 44px (PWA).
 */
interface HeroPossoGastarProps {
  /** entradas − comprometido. Pode ser negativo (passou do dinheiro do mês). */
  possoGastarCents: number
  /** gasto PAGO + em aberto (valor certo ou estimativa). */
  comprometidoCents: number
  /** "dinheiro do mês" = soma das ENTRADAS da Casa no mês. */
  dinheiroMesCents: number
  /** chip "Contas fixas" — parcela em aberto comprometida. */
  contasFixasCents: number
  /** chip "Variável gasto". */
  variavelCents: number
  /** chip "Já pago". */
  jaPagoCents: number
}

export function HeroPossoGastar({
  possoGastarCents,
  comprometidoCents,
  dinheiroMesCents,
  contasFixasCents,
  variavelCents,
  jaPagoCents,
}: HeroPossoGastarProps) {
  // % comprometido = comprometido / dinheiro do mês. Sem dinheiro do mês (0) e
  // com algo comprometido → 100% (estourado); sem nada → 0%.
  const pctRaw =
    dinheiroMesCents > 0
      ? Math.round((comprometidoCents / dinheiroMesCents) * 100)
      : comprometidoCents > 0
        ? 100
        : 0
  // Largura da barra limitada a 100 (nunca passa do trilho).
  const pctBarra = Math.min(100, Math.max(0, pctRaw))

  // Estado de alerta: comprometeu ≥ 100% do dinheiro do mês.
  const estourado = pctRaw >= 100
  const possoGastarPositivo = possoGastarCents >= 0

  return (
    <section
      aria-label="Posso gastar ainda"
      className="rounded-2xl shadow-sm p-6 bg-casa text-white"
      style={{
        backgroundImage:
          'linear-gradient(135deg, var(--color-casa) 0%, #1736A8 100%)',
      }}
    >
      <p className="text-sm font-sans text-white/80 mb-1">Posso gastar ainda</p>

      <div className="flex items-baseline gap-2">
        {possoGastarPositivo ? (
          <span className="text-3xl font-semibold font-mono">
            {formatBRL(possoGastarCents)}
          </span>
        ) : (
          <span
            className={`text-3xl font-semibold font-mono ${
              estourado ? 'text-red-200' : ''
            }`}
          >
            {`− ${formatBRL(Math.abs(possoGastarCents))}`}
          </span>
        )}
      </div>

      {/* Barra de % comprometido. Estourado (≥100%) → realce de alerta. */}
      <div
        className="mt-4 h-2 w-full rounded-full bg-white/25 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pctBarra}
      >
        <div
          className={`h-full rounded-full ${
            estourado ? 'bg-red-300' : 'bg-white'
          }`}
          style={{ width: `${pctBarra}%` }}
        />
      </div>

      <p className="mt-2 text-xs font-sans text-white/80">
        {`${pctRaw}% do mês comprometido · dinheiro do mês ${formatBRL(
          dinheiroMesCents
        )}`}
      </p>

      {/* 3 chips (UI-SPEC §1). Alvos ≥ 44px. */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Chip label="Contas fixas" valueCents={contasFixasCents} />
        <Chip label="Variável gasto" valueCents={variavelCents} />
        <Chip label="Já pago" valueCents={jaPagoCents} />
      </div>
    </section>
  )
}

function Chip({ label, valueCents }: { label: string; valueCents: number }) {
  return (
    <div className="min-h-[44px] rounded-xl bg-white/15 px-3 py-2 flex flex-col justify-center">
      <span className="text-[11px] font-sans text-white/75 leading-tight">
        {label}
      </span>
      <span className="text-sm font-semibold font-mono leading-tight">
        {formatBRL(valueCents)}
      </span>
    </div>
  )
}
