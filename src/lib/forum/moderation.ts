// Palavras em português — mesmas da moderação de avaliações
const BAD_WORDS_PT = [
  'viado','viada','bicha','puta','putinha','prostituta','vadia','piranha','safada','safado',
  'cuzao','cuzão','arrombado','fdp','filho da puta','vsf','vai se foder','vai tomar no cu',
  'idiota','imbecil','retardado','mongoloid','estupido','estúpido','burro','cretino',
  'lixo','lixo humano','inutil','inútil','incompetente','merda','bosta','porra','caralho',
  'cacete','buceta','pau no cu','toma no cu','fuder','foder','cagar','saco','escroto',
  'matar','morro','morra','assassinar','machucar','bater','surrar','estuprar',
  'negro','nega','macaco','macaca','judeu','travesti','viado','gay',
]

// Palavras em inglês
const BAD_WORDS_EN = [
  'fuck','fucking','fucker','shit','bitch','asshole','bastard','cunt','dick','cock',
  'pussy','whore','slut','faggot','nigger','nigga','retard','idiot','moron','stupid',
  'kill yourself','kys','rape','rapist','nazi','racist','hate you',
]

const ALL_BAD_WORDS = [...BAD_WORDS_PT, ...BAD_WORDS_EN]

const PERSONAL_DATA_PATTERNS = [
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/,
  /\b\d{2}\s*9?\d{4}[-\s]?\d{4}\b/,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/,
  /\b(instagram|ig|insta|twitter|tiktok|whatsapp|zap|telegram)\b/i,
  // links genéricos suspeitos
  /https?:\/\/[^\s]{10,}/i,
]

export type ForumStatus = 'publicado' | 'em_revisao'

export function moderateForumContent(text: string, maxLength = 5000): ForumStatus {
  if (!text || text.trim().length < 3) return 'publicado'
  if (text.length > maxLength) return 'em_revisao'

  const lower = text.toLowerCase()

  if (ALL_BAD_WORDS.some((w) => lower.includes(w))) return 'em_revisao'
  if (PERSONAL_DATA_PATTERNS.some((p) => p.test(text))) return 'em_revisao'

  // caps excessivos
  const letters = text.replace(/[^a-zA-ZÀ-ÿ]/g, '')
  if (letters.length >= 10) {
    const upperRatio = letters.split('').filter((c) => c === c.toUpperCase()).length / letters.length
    if (upperRatio > 0.6) return 'em_revisao'
  }

  return 'publicado'
}
