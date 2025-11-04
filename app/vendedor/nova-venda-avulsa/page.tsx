'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '../../../lib/api';
import { useAuth } from '../../../stories/authStore';
import VehicleImageUpload from '../../../components/VehicleImageUpload';
import DashboardLayout from '../../../components/DashboardLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { Role } from '../../../types/auth';

interface Loja {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
}

export default function NovaVendaAvulsa() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const [lojasAutorizadas, setLojasAutorizadas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clienteId: '',
    lojaId: '',
    valorSeguro: '',
    valorVeiculo: '',
    tipoVeiculo: '',
    marca: '',
    modelo: '',
    ano: '',
    placa: '',
    formaPagamento: 'total',
    numeroParcelas: 1,
    metodoPagamento: 'pix',
    desconto: '',
    observacoes: '',
  });
  const [imagensVeiculo, setImagensVeiculo] = useState<string[]>([]);

  useEffect(() => {
    carregarLojasAutorizadas();
  }, []);

  useEffect(() => {
    // Pré-preencher com dados da busca FIPE
  const tipoVeiculo = searchParams?.get('tipoVeiculo');
  const marca = searchParams?.get('marca');
  const modelo = searchParams?.get('modelo');
  const ano = searchParams?.get('ano');
  const valorSeguro = searchParams?.get('valorSeguro');
  const lojaId = searchParams?.get('lojaId');

    if (tipoVeiculo || marca || modelo || ano || valorSeguro || lojaId) {
      setFormData(prev => ({
        ...prev,
        ...(tipoVeiculo && { tipoVeiculo }),
        ...(marca && { marca }),
        ...(modelo && { modelo }),
        ...(ano && { ano }),
        ...(valorSeguro && { valorSeguro }),
        ...(lojaId && { lojaId })
      }));
    }
  }, [searchParams]);

  const carregarLojasAutorizadas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendas-avulso/minhas-lojas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLojasAutorizadas(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar lojas autorizadas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const vendaData = {
        ...formData,
        vendedorId: user?.vendedorId,
        valorSeguro: parseFloat(formData.valorSeguro),
        valorVeiculo: formData.valorVeiculo ? parseFloat(formData.valorVeiculo) : null,
        numeroParcelas: parseInt(formData.numeroParcelas.toString()),
        desconto: formData.desconto ? parseFloat(formData.desconto) : 0,
        imagensVeiculo,
      };

      await axios.post(`${API_BASE_URL}/api/vendas-avulso`, vendaData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Venda avulsa criada com sucesso!');
      router.push('/vendedor');
    } catch (error: any) {
      console.error('Erro ao criar venda avulsa:', error);
      alert(error.response?.data?.message || 'Erro ao criar venda avulsa');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ProtectedRoute requiredRoles={[Role.SELLER]}>
      <DashboardLayout title="Nova Venda Avulsa">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header pb-0">
                <h6>Cadastrar Nova Venda Avulsa</h6>
                <p className="text-sm mb-0">Preencha os dados da venda e inclua imagens do veículo</p>
                {(searchParams?.get('tipoVeiculo') || searchParams?.get('valorSeguro')) && (
                  <div className="alert alert-info mt-2 mb-0">
                    <i className="fas fa-search me-2"></i>
                    <strong>Dados pré-preenchidos:</strong> Informações vindas da Busca FIPE
                  </div>
                )}
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Cliente ID</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.clienteId}
                          onChange={(e) => handleInputChange('clienteId', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Loja</label>
                        <select
                          className="form-control"
                          value={formData.lojaId}
                          onChange={(e) => handleInputChange('lojaId', e.target.value)}
                          required
                        >
                          <option value="">Selecione uma loja</option>
                          {lojasAutorizadas.map(loja => (
                            <option key={loja.id} value={loja.id}>
                              {loja.nome} - {loja.cidade}/{loja.estado}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Valor do Seguro</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={formData.valorSeguro}
                          onChange={(e) => handleInputChange('valorSeguro', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Valor do Veículo</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={formData.valorVeiculo}
                          onChange={(e) => handleInputChange('valorVeiculo', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Tipo do Veículo</label>
                        <select
                          className="form-control"
                          value={formData.tipoVeiculo}
                          onChange={(e) => handleInputChange('tipoVeiculo', e.target.value)}
                          required
                        >
                          <option value="">Selecione</option>
                          <option value="Carro">Carro</option>
                          <option value="Moto">Moto</option>
                          <option value="Caminhão">Caminhão</option>
                          <option value="Ônibus">Ônibus</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Marca</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.marca}
                          onChange={(e) => handleInputChange('marca', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Modelo</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.modelo}
                          onChange={(e) => handleInputChange('modelo', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Ano</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.ano}
                          onChange={(e) => handleInputChange('ano', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Placa</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.placa}
                          onChange={(e) => handleInputChange('placa', e.target.value.toUpperCase())}
                          maxLength={7}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Forma de Pagamento</label>
                        <select
                          className="form-control"
                          value={formData.formaPagamento}
                          onChange={(e) => handleInputChange('formaPagamento', e.target.value)}
                        >
                          <option value="total">À Vista</option>
                          <option value="parcelado">Parcelado</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Método de Pagamento</label>
                        <select
                          className="form-control"
                          value={formData.metodoPagamento}
                          onChange={(e) => handleInputChange('metodoPagamento', e.target.value)}
                        >
                          <option value="pix">PIX</option>
                          <option value="boleto">Boleto</option>
                          <option value="cartao">Cartão</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {formData.formaPagamento === 'parcelado' && (
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Número de Parcelas</label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.numeroParcelas}
                            onChange={(e) => handleInputChange('numeroParcelas', e.target.value)}
                            min="1"
                            max="60"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Desconto</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={formData.desconto}
                            onChange={(e) => handleInputChange('desconto', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Observações</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.observacoes}
                      onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    />
                  </div>

                  <VehicleImageUpload
                    onImagesChange={setImagensVeiculo}
                    maxImages={5}
                  />

                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => router.push('/vendedor')}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Salvando...
                        </>
                      ) : (
                        'Criar Venda Avulsa'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}