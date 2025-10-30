// Configurações do Modal de Pagamento

export const PAYMENT_METHODS = {
  CARD: 'card',
  PIX: 'pix',
  BOLETO: 'boleto'
} as const

export const PAYMENT_PERIODS = {
  MENSAL: 'mensal',
  TRIMESTRAL: 'trimestral', 
  SEMESTRAL: 'semestral',
  ANUAL: 'anual'
} as const

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CARD]: '💳 Cartão de Crédito',
  [PAYMENT_METHODS.PIX]: '📱 PIX',
  [PAYMENT_METHODS.BOLETO]: '🧾 Boleto'
}

export const PAYMENT_PERIOD_LABELS = {
  [PAYMENT_PERIODS.MENSAL]: 'Mensal',
  [PAYMENT_PERIODS.TRIMESTRAL]: 'Trimestral',
  [PAYMENT_PERIODS.SEMESTRAL]: 'Semestral', 
  [PAYMENT_PERIODS.ANUAL]: 'Anual'
}

export const PAYMENT_ICONS = {
  [PAYMENT_METHODS.CARD]: 'fa-credit-card',
  [PAYMENT_METHODS.PIX]: 'fa-qrcode',
  [PAYMENT_METHODS.BOLETO]: 'fa-barcode'
}

export const PAYMENT_BUTTON_LABELS = {
  [PAYMENT_METHODS.CARD]: 'Pagar',
  [PAYMENT_METHODS.PIX]: 'Gerar PIX',
  [PAYMENT_METHODS.BOLETO]: 'Gerar Boleto'
}

// Validações
export const validateCardData = (cardData: any) => {
  const errors: string[] = []
  
  if (!cardData.cardNumber || cardData.cardNumber.length < 16) {
    errors.push('Número do cartão inválido')
  }
  
  if (!cardData.cardName || cardData.cardName.trim().length < 3) {
    errors.push('Nome no cartão é obrigatório')
  }
  
  if (!cardData.expiryDate || !/^\d{2}\/\d{2}$/.test(cardData.expiryDate)) {
    errors.push('Data de validade inválida (MM/AA)')
  }
  
  if (!cardData.cvv || cardData.cvv.length < 3) {
    errors.push('CVV inválido')
  }
  
  return errors
}

export const validateCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/\D/g, '')
  return cleanCPF.length === 11
}

// Formatadores
export const formatCardNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

export const formatExpiryDate = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length >= 2) {
    return numbers.substring(0, 2) + '/' + numbers.substring(2, 4)
  }
  return numbers
}

export const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return value
}

// Configurações de estilo
export const MODAL_STYLES = {
  backdrop: { backgroundColor: 'rgba(0,0,0,0.5)' },
  planName: { fontSize: '1.3rem', fontWeight: 'bold' },
  price: { fontSize: '1.1rem', color: '#007bff' }
}

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS]
export type PaymentPeriod = typeof PAYMENT_PERIODS[keyof typeof PAYMENT_PERIODS]