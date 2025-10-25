import { PlanoVenda } from './planos-venda'

export interface UsuarioResponsavel {
  id: string
  name: string
  email: string
}

export interface Loja {
  id: string
  nome: string
  cnpj: string
  email: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  logo?: string
  planoId?: string
  plano?: PlanoVenda
  userId?: string
  responsavel?: UsuarioResponsavel | null
  ativo: boolean
  createdAt: Date
  updatedAt: Date
}