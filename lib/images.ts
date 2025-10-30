// Função para upload de imagem
export async function uploadImage(file: File, pasta: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('pasta', pasta);

  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Falha ao enviar imagem');
  const data = await response.json();
  return data.url || '';
}
import { API_BASE_URL } from './api'

export const resolveImageUrl = (foto?: string | null): string => {
  if (!foto) {
    return ''
  }

  if (foto.startsWith('http://') || foto.startsWith('https://')) {
    return foto
  }

  const normalized = foto.replace(/^\/+/,'')
  return `${API_BASE_URL}/${normalized}`
}
