import { describe, expect, test } from 'vitest'
import { checkLogin, DEMO_PASSWORD, SESSION_TTL_MS, signSession, verifySession } from './auth'

describe('login', () => {
  test.each([['teknisi', 'Teknisi'], ['Purchasing', 'Purchasing'], [' sales ', 'Sales'], ['gudang', 'Gudang']])('%s logs in as its own role', (u, role) => {
    expect(checkLogin(u, DEMO_PASSWORD)).toBe(role)
  })
  test('wrong password or unknown user is rejected', () => {
    expect(checkLogin('sales', 'salah')).toBeNull()
    expect(checkLogin('admin', DEMO_PASSWORD)).toBeNull()
    expect(checkLogin('sales', '')).toBeNull()
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
