# Migração de Context API para Zustand ✨

## 📋 Resumo das Mudanças

Este projeto foi migrado de **Context API** para **Zustand** como solução de gerenciamento de estado global. A migração foi realizada em 25/10/2025 para melhorar performance e simplificar o código.

---

## 🔄 Antes e Depois

### Autenticação

#### ❌ Antes (Context API)
```typescript
// contexts/AuthContext.tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  // ... mais código

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Em layout.tsx
<AuthProvider>
  <ToastProvider>
    {children}
  </ToastProvider>
</AuthProvider>

// Uso em componentes
const { user, token } = useAuth()
```

#### ✅ Depois (Zustand)
```typescript
// stories/authStore.ts
export const useAuthStore = create<AuthStoreState>()(
  persist(useAuthStoreBase, {
    name: 'auth-store',
    storage: createJSONStorage(() => localStorage),
  })
)

// Em layout.tsx
// Nenhum provider necessário!
<ToastViewport />
{children}

// Uso em componentes (idêntico!)
const { user, token } = useAuth()
```

### Notificações (Toast)

#### ❌ Antes (Context API)
```typescript
// contexts/ToastContext.tsx
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])
  // ... gerenciar estado manualmente

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {/* Renderizar toasts */}
      </div>
    </ToastContext.Provider>
  )
}
```

#### ✅ Depois (Zustand)
```typescript
// stories/toastStore.ts
export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  showToast: (message, type, onConfirm) => {
    const id = generateToastId()
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, onConfirm }],
    }))
  },
  // ...
}))

// components/ToastViewport.tsx
// Renderiza automaticamente todos os toasts do store
export default function ToastViewport() {
  const { toasts, removeToast } = useToastStore()
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}
```

---

## 🗂️ Estrutura de Arquivos

### Deletados
```
frontend/contexts/
├── AuthContext.tsx         ❌ Removido
├── ToastContext.tsx        ❌ Removido
└── OffersContext.tsx       ❌ Removido
```

### Novos/Modificados
```
frontend/
├── stories/
│   ├── authStore.ts        ✨ Novo (Zustand)
│   ├── toastStore.ts       ✨ Novo (Zustand)
│   └── offersStore.ts      ✨ Novo (Zustand)
├── hooks/
│   └── useAppState.ts      ✨ Novo (Hooks customizados)
└── ZUSTAND_GUIDE.md        ✨ Novo (Documentação)
```

---

## 🎯 Benefícios da Migração

### 1. **Performance Melhorada**
- Menos re-renders desnecessários
- Seleção granular de estado
- Zustand re-renderiza apenas componentes que usam o state alterado

### 2. **Código Mais Simples**
- Menos boilerplate
- Sem necessidade de providers no layout
- Sintaxe mais limpa e intuitiva

### 3. **Melhor Type Safety**
```typescript
// Zustand oferece autocomplete perfeito
const { user, token } = useAuth()
// ✅ Todos os tipos são inferidos corretamente
```

### 4. **Persistência Automática**
```typescript
// localStorage é gerenciado automaticamente
export const useAuthStore = create()(
  persist(store, {
    name: 'auth-store',
    storage: createJSONStorage(() => localStorage),
  })
)
```

### 5. **Debugging Mais Fácil**
```typescript
// Zustand DevTools pode ser integrado
import { devtools } from 'zustand/middleware'
```

---

## 🔧 Como Migrar um Componente Existente

### Exemplo: Componente que usa AuthContext e ToastContext

#### ❌ Antes
```typescript
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

export default function MeuComponente() {
  const { user, login } = useAuth()
  const { showToast } = useToast()

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password')
      showToast('Login realizado!', 'success')
    } catch (error) {
      showToast('Erro no login', 'error')
    }
  }

  return (
    <div>
      <button onClick={handleLogin}>Login</button>
      <p>{user?.name}</p>
    </div>
  )
}
```

#### ✅ Depois (Nenhuma mudança necessária!)
```typescript
import { useAuth } from '@/stories/authStore'
import { useToast } from '@/stories/toastStore'

// ✨ O código permanece EXATAMENTE IGUAL!
// Apenas o import mudou!

export default function MeuComponente() {
  const { user, login } = useAuth()
  const { showToast } = useToast()

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password')
      showToast('Login realizado!', 'success')
    } catch (error) {
      showToast('Erro no login', 'error')
    }
  }

  return (
    <div>
      <button onClick={handleLogin}>Login</button>
      <p>{user?.name}</p>
    </div>
  )
}
```

---

## 📊 Comparação: Context API vs Zustand

| Aspecto | Context API | Zustand |
|---------|-----------|---------|
| **Bundle Size** | ~3KB | ~1KB |
| **Re-renders** | Múltiplos desnecessários | Apenas os necessários |
| **Boilerplate** | Muito | Mínimo |
| **Curva de Aprendizado** | Média | Baixa |
| **Persistência** | Manual | Built-in com middleware |
| **DevTools** | Complexo | Integrado |
| **Type Safety** | Bom | Excelente |

---

## 🔐 Segurança

### Token JWT
```typescript
// ✅ Token é armazenado em localStorage
// Zustand persistence cuida disso automaticamente
const { token } = useAuth()

// O token é enviado em todas as requisições autenticadas
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const { token } = useAuthStore.getState()
  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  }
  // ...
}
```

---

## 📝 Checklist de Migração

- ✅ Criar `authStore.ts` com Zustand
- ✅ Criar `toastStore.ts` com Zustand
- ✅ Criar `offersStore.ts` com Zustand
- ✅ Remover `AuthContext.tsx`
- ✅ Remover `ToastContext.tsx`
- ✅ Remover `OffersContext.tsx`
- ✅ Remover providers do `layout.tsx`
- ✅ Atualizar imports em componentes (se necessário)
- ✅ Testar autenticação
- ✅ Testar notificações (toast)
- ✅ Testar carregamento de dados (offers)
- ✅ Criar documentação (ZUSTAND_GUIDE.md)
- ✅ Criar hooks customizados (useAppState.ts)

---

## 🚀 Próximas Melhorias

1. **Integrar Zustand DevTools**
   ```typescript
   import { devtools } from 'zustand/middleware'
   
   const useAuthStore = create<AuthStoreState>()(
     devtools(persist(useAuthStoreBase, {...}))
   )
   ```

2. **Immer Middleware para Immutability**
   ```typescript
   import { immer } from 'zustand/middleware/immer'
   ```

3. **Subscribe Pattern**
   ```typescript
   useAuthStore.subscribe(
     (state) => state.user,
     (user) => console.log('User changed:', user)
   )
   ```

---

## 📚 Referências

- [Zustand Docs](https://zustand-demo.vercel.app/)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [React Context vs Zustand](https://www.prisma.io/blog/zustand-vs-redux)

---

**Migração concluída em: 25/10/2025** 🎉
