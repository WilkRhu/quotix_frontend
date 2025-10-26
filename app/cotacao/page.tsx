'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import DashboardLayout from '../../components/DashboardLayout'
import ProtectedRoute from '../../components/ProtectedRoute'
import SelectWithSearch from '../../components/SelectWithSearch'
import { Role } from '../../types/auth'
import { useAuth } from '../../stories/authStore'
import { useToast } from '../../stories/toastStore'
import { API_BASE_URL } from '../../lib/api'

export default function Cotacao() {
  const { showToast } = useToast()
  const { user, token } = useAuth()
  const [formData, setFormData] = useState({
    tipoVeiculo: '',
    marca: '',
    modelo: '',
    ano: ''
  })
  
  const [marcas, setMarcas] = useState([])
  const [modelos, setModelos] = useState([])
  const [anos, setAnos] = useState([])
  const [loading, setLoading] = useState(false)
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<any>(null)
  const [ofertas, setOfertas] = useState<any[]>([])
  const [buscandoOfertas, setBuscandoOfertas] = useState(false)
  const [showModalContratacao, setShowModalContratacao] = useState(false)
  const [ofertaSelecionada, setOfertaSelecionada] = useState<any>(null)
  const [contratando, setContratando] = useState(false)
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [clientePrecisaTelefone, setClientePrecisaTelefone] = useState(false)

  // Função para formatar telefone no padrão brasileiro
  const formatarTelefone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numeroLimpo = value.replace(/\D/g, '')
    
    // Limita a 11 dígitos
    const numeroLimitado = numeroLimpo.slice(0, 11)
    
    // Aplica a máscara
    if (numeroLimitado.length <= 2) {
      return numeroLimitado
    } else if (numeroLimitado.length <= 6) {
      return `(${numeroLimitado.slice(0, 2)}) ${numeroLimitado.slice(2)}`
    } else if (numeroLimitado.length <= 10) {
      return `(${numeroLimitado.slice(0, 2)}) ${numeroLimitado.slice(2, 6)}-${numeroLimitado.slice(6)}`
    } else {
      return `(${numeroLimitado.slice(0, 2)}) ${numeroLimitado.slice(2, 7)}-${numeroLimitado.slice(7)}`
    }
  }

  // Função para limpar telefone (remover máscara)
  const limparTelefone = (telefone: string) => {
    return telefone.replace(/\D/g, '')
  }

  // Handler para mudança do telefone com máscara
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarTelefone(e.target.value)
    setClienteTelefone(valorFormatado)
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'tipoVeiculo' && value) {
      await buscarMarcas(value)
      setModelos([])
      setAnos([])
      setVeiculoSelecionado(null)
      setFormData(prev => ({ ...prev, marca: '', modelo: '', ano: '' }))
    } else if (name === 'marca' && value) {
      await buscarModelos(formData.tipoVeiculo, value)
      setAnos([])
      setVeiculoSelecionado(null)
      setFormData(prev => ({ ...prev, modelo: '', ano: '' }))
    } else if (name === 'modelo' && value) {
      await buscarAnos(formData.tipoVeiculo, formData.marca, value)
      setVeiculoSelecionado(null)
      setFormData(prev => ({ ...prev, ano: '' }))
    } else if (name === 'ano' && value) {
      await buscarDadosVeiculo(formData.tipoVeiculo, formData.marca, formData.modelo, value)
    }
  }

  const buscarMarcas = async (tipo: string) => {
    setLoading(true)
    try {
  const response = await axios.get(`${API_BASE_URL}/api/fipe/marcas/${tipo}`)
      setMarcas(response.data)
    } catch (error) {
      console.error('Erro ao buscar marcas:', error)
    } finally {
      setLoading(false)
    }
  }

  const buscarModelos = async (tipo: string, marca: string) => {
    setLoading(true)
    try {
  const response = await axios.get(`${API_BASE_URL}/api/fipe/modelos/${tipo}/${marca}`)
      setModelos(response.data.modelos)
    } catch (error) {
      console.error('Erro ao buscar modelos:', error)
    } finally {
      setLoading(false)
    }
  }

  const buscarAnos = async (tipo: string, marca: string, modelo: string) => {
    setLoading(true)
    try {
  const response = await axios.get(`${API_BASE_URL}/api/fipe/anos/${tipo}/${marca}/${modelo}`)
      setAnos(response.data)
    } catch (error) {
      console.error('Erro ao buscar anos:', error)
    } finally {
      setLoading(false)
    }
  }

  const buscarDadosVeiculo = async (tipo: string, marca: string, modelo: string, ano: string) => {
    setLoading(true)
    try {
  const response = await axios.get(`${API_BASE_URL}/api/fipe/valor/${tipo}/${marca}/${modelo}/${ano}`)
      const dadosVeiculo = {
        ...response.data,
        tipoVeiculo: tipo,
        imagemUrl: gerarImagemVeiculo(tipo, response.data.Marca, response.data.Modelo)
      }
      setVeiculoSelecionado(dadosVeiculo)
    } catch (error) {
      console.error('Erro ao buscar dados do veículo:', error)
    } finally {
      setLoading(false)
    }
  }

  const gerarImagemVeiculo = (tipo: string, marca: string, modelo: string) => {
    const marcaLower = marca.toLowerCase()
    
    const imagensPorMarca: { [key: string]: string } = {
      'volkswagen': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
      'chevrolet': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop',
      'ford': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop',
      'fiat': 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop',
      'toyota': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
      'honda': tipo === 'motos' ? 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' : 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
      'yamaha': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      'mercedes': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop',
      'volvo': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop'
    }
    
    for (const [key, url] of Object.entries(imagensPorMarca)) {
      if (marcaLower.includes(key)) {
        return url
      }
    }
    
    const fallbackPorTipo = {
      carros: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop',
      motos: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      caminhoes: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop'
    }
    
    return fallbackPorTipo[tipo as keyof typeof fallbackPorTipo] || fallbackPorTipo.carros
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBuscandoOfertas(true)
    try {
  const response = await axios.post(`${API_BASE_URL}/api/ofertas/buscar-por-loja`, {
        veiculo: veiculoSelecionado,
        tipoVeiculo: formData.tipoVeiculo,
        marca: veiculoSelecionado.Marca,
        modelo: veiculoSelecionado.Modelo,
        ano: veiculoSelecionado.AnoModelo
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      setOfertas(response.data)
      
      if (response.data.length === 0) {
        showToast('Nenhuma oferta encontrada.', 'warning')
      }
    } catch (error) {
      console.error('Erro ao buscar ofertas:', error)
      showToast('Erro ao buscar ofertas', 'error')
    } finally {
      setBuscandoOfertas(false)
    }
  }

  const handleSelecionarOferta = (oferta: any, loja: any) => {
    const ofertaComLoja = { ...oferta, loja }
    
    setOfertaSelecionada(ofertaComLoja)
    
    // Verificar se o cliente já tem telefone cadastrado
    const telefoneUsuario = user?.telefone || ''
    if (telefoneUsuario) {
      setClienteTelefone(formatarTelefone(telefoneUsuario))
      setClientePrecisaTelefone(false)
    } else {
      setClienteTelefone('')
      setClientePrecisaTelefone(true)
    }
    
    setShowModalContratacao(true)
  }

  const handleContratar = async () => {
    if (!ofertaSelecionada) {
      return
    }

    // Validação adicional
    if (!ofertaSelecionada.id || !ofertaSelecionada.loja?.id) {
      showToast('Dados da oferta inválidos. Tente novamente.', 'error')
      return
    }

    // Verificar se veículo foi selecionado
    if (!veiculoSelecionado) {
      showToast('Selecione um veículo antes de contratar.', 'error')
      return
    }

    // Validar telefone se necessário
    if (clientePrecisaTelefone && limparTelefone(clienteTelefone).length < 10) {
      showToast('Por favor, informe um telefone válido com pelo menos 10 dígitos.', 'error')
      return
    }

    setContratando(true)
    try {
      const valorVeiculoParsed = veiculoSelecionado.Valor ? 
        parseFloat(veiculoSelecionado.Valor.toString().replace(/[^\d,]/g, '').replace(',', '.')) : 
        undefined
      
      const payload = {
        ofertaId: ofertaSelecionada.id,
        lojaId: ofertaSelecionada.loja?.id,
        tipoVeiculo: veiculoSelecionado.tipoVeiculo,
        marca: veiculoSelecionado.Marca,
        modelo: veiculoSelecionado.Modelo,
        ano: veiculoSelecionado.AnoModelo?.toString(),
        valorVeiculo: valorVeiculoParsed,
        clienteTelefone: clientePrecisaTelefone ? limparTelefone(clienteTelefone) : null
      }

  const response = await axios.post(`${API_BASE_URL}/api/vendas/contratar`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      showToast('Solicitação de contratação enviada com sucesso! Aguarde o contato do vendedor.', 'success')
      setShowModalContratacao(false)
      setOfertaSelecionada(null)
      setClienteTelefone('')
      setClientePrecisaTelefone(false)
    } catch (error: any) {
      console.error('Erro ao contratar:', error)
      const errorMessage = error?.response?.data?.message
      const message = typeof errorMessage === 'string' ? errorMessage : 'Erro ao enviar solicitação de contratação'
      showToast(message, 'error')
    } finally {
      setContratando(false)
    }
  }

  return (
    <ProtectedRoute requiredRoles={[Role.CLIENT]}>
      <DashboardLayout title="Solicitar Cotação">
        <div className="row">
          <div className="col-12">
            <div className="card mb-4">
            <div className="card-header pb-0">
              <h6>Solicitar Cotação de Seguro</h6>
            </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-control-label">Tipo de Veículo</label>
                        <select 
                          className="form-control" 
                          name="tipoVeiculo"
                          value={formData.tipoVeiculo}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Selecione o tipo</option>
                          <option value="carros">Carros</option>
                          <option value="motos">Motos</option>
                          <option value="caminhoes">Caminhões</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-control-label">Marca</label>
                        <SelectWithSearch
                          options={marcas.map((marca: any) => ({ value: marca.codigo, label: marca.nome }))}
                          value={formData.marca}
                          onChange={(value) => handleChange({ target: { name: 'marca', value } } as any)}
                          placeholder="Selecione a marca"
                          disabled={!formData.tipoVeiculo || loading}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-control-label">Modelo</label>
                        <SelectWithSearch
                          options={modelos.map((modelo: any) => ({ value: modelo.codigo, label: modelo.nome }))}
                          value={formData.modelo}
                          onChange={(value) => handleChange({ target: { name: 'modelo', value } } as any)}
                          placeholder="Selecione o modelo"
                          disabled={!formData.marca || loading}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-control-label">Ano</label>
                        <SelectWithSearch
                          options={anos.map((ano: any) => ({ value: ano.codigo, label: ano.nome }))}
                          value={formData.ano}
                          onChange={(value) => handleChange({ target: { name: 'ano', value } } as any)}
                          placeholder="Selecione o ano"
                          disabled={!formData.modelo || loading}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  {veiculoSelecionado && (
                    <div className="row mt-4">
                      <div className="col-12">
                        <div className="card">
                          <div className="card-body">
                            <div className="row align-items-center">
                              <div className="col-md-4">
                                <img 
                                  src={veiculoSelecionado.imagemUrl} 
                                  alt={`${veiculoSelecionado.Marca} ${veiculoSelecionado.Modelo}`}
                                  className="img-fluid rounded"
                                  style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                                />
                                <small className="text-muted d-block text-center mt-2">
                                  <i className="fas fa-info-circle me-1"></i>
                                  Imagem ilustrativa
                                </small>
                              </div>
                              <div className="col-md-8">
                                <h5 className="mb-3">
                                  {veiculoSelecionado.tipoVeiculo === 'carros' && '🚗 '}
                                  {veiculoSelecionado.tipoVeiculo === 'motos' && '🏍️ '}
                                  {veiculoSelecionado.tipoVeiculo === 'caminhoes' && '🚛 '}
                                  Veículo Selecionado
                                </h5>
                                <p className="mb-2"><strong>Marca:</strong> {veiculoSelecionado.Marca}</p>
                                <p className="mb-2"><strong>Modelo:</strong> {veiculoSelecionado.Modelo}</p>
                                <p className="mb-2"><strong>Ano:</strong> {veiculoSelecionado.AnoModelo}</p>
                                <p className="mb-0"><strong>Valor FIPE:</strong> <span className="text-success">{veiculoSelecionado.Valor}</span></p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="row mt-4">
                    <div className="col-12">
                      <button 
                        type="submit" 
                        className="btn btn-primary btn-lg" 
                        disabled={!veiculoSelecionado || buscandoOfertas}
                      >
                        {buscandoOfertas ? 'Buscando Ofertas...' : 'Buscar Ofertas'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        
        {ofertas.length > 0 && (
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header pb-0">
                  <h6>Lojas Disponíveis ({ofertas.length})</h6>
                  <p className="text-sm text-muted mb-0">Valores já incluem o somatório de todas as ofertas de cada loja</p>
                </div>
                <div className="card-body">
                  <div className="row">
                    {ofertas.map((lojaData, index) => (
                      <div key={index} className="col-md-6 col-lg-4 mb-4">
                        <div className="card h-100 border">
                          <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                              <div className="avatar avatar-sm bg-gradient-primary rounded-circle me-3">
                                <i className="fas fa-store text-white"></i>
                              </div>
                              <div>
                                <h6 className="mb-0">{lojaData.loja.nome}</h6>
                                <small className="text-muted">{lojaData.loja.cidade}, {lojaData.loja.estado}</small>
                              </div>
                            </div>
                            
                            <div className="mb-3 text-center">
                              <h3 className="text-primary mb-1">{lojaData.resumo.valorMensalTotal}</h3>
                              <small className="text-muted">Total mensal de {lojaData.resumo.quantidadeOfertas} ofertas</small>
                              
                              {lojaData.resumo.taxaAdesaoTotal && (
                                <div className="mt-2">
                                  <h6 className="text-warning mb-1">+ {lojaData.resumo.taxaAdesaoTotal}</h6>
                                  <small className="text-muted">Taxa de adesão total</small>
                                </div>
                              )}
                              
                              <div className="mt-2">
                                <small className="text-success"><strong>Anual: {lojaData.resumo.valorAnualTotal}</strong></small>
                              </div>
                              
                              <div className="mt-1">
                                <small className="text-muted">Valor médio por oferta: {lojaData.resumo.valorMedio}</small>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <h6 className="text-sm mb-2">📋 Ofertas Incluídas:</h6>
                              {lojaData.ofertas.slice(0, 3).map((oferta: any, ofertaIndex: number) => (
                                <div key={ofertaIndex} className="border-start border-2 border-light ps-2 mb-2">
                                  <p className="text-sm mb-1"><strong>{oferta.nome}</strong></p>
                                  <p className="text-xs text-muted mb-0">
                                    {oferta.descricao || 'Tipo de cotação'} - {oferta.valorMensal}
                                  </p>
                                </div>
                              ))}
                              {lojaData.ofertas.length > 3 && (
                                <small className="text-muted">+ {lojaData.ofertas.length - 3} ofertas adicionais</small>
                              )}
                            </div>
                            
                            <div className="d-grid gap-2">
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => handleSelecionarOferta(lojaData.ofertas[0], lojaData.loja)}
                              >
                                <i className="fas fa-check me-1"></i>
                                Contratar Agora
                              </button>
                              <button className="btn btn-outline-primary btn-sm">
                                <i className="fas fa-phone me-1"></i>
                                {lojaData.loja.telefone}
                              </button>
                              <button 
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => {
                                  // Aqui você pode implementar um modal para mostrar todas as ofertas detalhadas
                                }}
                              >
                                <i className="fas fa-eye me-1"></i>
                                Ver Todas as Ofertas ({lojaData.ofertas.length})
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>

      {/* Modal de Contratação */}
      {showModalContratacao && ofertaSelecionada && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar Contratação</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModalContratacao(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Detalhes da Oferta</h6>
                    <p><strong>Plano:</strong> {ofertaSelecionada.nome}</p>
                    <p><strong>Valor Mensal:</strong> R$ {ofertaSelecionada.valorMensal}</p>
                    <p><strong>Valor Anual:</strong> R$ {ofertaSelecionada.valorAnual}</p>
                    {ofertaSelecionada.taxaAdesao && (
                      <p><strong>Taxa de Adesão:</strong> {ofertaSelecionada.taxaAdesao}</p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <h6>Loja</h6>
                    <p><strong>Nome:</strong> {ofertaSelecionada.loja?.nome}</p>
                    <p><strong>Endereço:</strong> {ofertaSelecionada.loja?.endereco}</p>
                    <p><strong>Telefone:</strong> {ofertaSelecionada.loja?.telefone}</p>
                  </div>
                </div>
                
                <div className="row mt-3">
                  <div className="col-12">
                    {clientePrecisaTelefone && (
                      <div className="alert alert-warning">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        <strong>Telefone obrigatório:</strong> Para prosseguir com a cotação, precisamos do seu telefone para contato.
                      </div>
                    )}
                    <div className="form-group">
                      <label htmlFor="clienteTelefone" className="form-control-label">
                        Seu Telefone {clientePrecisaTelefone && <span className="text-danger">*</span>}
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="clienteTelefone"
                        value={clienteTelefone}
                        onChange={handleTelefoneChange}
                        placeholder="(11) 99999-9999"
                        required={clientePrecisaTelefone}
                        maxLength={15}
                        disabled={!clientePrecisaTelefone}
                      />
                      <small className="form-text text-muted">
                        {clientePrecisaTelefone 
                          ? 'Este telefone será usado pelo vendedor para entrar em contato sobre sua cotação.'
                          : 'Telefone cadastrado. O vendedor entrará em contato por este número.'}
                      </small>
                    </div>
                  </div>
                </div>
                
                <div className="alert alert-info mt-3">
                  <i className="fas fa-info-circle me-2"></i>
                  Ao confirmar, uma solicitação será enviada para o vendedor da loja. 
                  Você será contactado em breve para finalizar a contratação.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModalContratacao(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={handleContratar}
                  disabled={contratando}
                >
                  {contratando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-1"></i>
                      Confirmar Contratação
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}