'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL } from '@/lib/format'

interface WeekData {
  week: string
  totalCents: number
}

interface WeeklyBarChartProps {
  data: WeekData[]
}

export function WeeklyBarChart({ data }: WeeklyBarChartProps) {
  const hasData = data.length > 0 && data.some((d) => d.totalCents > 0)

  return (
    <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
      <h2 className="text-xl font-semibold text-text-primary mb-4">Gastos por semana</h2>

      {!hasData ? (
        <Skeleton className="h-[200px] w-full animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <XAxis dataKey="week" tick={{ fontFamily: 'var(--font-sans)', fontSize: 12 }} />
            <YAxis
              tickFormatter={(v: number) => formatBRL(v)}
              tick={{ fontFamily: 'var(--font-sans)', fontSize: 11 }}
              width={90}
            />
            <Tooltip
              formatter={(v) => [formatBRL(Number(v ?? 0)), 'Gasto']}
              contentStyle={{ fontFamily: 'var(--font-mono)' }}
            />
            <Bar dataKey="totalCents" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
