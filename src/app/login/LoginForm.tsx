'use client'

import { useState } from 'react'
import { useAction, useUi } from '@/components/ui/Providers'
import { loginAction } from '@/server/actions/app'

const RED = '#e05a65'
const field: React.CSSProperties = { width: '100%', height: 48, padding: '0 14px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#1f2937', fontSize: 16, outline: 'none' }
const label: React.CSSProperties = { display: 'block', fontSize: 18, fontWeight: 500, margin: '0 0 8px' }

export function LoginForm() {
  const { run, pending } = useAction()
  const { toast } = useUi()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        run(loginAction(email, password))
      }}
      style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}
    >
      <h2 style={{ margin: 0, padding: '22px 32px', fontSize: 30, fontWeight: 700, borderBottom: '1px solid #e5e7eb' }}>Sign In</h2>
      <div style={{ padding: '24px 32px 32px' }}>
        <label htmlFor="email" style={label}>Email Address *</label>
        <input id="email" type="email" autoFocus autoComplete="email" placeholder="Email Address" style={field} value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password" style={{ ...label, marginTop: 24 }}>Password *</label>
        <div style={{ position: 'relative' }}>
          <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Password" style={{ ...field, paddingRight: 48 }} value={password} onChange={(e) => setPassword(e.target.value)} />
          <button
            type="button"
            aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
            onClick={() => setShow((s) => !s)}
            style={{ position: 'absolute', right: 8, top: 0, height: 48, width: 40, border: 0, background: 'transparent', cursor: 'pointer', color: '#1f2937' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
              {!show && <path d="M4 4l16 16" />}
            </svg>
          </button>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button type="button" onClick={() => toast('Reset password belum tersedia di POC. Hubungi admin.', 'info')} style={{ border: 0, background: 'transparent', color: RED, fontWeight: 600, fontSize: 16, cursor: 'pointer', padding: 0 }}>
          Forget Password ?
        </button>
        <button type="submit" disabled={pending || !email || !password} style={{ height: 44, padding: '0 28px', border: 0, borderRadius: 8, background: RED, color: '#fff', fontWeight: 600, fontSize: 18, cursor: 'pointer', opacity: pending || !email || !password ? 0.6 : 1 }}>
          Sign In
        </button>
      </div>
    </form>
  )
}
