
'use client'
import DynamicVehicleImageUploadCards, { DynamicCard } from '../../../components/DynamicVehicleImageUploadCards'


import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { VehicleImagesByPart } from '../../../components/VehicleImageUploadCards'
import { Role } from '../../../types/auth'
import { useAuth } from '../../../stories/authStore'
import { API_BASE_URL } from '../../../lib/api'
import { useToast } from '../../../stories/toastStore'
import { formatCurrency } from '../../../lib/formatters'

interface Cliente {
  id: string
  name: string
  email: string
}

interface TipoCotacao {
  id: string
  nome: string
  tipoVeiculo?: string
  descricao?: string
  temTaxaAdesao: boolean
  taxaAdesaoTipo?: string
  taxaAdesaoValor?: number | string
  taxaAdesaoPercentual?: number | string
  temBaseCalculo: boolean
  baseCalculoTipo?: string
  baseCalculoPercentual?: number | string
  baseCalculoValorFixo?: number | string
  comissaoVendasTipo?: 'percentual' | 'valor' | null
  comissaoVendasPercentual?: number | string | null
  comissaoVendasValor?: number | string | null
  anoMinimoVeiculo?: number
  loja?: {
    id: string
    nome: string
  }
}

type TaxaAdesaoModo = 'padrao' | 'manual' | 'nenhuma'
type TaxaAdesaoTipoManual = 'valor' | 'percentual'

type MetodoPagamento = 'pix' | 'boleto' | 'cartao'

interface VendaData {
  clienteId: string
  valorVeiculo: number
  valorSeguro: number
  tipoVeiculo: string
  marca: string
  modelo: string
  ano: string
  placa: string
  tipoCotacaoLojaId?: string
  formaPagamento: string
  numeroParcelas: number
  metodoPagamento: MetodoPagamento
  taxaAdesaoModo: TaxaAdesaoModo
  taxaAdesaoTipoManual: TaxaAdesaoTipoManual
  taxaAdesaoValorManual: number
  vendedorId?: string
  desconto: number
}

export default function NovaVenda() {
  const [dynamicImageCards, setDynamicImageCards] = useState<DynamicCard[]>([])
  const { token, user } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [tiposCotacao, setTiposCotacao] = useState<TipoCotacao[]>([])
  const [formData, setFormData] = useState<VendaData>({
    clienteId: '',
    valorVeiculo: 0,
    valorSeguro: 0,
    tipoVeiculo: '',
    marca: '',
    modelo: '',
    ano: '',
    placa: '',
    tipoCotacaoLojaId: '',
    formaPagamento: 'total',
    numeroParcelas: 1,
    metodoPagamento: 'pix',
    taxaAdesaoModo: 'padrao',
    taxaAdesaoTipoManual: 'valor',
    taxaAdesaoValorManual: 0,
    desconto: 0
  })

  const [valorVeiculoDisplay, setValorVeiculoDisplay] = useState('R$ 0,00')
  const [taxaAdesaoValorManualDisplay, setTaxaAdesaoValorManualDisplay] = useState('R$ 0,00')
  const [descontoDisplay, setDescontoDisplay] = useState('R$ 0,00')
  const [mostrarDesconto, setMostrarDesconto] = useState(false)
  const [fipeToastShown, setFipeToastShown] = useState(false)
  const [incompleteSaleToastShown, setIncompleteSaleToastShown] = useState(false)
  const [editingVendaId, setEditingVendaId] = useState<number | null>(null)
  const [imagensVeiculo, setImagensVeiculo] = useState<string[]>([])
  const [imagensVeiculoByPart, setImagensVeiculoByPart] = useState<VehicleImagesByPart>({
    frente: [],
    verso: [],
    lado_direito: [],
    lado_esquerdo: [],
    painel_interno: [],
    pneus: []
  })
  const [vendedorInfo, setVendedorInfo] = useState<any>(null)

  // Função para normalizar o tipo de veículo para corresponder às opções do select
  const normalizarTipoVeiculo = (tipo: string | undefined | null) => {
    if (!tipo) return ''
    const tipoLower = tipo.toLowerCase().trim()
    if (tipoLower.includes('carro') || tipoLower === 'carros') return 'Carro'
    if (tipoLower.includes('moto') || tipoLower === 'motos') return 'Moto'
    if (tipoLower.includes('caminh') || tipoLower.includes('truck') || tipoLower === 'caminhoes' || tipoLower === 'caminhao') return 'Caminhão'
    if (tipoLower.includes('ôni') || tipoLower.includes('bus') || tipoLower === 'onibus') return 'Ônibus'
    return tipo
  }

  useEffect(() => {
    // Sincronizar o valor de exibição com o estado do formulário
    setValorVeiculoDisplay(formatCurrency(formData.valorVeiculo))
  }, [formData.valorVeiculo])

  useEffect(() => {
    if (formData.taxaAdesaoTipoManual === 'valor') {
      setTaxaAdesaoValorManualDisplay(formatCurrency(formData.taxaAdesaoValorManual))
    }
  }, [formData.taxaAdesaoTipoManual, formData.taxaAdesaoValorManual])

  useEffect(() => {
    setDescontoDisplay(formatCurrency(formData.desconto))
  }, [formData.desconto])

  useEffect(() => {
    // Verificar se há parâmetros da busca FIPE na URL
    if (searchParams && !fipeToastShown && tiposCotacao.length > 0) {
      const tipoVeiculoParam = searchParams.get('tipoVeiculo')
      const marca = searchParams.get('marca')
      const modelo = searchParams.get('modelo')
      const ano = searchParams.get('ano')
      const valorFipe = searchParams.get('valorFipe')

      if (tipoVeiculoParam || marca || modelo || ano || valorFipe) {
        // Mapear o tipo de veículo da URL para o valor correto do select
        const mapTipoVeiculo = (tipo: string | null) => {
          if (!tipo) return ''
          switch (tipo.toLowerCase()) {
            case 'carros':
            case 'carro':
              return 'Carro'
            case 'motos':
            case 'moto':
              return 'Moto'
            case 'caminhoes':
            case 'caminhão':
            case 'caminhao':
              return 'Caminhão'
            case 'onibus':
            case 'ônibus':
            case 'bus':
              return 'Ônibus'
            default:
              return tipo
          }
        }

        const tipoVeiculoMapeado = mapTipoVeiculo(tipoVeiculoParam)

        // Selecionar automaticamente um tipo de cotação baseado no tipo de veículo
        const selecionarTipoCotacaoAutomatico = (tipoVeiculo: string) => {
          // Procurar por tipos de cotação que correspondam ao tipo de veículo
          const tiposCompativeis = tiposCotacao.filter(tipo =>
            tipo.nome.toLowerCase().includes(tipoVeiculo.toLowerCase()) ||
            tipo.descricao?.toLowerCase().includes(tipoVeiculo.toLowerCase())
          )

          // Retornar o primeiro tipo compatível encontrado, ou o primeiro tipo disponível
          return tiposCompativeis.length > 0 ? tiposCompativeis[0].id : (tiposCotacao.length > 0 ? tiposCotacao[0].id : '')
        }

        const tipoCotacaoId = tipoVeiculoMapeado ? selecionarTipoCotacaoAutomatico(tipoVeiculoMapeado) : ''

        setFormData(prev => ({
          ...prev,
          tipoVeiculo: normalizarTipoVeiculo(tipoVeiculoMapeado) || prev.tipoVeiculo,
          marca: marca || prev.marca,
          modelo: modelo || prev.modelo,
          ano: ano || prev.ano,
          valorVeiculo: valorFipe ? parseFloat(valorFipe) || 0 : prev.valorVeiculo,
          tipoCotacaoLojaId: tipoCotacaoId || prev.tipoCotacaoLojaId
        }))

        showToast('Dados do veículo preenchidos automaticamente da busca FIPE!', 'success')
        setFipeToastShown(true)
      }
    }
  }, [searchParams, fipeToastShown, showToast, tiposCotacao])

  useEffect(() => {
    // Verificar se há parâmetros de venda incompleta na URL
    if (searchParams && !incompleteSaleToastShown && clientes.length > 0) {
      const clienteId = searchParams.get('clienteId')
      const telefone = searchParams.get('telefone')
      const tipoVeiculo = searchParams.get('tipoVeiculo')
      const marca = searchParams.get('marca')
      const modelo = searchParams.get('modelo')
      const ano = searchParams.get('ano')
      const valorVeiculo = searchParams.get('valorVeiculo')

      if (clienteId || telefone || tipoVeiculo || marca || modelo || ano || valorVeiculo) {
        // Verificar se o clienteId existe na lista de clientes carregada
        const clienteExiste = clienteId ? clientes.some(cliente => cliente.id === clienteId) : true

        if (clienteId && !clienteExiste) {
          showToast('Cliente não encontrado ou não autorizado para este vendedor. Os dados do veículo foram preenchidos.', 'warning')
          // Não definir o clienteId se não existir, mas ainda preenche os outros dados
          setFormData(prev => ({
            ...prev,
            tipoVeiculo: normalizarTipoVeiculo(tipoVeiculo) || prev.tipoVeiculo,
            marca: marca || prev.marca,
            modelo: modelo || prev.modelo,
            ano: ano || prev.ano,
            valorVeiculo: valorVeiculo ? parseFloat(valorVeiculo) || 0 : prev.valorVeiculo
          }))
        } else {
          // Se há clienteId, verificar se existe venda pendente para atualizar
          if (clienteId) {
            buscarVendaPendentePorCliente(clienteId).then(vendaPendente => {
              if (vendaPendente) {
                // Há venda pendente, vamos editar ela
                setEditingVendaId(vendaPendente.id)
                setFormData(prev => ({
                  ...prev,
                  clienteId: clienteId || prev.clienteId,
                  tipoVeiculo: normalizarTipoVeiculo(tipoVeiculo || vendaPendente.tipoVeiculo) || prev.tipoVeiculo,
                  marca: marca || vendaPendente.marca || prev.marca,
                  modelo: modelo || vendaPendente.modelo || prev.modelo,
                  ano: ano || vendaPendente.ano || prev.ano,
                  valorVeiculo: valorVeiculo ? parseFloat(valorVeiculo) || 0 : vendaPendente.valorVeiculo || prev.valorVeiculo,
                  tipoCotacaoLojaId: vendaPendente.tipoCotacaoLojaId || prev.tipoCotacaoLojaId,
                  formaPagamento: vendaPendente.formaPagamento || prev.formaPagamento,
                  numeroParcelas: vendaPendente.numeroParcelas || prev.numeroParcelas,
                  metodoPagamento: vendaPendente.metodoPagamento || prev.metodoPagamento,
                  taxaAdesaoModo: vendaPendente.taxaAdesaoModo || prev.taxaAdesaoModo,
                  taxaAdesaoTipoManual: vendaPendente.taxaAdesaoTipoManual || prev.taxaAdesaoTipoManual,
                  taxaAdesaoValorManual: vendaPendente.taxaAdesaoValorManual || prev.taxaAdesaoValorManual
                }))
                showToast('Venda pendente encontrada e carregada para edição!', 'info')
              } else {
                // Não há venda pendente, preencher dados normalmente
                setFormData(prev => ({
                  ...prev,
                  clienteId: clienteId || prev.clienteId,
                  tipoVeiculo: normalizarTipoVeiculo(tipoVeiculo) || prev.tipoVeiculo,
                  marca: marca || prev.marca,
                  modelo: modelo || prev.modelo,
                  ano: ano || prev.ano,
                  valorVeiculo: valorVeiculo ? parseFloat(valorVeiculo) || 0 : prev.valorVeiculo
                }))
                showToast('Dados da venda incompleta preenchidos automaticamente!', 'success')
              }
            })
          } else {
            // Não há clienteId, apenas preencher dados do veículo
            setFormData(prev => ({
              ...prev,
              tipoVeiculo: tipoVeiculo || prev.tipoVeiculo,
              marca: marca || prev.marca,
              modelo: modelo || prev.modelo,
              ano: ano || prev.ano,
              valorVeiculo: valorVeiculo ? parseFloat(valorVeiculo) || 0 : prev.valorVeiculo
            }))
            showToast('Dados da venda incompleta preenchidos automaticamente!', 'success')
          }
        }

        setIncompleteSaleToastShown(true)
      }
    }
  }, [searchParams, incompleteSaleToastShown, showToast, clientes, user?.vendedorId])

  const buscarClientes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendedor/clientes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setClientes(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      setClientes([])
      showToast('Erro ao carregar lista de clientes', 'error')
    }
  }

  const buscarTiposCotacao = async (lojaId?: string) => {
    if (!token) {
      return
    }

    try {
      let endpoint = `${API_BASE_URL}/api/vendas/vendedor/tipos-cotacao`
      
      // Se veio lojaId da busca FIPE, buscar tipos específicos da loja
      if (lojaId) {
        endpoint = `${API_BASE_URL}/api/lojas/${lojaId}/tipos-cotacao`
        console.log('Buscando tipos de cotação da loja:', lojaId)
        console.log('Endpoint:', endpoint)
      }
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log('Resposta tipos de cotação:', response.data)
      setTiposCotacao(Array.isArray(response.data) ? response.data : [])
      
      if (lojaId && response.data.length > 0) {
        showToast(`${response.data.length} tipos de cotação carregados da loja selecionada`, 'success')
      }
    } catch (error) {
      console.error('Erro ao buscar tipos de cotação:', error)
      setTiposCotacao([])
      showToast('Erro ao carregar tipos de cotação', 'error')
    }
  }

  const buscarVendaPendentePorCliente = async (clienteId: string) => {
    try {
  const response = await axios.get(`${API_BASE_URL}/api/vendas/cliente/${clienteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const vendas = Array.isArray(response.data) ? response.data : []
      // Procurar por venda pendente do vendedor atual
      const vendaPendente = vendas.find((venda: any) => 
        venda.status === 'pendente' && 
        venda.vendedorId === user?.vendedorId
      )
      
      return vendaPendente || null
    } catch (error) {
      console.error('Erro ao buscar vendas do cliente:', error)
      return null
    }
  }

  const buscarVendedorInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendedor/perfil`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVendedorInfo(response.data)
    } catch (error) {
      console.error('Erro ao buscar informações do vendedor:', error)
    }
  }

  useEffect(() => {
    if (token) {
      buscarClientes()
      
      // Verificar se há lojaId nos parâmetros da URL
      const lojaId = searchParams?.get('lojaId')
      buscarTiposCotacao(lojaId || undefined)
      
      buscarVendedorInfo()
    }
  }, [token, searchParams])

  // Criar cards pré-definidos apenas para carros
  useEffect(() => {
    if (formData.tipoVeiculo === 'Carro' && dynamicImageCards.length === 0) {
      setDynamicImageCards([
        { id: 1, title: 'Frente do Veículo', images: [] },
        { id: 2, title: 'Traseira do Veículo', images: [] },
        { id: 3, title: 'Lado Direito', images: [] },
        { id: 4, title: 'Lado Esquerdo', images: [] },
        { id: 5, title: 'Painel Interno', images: [] }
      ])
    } else if (formData.tipoVeiculo !== 'Carro' && formData.tipoVeiculo !== '') {
      // Limpar cards se mudar para outro tipo de veículo
      setDynamicImageCards([])
    }
  }, [formData.tipoVeiculo])

  const handleValorVeiculoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    const numericValue = Number(rawValue) / 100
    
    setValorVeiculoDisplay(formatCurrency(numericValue))
    setFormData(prev => ({
      ...prev,
      valorVeiculo: numericValue
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'placa' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : value,
      ...(name === 'formaPagamento' && value === 'total' ? { numeroParcelas: 1 } : {})
    }))
  }

  const handleMetodoPagamentoChange = (metodo: MetodoPagamento) => {
    setFormData(prev => {
      const isCartao = metodo === 'cartao'
      const formaPagamento = isCartao ? prev.formaPagamento : 'total'
      const numeroParcelas = isCartao && formaPagamento === 'parcelado' ? prev.numeroParcelas : 1

      return {
        ...prev,
        metodoPagamento: metodo,
        formaPagamento,
        numeroParcelas
      }
    })
  }

  const formatErrorMessage = (error: any): string => {
    const fallback = 'Erro ao criar venda'

    if (!error) {
      return fallback
    }

    const rawMessage = error.response?.data?.message ?? error.message ?? error

    if (Array.isArray(rawMessage)) {
      return rawMessage
        .map(item => (typeof item === 'string' ? item : item?.message ?? JSON.stringify(item)))
        .join(' | ')
    }

    if (typeof rawMessage === 'object') {
      if (rawMessage.message) {
        return typeof rawMessage.message === 'string'
          ? rawMessage.message
          : JSON.stringify(rawMessage.message)
      }

      try {
        return JSON.stringify(rawMessage)
      } catch (serializationError) {
        return fallback
      }
    }

    return typeof rawMessage === 'string' ? rawMessage : fallback
  }

  const handleTaxaAdesaoModoChange = (modo: TaxaAdesaoModo) => {
    setFormData(prev => ({
      ...prev,
      taxaAdesaoModo: modo,
      ...(modo === 'nenhuma' ? { taxaAdesaoValorManual: 0 } : {})
    }))
  }

  const handleTaxaAdesaoTipoManualChange = (tipo: TaxaAdesaoTipoManual) => {
    setFormData(prev => ({
      ...prev,
      taxaAdesaoTipoManual: tipo
    }))
  }

  const handleTaxaAdesaoValorManualChange = (valor: string) => {
    const parsed = parseFloat(valor.replace(',', '.'))
    setFormData(prev => ({
      ...prev,
      taxaAdesaoValorManual: Number.isNaN(parsed) ? 0 : Math.max(0, parsed)
    }))
  }

  const handleTaxaAdesaoValorManualCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    const numericValue = Number(rawValue) / 100

    setTaxaAdesaoValorManualDisplay(formatCurrency(numericValue))
    setFormData(prev => ({
      ...prev,
      taxaAdesaoValorManual: numericValue
    }))
  }

  const handleDescontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    const numericValue = Number(rawValue) / 100
    
    setDescontoDisplay(formatCurrency(numericValue))
    setFormData(prev => ({
      ...prev,
      desconto: numericValue
    }))
  }

  const handleMostrarDescontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setMostrarDesconto(checked)
    
    if (!checked) {
      // Se desmarcar o checkbox, zerar o desconto
      setDescontoDisplay('R$ 0,00')
      setFormData(prev => ({
        ...prev,
        desconto: 0
      }))
    }
  }

  const resumoCalculo = useMemo(() => {
    const tipoSelecionado = tiposCotacao.find(tipo => tipo.id === formData.tipoCotacaoLojaId)

    if (!tipoSelecionado || formData.valorVeiculo <= 0) {
      return null
    }

    const parseDecimal = (valor?: number | string | null) => {
      if (valor === null || valor === undefined) {
        return 0
      }

      if (typeof valor === 'number') {
        return valor
      }

      const parsed = parseFloat(valor)
      return Number.isNaN(parsed) ? 0 : parsed
    }

    const valorVeiculo = formData.valorVeiculo
    let valorBase = valorVeiculo

    if (tipoSelecionado.temBaseCalculo) {
      const percentual = parseDecimal(tipoSelecionado.baseCalculoPercentual)
      const valorFixo = parseDecimal(tipoSelecionado.baseCalculoValorFixo)

      if (tipoSelecionado.baseCalculoTipo === 'percentual' && percentual > 0) {
        valorBase = valorVeiculo * (percentual / 100)
      } else if (tipoSelecionado.baseCalculoTipo === 'fixa' && valorFixo > 0) {
        valorBase = valorFixo
      }
    }

    let valorTaxaAdesao = 0

    let descricaoTaxa = 'Sem taxa de adesão'

    if (formData.taxaAdesaoModo === 'manual') {
      const manual = Math.max(0, formData.taxaAdesaoValorManual)
      if (formData.taxaAdesaoTipoManual === 'valor') {
        valorTaxaAdesao = manual
        descricaoTaxa = `Taxa manual fixa (${formatCurrency(manual)})`
      } else {
        valorTaxaAdesao = valorVeiculo * (manual / 100)
        descricaoTaxa = `Taxa manual percentual (${manual}% sobre o veículo)`
      }
    } else if (formData.taxaAdesaoModo === 'padrao' && tipoSelecionado.temTaxaAdesao) {
      const taxaValor = parseDecimal(tipoSelecionado.taxaAdesaoValor)
      const taxaPercentual = parseDecimal(tipoSelecionado.taxaAdesaoPercentual)

      if (tipoSelecionado.taxaAdesaoTipo === 'valor' && taxaValor > 0) {
        valorTaxaAdesao = taxaValor
        descricaoTaxa = `Taxa padrão fixa (${formatCurrency(taxaValor)})`
      } else if (tipoSelecionado.taxaAdesaoTipo === 'percentual' && taxaPercentual > 0) {
        valorTaxaAdesao = valorVeiculo * (taxaPercentual / 100)
        descricaoTaxa = `Taxa padrão percentual (${taxaPercentual}% sobre o veículo)`
      }
    }

    const totalComTaxa = valorBase + valorTaxaAdesao
    const desconto = Math.max(0, formData.desconto)
    const totalComDesconto = Math.max(0, totalComTaxa - desconto)
    const isParcelado = formData.metodoPagamento === 'cartao' && formData.formaPagamento === 'parcelado' && formData.numeroParcelas > 0
    const numeroParcelasEfetivo = isParcelado ? formData.numeroParcelas : 1
    const valorPorParcela = isParcelado
      ? totalComDesconto / numeroParcelasEfetivo
      : 0

    return {
      tipoCotacao: tipoSelecionado,
      valorBase,
      valorTaxaAdesao,
      totalComTaxa,
      desconto,
      totalComDesconto,
      valorPorParcela,
      descricaoTaxa,
      metodoPagamento: formData.metodoPagamento,
      isParcelado,
      numeroParcelas: numeroParcelasEfetivo
    }
  }, [
    tiposCotacao,
    formData.tipoCotacaoLojaId,
    formData.valorVeiculo,
    formData.formaPagamento,
    formData.numeroParcelas,
    formData.metodoPagamento,
    formData.taxaAdesaoModo,
    formData.taxaAdesaoTipoManual,
    formData.taxaAdesaoValorManual,
    formData.desconto
  ])

  const valorTotalAtual = useMemo(() => {
    if (resumoCalculo) {
      return resumoCalculo.totalComDesconto
    }
    return formData.valorVeiculo
  }, [resumoCalculo, formData.valorVeiculo])

  const tiposCotacaoFiltrados = useMemo(() => {
    let filtrados = tiposCotacao
    
    // Filtrar por tipo de veículo
    if (formData.tipoVeiculo) {
      const tipoVeiculoLower = formData.tipoVeiculo.toLowerCase()
      filtrados = filtrados.filter(tipo => {
        if (!tipo.tipoVeiculo) return true
        const tiposCotacaoLower = tipo.tipoVeiculo.toLowerCase()
        
        const mapeamento: { [key: string]: string[] } = {
          'carro': ['carros', 'carro', 'automovel', 'automóvel'],
          'moto': ['motos', 'moto', 'motocicleta'],
          'caminhão': ['caminhoes', 'caminhão', 'caminhao', 'truck'],
          'ônibus': ['onibus', 'ônibus', 'bus']
        }
        
        const tiposCompativeis = mapeamento[tipoVeiculoLower] || [tipoVeiculoLower]
        return tiposCompativeis.some(t => tiposCotacaoLower.includes(t))
      })
    }
    
    // Filtrar por ano mínimo
    if (formData.ano) {
      const anoVeiculo = parseInt(formData.ano)
      if (!isNaN(anoVeiculo)) {
        filtrados = filtrados.filter(tipo => {
          if (!tipo.anoMinimoVeiculo) return true
          return anoVeiculo >= tipo.anoMinimoVeiculo
        })
      }
    }
    
    return filtrados
  }, [tiposCotacao, formData.tipoVeiculo, formData.ano])



  const handleSubmit = async (e: React.FormEvent) => {
  // Log do payload para debug
    e.preventDefault()

    const placaSanitizada = (formData.placa || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .trim()

    if (placaSanitizada.length !== 7 || !/^[A-Z0-9]{7}$/.test(placaSanitizada)) {
      showToast('A placa deve conter exatamente 7 caracteres alfanuméricos (ex.: ABC1D23).', 'error')
      return
    }

    if (formData.tipoCotacaoLojaId && formData.ano) {
      const tipoSelecionado = tiposCotacao.find(tipo => tipo.id === formData.tipoCotacaoLojaId)
      if (tipoSelecionado?.anoMinimoVeiculo) {
        const anoVeiculo = parseInt(formData.ano)
        if (anoVeiculo < tipoSelecionado.anoMinimoVeiculo) {
          showToast(`Este tipo de cotação requer veículos a partir do ano ${tipoSelecionado.anoMinimoVeiculo}`, 'error')
          return
        }
      }
    }

    setLoading(true)

    try {
      const arredondar = (valor: number) => Math.round((valor + Number.EPSILON) * 100) / 100

      const valorVeiculo = arredondar(formData.valorVeiculo)
      const valorTotalVenda = arredondar(resumoCalculo ? resumoCalculo.totalComDesconto : valorVeiculo)
      const desconto = arredondar(formData.desconto)

      const payload = {
  // ...existing code...
  // Log do payload para debug
        clienteId: formData.clienteId,
        valorVeiculo,
        valorSeguro: valorTotalVenda,
        tipoVeiculo: formData.tipoVeiculo,
        marca: formData.marca,
        modelo: formData.modelo,
        ano: formData.ano,
        placa: placaSanitizada,
        tipoCotacaoLojaId: formData.tipoCotacaoLojaId || null,
        formaPagamento: formData.formaPagamento,
        numeroParcelas: formData.numeroParcelas,
        metodoPagamento: formData.metodoPagamento,
        desconto,
        vendedorId: user?.vendedorId || formData.vendedorId,
        ...(vendedorInfo?.tipoVendedor === 'avulso' && { 
          imagensVeiculo: dynamicImageCards.flatMap(card => card.images.map(() => 'blob:placeholder')),
          dadosBase64: dynamicImageCards.flatMap(card => card.imagesBase64 || []),
          lojaId: formData.tipoCotacaoLojaId ? tiposCotacao.find(t => t.id === formData.tipoCotacaoLojaId)?.loja?.id : undefined
        })
      }

      let response
      if (editingVendaId) {
        // Atualizar venda existente
        const endpoint = vendedorInfo?.tipoVendedor === 'avulso' 
          ? `${API_BASE_URL}/api/vendas-avulso/${editingVendaId}`
          : `${API_BASE_URL}/api/vendas/${editingVendaId}`
        
        response = await axios.patch(
          endpoint,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
        showToast('Venda pendente atualizada com sucesso!', 'success')
      } else {
        // Criar nova venda
        const endpoint = vendedorInfo?.tipoVendedor === 'avulso'
          ? `${API_BASE_URL}/api/vendas-avulso`
          : `${API_BASE_URL}/api/vendas`
        
        response = await axios.post(
          endpoint,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
        
        if (vendedorInfo?.tipoVendedor === 'avulso') {
          showToast('Venda avulsa criada com sucesso! Aguardando aprovação da loja.', 'success')
        } else {
          // Processar pagamento fake apenas para vendedores fixos
          try {
            const pagamentoResponse = await axios.post(
              `${API_BASE_URL}/api/pagamentos/processar`,
              {
                vendaId: response.data.id,
                metodoPagamento: formData.metodoPagamento,
                valor: valorTotalVenda
              }
            )
            
            showToast(`Venda criada e pagamento processado! ID: ${pagamentoResponse.data.transactionId}`, 'success')
          } catch (pagamentoError) {
            showToast('Venda criada, mas erro no processamento do pagamento', 'warning')
          }
        }
      }
      
      router.push('/vendedor/vendas')
    } catch (error: any) {
      console.error('Erro ao criar venda:', error)
      const errorMessage = formatErrorMessage(error)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRoles={[Role.SELLER]}>
      <DashboardLayout>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h4 className="card-title mb-0">
                    <i className="fas fa-plus-circle me-2"></i>
                    {editingVendaId ? 'Editar Venda Pendente' : 'Nova Venda'}
                  </h4>
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Informação:</strong> A comissão será calculada automaticamente baseada na taxa definida pela loja.
                    {tiposCotacao.some(tipo => tipo.loja) && (
                      <div className="mt-2">
                        <small>
                          <i className="fas fa-handshake me-1"></i>
                          Como vendedor avulso, você pode trabalhar com múltiplas lojas.
                        </small>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSubmit}>
                    {/* Seleção do Cliente */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <h5 className="text-primary">Selecionar Cliente</h5>
                        <hr />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-8">
                        <div className="form-group">
                          <label htmlFor="clienteId">Cliente *</label>
                          <select
                            className="form-control"
                            id="clienteId"
                            name="clienteId"
                            value={formData.clienteId}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Selecione um cliente</option>
                            {clientes.map((cliente) => (
                              <option key={cliente.id} value={cliente.id}>
                                {cliente.name} - {cliente.email}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>&nbsp;</label>
                          <button
                            type="button"
                            className="btn btn-outline-primary form-control"
                            onClick={() => router.push('/vendedor/cadastrar-cliente')}
                          >
                            <i className="fas fa-plus me-2"></i>
                            Novo Cliente
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dados da Venda */}
                    <div className="row mb-4 mt-4">
                      <div className="col-12">
                        <h5 className="text-primary">Dados da Venda</h5>
                        <hr />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="tipoVeiculo">Tipo de Veículo *</label>
                          <select
                            className="form-control"
                            id="tipoVeiculo"
                            name="tipoVeiculo"
                            value={formData.tipoVeiculo}
                            onChange={(e) => {
                              handleInputChange(e)
                              if (formData.tipoCotacaoLojaId) {
                                setFormData(prev => ({ ...prev, tipoCotacaoLojaId: '' }))
                              }
                            }}
                            required
                          >
                            <option value="">Selecione...</option>
                            <option value="Carro">Carro</option>
                            <option value="Moto">Moto</option>
                            <option value="Caminhão">Caminhão</option>
                            <option value="Ônibus">Ônibus</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="marca">Marca *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="marca"
                            name="marca"
                            value={formData.marca}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="modelo">Modelo *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="modelo"
                            name="modelo"
                            value={formData.modelo}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="ano">Ano *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="ano"
                            name="ano"
                            value={formData.ano}
                            onChange={handleInputChange}
                            placeholder="2024"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="valorVeiculo">Valor do Veículo (R$) *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="valorVeiculo"
                            name="valorVeiculo"
                            value={valorVeiculoDisplay}
                            onChange={handleValorVeiculoChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="placa">Placa *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="placa"
                            name="placa"
                            value={formData.placa}
                            onChange={handleInputChange}
                            placeholder="ABC1D23"
                            maxLength={7}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Checkbox para mostrar campo de desconto */}
                    <div className="row">
                      <div className="col-12">
                        <div className="form-check mb-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="mostrarDesconto"
                            checked={mostrarDesconto}
                            onChange={handleMostrarDescontoChange}
                          />
                          <label className="form-check-label" htmlFor="mostrarDesconto">
                            Aplicar desconto
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Campo de Desconto - só aparece se checkbox estiver marcado */}
                    {mostrarDesconto && (
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="desconto">Valor do Desconto (R$)</label>
                            <input
                              type="text"
                              className="form-control"
                              id="desconto"
                              name="desconto"
                              value={descontoDisplay}
                              onChange={handleDescontoChange}
                              placeholder="R$ 0,00"
                            />
                            <small className="form-text text-muted">
                              Desconto aplicado sobre o valor total
                            </small>
                          </div>
                        </div>
                      </div>
                    )}



                    {(formData.tipoVeiculo || formData.ano) && tiposCotacaoFiltrados.length < tiposCotacao.length && (
                      <div className="row">
                        <div className="col-12">
                          <div className="alert alert-warning">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            <strong>Atenção:</strong> Alguns tipos de cotação foram filtrados.
                            {formData.tipoVeiculo && (
                              <span> Mostrando apenas cotações para {formData.tipoVeiculo.toLowerCase()}s.</span>
                            )}
                            {formData.ano && (
                              <span> Cotações disponíveis para veículos a partir do ano {formData.ano}.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {tiposCotacao.some(tipo => tipo.loja) && (
                      <div className="row">
                        <div className="col-12">
                          <div className="alert alert-info">
                            <i className="fas fa-info-circle me-2"></i>
                            <strong>Vendedor Avulso:</strong> Você tem acesso às cotações de {new Set(tiposCotacao.filter(t => t.loja).map(t => t.loja!.nome)).size} loja(s) que aceitam vendedores avulsos.
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="row">
                      <div className="col-12">
                        <div className="form-group">
                          <label htmlFor="tipoCotacaoLojaId">
                            Tipo de Cotação
                            {tiposCotacao.some(tipo => tipo.loja) && (
                              <small className="text-muted ms-2">
                                (Cotações de lojas que aceitam vendedor avulso)
                              </small>
                            )}
                            {formData.tipoVeiculo && (
                              <small className="text-info ms-2">
                                - Filtrado para {formData.tipoVeiculo.toLowerCase()}s
                              </small>
                            )}
                          </label>
                          <select
                            className="form-control"
                            id="tipoCotacaoLojaId"
                            name="tipoCotacaoLojaId"
                            value={formData.tipoCotacaoLojaId}
                            onChange={handleInputChange}
                          >
                            <option value="">
                              {tiposCotacao.some(tipo => tipo.loja) 
                                ? 'Selecione uma cotação (múltiplas lojas disponíveis)'
                                : 'Selecione um tipo de cotação'
                              }
                            </option>
                            {tiposCotacaoFiltrados.map((tipo) => (
                              <option key={tipo.id} value={tipo.id}>
                                {tipo.loja ? `[${tipo.loja.nome}] ` : ''}{tipo.nome} {tipo.descricao ? `- ${tipo.descricao}` : ''}
                                {tipo.temTaxaAdesao && (
                                  <span className="text-muted">
                                    {tipo.taxaAdesaoTipo === 'valor' 
                                      ? ` (Taxa: ${formatCurrency(Number(tipo.taxaAdesaoValor) || 0)})`
                                      : ` (Taxa: ${Number(tipo.taxaAdesaoPercentual) || 0}%)`
                                    }
                                  </span>
                                )}
                                {tipo.comissaoVendasTipo && (
                                  <span className="text-muted ms-1">
                                    {tipo.comissaoVendasTipo === 'valor'
                                      ? `Comissão: ${formatCurrency(Number(tipo.comissaoVendasValor) || 0)}`
                                      : `Comissão: ${Number(tipo.comissaoVendasPercentual) || 0}%`
                                    }
                                  </span>
                                )}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Seção de Upload de Imagens por Partes */}
                    <div className="row mb-4 mt-4">
                      <div className="col-12">
                        <h5 className="text-primary mb-3">Imagens do Veículo por Partes</h5>
                        <hr />
                        <DynamicVehicleImageUploadCards
                          cards={dynamicImageCards}
                          onCardsChange={setDynamicImageCards}
                          maxCards={10}
                          idVeiculo={formData.placa || 'temp'}
                          tipoVeiculo={formData.tipoVeiculo}
                          clienteId={formData.clienteId}
                        />
                      </div>
                    </div>

                    {/* Dados de Pagamento - apenas para vendedores fixos */}
                    {vendedorInfo?.tipoVendedor !== 'avulso' && (
                      <>
                        <div className="row mb-4 mt-4">
                          <div className="col-12">
                            <h5 className="text-primary">Dados de Pagamento</h5>
                            <hr />
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-4">
                            <div className="form-group">
                              <label htmlFor="metodoPagamento">Método de Pagamento *</label>
                              <select
                                className="form-control"
                                id="metodoPagamento"
                                name="metodoPagamento"
                                value={formData.metodoPagamento}
                                onChange={(e) => handleMetodoPagamentoChange(e.target.value as MetodoPagamento)}
                                required
                              >
                                <option value="pix">Pix</option>
                                <option value="boleto">Boleto</option>
                                <option value="cartao">Cartão</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-group">
                              <label htmlFor="formaPagamento">Forma de Pagamento *</label>
                              {formData.metodoPagamento === 'cartao' ? (
                                <select
                                  className="form-control"
                                  id="formaPagamento"
                                  name="formaPagamento"
                                  value={formData.formaPagamento}
                                  onChange={handleInputChange}
                                  required
                                >
                                  <option value="total">Pagamento Total</option>
                                  <option value="parcelado">Pagamento Parcelado</option>
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  className="form-control"
                                  value="Pagamento Total"
                                  readOnly
                                />
                              )}
                            </div>
                          </div>
                          {formData.metodoPagamento === 'cartao' && (
                            <div className="col-md-4">
                              <div className="form-group">
                                <label htmlFor="numeroParcelas">Número de Parcelas *</label>
                                <select
                                  className="form-control"
                                  id="numeroParcelas"
                                  name="numeroParcelas"
                                  value={formData.numeroParcelas}
                                  onChange={(e) => setFormData(prev => ({ ...prev, numeroParcelas: parseInt(e.target.value) }))}
                                  required
                                  disabled={formData.formaPagamento === 'total'}
                                >
                                  <option value={1}>1 parcela</option>
                                  <option value={2}>2 parcelas</option>
                                  <option value={3}>3 parcelas</option>
                                  <option value={6}>6 parcelas</option>
                                  <option value={12}>12 parcelas</option>
                                  <option value={24}>24 parcelas</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {resumoCalculo && (
                      <div className="row">
                        <div className="col-12">
                          <div className="alert alert-secondary">
                            <div className="d-flex justify-content-between flex-wrap align-items-center mb-2">
                              <div>
                                <h6 className="mb-0">Resumo do cálculo</h6>
                                <small className="text-muted d-block">
                                  Tipo de cotação: {resumoCalculo.tipoCotacao.nome}
                                  {resumoCalculo.tipoCotacao.loja && (
                                    <span className="badge bg-info text-dark ms-2">
                                      {resumoCalculo.tipoCotacao.loja.nome}
                                    </span>
                                  )}
                                </small>
                                <small className="text-muted">Método de pagamento: {resumoCalculo.metodoPagamento === 'cartao' ? 'Cartão' : resumoCalculo.metodoPagamento === 'boleto' ? 'Boleto' : 'Pix'}</small>
                              </div>
                              <span className="badge bg-light text-dark">Valor do veículo: {formatCurrency(formData.valorVeiculo)}</span>
                            </div>
                            <div className="row">
                              <div className={resumoCalculo.desconto > 0 ? "col-md-3" : "col-md-4"}>
                                <p className="mb-1"><strong>Base do seguro:</strong></p>
                                <p className="mb-0">{formatCurrency(resumoCalculo.valorBase)}</p>
                              </div>
                              <div className={resumoCalculo.desconto > 0 ? "col-md-3" : "col-md-4"}>
                                <p className="mb-1"><strong>Taxa de adesão:</strong></p>
                                <p className="mb-0">{formatCurrency(resumoCalculo.valorTaxaAdesao)}</p>
                              </div>
                              {resumoCalculo.desconto > 0 && (
                                <div className="col-md-3">
                                  <p className="mb-1"><strong>Desconto:</strong></p>
                                  <p className="mb-0 text-success">-{formatCurrency(resumoCalculo.desconto)}</p>
                                </div>
                              )}
                              <div className={resumoCalculo.desconto > 0 ? "col-md-3" : "col-md-4"}>
                                <p className="mb-1"><strong>Total final:</strong></p>
                                <p className="mb-0 fw-bold text-primary">{formatCurrency(resumoCalculo.totalComDesconto)}</p>
                              </div>
                            </div>
                            {resumoCalculo.isParcelado ? (
                              <div className="mt-3">
                                <p className="mb-1"><strong>Valor mensal ({resumoCalculo.numeroParcelas}x):</strong> {formatCurrency(resumoCalculo.valorPorParcela)}</p>
                                <p className="mb-1"><strong>Taxa de adesão (única):</strong> {formatCurrency(resumoCalculo.valorTaxaAdesao)}</p>
                                {resumoCalculo.desconto > 0 && (
                                  <p className="mb-1 text-success"><strong>Desconto aplicado:</strong> -{formatCurrency(resumoCalculo.desconto)}</p>
                                )}
                                <small className="d-block text-muted mb-1">{resumoCalculo.descricaoTaxa}</small>
                                <p className="mb-0"><strong>Total final a pagar:</strong> {formatCurrency(resumoCalculo.totalComDesconto)}</p>
                              </div>
                            ) : (
                              <div className="mt-3">
                                <p className="mb-1"><strong>Valor do seguro:</strong> {formatCurrency(resumoCalculo.valorBase)}</p>
                                <p className="mb-1"><strong>Taxa de adesão:</strong> {formatCurrency(resumoCalculo.valorTaxaAdesao)}</p>
                                {resumoCalculo.desconto > 0 && (
                                  <p className="mb-1 text-success"><strong>Desconto aplicado:</strong> -{formatCurrency(resumoCalculo.desconto)}</p>
                                )}
                                <small className="d-block text-muted mb-1">{resumoCalculo.descricaoTaxa}</small>
                                <p className="mb-0"><strong>Total final a pagar:</strong> {formatCurrency(resumoCalculo.totalComDesconto)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}



                    <div className="row mt-4">
                      <div className="col-12">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={loading || Boolean(formData.ano && tiposCotacaoFiltrados.length === 0)}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              {editingVendaId ? 'Atualizando Venda...' : 'Criando Venda...'}
                            </>
                          ) : (
                            editingVendaId ? 'Atualizar Venda' : 'Criar Venda & Processar Pagamento'
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary ms-2"
                          onClick={() => router.back()}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}