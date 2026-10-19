import { describe, expect, test } from 'vitest'
import { checkLogin, DEMO_PASSWORD, SESSION_TTL_MS, signSession, verifySession } from './auth'

describe('login', () => {
  test('the single account logs in, case-insensitively and trimmed', () => {
    expect(checkLogin('admin@ditajaya.test', DEMO_PASSWORD)).toBe(true)
    expect(checkLogin(' Admin@Ditajaya.test ', DEMO_PASSWORD)).toBe(true)
  })
  test('wrong password, other emails and the old per-role accounts are rejected', () => {
    expect(checkLogin('admin@ditajaya.test', 'salah')).toBe(false)
    expect(checkLogin('admin@ditajaya.test', '')).toBe(false)
    expect(checkLogin('sales@ditajaya.test', DEMO_PASSWORD)).toBe(false)
    expect(checkLogin('admin', DEMO_PASSWORD)).toBe(false)
  })
})

describe('session token', () => {
  test('round trips the role', () => {
    expect(verifySession(signSession('Gudang'))).toBe('Gudang')
  })
  test('rejects missing, tampered and forged tokens', () => {
    const t = signSession('Teknisi')
    expect(verifySession(undefined)).toBeNull()
    expect(verifySession('')).toBeNull()
    expect(verifySession(t.replace('Teknisi', 'Sales'))).toBeNull()
    expect(verifySession(t.slice(0, -2) + 'xx')).toBeNull()
    expect(verifySession('Sales.9999999999999.abc')).toBeNull()
  })
  test('expires after the TTL', () => {
    const t = signSession('Sales', 1000)
    expect(verifySession(t, 1000 + SESSION_TTL_MS - 1)).toBe('Sales')
    expect(verifySession(t, 1000 + SESSION_TTL_MS + 1)).toBeNull()
  })
})
