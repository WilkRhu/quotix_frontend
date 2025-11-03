import { API_BASE_URL } from '@/lib/api';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Pega o token do header Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Token não informado' }, { status: 401 });
    }
    // Chama o backend real
    const response = await fetch(`${API_BASE_URL}/api/lojas/me/vendas/avulsas`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }
  const vendasAvulsas = await response.json();
  console.log('[API vendas avulsas] Retorno do backend:', vendasAvulsas);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}