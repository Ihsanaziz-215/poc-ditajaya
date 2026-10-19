import { turnOf } from './derived'
import type { Form, Role } from './types'

export function filterForms(forms: Form[], opts: { q?: string; status?: string; mine?: boolean }, role: Role): Form[] {
  const q = (opts.q || '').toLowerCase()
  return forms.filter(
    (f) =>
      (!q || (f.id + ' ' + f.cust).toLowerCase().includes(q)) &&
      (!opts.status || f.status === opts.status) &&
      (!opts.mine || turnOf(f, role)?.role === role),
  )
}
