import { describe, it, expect } from 'vitest'
import { generateNickname, getNicknameColor } from '../../src/lib/forum/nicknames'

describe('generateNickname', () => {
  it('retorna string no formato "Palavra Palavra"', () => {
    const nick = generateNickname()
    const parts = nick.split(' ')
    expect(parts).toHaveLength(2)
    expect(parts[0]).toMatch(/^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]/)
    expect(parts[1]).toMatch(/^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]/)
  })

  it('gera nicknames diferentes em chamadas seguidas (alta probabilidade)', () => {
    const nicks = new Set(Array.from({ length: 20 }, generateNickname))
    expect(nicks.size).toBeGreaterThan(5)
  })
})

describe('getNicknameColor', () => {
  it('retorna uma string hex ou classe de cor válida', () => {
    const color = getNicknameColor('Tucano Veloz')
    expect(typeof color).toBe('string')
    expect(color.length).toBeGreaterThan(0)
  })

  it('é determinístico — mesmo nickname sempre dá mesma cor', () => {
    expect(getNicknameColor('Onça Sábia')).toBe(getNicknameColor('Onça Sábia'))
  })

  it('nicknames diferentes podem ter cores diferentes', () => {
    const cores = new Set(['Tucano Veloz', 'Capivara Dourada', 'Jacaré Sereno', 'Peixe Curioso'].map(getNicknameColor))
    expect(cores.size).toBeGreaterThan(1)
  })
})
