// src/app/api/health/route.ts
// Health check endpoint — used by keep-alive cron job (GitHub Actions) to prevent Supabase free tier auto-pause
// No DB or Auth dependency — only proves the server is alive
export function GET() {
  return Response.json({ status: 'ok' }, { status: 200 })
}
