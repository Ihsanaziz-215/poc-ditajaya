import { Icon } from '@/components/ui/Icon'
import { RoleBadge } from '@/components/ui/Badge'
import type { Form, Role } from '@/domain/types'
import { fdt } from '@/lib/format'

export function LogCard({ form, role }: { form: Form; role: Role }) {
  const lg = [...form.log].filter((l) => !(role === 'Sales' && l.act.startsWith('Stock In'))).sort((a, b) => b.t - a.t)
  return (
    <div className="card">
      <div className="ch">
        <div>
          <h3>Log perubahan <Icon name="lock" style={{ width: 15, height: 15, verticalAlign: -2 }} /></h3>
          <p className="sub">Tercatat otomatis, tidak bisa diedit atau dihapus role mana pun. Comment tidak masuk log.</p>
        </div>
        <span className="b gray">{lg.length} kejadian</span>
      </div>
      <div className="logbox">
        <table className="tbl">
          <thead><tr><th>Waktu</th><th>Pengguna</th><th>Aktivitas</th><th>Nilai lama</th><th>Nilai baru</th></tr></thead>
          <tbody>
            {lg.map((l, k) => (
              <tr key={k}>
                <td style={{ whiteSpace: 'nowrap' }}>{fdt(l.t)}</td>
                <td>{l.user} {l.role !== '—' && <RoleBadge r={l.role} />}</td>
                <td>{l.act}</td>
                <td>{l.o}</td>
                <td>{l.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
