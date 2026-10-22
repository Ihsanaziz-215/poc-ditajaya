import { describe, expect, test } from 'vitest'
import { as, freshDb } from '../testing'
import { DomainError } from './core'
import { decide, reviseForm, setStrike } from './sales'

describe('decide', () => {
  test('only Sales', () => {
    const db = freshDb()
    for (const r of ['Purchasing', 'Teknisi', 'Gudang'] as const) expect(() => decide(db, as(db, r), db.forms[1].id, 'Disetujui')).toThrow(DomainError)
  })
  test('Disetujui changes status, logs, and notifies Purchasing and Teknisi', () => {
    const db = freshDb()
    const f = db.forms[1]
    decide(db, as(db, 'Sales'), f.id, 'Disetujui')
    expect(f.status).toBe('Disetujui')
    expect(f.log.at(-1)).toMatchObject({ act: 'Ubah status pengajuan', o: 'Harga Terisi', n: 'Disetujui' })
    expect(db.notifs[0]).toMatchObject({ roles: ['Purchasing', 'Teknisi'], text: `Disetujui: ${f.id} ${f.cust}` })
  })
  test('deciding twice is rejected (double click)', () => {
    const db = freshDb()
    const f = db.forms[1]
    decide(db, as(db, 'Sales'), f.id, 'Batal')
    expect(() => decide(db, as(db, 'Sales'), f.id, 'Disetujui')).toThrow(DomainError)
    expect(f.status).toBe('Batal')
  })
  test('rejected before prices are filled', () => {
    const db = freshDb()
    expect(() => decide(db, as(db, 'Sales'), db.forms[0].id, 'Disetujui')).toThrow(DomainError)
  })
})

describe('setStrike', () => {
  test('strikes and unstrikes with logs', () => {
    const db = freshDb()
    const f = db.forms[1]
    const ctx = as(db, 'Sales')
    setStrike(db, ctx, f.id, f.items[0].id, true)
    expect(f.items[0].struck).toBe(true)
    expect(f.log.at(-1)).toMatchObject({ act: `Batalkan barang — ${f.items[0].name}`, o: 'Aktif', n: 'Dibatalkan' })
    setStrike(db, ctx, f.id, f.items[0].id, false)
    expect(f.items[0].struck).toBe(false)
    expect(f.log.at(-1)).toMatchObject({ act: `Aktifkan kembali barang — ${f.items[0].name}`, o: 'Dibatalkan', n: 'Aktif' })
  })
  test('the last active item cannot be struck', () => {
    const db = freshDb()
    const f = db.forms[1]
    const ctx = as(db, 'Sales')
    f.items.slice(1).forEach((i) => setStrike(db, ctx, f.id, i.id, true))
    expect(() => setStrike(db, ctx, f.id, f.items[0].id, true)).toThrow('Minimal satu barang harus tetap aktif.')
  })
  test('non-Sales or wrong status is rejected', () => {
    const db = freshDb()
    expect(() => setStrike(db, as(db, 'Purchasing'), db.forms[1].id, db.forms[1].items[0].id, true)).toThrow(DomainError)
    expect(() => setStrike(db, as(db, 'Sales'), db.forms[3].id, db.forms[3].items[0].id, true)).toThrow(DomainError)
  })
  test('struck items drop out of the quote', () => {
    const db = freshDb()
    const f = db.forms[2]
    f.status = 'Harga Terisi'
    setStrike(db, as(db, 'Sales'), f.id, f.items[1].id, true)
    const q = db.quotes[0]
    expect(q.versions.at(-1)!.items.some((i) => i.iid === f.items[1].id)).toBe(false)
    expect(q.versions[0].items.some((i) => i.iid === f.items[1].id)).toBe(true)
  })
})

describe('reviseForm', () => {
  test('returns the form to Sales and resets confirmation', () => {
    const db = freshDb()
    const f = db.forms[3]
    f.conf = 'Tidak Sesuai'
    reviseForm(db, as(db, 'Sales'), f.id)
    expect(f.status).toBe('Harga Terisi')
    expect(f.conf).toBe('Menunggu')
    expect(f.log.slice(-2).map((l) => [l.act, l.o, l.n])).toEqual([
      ['Ubah status pengajuan', 'Disetujui', 'Harga Terisi'],
      ['Ubah status konfirmasi', 'Tidak Sesuai', 'Menunggu'],
    ])
  })
  test('rejected unless confirmation is Tidak Sesuai, or by other roles', () => {
    const db = freshDb()
    expect(() => reviseForm(db, as(db, 'Sales'), db.forms[3].id)).toThrow(DomainError)
    db.forms[3].conf = 'Tidak Sesuai'
    expect(() => reviseForm(db, as(db, 'Teknisi'), db.forms[3].id)).toThrow(DomainError)
  })
})
