import { redirect } from 'next/navigation'
import { PERSON } from '@/domain/types'
import { ACCOUNTS, DEMO_PASSWORD } from '@/lib/auth'
import { getSession } from '@/lib/role'
import { LoginForm } from './LoginForm'

export default async function Page() {
  if (await getSession()) redirect('/breakdown')
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="card" style={{ width: 380, maxWidth: '100%' }}>
        <h2 style={{ margin: '0 0 4px' }}>Modul Form Breakdown</h2>
        <p style={{ color: 'var(--muted)', margin: '0 0 16px' }}>Masuk dengan akun sesuai role.</p>
        <LoginForm />
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed var(--line)', fontSize: 12, color: 'var(--muted)' }}>
          <b>Akun demo</b> (password sama: <code>{DEMO_PASSWORD}</code>)
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {ACCOUNTS.map((a) => (
              <li key={a.username}><code>{a.username}</code> — {PERSON[a.role]} ({a.role})</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
