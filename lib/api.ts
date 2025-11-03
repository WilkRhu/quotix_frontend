import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quotix-backend.fly.dev';
export const UPLOAD_URL = 'https://wilkcaetano.com.br/upload';

// Criar instância do axios com configuração base
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Tentar pegar token do Zustand store
      const authStore = localStorage.getItem('auth-store');
      let token = null;
      
      if (authStore) {
        try {
          const parsedStore = JSON.parse(authStore);
          token = parsedStore.state?.token;
        } catch (e) {
          console.log('Erro ao parsear auth-store:', e);
        }
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);