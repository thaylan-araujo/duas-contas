// src/app/(authed)/contas-fixas/_lib/loader.ts
// Plain module (no 'use server') — orchestrates the parallel data fetches
// for the /contas-fixas Server Component page.
import {
  getFixedAccounts,
  getAnnualExpenses,
  getOrSeedGoals,
} from './service'

/**
 * Fetches fixed accounts, annual expenses, and (seeded) goals in parallel.
 * getOrSeedGoals seeds the two default goals on first access (META-02).
 */
export async function loadContasFixasData(userId: string) {
  const [fixedAccounts, annualExpenses, goals] = await Promise.all([
    getFixedAccounts(userId),
    getAnnualExpenses(userId),
    getOrSeedGoals(userId),
  ])

  return { fixedAccounts, annualExpenses, goals }
}
