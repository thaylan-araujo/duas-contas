// src/app/(authed)/contas-fixas/page.tsx
// Rota antiga — a edição de contas fixas / gastos do ano agora mora na aba
// "Contas fixas" do hub Lançamentos (Fatia 2 / ROADMAP-P11-C5). Redirect in-page
// (Option B — molde (authed)/page.tsx), preservando o layout de autenticação.
// As pastas _components/_lib desta rota CONTINUAM no lugar: são importadas
// cross-folder pelas abas de Lançamentos e por /metas. Só o corpo do page foi trocado.
import { redirect } from 'next/navigation'

export default function ContasFixasPage() {
  redirect('/lancamentos?aba=contas-fixas')
}
