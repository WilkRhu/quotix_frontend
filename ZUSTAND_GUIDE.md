# Guia de Gerenciamento de Estado com Zustand

## 📚 Visão Geral

Este projeto utiliza **Zustand** como solução centralizada de gerenciamento de estado, substituindo a Context API. O Zustand oferece uma abordagem minimalista e performática para gerenciar estado global.

## 🎯 Stores Disponíveis

### 1. **AuthStore** (`stories/authStore.ts`)
Gerencia autenticação e dados do usuário.

**Uso:**
```typescript
import { useAuth } from '@/stories/authStore'

export default function MeuComponente() {
  const { user, token, login, logout, isAuthenticated, isLoading } = useAuth()
  
  // Usar os valores
  return (
    <div>
      {isLoading ? (
        <span>Carregando...</span>
      ) : isAuthenticated ? (
        <p>Bem-vindo, {user?.name}</p>
      ) : (
        <p>Não autenticado</p>
      )}
    </div>
  )
}
```

**Funcionalidades:**
- `login(email, password)` - Fazer login
- `logout()` - Fazer logout
- `isAuthenticated` - Verifica se está autenticado
- `isLoading` - Verifica se está carregando
- `user` - Dados do usuário
- `token` - Token JWT

**Persistência:** Os dados são salvos em localStorage automaticamente.

---

### 2. **ToastStore** (`stories/toastStore.ts`)
Gerencia notificações (toasts) na aplicação.

**Uso:**
```typescript
import { useToast } from '@/stories/toastStore'

export default function MeuComponente() {
  const { showToast, removeToast, clearToasts } = useToast()
  
  const handleSuccess = () => {
    showToast('Operação realizada com sucesso!', 'success')
  }
  
  const handleError = () => {
    showToast('Erro ao processar requisição', 'error')
  }
  
  const handleConfirmation = () => {
    showToast('Deseja continuar?', 'confirmation', () => {
      // Callback executado ao confirmar
      console.log('Confirmado!')
    })
  }
  
  return (
    <>
      <button onClick={handleSuccess}>Sucesso</button>
      <button onClick={handleError}>Erro</button>
      <button onClick={handleConfirmation}>Confirmar</button>
    </>
  )
}
```

**Tipos de Toast:**
- `'success'` - Mensagem de sucesso (verde)
- `'error'` - Mensagem de erro (vermelho)
- `'warning'` - Aviso (amarelo)
- `'info'` - Informação (azul)
- `'confirmation'` - Confirmação com botões (cinza)

**Funcionalidades:**
- `showToast(message, type, onConfirm?)` - Mostrar toast
- `removeToast(id)` - Remover toast específico
- `clearToasts()` - Limpar todos os toasts

---

### 3. **OffersStore** (`stories/offersStore.ts`)
Gerencia dados de ofertas, lojas, tipos de oferta e planos.

**Uso:**
```typescript
import { useOffersStore } from '@/stories/offersStore'

export default function MeuComponente() {
  const { 
    lojas, 
    tiposOferta, 
    planos, 
    loading,
    loadLojas,
    loadTiposOferta,
    createOferta
  } = useOffersStore((state) => ({
    lojas: state.lojas,
    tiposOferta: state.tiposOferta,
    planos: state.planos,
    loading: state.loading,
    loadLojas: state.loadLojas,
    loadTiposOferta: state.loadTiposOferta,
    createOferta: state.createOferta,
  }))
  
  useEffect(() => {
    loadLojas()
    loadTiposOferta()
  }, [loadLojas, loadTiposOferta])
  
  const handleCreateOferta = async () => {
    try {
      await createOferta({
        tipo: 'seguro',
        lojaId: '123',
        // ... outros dados
      })
      showToast('Oferta criada com sucesso!', 'success')
    } catch (error) {
      showToast('Erro ao criar oferta', 'error')
    }
  }
  
  return (
    <div>
      {loading ? (
        <span>Carregando...</span>
      ) : (
        <>
          <p>Total de lojas: {lojas.length}</p>
          <p>Total de tipos: {tiposOferta.length}</p>
        </>
      )}
    </div>
  )
}
```

**Funcionalidades:**
- `loadLojas()` - Carregar lojas
- `loadBasesCalculo()` - Carregar bases de cálculo
- `loadTiposOferta()` - Carregar tipos de oferta
- `loadPlanos()` - Carregar planos
- `createOferta(data)` - Criar nova oferta
- `updateTipoOferta(id, data)` - Atualizar tipo de oferta
- `deleteTipoOferta(id)` - Deletar tipo de oferta
- `associarTipoOferta(lojaId, tipoOfertaId)` - Associar tipo a loja

---

## 🔐 Autenticação com ProtectedRoute

Proteja rotas que requerem autenticação:

```typescript
import ProtectedRoute from '@/components/ProtectedRoute'
import { Role } from '@/types/auth'

export default function PaginaProtegida() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'lojista']}>
      <div>Conteúdo protegido</div>
    </ProtectedRoute>
  )
}
```

---

## 📍 ToastViewport

O componente `ToastViewport` é renderizado automaticamente no `layout.tsx` e exibe todos os toasts gerenciados pelo store.

**Localização:** `/frontend/components/ToastViewport.tsx`

---

## 🚀 Boas Práticas

### 1. **Seleção de Estado**
```typescript
// ✅ Bom: Seleciona apenas o necessário
const { user, token } = useAuth()

// ❌ Ruim: Obtém todo o estado
const auth = useAuthStore()
```

### 2. **Usar em `useEffect`**
```typescript
// ✅ Bom
useEffect(() => {
  loadOffers()
}, [loadOffers])

// ❌ Ruim: Sem dependências
useEffect(() => {
  loadOffers()
}, [])
```

### 3. **Tratamento de Erros**
```typescript
// ✅ Bom: Com feedback ao usuário
try {
  await createOferta(data)
  showToast('Sucesso!', 'success')
} catch (error) {
  showToast('Erro ao processar', 'error')
}
```

---

## 🔄 Fluxo de Dados

```
Component
  ↓
useAuth/useToast/useOffersStore (Zustand)
  ↓
Store State
  ↓
API (se necessário)
  ↓
Atualizar State
  ↓
Component re-render
```

---

## 📝 Tipos

Os tipos utilizados estão em `/frontend/types/`:
- `auth.ts` - Tipos de autenticação
- `loja.ts` - Tipos de loja
- `planos-venda.ts` - Tipos de planos

---

## ⚙️ Configuração

A URL base da API está em `/frontend/lib/api.ts`:
```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quotix-backend.fly.dev'
```

---

## 🎨 Componentes Relacionados

- `Toast.tsx` - Componente de notificação individual
- `ToastViewport.tsx` - Renderizador de toasts
- `ProtectedRoute.tsx` - Protetor de rotas
- `Navbar.tsx` - Barra de navegação com autenticação

---

## 💡 Exemplos Completos

### Exemplo: Página com Autenticação e Toast

```typescript
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/stories/authStore'
import { useToast } from '@/stories/toastStore'
import { useOffersStore } from '@/stories/offersStore'

export default function PaginaVendas() {
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const { lojas, loading, loadLojas } = useOffersStore()

  useEffect(() => {
    if (isAuthenticated) {
      loadLojas()
    }
  }, [isAuthenticated, loadLojas])

  const handleVenda = async (lojaId: string) => {
    try {
      showToast('Processando venda...', 'info')
      // Fazer algo aqui
      showToast('Venda realizada com sucesso!', 'success')
    } catch (error) {
      showToast('Erro ao processar venda', 'error')
    }
  }

  if (!isAuthenticated) {
    return <p>Não autenticado</p>
  }

  return (
    <div>
      <h1>Vendas de {user?.name}</h1>
      {loading ? (
        <p>Carregando lojas...</p>
      ) : (
        <ul>
          {lojas.map(loja => (
            <li key={loja.id}>
              {loja.nome}
              <button onClick={() => handleVenda(loja.id)}>
                Vender
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

---

## 🆘 Troubleshooting

**Erro: "useAuth must be used within a client component"**
- Adicione `'use client'` no topo do arquivo

**Estado não atualiza**
- Certifique-se de que está usando o seletor correto
- Verifique se a API está retornando dados corretos

**Toast não aparece**
- Verifique se `ToastViewport` está no layout
- Certifique-se de estar usando `useToast()` corretamente

---

✨ **Migração para Zustand Concluída!** ✨
