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
