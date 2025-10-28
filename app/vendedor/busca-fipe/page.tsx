'use client'

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '../../../stories/authStore'
import { API_BASE_URL } from '../../../lib/api'
import { useToast } from '../../../stories/toastStore'
import SelectWithSearch from '../../../components/SelectWithSearch'

export default function BuscaFipe() {
  const [marcaFiltro, setMarcaFiltro] = useState('')
  const [modeloFiltro, setModeloFiltro] = useState('')
  const [anoFiltro, setAnoFiltro] = useState('')
  const { showToast } = useToast()
  const router = useRouter()
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

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (e.target.name === 'marcaFiltro') {
      setMarcaFiltro(e.target.value)
      return
    }
    if (e.target.name === 'modeloFiltro') {
      setModeloFiltro(e.target.value)
      return
    }
    if (e.target.name === 'anoFiltro') {
      setAnoFiltro(e.target.value)
      return
    }
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
      showToast('Erro ao buscar marcas', 'error')
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
      showToast('Erro ao buscar modelos', 'error')
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
      showToast('Erro ao buscar anos', 'error')
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
      showToast(`Valor FIPE encontrado: ${response.data.Valor}`, 'success')
    } catch (error) {
      console.error('Erro ao buscar valor FIPE:', error)
      showToast('Erro ao buscar valor FIPE', 'error')
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

  const usarValorNaVenda = () => {
    if (!veiculoSelecionado) return

    // Converter tipo FIPE para tipo da venda
    const tipoParaVenda = veiculoSelecionado.tipoVeiculo === 'carros' ? 'Carro' :
                         veiculoSelecionado.tipoVeiculo === 'motos' ? 'Moto' : 'Caminhão'

    // Converter valor FIPE de string para número
    const valorFipeNumerico = veiculoSelecionado.Valor
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim()

    // Criar query string com os dados
    const params = new URLSearchParams({
      tipoVeiculo: tipoParaVenda,
      marca: veiculoSelecionado.Marca,
      modelo: veiculoSelecionado.Modelo,
      ano: veiculoSelecionado.AnoModelo,
      valorFipe: valorFipeNumerico
    })

    router.push(`/vendedor/nova-venda?${params.toString()}`)
  }

  return (
    <ProtectedRoute requiredRoles={[Role.SELLER]}>
      <DashboardLayout>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-info text-white">
                  <h4 className="card-title mb-0">
                    <i className="fas fa-search me-2"></i>
                    Busca FIPE - Consulta de Valores
                  </h4>
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Consulta FIPE:</strong> Use esta ferramenta para consultar os valores de mercado dos veículos e ter uma referência para precificação de seguros.
                  </div>

                  <form>
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
                            onChange={value => handleChange({ target: { name: 'marca', value } } as any)}
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
                            onChange={value => handleChange({ target: { name: 'modelo', value } } as any)}
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
                            onChange={value => handleChange({ target: { name: 'ano', value } } as any)}
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
                          <div className="card border-success">
                            <div className="card-header bg-success text-white">
                              <h6 className="mb-0">
                                <i className="fas fa-check-circle me-2"></i>
                                Valor FIPE Encontrado
                              </h6>
                            </div>
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
                                    {veiculoSelecionado.Marca} {veiculoSelecionado.Modelo}
                                  </h5>
                                  <div className="row">
                                    <div className="col-md-6">
                                      <p className="mb-2">
                                        <strong>Ano:</strong> {veiculoSelecionado.AnoModelo}
                                      </p>
                                      <p className="mb-2">
                                        <strong>Código FIPE:</strong> {veiculoSelecionado.CodigoFipe}
                                      </p>
                                      <p className="mb-2">
                                        <strong>Combustível:</strong> {veiculoSelecionado.Combustivel}
                                      </p>
                                    </div>
                                    <div className="col-md-6">
                                      <div className="alert alert-success">
                                        <h4 className="alert-heading mb-2">Valor FIPE</h4>
                                        <p className="mb-0 display-6 text-success fw-bold">
                                          {veiculoSelecionado.Valor}
                                        </p>
                                        <small className="text-muted">
                                          <i className="fas fa-calendar me-1"></i>
                                          Atualizado em: {veiculoSelecionado.MesReferencia}
                                        </small>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="alert alert-info mt-3">
                                    <i className="fas fa-lightbulb me-2"></i>
                                    <strong>Dica:</strong> Use este valor como referência para precificar o seguro do veículo.
                                  </div>
                                  <div className="mt-3">
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-lg w-100"
                                      onClick={usarValorNaVenda}
                                    >
                                      <i className="fas fa-shopping-cart me-2"></i>
                                      Usar este valor na venda
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {loading && (
                      <div className="row mt-4">
                        <div className="col-12 text-center">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Carregando...</span>
                          </div>
                          <p className="mt-2">Buscando dados...</p>
                        </div>
                      </div>
                    )}
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