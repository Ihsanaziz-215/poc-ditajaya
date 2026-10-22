import { PDFDocument } from 'pdf-lib'
import { describe, expect, test } from 'vitest'
import { buildQuotePdf, quotePdfName } from './quotePdf'
import { freshDb } from './testing'

const db = freshDb()
const q = db.quotes.find((x) => x.id === 'Q3001')!

describe('quotation PDF', () => {
  test('is a real PDF with the quote title', async () => {
    const bytes = await buildQuotePdf({ quote: q, vi: 0, cust: 'PT Contoh', formId: q.formId })
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe('%PDF-')
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getTitle()).toContain(q.number)
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1)
  })
  test('survives non-Latin text and paginates a long item list', async () => {
    const big = structuredClone(q)
    const v = big.versions[0]
    v.subject = 'Perihal 中文 ✓ emoji 😀'
    v.items = Array.from({ length: 60 }, (_, i) => ({ iid: `x${i}`, name: `Barang panjang ${i} `.repeat(6), qty: i + 1, price: 1_000_000, disc: 0 }))
    const pdf = await PDFDocument.load(await buildQuotePdf({ quote: big, vi: 0, cust: null, formId: null }))
    expect(pdf.getPageCount()).toBeGreaterThan(1)
  })
  test('file name matches the email attachment name', () => {
    expect(quotePdfName({ ...q, number: 'QT/2610/001' }, 2)).toBe('Quotation-QT-2610-001-v2.pdf')
  })
})
