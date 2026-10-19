import { describe, expect, test } from 'vitest'
import { as, freshDb } from '../testing'
import { DomainError } from './core'
import { confirmItems, createForm, finishWork, submitDraft } from './teknisi'

const input = { cust: 'PT ABC', date: '2026-10-15', analysis: 'rusak', note: '', items: [{ name: 'Seal', qty: 2 }], submit: true }

describe('createForm', () => {
  test('only Teknisi can create', () => {
    const db = freshDb()
    expect(() => createForm(db, as(db, 'Sales'), input)).toThrow(DomainError)
  })
  test('submit without required fields reports per-field errors', () => {
    const db = freshDb()
    try {
      createForm(db, as(db, 'Teknisi'), { ...input, cust: '', analysis: ' ', items: [{ name: '', qty: 1 }] })
      expect.unreachable()
    } catch (e) {
      expect((e as DomainError).fields).toEqual({
        cust: 'Pilih customer.',
        analysis: 'Hasil analisa wajib diisi.',
        items: 'Isi minimal satu barang dengan nama dan qty.',
      })
    }
    expect(db.forms).toHaveLength(6)
  })
  test('draft only needs a customer', () => {
    const db = freshDb()
    expect(() => createForm(db, as(db, 'Teknisi'), { ...input, cust: '', submit: false })).toThrow('Pilih customer untuk menyimpan draft.')
    createForm(db, as(db, 'Teknisi'), { ...input, analysis: '', items: [{ name: '', qty: 1 }], submit: false })
    expect(db.forms[0].status).toBe('Draft')
  })
  test('submit creates BD-2610-007 as Diajukan with logs and a Purchasing notification', () => {
    const db = freshDb()
    const r = createForm(db, as(db, 'Teknisi'), input)
    const f = db.forms[0]
    expect(f.id).toBe('BD-2610-007')
    expect(r?.redirect).toBe('/breakdown/BD-2610-007')
    expect(f.status).toBe('Diajukan')
    expect(f.log.map((l) => [l.act, l.o, l.n])).toEqual([
      ['Buat form', '—', 'Draft'],
      ['Ubah status pengajuan', 'Draft', 'Diajukan'],
    ])
    expect(db.notifs[0]).toMatchObject({ roles: ['Purchasing'], fid: 'BD-2610-007', text: 'Form Diajukan: BD-2610-007 PT ABC' })
  })
})

describe('submitDraft', () => {
  test('moves Draft to Diajukan, rejects incomplete items and other roles', () => {
    const db = freshDb()
    createForm(db, as(db, 'Teknisi'), { ...input, submit: false })
    const f = db.forms[0]
    expect(() => submitDraft(db, as(db, 'Sales'), f.id)).toThrow(DomainError)
    f.items[0].name = ''
    expect(() => submitDraft(db, as(db, 'Teknisi'), f.id)).toThrow('Lengkapi nama dan qty semua barang dulu.')
    f.items[0].name = 'Seal'
    submitDraft(db, as(db, 'Teknisi'), f.id)
    expect(f.status).toBe('Diajukan')
    expect(() => submitDraft(db, as(db, 'Teknisi'), f.id)).toThrow(DomainError)
  })
})

describe('confirmItems and finishWork', () => {
  test('Tidak Sesuai needs a note and notifies Sales and Purchasing', () => {
    const db = freshDb()
    const f = db.forms[3]
    expect(() => confirmItems(db, as(db, 'Teknisi'), f.id, 'Tidak Sesuai', '')).toThrow('Tulis catatan alasan Tidak Sesuai.')
    confirmItems(db, as(db, 'Teknisi'), f.id, 'Tidak Sesuai', 'Salah merk')
    expect(f.conf).toBe('Tidak Sesuai')
    expect(f.log.at(-1)).toMatchObject({ act: 'Ubah status konfirmasi · Salah merk', o: 'Menunggu', n: 'Tidak Sesuai' })
    expect(db.notifs[0].roles).toEqual(['Sales', 'Purchasing'])
  })
  test('rejects confirm before items are all received and by other roles', () => {
    const db = freshDb()
    expect(() => confirmItems(db, as(db, 'Teknisi'), db.forms[2].id, 'Sesuai', '')).toThrow(DomainError)
    expect(() => confirmItems(db, as(db, 'Gudang'), db.forms[3].id, 'Sesuai', '')).toThrow(DomainError)
  })
  test('finishWork only after Sesuai', () => {
    const db = freshDb()
    const f = db.forms[3]
    expect(() => finishWork(db, as(db, 'Teknisi'), f.id)).toThrow(DomainError)
    confirmItems(db, as(db, 'Teknisi'), f.id, 'Sesuai', '')
    finishWork(db, as(db, 'Teknisi'), f.id)
    expect(f.done).toBe(true)
    expect(f.log.at(-1)).toMatchObject({ act: 'Ubah status pekerjaan', o: 'Dikerjakan', n: 'Selesai' })
    expect(() => finishWork(db, as(db, 'Teknisi'), f.id)).toThrow(DomainError)
  })
})
