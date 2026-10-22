import { describe, expect, test } from 'vitest'
import { fd, fdt, iso, rn, rp } from './format'

describe('format', () => {
  test('fd formats day, Indonesian month abbreviation, year', () => {
    expect(fd(new Date(2026, 9, 15))).toBe('15 Okt 2026')
  })
  test('fdt appends HH:mm', () => {
    expect(fdt(new Date(2026, 9, 15, 16, 10))).toBe('15 Okt 2026 16:10')
  })
  test('iso zero-pads month and day', () => {
    expect(iso(new Date(2026, 9, 5))).toBe('2026-10-05')
  })
  test('rp uses Rp with id-ID grouping', () => {
    expect(rp(2145000)).toBe('Rp2.145.000')
    expect(rp(12000000)).toBe('Rp12.000.000')
    expect(rp(0)).toBe('Rp0')
  })
  test('rn uses id-ID grouping and treats missing as 0', () => {
    expect(rn(2145000)).toBe('2.145.000')
    expect(rn(undefined as never)).toBe('0')
  })
})
