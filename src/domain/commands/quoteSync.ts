import { active } from '../derived'
import type { Form, Quote, QuoteVersion } from '../types'
import { addLog, getForm } from './core'
import type { Ctx } from './core'
import type { Db } from '../types'

export const lastVersion = (q: Quote): QuoteVersion => q.versions[q.versions.length - 1]

export function newVersion(db: Db, ctx: Ctx, q: Quote, why: string): QuoteVersion {
  const lv = lastVersion(q)
  const v: QuoteVersion = structuredClone(lv)
  v.ver = lv.ver + 1
  v.date = ctx.now
  v.status = 'Belum Dikirim'
  v.sentTo = ''
  v.cc = ''
  v.sentAt = null
  q.versions.push(v)
  const f = q.formId ? db.forms.find((x) => x.id === q.formId) : undefined
  if (f) addLog(ctx, f, `Buat Quotation v${v.ver} (${why})`, '—', 'Belum Dikirim')
  return v
}

/** Re-derives the latest quote version's items from the form; a sent version spawns a new one first. */
export const branchedMessage = (v: QuoteVersion) => `Versi baru dibuat: Quotation v${v.ver}. Versi lama tetap tersimpan.`

/** Returns the newly created version when the sent one had to branch, otherwise undefined. */
export function syncQuote(db: Db, ctx: Ctx, f: Form): QuoteVersion | undefined {
  getForm(db, f.id)
  const q = db.quotes.find((x) => x.formId === f.id)
  if (!q) return undefined
  let v = lastVersion(q)
  let branched: QuoteVersion | undefined
  if (v.status === 'Terkirim') v = branched = newVersion(db, ctx, q, 'revisi harga atau qty setelah terkirim')
  const old = v.items
  v.items = active(f).map((i) => ({ iid: i.id, name: i.name, qty: i.qty, price: i.price, unit: i.unit, partNo: i.partNo, disc: old.find((o) => o.iid === i.id)?.disc || 0 }))
  return branched
}
