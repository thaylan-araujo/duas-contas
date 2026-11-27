// src/lib/whatsapp/evolution.ts
// Wrapper REST centralizado para enviar texto de volta pela Evolution API.
// Centralizar o shape num lugar só facilita a troca v1↔v2 (09-RESEARCH Pitfall 5):
// o default aqui é o body v2 `{ number, text }`; se a instância real responder 400
// (confirmação é o checkpoint de setup do 09-03), basta trocar AQUI. fetch/baseUrl/
// instance/apiKey são injetáveis para testar sem rede.

interface SendTextDeps {
  fetchFn?: typeof fetch
  baseUrl?: string
  instance?: string
  apiKey?: string
}

/**
 * Envia uma mensagem de texto para `phone` (só dígitos com DDI, ex.: 5511...).
 * Lê EVOLUTION_API_URL / EVOLUTION_INSTANCE / EVOLUTION_API_KEY do ambiente por
 * padrão; aceita overrides via `deps` (usado nos testes). Body v2: {number,text}.
 */
export async function sendText(
  phone: string,
  text: string,
  deps: SendTextDeps = {}
): Promise<void> {
  const fetchFn = deps.fetchFn ?? fetch
  const baseUrl = deps.baseUrl ?? process.env.EVOLUTION_API_URL ?? ''
  const instance = deps.instance ?? process.env.EVOLUTION_INSTANCE ?? ''
  const apiKey = deps.apiKey ?? process.env.EVOLUTION_API_KEY ?? ''

  const url = `${baseUrl}/message/sendText/${instance}`
  await fetchFn(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify({ number: phone, text }),
  })
}
