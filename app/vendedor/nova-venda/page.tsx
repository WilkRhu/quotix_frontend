'use client'

import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
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
}

export default function NovaVenda() {
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
    taxaAdesaoValorManual: 0
  })

  const [valorVeiculoDisplay, setValorVeiculoDisplay] = useState('R$ 0,00')
  const [taxaAdesaoValorManualDisplay, setTaxaAdesaoValorManualDisplay] = useState('R$ 0,00')
  const [fipeToastShown, setFipeToastShown] = useState(false)
  const [incompleteSaleToastShown, setIncompleteSaleToastShown] = useState(false)
  const [editingVendaId, setEditingVendaId] = useState<number | null>(null)

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
      // Por enquanto, vamos buscar todos os clientes
      // TODO: implementar endpoint para buscar clientes por vendedor/loja
      const response = await axios.get(`${API_BASE_URL}/api/users/clientes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setClientes(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      setClientes([])
      showToast('Erro ao carregar lista de clientes', 'error')
    }
  }

  const buscarTiposCotacao = async () => {
    if (!token) {
      return
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendas/vendedor/tipos-cotacao`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTiposCotacao(Array.isArray(response.data) ? response.data : [])
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

  useEffect(() => {
    if (token) {
      buscarClientes()
      buscarTiposCotacao()
    }
  }, [token])

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
    const isParcelado = formData.metodoPagamento === 'cartao' && formData.formaPagamento === 'parcelado' && formData.numeroParcelas > 0
    const numeroParcelasEfetivo = isParcelado ? formData.numeroParcelas : 1
    const valorPorParcela = isParcelado
      ? valorBase / numeroParcelasEfetivo
      : 0

    return {
      tipoCotacao: tipoSelecionado,
      valorBase,
      valorTaxaAdesao,
      totalComTaxa,
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
    formData.taxaAdesaoValorManual
  ])

  const valorTotalAtual = useMemo(() => {
    if (resumoCalculo) {
      return resumoCalculo.totalComTaxa
    }
    return formData.valorVeiculo
  }, [resumoCalculo, formData.valorVeiculo])

  const mockPixCode = useMemo(() => {
    const total = Math.max(0, valorTotalAtual || 0)
    const valorFormatado = total.toFixed(2)
    const cliente = formData.clienteId || 'CLIENTE'
    return `00020126580014BR.GOV.BCB.PIX0136MOCK-${cliente}-VENDA520400005303986540${valorFormatado.replace('.', '')}5802BR5924Corretora Segura LTDA6009SAO PAULO62070503***6304ABCD`
  }, [valorTotalAtual, formData.clienteId])

  const mockBoletoLinhaDigitavel = useMemo(() => {
    const total = Math.max(0, valorTotalAtual || 0)
    const base = `34191.79001 01043.510047 91020.150008 6 ${String(Math.round(total * 100)).padStart(10, '0')}`
    return base
  }, [valorTotalAtual])

  const mockBoletoVencimento = useMemo(() => {
    const data = new Date()
    data.setDate(data.getDate() + 3)
    return data.toLocaleDateString('pt-BR')
  }, [])

  const mockCartaoDados = useMemo(() => ({
    bandeira: 'Visa',
    numero: '4111 1111 1111 1111',
    validade: '12/28',
    nome: 'VENDEDOR MOCK',
    cvv: '***'
  }), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const placaSanitizada = (formData.placa || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .trim()

    if (placaSanitizada.length !== 7 || !/^[A-Z0-9]{7}$/.test(placaSanitizada)) {
      showToast('A placa deve conter exatamente 7 caracteres alfanuméricos (ex.: ABC1D23).', 'error')
      return
    }

    setLoading(true)

    try {
      const arredondar = (valor: number) => Math.round((valor + Number.EPSILON) * 100) / 100

  const valorVeiculo = arredondar(formData.valorVeiculo)
      const valorTotalVenda = arredondar(resumoCalculo ? resumoCalculo.totalComTaxa : valorVeiculo)

      const payload = {
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
        vendedorId: user?.vendedorId || formData.vendedorId
      }

      let response
      if (editingVendaId) {
        // Atualizar venda existente
        response = await axios.patch(
          `${API_BASE_URL}/api/vendas/${editingVendaId}`,
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
        response = await axios.post(
          `${API_BASE_URL}/api/vendas`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
        showToast('Venda criada com sucesso!', 'success')
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
                            onChange={handleInputChange}
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

                    <div className="row">
                      <div className="col-12">
                        <div className="form-group">
                          <label htmlFor="tipoCotacaoLojaId">Tipo de Cotação</label>
                          <select
                            className="form-control"
                            id="tipoCotacaoLojaId"
                            name="tipoCotacaoLojaId"
                            value={formData.tipoCotacaoLojaId}
                            onChange={handleInputChange}
                          >
                            <option value="">Selecione um tipo de cotação</option>
                            {tiposCotacao.map((tipo) => (
                              <option key={tipo.id} value={tipo.id}>
                                {tipo.nome} {tipo.descricao ? `- ${tipo.descricao}` : ''}
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

                    {/* Dados de Pagamento */}
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

                    <div className="card mt-3">
                      <div className="card-header bg-light">
                        <strong>Instruções de Pagamento (Mock)</strong>
                      </div>
                      <div className="card-body">
                        {formData.metodoPagamento === 'pix' && (
                          <div className="d-flex flex-wrap align-items-start">
                            <div
                              className="me-3 mb-3 rounded"
                              style={{
                                width: '140px',
                                height: '140px',
                                background: 'repeating-linear-gradient(45deg, #000, #000 10px, #fff 10px, #fff 20px)',
                                boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3)'
                              }}
                              aria-hidden="true"
                            ></div>
                            <div className="flex-grow-1">
                              <p className="mb-1">Escaneie o QR code pelo app bancário para concluir o pagamento.</p>
                              <p className="mb-1"><strong>Valor:</strong> {formatCurrency(valorTotalAtual)}</p>
                              <p className="mb-1 small text-muted">Ou copie o código Pix:</p>
                              <code className="d-block small text-wrap" style={{ whiteSpace: 'pre-wrap' }}>{mockPixCode}</code>
                            </div>
                          </div>
                        )}

                        {formData.metodoPagamento === 'boleto' && (
                          <div>
                            <p className="mb-1">Apresente o boleto abaixo em uma casa lotérica ou banco até o vencimento.</p>
                            <p className="mb-1"><strong>Valor:</strong> {formatCurrency(valorTotalAtual)}</p>
                            <p className="mb-1"><strong>Vencimento:</strong> {mockBoletoVencimento}</p>
                            <p className="mb-1 small text-muted">Linha digitável:</p>
                            <code className="d-block small text-wrap" style={{ whiteSpace: 'pre-wrap' }}>{mockBoletoLinhaDigitavel}</code>
                          </div>
                        )}

                        {formData.metodoPagamento === 'cartao' && (
                          <div>
                            <p className="mb-2">Integração de cartão será disponibilizada futuramente. Utilize os dados fictícios abaixo para testes.</p>
                            <div className="row g-3">
                              <div className="col-md-6">
                                <label className="form-label">Número do Cartão</label>
                                <input type="text" className="form-control" value={mockCartaoDados.numero} readOnly />
                              </div>
                              <div className="col-md-3">
                                <label className="form-label">Validade</label>
                                <input type="text" className="form-control" value={mockCartaoDados.validade} readOnly />
                              </div>
                              <div className="col-md-3">
                                <label className="form-label">CVV</label>
                                <input type="text" className="form-control" value={mockCartaoDados.cvv} readOnly />
                              </div>
                              <div className="col-12">
                                <label className="form-label">Nome Impresso</label>
                                <input type="text" className="form-control" value={mockCartaoDados.nome} readOnly />
                              </div>
                              <div className="col-12">
                                <p className="mb-0"><strong>Valor total:</strong> {formatCurrency(valorTotalAtual)}</p>
                                {formData.formaPagamento === 'parcelado' && (
                                  <small className="text-muted">Simulação em {formData.numeroParcelas}x sem juros.</small>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <small className="d-block text-muted mt-3">Integração real com operadora de pagamentos será configurada posteriormente.</small>
                      </div>
                    </div>

                    {resumoCalculo && (
                      <div className="row">
                        <div className="col-12">
                          <div className="alert alert-secondary">
                            <div className="d-flex justify-content-between flex-wrap align-items-center mb-2">
                              <div>
                                <h6 className="mb-0">Resumo do cálculo</h6>
                                <small className="text-muted d-block">Tipo de cotação selecionado: {resumoCalculo.tipoCotacao.nome}</small>
                                <small className="text-muted">Método de pagamento: {resumoCalculo.metodoPagamento === 'cartao' ? 'Cartão' : resumoCalculo.metodoPagamento === 'boleto' ? 'Boleto' : 'Pix'}</small>
                              </div>
                              <span className="badge bg-light text-dark">Valor do veículo: {formatCurrency(formData.valorVeiculo)}</span>
                            </div>
                            <div className="row">
                              <div className="col-md-4">
                                <p className="mb-1"><strong>Base do seguro:</strong></p>
                                <p className="mb-0">{formatCurrency(resumoCalculo.valorBase)}</p>
                              </div>
                              <div className="col-md-4">
                                <p className="mb-1"><strong>Taxa de adesão:</strong></p>
                                <p className="mb-0">{formatCurrency(resumoCalculo.valorTaxaAdesao)}</p>
                              </div>
                              <div className="col-md-4">
                                <p className="mb-1"><strong>Total com taxa:</strong></p>
                                <p className="mb-0">{formatCurrency(resumoCalculo.totalComTaxa)}</p>
                              </div>
                            </div>
                            {resumoCalculo.isParcelado ? (
                              <div className="mt-3">
                                <p className="mb-1"><strong>Valor mensal ({resumoCalculo.numeroParcelas}x):</strong> {formatCurrency(resumoCalculo.valorPorParcela)}</p>
                                <p className="mb-1"><strong>Taxa de adesão (única):</strong> {formatCurrency(resumoCalculo.valorTaxaAdesao)}</p>
                                <small className="d-block text-muted mb-1">{resumoCalculo.descricaoTaxa}</small>
                                <p className="mb-0"><strong>Valor mensal + taxa de adesão:</strong> {formatCurrency(resumoCalculo.valorPorParcela + resumoCalculo.valorTaxaAdesao)}</p>
                              </div>
                            ) : (
                              <div className="mt-3">
                                <p className="mb-1"><strong>Valor do seguro:</strong> {formatCurrency(resumoCalculo.valorBase)}</p>
                                <p className="mb-1"><strong>Taxa de adesão:</strong> {formatCurrency(resumoCalculo.valorTaxaAdesao)}</p>
                                <small className="d-block text-muted mb-1">{resumoCalculo.descricaoTaxa}</small>
                                <p className="mb-0"><strong>Total a pagar:</strong> {formatCurrency(resumoCalculo.totalComTaxa)}</p>
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
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              {editingVendaId ? 'Atualizando Venda...' : 'Criando Venda...'}
                            </>
                          ) : (
                            editingVendaId ? 'Atualizar Venda' : 'Criar Venda'
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