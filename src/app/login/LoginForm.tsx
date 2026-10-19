'use client'

import { useState } from 'react'
import { useAction } from '@/components/ui/Providers'
import { loginAction } from '@/server/actions/app'

export function LoginForm() {
  const { run, pending } = useAction()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        run(loginAction(username, password))
      }}
    >
      <label className="l" htmlFor="u">Username</label>
      <input id="u" autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <label className="l" htmlFor="p" style={{ marginTop: 10 }}>Password</label>
      <input id="p" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="btn" type="submit" disabled={pending || !username || !password} style={{ marginTop: 16, width: '100%' }}>Masuk</button>
    </form>
  )
}
