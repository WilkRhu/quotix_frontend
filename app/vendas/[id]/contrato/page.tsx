"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import DashboardLayout from "../../../../components/DashboardLayout";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useAuth } from "../../../../stories/authStore";
import { API_BASE_URL } from "../../../../lib/api";

export default function ContratoVendaPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [contrato, setContrato] = useState<any>(null);
  const [assinando, setAssinando] = useState(false);
  const [assinou, setAssinou] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      carregarContrato(params.id as string);
    }
  }, [params?.id]);

  const carregarContrato = async (id: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendas-avulso/${id}/contrato`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContrato(response.data);
    } catch (error: any) {
      setErro("Erro ao carregar contrato");
    }
  };

  const assinarContrato = async () => {
    setAssinando(true);
    setErro(null);
    try {
      const id = params && (typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '');
      if (!id) throw new Error('ID da venda não encontrado');
      await axios.post(`${API_BASE_URL}/api/vendas-avulso/${id}/assinar-contrato`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssinou(true);
    } catch (error: any) {
      setErro("Erro ao assinar contrato");
    } finally {
      setAssinando(false);
    }
  };

  return (
  <ProtectedRoute>
      <DashboardLayout title="Contrato da Venda">
        <div className="container py-4">
          {erro && <div className="alert alert-danger">{erro}</div>}
          {!contrato ? (
            <div>Carregando contrato...</div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h5>{contrato.titulo}</h5>
              </div>
              <div className="card-body">
                <p><strong>Vendedor:</strong> {contrato.vendedor}</p>
                <p><strong>Cliente:</strong> {contrato.cliente}</p>
                <p><strong>Loja:</strong> {contrato.loja}</p>
                <p><strong>Valor do Seguro:</strong> R${contrato.valorSeguro}</p>
                <p><strong>Comissão:</strong> R${contrato.valorComissao}</p>
                <p><strong>Data:</strong> {contrato.data}</p>
                <hr />
                <p>{contrato.texto}</p>
                {!assinou ? (
                  <button className="btn btn-primary" onClick={assinarContrato} disabled={assinando}>
                    {assinando ? "Assinando..." : "Assinar Contrato"}
                  </button>
                ) : (
                  <div className="alert alert-success mt-3">Contrato assinado com sucesso!</div>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
