"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import DashboardLayout from "../../../../components/DashboardLayout";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useAuth } from "../../../../stories/authStore";
import { API_BASE_URL } from "../../../../lib/api";

export default function PagamentoVendaPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [venda, setVenda] = useState<any>(null);
  const [pagando, setPagando] = useState(false);
  const [pagou, setPagou] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      carregarVenda(params.id as string);
    }
  }, [params?.id]);

  const carregarVenda = async (id: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendas-avulso/${id}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setVenda(response.data);
    } catch (error: any) {
      setErro("Erro ao carregar venda");
    }
  };

  const pagarVenda = async () => {
    setPagando(true);
    setErro(null);
    try {
      const id = params && (typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '');
      if (!id) throw new Error('ID da venda não encontrado');
      await axios.post(`${API_BASE_URL}/api/vendas-avulso/${id}/pagar`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPagou(true);
    } catch (error: any) {
      setErro(error?.response?.data?.message || "Erro ao realizar pagamento");
    } finally {
      setPagando(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={[]}>
      <DashboardLayout title="Pagamento da Venda">
        <div className="container py-4">
          {erro && <div className="alert alert-danger">{erro}</div>}
          {!venda ? (
            <div>Carregando venda...</div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h5>Pagamento da Venda Avulsa</h5>
              </div>
              <div className="card-body">
                <p><strong>Cliente:</strong> {venda.cliente?.nome || venda.cliente?.name}</p>
                <p><strong>Vendedor:</strong> {venda.vendedor?.nome}</p>
                <p><strong>Valor do Seguro:</strong> R${venda.valorSeguro}</p>
                <p><strong>Comissão:</strong> R${venda.valorComissao}</p>
                <p><strong>Status do Contrato:</strong> {venda.contratoAssinado ? "Assinado" : "Pendente"}</p>
                <hr />
                {!venda.contratoAssinado ? (
                  <div className="alert alert-warning">Contrato ainda não foi assinado. O pagamento só será liberado após assinatura.</div>
                ) : !pagou ? (
                  <button className="btn btn-success" onClick={pagarVenda} disabled={pagando}>
                    {pagando ? "Processando..." : "Realizar Pagamento"}
                  </button>
                ) : (
                  <div className="alert alert-success mt-3">Pagamento realizado com sucesso!</div>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
