// src/lib/empresa-cores.ts
// Paleta fixa de 6 cores de empresa (UI-SPEC §Color) + descritor de tipo pt-BR.
// As classes Tailwind são ESTÁTICAS (strings completas) — nunca interpoladas —
// para o JIT do Tailwind v4 conseguir detectá-las. Os tokens vivem no @theme do
// globals.css (--color-empresa-*). O par "laranja" reutiliza os tokens
// --color-empresa / --color-empresa-light existentes.
import type { EMPRESA_CORES } from '@/app/(authed)/empresas/_lib/schema'

export type EmpresaCorKey = (typeof EMPRESA_CORES)[number]

export interface EmpresaCorDescriptor {
  /** Rótulo pt-BR exibido no seletor de cor (UI-SPEC §Copywriting). */
  label: string
  /** Classe de cor sólida (swatch, pill texto, acento). */
  text: string
  /** Classe de fundo sólido (swatch). */
  bg: string
  /** Classe de fundo claro (pill/estado ativo). */
  bgLight: string
  /** Classe de anel (seleção no ColorPicker). */
  ring: string
}

/**
 * Mapa determinístico cor→classes. A chave "cinza-azulado" aponta para o token
 * `empresa-cinza` (UI-SPEC: "Cinza-azulado", token --color-empresa-cinza).
 */
export const EMPRESA_CORES_MAP: Record<EmpresaCorKey, EmpresaCorDescriptor> = {
  laranja: {
    label: 'Laranja',
    text: 'text-empresa',
    bg: 'bg-empresa',
    bgLight: 'bg-empresa-light',
    ring: 'ring-empresa',
  },
  verde: {
    label: 'Verde',
    text: 'text-empresa-verde',
    bg: 'bg-empresa-verde',
    bgLight: 'bg-empresa-verde-light',
    ring: 'ring-empresa-verde',
  },
  roxo: {
    label: 'Roxo',
    text: 'text-empresa-roxo',
    bg: 'bg-empresa-roxo',
    bgLight: 'bg-empresa-roxo-light',
    ring: 'ring-empresa-roxo',
  },
  rosa: {
    label: 'Rosa',
    text: 'text-empresa-rosa',
    bg: 'bg-empresa-rosa',
    bgLight: 'bg-empresa-rosa-light',
    ring: 'ring-empresa-rosa',
  },
  ambar: {
    label: 'Âmbar',
    text: 'text-empresa-ambar',
    bg: 'bg-empresa-ambar',
    bgLight: 'bg-empresa-ambar-light',
    ring: 'ring-empresa-ambar',
  },
  'cinza-azulado': {
    label: 'Cinza-azulado',
    text: 'text-empresa-cinza',
    bg: 'bg-empresa-cinza',
    bgLight: 'bg-empresa-cinza-light',
    ring: 'ring-empresa-cinza',
  },
}

/** Ordem de exibição dos swatches no seletor de cor (UI-SPEC §Color). */
export const EMPRESA_COR_KEYS: EmpresaCorKey[] = [
  'laranja',
  'verde',
  'roxo',
  'rosa',
  'ambar',
  'cinza-azulado',
]

/** Fallback seguro para uma cor fora da paleta (não deveria acontecer pós-zod). */
export function corDescriptor(cor: string): EmpresaCorDescriptor {
  return EMPRESA_CORES_MAP[cor as EmpresaCorKey] ?? EMPRESA_CORES_MAP.laranja
}

// Descritores de tipo de empresa em pt-BR (UI-SPEC §Copywriting / D-02).
export const EMPRESA_TIPO_LABEL: Record<string, string> = {
  AFILIADO: 'Afiliado',
  JURIDICO_SERVICOS: 'Jurídico/Serviços',
  INFOPRODUTO: 'Infoproduto',
  GENERICO: 'Genérico',
}

/** Opções do Select de tipo, na ordem da UI-SPEC. */
export const EMPRESA_TIPO_OPTIONS: { value: string; label: string }[] = [
  { value: 'AFILIADO', label: 'Afiliado' },
  { value: 'JURIDICO_SERVICOS', label: 'Jurídico/Serviços' },
  { value: 'INFOPRODUTO', label: 'Infoproduto' },
  { value: 'GENERICO', label: 'Genérico' },
]
