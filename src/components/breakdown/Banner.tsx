import { Icon } from '@/components/ui/Icon'
import type { Turn } from '@/domain/derived'
import type { Form, Role } from '@/domain/types'

export function Banner({ form: f, role, turn }: { form: Form; role: Role; turn: Turn | null }) {
  if (f.status === 'Batal')
    return <div className="banner stop"><Icon name="alert" /><div><b>Form dibatalkan</b>Sales menutup form setelah negosiasi. Form tidak masuk antrean Purchasing.</div></div>
  if (f.done)
    return <div className="banner"><Icon name="info" /><div><b>Breakdown selesai</b>Semua tahap sudah dilalui. Log perubahan tetap bisa dilihat.</div></div>
  if (turn && turn.role === role)
    return <div className="banner turn"><Icon name="user" /><div><b>Giliran Anda ({role})</b>{turn.text}</div></div>
  return (
    <div className="banner">
      <Icon name="lock" />
      <div><b>Menunggu {turn ? turn.role : '—'}</b>{turn ? turn.text + ' ' : ''}Sebagai {role}, Anda bisa melihat form, menulis comment, dan membaca log di tahap ini.</div>
    </div>
  )
}
