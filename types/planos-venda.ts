export interface BaseCalculo {
  id?: string
  nome: string
  percentual: string | number
  descricao: string
}

export interface PlanoVenda {
  id?: string
  nome: string
  descricao?: string
  precoMensal: string | number
  precoAnual: string | number
  isTrial?: boolean
  status: 'ativo' | 'inativo'
}

export interface TaxaAdesao {
  tipo: 'valor' | 'percentual'
  valor: number
  percentual: number
  aplicar: boolean
}

export interface AdesaoPlano {
  id?: string
  lojaId: string
  planoId: string
  taxaAdesao: TaxaAdesao
  status: 'ativo' | 'inativo'
  dataAdesao: Date
}

export interface Loja {
  id: string
  nome: string
  cidade: string
  [key: string]: any
}

export interface PlanoPreDefinido {
  id: string
  nome: string
  descricao: string
  personalizado?: boolean
  // caso necessário, ofertas pré-definidas devem ser tratadas como `Oferta`
}