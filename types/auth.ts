export enum Role {
  ADMIN = 'admin',
  SELLER = 'seller',
  LOGIST = 'logist',
  LOJISTA = 'lojista',
  CLIENT = 'client',
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  lojaId?: string;
  vendedorId?: string;
  foto?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}