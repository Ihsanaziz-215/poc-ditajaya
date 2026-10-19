import { describe, expect, test } from 'vitest'
import { buildSeed } from './seed'
import { calc, hasFollowUp, isExpired, labelOf, procOf, recvOf, stepOf, turnOf, today } from './derived'
import type { Form, Item } from './types'

const db = buildSeed(Date.now())
const F = (n: number) => db.forms[n - 1]
const Q = (id: string) => db.quotes.find((q) => q.id === id)!
const quoteOf = (f: Form) => db.quotes.find((q) => q.formId === f.id)
const T = new Date(2026, 9, 15)

describe('form state per seed form', () => {
  const rows: [number, string, string, string | null, number][] = [
    [1, '—', '—', 'Purchasing', 1],
    [2, '—', '—', 'Sales', 2],
    [3, 'Perlu Follow Up', 'Diterima Rusak', 'Purchasing', 4],
    [4, 'Dibeli', 'Diterima Baik', 'Teknisi', 6],
  ]
  test.each(rows)('F%i proc/recv/turn/step', (n, proc, recv, turn, cur) => {
    const f = F(n)
    expect(procOf(f)).toBe(proc)
    expect(recvOf(f)).toBe(recv)
    expect(turnOf(f)?.role).toBe(turn)
    expect(stepOf(f, quoteOf(f)).cur).toBe(cur)
  })
  test('F5 done has no turn, F6 cancelled is a stop step', () => {
    expect(turnOf(F(5))).toBeNull()
    expect(stepOf(F(5), quoteOf(F(5))).cur).toBe(8)
    expect(turnOf(F(6))).toBeNull()
    expect(stepOf(F(6))).toEqual({ cur: 3, stop: true })
  })
  test('Gudang turn is the same for every viewer (PRD B8/B11)', () => {
    const item = (o: Partial<Item>): Item => ({ id: 'x', name: 'n', qty: 2, price: 1, supplier: 's', proc: 'Dibeli', eta: '', pnote: '', good: 0, bad: 0, stock: 0, struck: false, ...o })
    const f: Form = { ...F(4), items: [item({}), item({ id: 'y' })], conf: 'Menunggu' }
    expect(turnOf(f)?.role).toBe('Gudang')
  })
  test('F2 with a sent quote is at step 3', () => {
    const q = structuredClone(Q('Q3001'))
    expect(q.versions.at(-1)!.status).toBe('Terkirim')
    expect(stepOf(F(2), q).cur).toBe(3)
  })
})

describe('calc and expiry', () => {
  test.each([
    ['Q3001', 2145000, 235950, 2380950],
    ['Q3002', 3500000, 385000, 3885000],
    ['Q3003', 4460000, 490600, 4950600],
  ])('%s totals', (id, sub, tax, grand) => {
    const c = calc(Q(id).versions[0])
    expect(c.sub).toBe(sub)
    expect(c.tax).toBe(tax)
    expect(c.grand).toBe(grand)
  })
  test('tax is computed after discount', () => {
    const v = structuredClone(Q('Q3002').versions[0])
    v.items[0].disc = 100000
    const c = calc(v)
    expect(c.disc).toBe(100000)
    expect(c.tax).toBe(Math.round(3400000 * 0.11))
  })
  test('isExpired relative to 15 Oct 2026', () => {
    expect(isExpired(Q('Q3003').versions[0], T)).toBe(true)
    expect(isExpired(Q('Q3001').versions[0], T)).toBe(false)
    expect(isExpired(Q('Q3002').versions[0], T)).toBe(false)
  })
  test('today(db) is midnight of the simulated day', () => {
    const d = buildSeed(5_000)
    const t = today({ ...d, clock: { sim: d.clock.sim, real: Date.now() } })
    expect(t.getTime()).toBe(T.getTime())
  })
})

describe('customer labels', () => {
  const rows: [string, boolean, string, number][] = [
    ['c1', true, 'B', 4], ['c2', true, 'A', 6], ['c3', false, 'C', 2], ['c4', false, 'C', 1],
    ['c5', true, 'B', 3], ['c6', true, '—', 0], ['c7', false, 'B', 5], ['c8', true, 'C', 1],
  ]
  test.each(rows)('%s label', (id, active, cls, mesin) => {
    const l = labelOf(db.customers.find((c) => c.id === id)!, T)
    expect(l.active).toBe(active)
    expect(l.cls).toBe(cls)
    expect(l.mesin).toBe(mesin)
  })
  test('follow up this month', () => {
    const has = db.customers.filter((c) => hasFollowUp(c, T)).map((c) => c.id)
    expect(has).toEqual(['c1', 'c5', 'c6'])
  })
})
