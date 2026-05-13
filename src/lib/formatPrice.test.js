import { describe, it, expect } from 'vitest'
import formatPrice from './formatPrice'

describe('formatPrice', () => {
  it('formats integer reais with BRL prefix and decimals', () => {
    expect(formatPrice(100)).toMatch(/^R\$\s?100,00$/)
  })

  it('formats fractional values rounded to 2 decimals', () => {
    expect(formatPrice(149.9)).toMatch(/^R\$\s?149,90$/)
    expect(formatPrice(79.99)).toMatch(/^R\$\s?79,99$/)
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toMatch(/^R\$\s?0,00$/)
  })

  it('accepts numeric strings (via Number coercion in toLocaleString chain)', () => {
    expect(formatPrice(Number('120'))).toMatch(/^R\$\s?120,00$/)
  })
})
