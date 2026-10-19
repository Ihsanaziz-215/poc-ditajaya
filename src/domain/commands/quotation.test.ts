import { describe, expect, test } from 'vitest'
import { as, freshDb } from '../testing'
import { DomainError } from './core'
import { editItem } from './shared'
import { addQuoteExtra, makeQuote, removeQuoteExtra, sendQuote, setQuoteDiscount, setQuoteField } from './sales'

describe('makeQuote', () => {
  test('creates Q3004 for a Harga Terisi form with defaults', () => {
    const db = freshDb()
    const f = db.forms[1]
    const r = makeQuote(db, as(db, 'Sales'), f.id)
    const q = db.quotes.at(-1)!
    expect(q).toMatchObject({ id: 'Q3004', number: 'DMP/U/2026/X/QT3004', formId: f.id })
    expect(r).toMatchObject({ redirect: '/quotes/Q3004' })
    const v = q.versions[0]
    expect(v.expiry).toBe('2026-10-29')
    expect(v.items).toHaveLength(7)
    expect(v).toMatchObject({ ver: 1, status: 'Belum Dikirim', pic: 'Ibu Wulan', email: 'wulan@duniamegaraya.example', owner: 'Rully' })
    expect(f.log.at(-1)).toMatchObject({ act: 'Buat Quotation v1', o: '—', n: 'Belum Dikirim' })
  })
  test('rejects second quote, wrong status, and other roles', () => {
    const db = freshDb()
    makeQuote(db, as(db, 'Sales'), db.forms[1].id)
    expect(() => makeQuote(db, as(db, 'Sales'), db.forms[1].id)).toThrow(DomainError)
    expect(() => makeQuote(db, as(db, 'Sales'), db.forms[0].id)).toThrow(DomainError)
    expect(() => makeQuote(db, as(db, 'Sales'), db.forms[2].id)).toThrow(DomainError)
    const db2 = freshDb()
    expect(() => makeQuote(db2, as(db2, 'Purchasing'), db2.forms[1].id)).toThrow(DomainError)
  })
})

describe('sendQuote', () => {
  const send = { to: 'pic@x.com', cc: '', fail: false }
  test('invalid email is rejected without changing state', () => {
    const db = freshDb()
    makeQuote(db, as(db, 'Sales'), db.forms[1].id)
    expect(() => sendQuote(db, as(db, 'Sales'), 'Q3004', { ...send, to: 'abc' })).toThrow('Email tujuan belum valid. Email PIC wajib untuk pengiriman.')
    expect(db.quotes.at(-1)!.versions[0].status).toBe('Belum Dikirim')
  })
  test('send, resend and simulated failure are logged on the form', () => {
    const db = freshDb()
    const f = db.forms[1]
    const ctx = as(db, 'Sales')
    makeQuote(db, ctx, f.id)
    const r1 = sendQuote(db, ctx, 'Q3004', { ...send, cc: 'cc@x.com' })
    expect(r1).toMatchObject({ message: 'Quotation v1 terkirim ke pic@x.com', kind: 'ok' })
    expect(f.log.at(-1)).toMatchObject({ act: 'Kirim Quotation v1 ke pic@x.com (CC cc@x.com)', o: 'Belum Dikirim', n: 'Terkirim' })
    sendQuote(db, ctx, 'Q3004', send)
    expect(f.log.at(-1)!.act).toBe('Kirim ulang Quotation v1 ke pic@x.com')
    const r3 = sendQuote(db, ctx, 'Q3004', { ...send, fail: true })
    expect(r3).toMatchObject({ kind: 'bad' })
    expect(db.quotes.at(-1)!.versions[0].status).toBe('Gagal Kirim')
    sendQuote(db, ctx, 'Q3004', send)
    expect(f.log.at(-1)!.act).toBe('Kirim ulang Quotation v1 ke pic@x.com')
  })
  test('legacy quote without a form sends without logging; non-Sales rejected', () => {
    const db = freshDb()
    sendQuote(db, as(db, 'Sales'), 'QL1', send)
    expect(db.quotes.find((q) => q.id === 'QL1')!.versions[0].status).toBe('Terkirim')
    expect(() => sendQuote(db, as(db, 'Gudang'), 'QL1', send)).toThrow(DomainError)
  })
})

describe('editing quotes', () => {
  test('editing a sent version creates v2, leaves v1 untouched, and logs it', () => {
    const db = freshDb()
    const q = db.quotes[0]
    setQuoteField(db, as(db, 'Sales'), 'Q3001', 'termin', 'x')
    expect(q.versions).toHaveLength(2)
    expect(q.versions[0].termin).toBe('DP 50% setelah PO, pelunasan setelah pekerjaan selesai')
    expect(q.versions[1]).toMatchObject({ ver: 2, termin: 'x', status: 'Belum Dikirim' })
    expect(db.forms[2].log.at(-1)).toMatchObject({ act: 'Buat Quotation v2 (revisi isi quotation)', o: '—', n: 'Belum Dikirim' })
  })
  test('editing an unsent latest version does not branch again', () => {
    const db = freshDb()
    setQuoteField(db, as(db, 'Sales'), 'Q3001', 'termin', 'x')
    setQuoteField(db, as(db, 'Sales'), 'Q3001', 'termin', 'y')
    expect(db.quotes[0].versions).toHaveLength(2)
    expect(db.quotes[0].versions[1].termin).toBe('y')
    setQuoteField(db, as(db, 'Sales'), 'Q3001', 'termin', 'y')
    expect(db.quotes[0].versions).toHaveLength(2)
  })
  test('discount is clamped at 0 and branches a sent version', () => {
    const db = freshDb()
    const q = db.quotes[0]
    const iid = q.versions[0].items[0].iid
    setQuoteDiscount(db, as(db, 'Sales'), 'Q3001', iid, -5)
    expect(q.versions).toHaveLength(1)
    setQuoteDiscount(db, as(db, 'Sales'), 'Q3001', iid, 1000)
    expect(q.versions).toHaveLength(2)
    expect(q.versions[1].items[0].disc).toBe(1000)
    expect(q.versions[0].items[0].disc).toBe(0)
    expect(db.forms[2].log.at(-1)!.act).toBe('Buat Quotation v2 (revisi diskon)')
  })
  test('only Sales edits', () => {
    const db = freshDb()
    expect(() => setQuoteField(db, as(db, 'Purchasing'), 'Q3001', 'termin', 'x')).toThrow(DomainError)
    expect(() => setQuoteDiscount(db, as(db, 'Teknisi'), 'Q3001', 'x', 1)).toThrow(DomainError)
  })
})

describe('barang non-stok di quotation', () => {
  test('Sales menambah barang habis pakai tanpa menyentuh form dan pengadaan, dan tetap ada setelah sinkron', () => {
    const db = freshDb()
    const f = db.forms.find((x) => x.status === 'Harga Terisi')!
    const S = as(db, 'Sales')
    makeQuote(db, S, f.id)
    const q = db.quotes.find((x) => x.formId === f.id)!
    const before = f.items.length
    addQuoteExtra(db, S, q.id, { name: 'Lem', qty: 2, price: 15000, unit: 'tube' })
    const v = q.versions.at(-1)!
    expect(v.items.at(-1)).toMatchObject({ name: 'Lem', extra: true, qty: 2, price: 15000 })
    expect(f.items.length).toBe(before)
    editItem(db, S, f.id, f.items[0].id, 'qty', f.items[0].qty + 1)
    expect(q.versions.at(-1)!.items.some((i) => i.extra && i.name === 'Lem')).toBe(true)
    expect(() => addQuoteExtra(db, as(db, 'Purchasing'), q.id, { name: 'Mur', qty: 1, price: 1 })).toThrow()
    removeQuoteExtra(db, S, q.id, v.items.at(-1)!.iid)
    expect(q.versions.at(-1)!.items.some((i) => i.extra)).toBe(false)
    expect(() => removeQuoteExtra(db, S, q.id, f.items[0].id)).toThrow()
  })
})
