import { statusOf } from './derived'
import type { Form } from './types'

export function filterForms(forms: Form[], opts: { q?: string; status?: string }): Form[] {
  const q = (opts.q || '').toLowerCase()
  return forms.filter((f) => (!q || (f.id + ' ' + f.cust).toLowerCase().includes(q)) && (!opts.status || statusOf(f) === opts.status))
}
