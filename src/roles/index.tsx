import { SendToSalesButton } from './purchasing/SendToSalesButton'
import { DecisionButtons, ReviseButton } from './sales/HeaderButtons'
import { FinishButton, SubmitDraftButton } from './teknisi/HeaderButtons'
import type { Form, Role } from '@/domain/types'

/**
 * The action of the form's current stage, shown to every role but enabled only for the role that owns it
 * (proto:688-693, PRD B11). The server enforces the same rule.
 */
export function headerActionsFor(role: Role, f: Form): React.ReactNode {
  if (f.status === 'Draft') return <SubmitDraftButton fid={f.id} can={role === 'Teknisi'} />
  if (f.status === 'Disetujui' && f.conf === 'Sesuai' && !f.done) return <FinishButton fid={f.id} can={role === 'Teknisi'} />
  if (f.status === 'Diajukan') return <SendToSalesButton fid={f.id} can={role === 'Purchasing'} />
  if (f.status === 'Harga Terisi') return <DecisionButtons fid={f.id} can={role === 'Sales'} />
  if (f.status === 'Disetujui' && f.conf === 'Tidak Sesuai' && !f.done) return <ReviseButton fid={f.id} can={role === 'Sales'} />
  return null
}
