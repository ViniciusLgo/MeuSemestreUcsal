// Cores disponíveis — mesmas do Avatar.tsx
const COLORS = [
  '#e57373', // vermelho suave
  '#81c784', // verde suave
  '#64b5f6', // azul suave
  '#ffd54f', // amarelo suave
  '#ff8a65', // laranja suave
  '#ba68c8', // roxo suave
]

const ADJETIVOS = [
  'Veloz', 'Curioso', 'Sábio', 'Dourado', 'Sereno', 'Bravo', 'Astuto',
  'Calmo', 'Dócil', 'Esperto', 'Feroz', 'Gentil', 'Hábil', 'Intenso',
  'Jovial', 'Ligeiro', 'Místico', 'Nobre', 'Ousado', 'Prudente',
  'Quieto', 'Rápido', 'Sutil', 'Tenaz', 'Único', 'Valente', 'Xucro',
  'Zeloso', 'Alegre', 'Brilhante', 'Certeiro', 'Destemido', 'Elegante',
  'Furtivo', 'Gracioso', 'Honesto', 'Imponente', 'Justo', 'Leal',
  'Majestoso', 'Notável', 'Paciente', 'Resoluto', 'Sagaz', 'Terrível',
  'Vigoroso', 'Altivo', 'Benévolo', 'Corajoso',
]

const ANIMAIS = [
  'Tucano', 'Onça', 'Jacaré', 'Capivara', 'Tamanduá', 'Arara', 'Boto',
  'Caititu', 'Jaguatirica', 'Mico', 'Pirarucu', 'Quati', 'Raposa',
  'Sucuri', 'Tapioca', 'Urubu', 'Veado', 'Xexéu', 'Anta', 'Boto',
  'Cágado', 'Dendê', 'Lobo', 'Mutum', 'Nhambu', 'Paca', 'Siriema',
  'Tatu', 'Gavião', 'Juriti', 'Largato', 'Maçarico', 'Nambu', 'Ouriço',
  'Pelicano', 'Quero', 'Rolinha', 'Sabiá', 'Tamanduá', 'Urutau',
  'Vanelo', 'Yararé', 'Zebra', 'Abelha', 'Beija-Flor', 'Cará',
  'Furão', 'Graxaim', 'Irara',
]

export function generateNickname(): string {
  const adj    = ADJETIVOS[Math.floor(Math.random() * ADJETIVOS.length)]
  const animal = ANIMAIS[Math.floor(Math.random() * ANIMAIS.length)]
  return `${animal} ${adj}`
}

export function getNicknameColor(nickname: string): string {
  let hash = 0
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}
