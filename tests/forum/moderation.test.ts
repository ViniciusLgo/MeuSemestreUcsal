import { describe, it, expect } from 'vitest'
import { moderateForumContent } from '../../src/lib/forum/moderation'

describe('moderateForumContent', () => {
  it('texto limpo retorna publicado', () => {
    expect(moderateForumContent('Alguém tem dicas sobre Cálculo I?', 500)).toBe('publicado')
  })

  it('palavra ofensiva em PT dispara em_revisao', () => {
    const result = moderateForumContent('esse professor é uma merda total', 500)
    expect(result).toBe('em_revisao')
  })

  it('palavra ofensiva em EN dispara em_revisao', () => {
    const result = moderateForumContent('what a bullshit class', 500)
    expect(result).toBe('em_revisao')
  })

  it('texto vazio retorna publicado', () => {
    expect(moderateForumContent('', 500)).toBe('publicado')
  })

  it('texto com muitas maiúsculas (CAPS LOCK) dispara em_revisao', () => {
    const result = moderateForumContent('ESSE PROFESSOR É HORRÍVEL E NÃO SABE NADA!!!', 500)
    expect(result).toBe('em_revisao')
  })

  it('link suspeito dispara em_revisao', () => {
    const result = moderateForumContent('acesse aqui http://site-suspeito.xyz/clique', 500)
    expect(result).toBe('em_revisao')
  })

  it('texto com email pessoal dispara em_revisao', () => {
    const result = moderateForumContent('me manda mensagem em joao123@gmail.com', 500)
    expect(result).toBe('em_revisao')
  })

  it('texto com CPF dispara em_revisao', () => {
    const result = moderateForumContent('meu CPF é 123.456.789-00', 500)
    expect(result).toBe('em_revisao')
  })
})
