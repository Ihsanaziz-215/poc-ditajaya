import { SendToSalesButton } from './purchasing/SendToSalesButton'
import { DecisionButtons, ReviseButton } from './sales/HeaderButtons'
import { FinishButton, SubmitDraftButton } from './teknisi/HeaderButtons'
import type { Form, Role } from '@/domain/types'

/** The buttons shown in the page header for the active role (proto:688-693). */
export function headerActionsFor(role: Role, f: Form): React.ReactNode {
  if (role === 'Teknisi' && f.status === 'Draft') return <SubmitDraftButton fid={f.id} />
  if (role === 'Teknisi' && f.status === 'Disetujui' && f.conf === 'Sesuai' && !f.done) return <FinishButton fid={f.id} />
  if (role === 'Purchasing' && f.status === 'Diajukan') return <SendToSalesButton fid={f.id} />
  if (role === 'Sales' && f.status === 'Harga Terisi') return <DecisionButtons fid={f.id} />
  if (role === 'Sales' && f.status === 'Disetujui' && f.conf === 'Tidak Sesuai' && !f.done) return <ReviseButton fid={f.id} />
  return null
}
