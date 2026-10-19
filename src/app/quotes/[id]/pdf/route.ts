import { isExpired, today } from '@/domain/derived'
import { buildQuotePdf, quotePdfName } from '@/domain/quotePdf'
import { getSession } from '@/lib/role'
import { store } from '@/server/store'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return new Response('Unauthorized', { status: 401 })
  const { id } = await params
  const db = await store.read()
  const quote = db.quotes.find((x) => x.id === id)
  if (!quote) return new Response('Quote tidak ditemukan', { status: 404 })
  const last = quote.versions.length - 1
  const raw = new URL(req.url).searchParams.get('v')
  const asked = raw === null ? last : Number(raw)
  const vi = Number.isInteger(asked) && asked >= 0 && asked <= last ? asked : last
  const form = quote.formId ? db.forms.find((f) => f.id === quote.formId) : undefined
  const bytes = await buildQuotePdf({ quote, vi, cust: form?.cust ?? null, formId: quote.formId, expired: isExpired(quote.versions[vi], today(db)) })
  return new Response(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${quotePdfName(quote, quote.versions[vi].ver)}"`,
      'Cache-Control': 'no-store',
    },
  })
}
