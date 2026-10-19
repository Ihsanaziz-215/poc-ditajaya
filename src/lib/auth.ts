import { createHmac, timingSafeEqual } from 'node:crypto'
import { ROLES } from '@/domain/types'
import type { Role } from '@/domain/types'

export const SESSION_COOKIE = 'session'
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** POC accounts: one login per role. Override the shared password with DEMO_PASSWORD. */
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'ditajaya123'
export const ACCOUNTS: { username: string; role: Role }[] = ROLES.map((r) => ({ username: r.toLowerCase(), role: r }))

const secret = () => process.env.SESSION_SECRET ?? 'poc-ditajaya-dev-secret'
const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url')

const same = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function checkLogin(username: string, password: string): Role | null {
  const acc = ACCOUNTS.find((a) => a.username === username.trim().toLowerCase())
  return acc && same(password, DEMO_PASSWORD) ? acc.role : null
}

export function signSession(role: Role, now = Date.now()): string {
  const payload = `${role}.${now + SESSION_TTL_MS}`
  return `${payload}.${sign(payload)}`
}

export function verifySession(token: string | undefined, now = Date.now()): Role | null {
  if (!token) return null
  const i = token.lastIndexOf('.')
  if (i < 0) return null
  const payload = token.slice(0, i)
  if (!same(token.slice(i + 1), sign(payload))) return null
  const [role, exp] = payload.split('.')
  if (!ROLES.includes(role as Role) || !(Number(exp) > now)) return null
  return role as Role
}
