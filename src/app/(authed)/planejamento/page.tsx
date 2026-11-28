// src/app/(authed)/planejamento/page.tsx
// Rota antiga — o acompanhamento "ver" agora mora na Visão Geral e a edição de
// tetos mora na aba "Tetos & categorias" do hub Lançamentos (Fatia 2 /
// ROADMAP-P11-C5). Redirect in-page (Option B — molde (authed)/page.tsx),
// preservando o layout de autenticação. As pastas _components/_lib desta rota
// CONTINUAM no lugar: são importadas cross-folder pela Visão Geral e pela aba de
// Tetos. Só o corpo do page foi trocado.
import { redirect } from 'next/navigation'

export default function PlanejamentoPage() {
  redirect('/visao-geral')
}
