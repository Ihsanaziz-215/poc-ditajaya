import { createHmac, timingSafeEqual } from 'node:crypto'
import { ROLES } from '@/domain/types'
import type { Role } from '@/domain/types'
import { ACCOUNT_EMAIL } from './accountEmail'

export const SESSION_COOKIE = 'session'
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** POC: one shared account. The role is picked with the tabs in the header, not by logging in. Override the password with DEMO_PASSWORD. */
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'ditajaya123'
/** Role the session starts with, the first step of the flow. */
export const DEFAULT_ROLE: Role = ROLES[0]

const secret = () => process.env.SESSION_SECRET ?? 'poc-ditajaya-dev-secret'
const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url')

const same = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function checkLogin(email: string, password: string): boolean {
  return email.trim().toLowerCase() === ACCOUNT_EMAIL && same(password, DEMO_PASSWORD)
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
