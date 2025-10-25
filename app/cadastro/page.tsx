'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '../../stories/toastStore'
import { API_BASE_URL } from '../../lib/api'

interface Plano {
  id: string
  nome: string
  descricao: string
  precoMensal: number
  precoAnual: number
  limite_vendedores?: number
  features?: string[]
}

export default function Cadastro() {
  const router = useRouter()
  const { showToast } = useToast()
  
  // Estado padrão do formulário
  const FORM_DATA_INICIAL = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    nomeLoja: '',
    cnpj: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    planoId: '',
    terms: false
  }

  const STORAGE_KEY = 'cadastro_form_data'
  const STORAGE_ETAPA_KEY = 'cadastro_etapa'
  const STORAGE_PLANO_KEY = 'cadastro_plano'
  const STORAGE_TRIAL_KEY = 'cadastro_trial'

  // Função para carregar dados do localStorage
  const carregarFormularioDaSessao = () => {
    if (typeof window === 'undefined') return FORM_DATA_INICIAL
    
    try {
      const salvo = localStorage.getItem(STORAGE_KEY)
      return salvo ? JSON.parse(salvo) : FORM_DATA_INICIAL
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error)
      return FORM_DATA_INICIAL
    }
  }

  const carregarEtapaDaSessao = () => {
    if (typeof window === 'undefined') return 1
    
    try {
      const salva = localStorage.getItem(STORAGE_ETAPA_KEY)
      return salva ? JSON.parse(salva) : 1
    } catch (error) {
      return 1
    }
  }

  const carregarPlanoDaSessao = () => {
    if (typeof window === 'undefined') return null
    
    try {
      const salvo = localStorage.getItem(STORAGE_PLANO_KEY)
      return salvo ? JSON.parse(salvo) : null
    } catch (error) {
      return null
    }
  }

  const carregarTrialDaSessao = () => {
    if (typeof window === 'undefined') return false
    
    try {
      const salvo = localStorage.getItem(STORAGE_TRIAL_KEY)
      return salvo ? JSON.parse(salvo) : false
    } catch (error) {
      return false
    }
  }

  const [etapa, setEtapa] = useState(1)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(false)
  const [planoSelecionado, setPlanoSelecionado] = useState<string | null>(null)
  const [usarTrial, setUsarTrial] = useState(false)
  const [formData, setFormData] = useState(FORM_DATA_INICIAL)
  
  // Efeito para carregar dados salvos quando o componente monta
  useEffect(() => {
    setFormData(carregarFormularioDaSessao())
    setEtapa(carregarEtapaDaSessao())
    setPlanoSelecionado(carregarPlanoDaSessao())
    setUsarTrial(carregarTrialDaSessao())
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any
    const novosDados = {
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }
    setFormData(novosDados)
    
    // Salvar no localStorage automaticamente
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(novosDados))
      } catch (error) {
        console.error('Erro ao salvar no localStorage:', error)
      }
    }
  }

  // Carregar planos ao montar o componente
  useEffect(() => {
    const fetchPlanos = async () => {
      try {
        // Carregar os planos públicos (sem autenticação)
        const response = await fetch(`${API_BASE_URL}/api/planos/public/active`)
        if (response.ok) {
          const data = await response.json()
          setPlanos(data)
          if (data.length === 0) {
            showToast('Nenhum plano disponível', 'warning')
          }
        } else {
          showToast('Erro ao carregar planos', 'error')
        }
      } catch (error) {
        console.error('Erro ao carregar planos:', error)
        showToast('Erro ao carregar planos', 'error')
      }
    }
    fetchPlanos()
  }, [])

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
  }

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9)
  }

  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d)/, '$1-$2')
      .slice(0, 15)
  }

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novosDados = {
      ...formData,
      cnpj: formatCNPJ(e.target.value)
    }
    setFormData(novosDados)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novosDados))
    }
  }

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novosDados = {
      ...formData,
      cep: formatCEP(e.target.value)
    }
    setFormData(novosDados)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novosDados))
    }
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novosDados = {
      ...formData,
      telefone: formatTelefone(e.target.value)
    }
    setFormData(novosDados)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novosDados))
    }
  }

  const validarEtapa1 = () => {
    if (!formData.name.trim()) {
      showToast('Nome completo é obrigatório', 'error')
      return false
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      showToast('Email válido é obrigatório', 'error')
      return false
    }
    if (formData.password.length < 6) {
      showToast('Senha deve ter no mínimo 6 caracteres', 'error')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      showToast('As senhas não coincidem', 'error')
      return false
    }
    return true
  }

  const validarEtapa2 = () => {
    if (!formData.nomeLoja.trim()) {
      showToast('Nome da loja é obrigatório', 'error')
      return false
    }
    if (!formData.cnpj.trim() || formData.cnpj.replace(/\D/g, '').length !== 14) {
      showToast('CNPJ válido é obrigatório', 'error')
      return false
    }
    if (!formData.telefone.trim()) {
      showToast('Telefone é obrigatório', 'error')
      return false
    }
    if (!formData.endereco.trim()) {
      showToast('Endereço é obrigatório', 'error')
      return false
    }
    if (!formData.cidade.trim()) {
      showToast('Cidade é obrigatória', 'error')
      return false
    }
    if (!formData.estado.trim()) {
      showToast('Estado é obrigatório', 'error')
      return false
    }
    if (!formData.cep.trim() || formData.cep.replace(/\D/g, '').length !== 8) {
      showToast('CEP válido é obrigatório', 'error')
      return false
    }
    if (!formData.terms) {
      showToast('Você deve aceitar os termos e condições', 'warning')
      return false
    }
    return true
  }

  const validarEtapa3 = () => {
    if (!usarTrial && !planoSelecionado) {
      showToast('Selecione um plano ou a opção trial', 'error')
      return false
    }
    return true
  }

  const handleProximaEtapa = () => {
    if (etapa === 1 && validarEtapa1()) {
      const novaEtapa = 2
      setEtapa(novaEtapa)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ETAPA_KEY, JSON.stringify(novaEtapa))
      }
    } else if (etapa === 2 && validarEtapa2()) {
      const novaEtapa = 3
      setEtapa(novaEtapa)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ETAPA_KEY, JSON.stringify(novaEtapa))
      }
    }
  }

  const handleEtapaAnterior = () => {
    if (etapa > 1) {
      const novaEtapa = etapa - 1
      setEtapa(novaEtapa)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ETAPA_KEY, JSON.stringify(novaEtapa))
      }
    }
  }

  const handleLimparFormulario = () => {
    if (typeof window !== 'undefined') {
      if (window.confirm('Tem certeza que deseja limpar todos os dados do formulário?')) {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(STORAGE_ETAPA_KEY)
        localStorage.removeItem(STORAGE_PLANO_KEY)
        localStorage.removeItem(STORAGE_TRIAL_KEY)
        
        setFormData(FORM_DATA_INICIAL)
        setEtapa(1)
        setPlanoSelecionado(null)
        setUsarTrial(false)
        
        showToast('Formulário limpo com sucesso', 'success')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validarEtapa3()) {
      return
    }

    setLoading(true)

    try {
      // Calcular data de expiração do trial (7 dias)
      const trialExpiryDate = usarTrial ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null

      // Preparar dados para signup (usuário + loja em uma única requisição)
      const signupData = {
        nome: formData.name,
        email: formData.email,
        password: formData.password,
        nomeLoja: formData.nomeLoja,
        cnpj: formData.cnpj.replace(/\D/g, ''),
        telefone: formData.telefone,
        endereco: formData.endereco,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep.replace(/\D/g, ''),
        planoId: planoSelecionado, // Sempre enviar o planoId, mesmo que seja trial
        usarTrial: usarTrial,
      }

      // Fazer signup (cria usuário + loja + vínculo)
      const signupResponse = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      })

      if (!signupResponse.ok) {
        const errorData = await signupResponse.json()
        throw new Error(errorData.message || 'Erro ao realizar cadastro')
      }

      const signupResult = await signupResponse.json()

      showToast('Cadastro realizado com sucesso!', 'success')
      
      // Limpar localStorage após sucesso
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(STORAGE_ETAPA_KEY)
        localStorage.removeItem(STORAGE_PLANO_KEY)
        localStorage.removeItem(STORAGE_TRIAL_KEY)
      }
      
      // Redirecionar para login após 1.5s
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (error) {
      console.error('Erro no cadastro:', error)
      showToast(error instanceof Error ? error.message : 'Erro ao realizar cadastro', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .cadastro-gradient {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f5f7fa 50%, #f5f7fa 100%);
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }

        .cadastro-gradient::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.08) 0%, transparent 50%);
          pointer-events: none;
        }

        .cadastro-gradient::after {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(102, 126, 234, 0.05) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .card-cadastro {
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 0 1px rgba(102, 126, 234, 0.1);
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          padding: 40px !important;
          position: relative;
          z-index: 1;
        }

        .tab-indicator {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          position: relative;
          padding: 0 0 20px 0;
        }

        .tab-indicator::before {
          content: '';
          position: absolute;
          top: 15px;
          left: 0;
          right: 0;
          height: 2px;
          background: #e9ecef;
          z-index: 0;
        }

        .tab-step {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .tab-step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e9ecef;
          color: #999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.1rem;
          transition: all 0.3s ease;
        }

        .tab-step.active .tab-step-number {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          transform: scale(1.05);
        }

        .tab-step.completed .tab-step-number {
          background: #22c55e;
          color: white;
        }

        .tab-step-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: #999;
          text-align: center;
          white-space: nowrap;
        }

        .tab-step.active .tab-step-label {
          color: #667eea;
          font-weight: 600;
        }

        .tab-step.completed .tab-step-label {
          color: #22c55e;
        }

        .form-section {
          display: none;
          animation: fadeIn 0.3s ease;
        }

        .form-section.active {
          display: block;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .left-content-section {
          animation: slideInFromLeft 0.8s ease-out forwards;
        }

        .form-content-section {
          animation: slideInFromRight 0.8s ease-out forwards;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #667eea;
          font-size: 0.85rem;
          pointer-events: none;
        }

        .form-control-wrapper {
          position: relative;
          width: 100%;
        }

        .form-control-wrapper input,
        .form-control-wrapper select {
          width: 100%;
          padding: 10px 12px 10px 35px;
          border-radius: 8px;
          border: 1px solid #ddd;
          transition: all 0.3s ease;
          font-size: 0.95rem;
          font-family: inherit;
        }

        .form-control-wrapper input::placeholder {
          color: #bbb;
        }

        .form-control-wrapper input:focus,
        .form-control-wrapper select:focus {
          border-color: #667eea;
          outline: none;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          background: white;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          width: 100%;
          margin-bottom: 15px;
        }

        @media (max-width: 576px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 15px;
          }
        }

        .mb-3 {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }

        .btn-wizard {
          border-radius: 8px;
          padding: 11px 24px;
          font-weight: 600;
          transition: all 0.3s ease;
          border: none;
          font-size: 0.95rem;
          cursor: pointer;
        }

        .btn-primary-wizard {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .btn-primary-wizard:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4);
        }

        .btn-primary-wizard:active {
          transform: translateY(0);
        }

        .btn-secondary-wizard {
          background: #f0f2f5;
          color: #333;
        }

        .btn-secondary-wizard:hover {
          background: #e0e2e6;
        }

        .buttons-container {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 30px;
          width: 100%;
        }

        .buttons-container button {
          min-width: 120px;
        }

        .section-title {
          font-size: 1.3rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 10px;
        }

        .section-subtitle {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 25px;
        }

        .form-check-custom {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 15px;
          border-radius: 8px;
          background: #f8f9fa;
          margin-top: 20px;
          margin-bottom: 20px;
        }

        .form-check-custom input {
          width: 18px;
          height: 18px;
          margin-top: 2px;
          accent-color: #667eea;
          cursor: pointer;
          flex-shrink: 0;
        }

        .form-check-custom label {
          margin: 0;
          cursor: pointer;
          font-size: 0.9rem;
          color: #666;
          line-height: 1.4;
        }

        .form-check-custom a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        .form-check-custom a:hover {
          text-decoration: underline;
        }

        .password-indicator {
          font-size: 0.85rem;
          padding: 10px 12px;
          border-radius: 6px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .password-indicator.match {
          background: #d1fae5;
          color: #065f46;
        }

        .password-indicator.no-match {
          background: #fee2e2;
          color: #991b1b;
        }

        .navbar-cadastro {
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(102, 126, 234, 0.1);
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
          position: relative;
          z-index: 100;
        }

        .navbar-cadastro .navbar-brand {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
          font-size: 1.3rem;
          text-decoration: none;
        }

        .navbar-cadastro .nav-link {
          color: #4a5568 !important;
          font-weight: 500;
          transition: color 0.3s ease;
          text-decoration: none;
        }

        .navbar-cadastro .nav-link:hover {
          color: #667eea !important;
        }

        .login-link {
          text-align: center;
          margin-top: 25px;
          color: #666;
          font-size: 0.9rem;
        }

        .login-link a {
          color: #667eea;
          font-weight: bold;
          text-decoration: none;
          margin-left: 4px;
        }

        .login-link a:hover {
          text-decoration: underline;
        }

        .plano-card {
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 15px;
        }

        .plano-card:hover {
          border-color: #667eea;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
          transform: translateY(-2px);
        }

        .plano-card.selected {
          border-color: #667eea;
          background: #f0f3ff;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .plano-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .plano-nome {
          font-weight: 700;
          color: #333;
          font-size: 1rem;
        }

        .plano-preco {
          font-weight: 700;
          color: #667eea;
          font-size: 1.2rem;
        }

        .plano-descricao {
          color: #666;
          font-size: 0.85rem;
          margin-bottom: 10px;
          line-height: 1.4;
        }

        .plano-features {
          list-style: none;
          padding: 0;
          margin: 10px 0 0 0;
          font-size: 0.85rem;
        }

        .plano-features li {
          color: #666;
          padding: 5px 0;
          border-top: 1px solid #f0f0f0;
        }

        .plano-features li:first-child {
          border-top: none;
          padding-top: 0;
        }

        .plano-features li:before {
          content: '✓ ';
          color: #22c55e;
          font-weight: bold;
          margin-right: 5px;
        }

        .trial-option {
          border: 2px solid #22c55e;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          background: #f1fef0;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .trial-option:hover {
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.2);
          transform: translateY(-2px);
        }

        .trial-option.selected {
          background: #d1fae5;
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
        }

        .trial-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .trial-title {
          font-weight: 700;
          color: #22c55e;
          font-size: 1.1rem;
        }

        .trial-badge {
          background: #22c55e;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .trial-description {
          color: #065f46;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .card-cadastro {
            padding: 30px !important;
          }

          .section-title {
            font-size: 1.15rem;
          }

          .buttons-container {
            flex-direction: column-reverse;
          }

          .buttons-container button {
            width: 100%;
          }
        }
      `}</style>

      <nav className="navbar navbar-expand-lg navbar-cadastro">
        <div className="container">
          <Link className="navbar-brand" href="/">
            <img 
              src="/assets/img/logomarcafull.png" 
              alt="QUOTIX" 
              style={{ height: '45px' }}
            />
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" href="/">
                  <i className="fas fa-home me-2"></i>Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href="/login">
                  <i className="fas fa-sign-in-alt me-2"></i>Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="cadastro-gradient">
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '0px', paddingBottom: '0px' }}>
          <div className="container-fluid">
            <div className="row g-0 align-items-center" style={{ minHeight: '100vh' }}>
              {/* COLUNA ESQUERDA - CONTEÚDO */}
              <div className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center p-5 left-content-section" style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '500px' }}>
                  <div style={{ marginBottom: '40px' }}>
                    <div style={{
                      fontSize: '3.5rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      marginBottom: '20px'
                    }}>
                      Bem-vindo!
                    </div>
                    <p style={{
                      fontSize: '1.1rem',
                      color: '#ffffff',
                      lineHeight: '1.8',
                      marginBottom: '30px',
                      opacity: 0.9
                    }}>
                      Junte-se a milhares de lojistas que estão aumentando suas vendas de seguros com nossa plataforma inteligente.
                    </p>
                  </div>

                  {/* Benefícios */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.5rem',
                        flexShrink: 0
                      }}>
                        <i className="fas fa-rocket"></i>
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', color: '#ffffff', fontWeight: '600' }}>Comece em 5 minutos</h4>
                        <p style={{ margin: 0, color: '#ffffff', fontSize: '0.9rem', opacity: 0.9 }}>Cadastro rápido e simples, sem burocracias</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.5rem',
                        flexShrink: 0
                      }}>
                        <i className="fas fa-chart-line"></i>
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', color: '#ffffff', fontWeight: '600' }}>Aumente suas vendas</h4>
                        <p style={{ margin: 0, color: '#ffffff', fontSize: '0.9rem', opacity: 0.9 }}>Ferramentas poderosas para gerenciar suas vendas</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.5rem',
                        flexShrink: 0
                      }}>
                        <i className="fas fa-shield-alt"></i>
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', color: '#ffffff', fontWeight: '600' }}>100% Seguro</h4>
                        <p style={{ margin: 0, color: '#ffffff', fontSize: '0.9rem', opacity: 0.9 }}>Seus dados protegidos com segurança de ponta</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.5rem',
                        flexShrink: 0
                      }}>
                        <i className="fas fa-headset"></i>
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', color: '#ffffff', fontWeight: '600' }}>Suporte 24/7</h4>
                        <p style={{ margin: 0, color: '#ffffff', fontSize: '0.9rem', opacity: 0.9 }}>Equipe sempre pronta para ajudar você</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                    marginTop: '40px',
                    paddingTop: '30px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <div>
                      <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#ffffff' }}>5000+</div>
                      <div style={{ fontSize: '0.9rem', color: '#ffffff', opacity: 0.9 }}>Lojistas ativos</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#ffffff' }}>R$ 10M+</div>
                      <div style={{ fontSize: '0.9rem', color: '#ffffff', opacity: 0.9 }}>Em vendas/mês</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUNA DIREITA - FORM */}
              <div className="col-lg-6 d-flex align-items-center justify-content-center p-4 form-content-section" style={{ position: 'relative', zIndex: 1 }}>
                <div className="card-cadastro" style={{ width: '100%', maxWidth: '500px' }}>
                  {/* Botão Limpar Dados */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                    <button 
                      type="button"
                      onClick={handleLimparFormulario}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#999',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease',
                        textDecoration: 'none'
                      } as React.CSSProperties}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f5f5f5'
                        e.currentTarget.style.color = '#666'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'none'
                        e.currentTarget.style.color = '#999'
                      }}
                      title="Limpar dados salvos do formulário"
                    >
                      <i className="fas fa-trash-alt"></i>
                      Limpar dados
                    </button>
                  </div>

                  {/* Indicador de Etapas */}
                  <div className="tab-indicator">
                    <div className={`tab-step ${etapa >= 1 ? 'active' : ''} ${etapa > 1 ? 'completed' : ''}`}>
                      <div className="tab-step-number">
                        {etapa > 1 ? <i className="fas fa-check"></i> : '1'}
                      </div>
                      <div className="tab-step-label">Dados Pessoais</div>
                    </div>
                    <div className={`tab-step ${etapa >= 2 ? 'active' : ''} ${etapa > 2 ? 'completed' : ''}`}>
                      <div className="tab-step-number">
                        {etapa > 2 ? <i className="fas fa-check"></i> : '2'}
                      </div>
                      <div className="tab-step-label">Dados da Loja</div>
                    </div>
                    <div className={`tab-step ${etapa >= 3 ? 'active' : ''}`}>
                      <div className="tab-step-number">3</div>
                      <div className="tab-step-label">Plano</div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit}>
                  {/* ETAPA 1: DADOS PESSOAIS */}
                  <div className={`form-section ${etapa === 1 ? 'active' : ''}`}>
                    <h2 className="section-title">
                      <i className="fas fa-user me-2"></i>Dados Pessoais
                    </h2>
                    <p className="section-subtitle">Crie sua conta para gerenciar a loja</p>

                    <div className="mb-3">
                      <label className="form-label">Nome Completo</label>
                      <div className="form-control-wrapper">
                        <i className="fas fa-user input-icon"></i>
                        <input 
                          type="text" 
                          placeholder="Digite seu nome completo"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <div className="form-control-wrapper">
                        <i className="fas fa-envelope input-icon"></i>
                        <input 
                          type="email" 
                          placeholder="seu@email.com"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div>
                        <label className="form-label">Senha</label>
                        <div className="form-control-wrapper">
                          <i className="fas fa-lock input-icon"></i>
                          <input 
                            type="password" 
                            placeholder="Mínimo 6 caracteres"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Confirmar Senha</label>
                        <div className="form-control-wrapper">
                          <i className="fas fa-check-circle input-icon"></i>
                          <input 
                            type="password" 
                            placeholder="Repita a senha"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {formData.password && formData.confirmPassword && (
                      <div className={`password-indicator ${formData.password === formData.confirmPassword ? 'match' : 'no-match'}`}>
                        {formData.password === formData.confirmPassword ? (
                          <><i className="fas fa-check"></i>Senhas coincidem</>
                        ) : (
                          <><i className="fas fa-times"></i>Senhas não coincidem</>
                        )}
                      </div>
                    )}

                    <div className="buttons-container">
                      <button type="button" onClick={handleProximaEtapa} className="btn-wizard btn-primary-wizard">
                        Próxima Etapa <i className="fas fa-arrow-right ms-2"></i>
                      </button>
                    </div>
                  </div>

                  {/* ETAPA 2: DADOS DA LOJA */}
                  <div className={`form-section ${etapa === 2 ? 'active' : ''}`}>
                    <h2 className="section-title">
                      <i className="fas fa-store me-2"></i>Dados da Loja
                    </h2>
                    <p className="section-subtitle">Informações sobre sua loja</p>

                    <div className="mb-3">
                      <label className="form-label">Nome da Loja</label>
                      <div className="form-control-wrapper">
                        <i className="fas fa-briefcase input-icon"></i>
                        <input 
                          type="text" 
                          placeholder="Nome da sua loja"
                          name="nomeLoja"
                          value={formData.nomeLoja}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">CNPJ</label>
                      <div className="form-control-wrapper">
                        <i className="fas fa-id-card input-icon"></i>
                        <input 
                          type="text" 
                          placeholder="00.000.000/0000-00"
                          name="cnpj"
                          value={formData.cnpj}
                          onChange={handleCNPJChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div>
                        <label className="form-label">Telefone</label>
                        <div className="form-control-wrapper">
                          <i className="fas fa-phone input-icon"></i>
                          <input 
                            type="text" 
                            placeholder="(11) 99999-9999"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleTelefoneChange}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="form-label">CEP</label>
                        <div className="form-control-wrapper">
                          <i className="fas fa-map-pin input-icon"></i>
                          <input 
                            type="text" 
                            placeholder="00000-000"
                            name="cep"
                            value={formData.cep}
                            onChange={handleCEPChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Endereço</label>
                      <div className="form-control-wrapper">
                        <i className="fas fa-road input-icon"></i>
                        <input 
                          type="text" 
                          placeholder="Rua das Flores, 123"
                          name="endereco"
                          value={formData.endereco}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div>
                        <label className="form-label">Cidade</label>
                        <div className="form-control-wrapper">
                          <i className="fas fa-city input-icon"></i>
                          <input 
                            type="text" 
                            placeholder="São Paulo"
                            name="cidade"
                            value={formData.cidade}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Estado</label>
                        <div className="form-control-wrapper">
                          <i className="fas fa-globe input-icon"></i>
                          <select 
                            name="estado"
                            value={formData.estado}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Selecione o estado</option>
                            {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="form-check-custom">
                      <input 
                        type="checkbox" 
                        id="terms"
                        name="terms"
                        checked={formData.terms}
                        onChange={handleChange}
                        required
                      />
                      <label htmlFor="terms">
                        Eu concordo com os <a href="#" onClick={(e) => e.preventDefault()}>Termos e Condições</a>
                      </label>
                    </div>

                    <div className="buttons-container">
                      <button type="button" onClick={handleEtapaAnterior} className="btn-wizard btn-secondary-wizard">
                        <i className="fas fa-arrow-left me-2"></i>Voltar
                      </button>
                      <button type="button" onClick={handleProximaEtapa} className="btn-wizard btn-primary-wizard">
                        Próxima Etapa <i className="fas fa-arrow-right ms-2"></i>
                      </button>
                    </div>
                  </div>

                  {/* ETAPA 3: SELEÇÃO DE PLANO */}
                  <div className={`form-section ${etapa === 3 ? 'active' : ''}`}>
                    <h2 className="section-title">
                      <i className="fas fa-crown me-2"></i>Escolha seu Plano
                    </h2>
                    <p className="section-subtitle">Comece com trial ou escolha um plano</p>

                    {/* Trial Option */}
                    <div 
                      className={`trial-option ${usarTrial ? 'selected' : ''}`}
                      onClick={() => {
                        const novoTrial = !usarTrial
                        setUsarTrial(novoTrial)
                        if (!usarTrial) setPlanoSelecionado(null)
                        
                        // Salvar no localStorage
                        if (typeof window !== 'undefined') {
                          localStorage.setItem(STORAGE_TRIAL_KEY, JSON.stringify(novoTrial))
                          localStorage.setItem(STORAGE_PLANO_KEY, JSON.stringify(null))
                        }
                      }}
                    >
                      <div className="trial-header">
                        <i className="fas fa-gift" style={{ fontSize: '1.5rem', color: '#22c55e' }}></i>
                        <div className="trial-title">7 Dias de Trial Grátis</div>
                        <div className="trial-badge">RECOMENDADO</div>
                      </div>
                      <div className="trial-description">
                        Teste todas as funcionalidades sem custo. Cancele a qualquer momento.
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', color: '#999', margin: '20px 0', fontSize: '0.9rem' }}>
                      OU ESCOLHA UM PLANO
                    </div>

                    {/* Planos */}
                    {planos.map((plano) => (
                      <div
                        key={plano.id}
                        className={`plano-card ${planoSelecionado === plano.id ? 'selected' : ''}`}
                        onClick={() => {
                          setPlanoSelecionado(plano.id)
                          setUsarTrial(false)
                          
                          // Salvar no localStorage
                          if (typeof window !== 'undefined') {
                            localStorage.setItem(STORAGE_PLANO_KEY, JSON.stringify(plano.id))
                            localStorage.setItem(STORAGE_TRIAL_KEY, JSON.stringify(false))
                          }
                        }}
                      >
                        <div className="plano-header">
                          <div className="plano-nome">{plano.nome}</div>
                          <div className="plano-preco">R$ {plano.precoMensal}/mês</div>
                        </div>
                        <div className="plano-descricao">{plano.descricao}</div>
                        {plano.features && plano.features.length > 0 && (
                          <ul className="plano-features">
                            {plano.features.map((feature, idx) => (
                              <li key={idx}>{feature}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}

                    <div className="buttons-container">
                      <button type="button" onClick={handleEtapaAnterior} className="btn-wizard btn-secondary-wizard">
                        <i className="fas fa-arrow-left me-2"></i>Voltar
                      </button>
                      <button type="submit" disabled={loading} className="btn-wizard btn-primary-wizard" style={{ opacity: loading ? 0.6 : 1 }}>
                        {loading ? (
                          <><i className="fas fa-spinner fa-spin me-2"></i>Enviando...</>
                        ) : (
                          <><i className="fas fa-check me-2"></i>Finalizar Cadastro</>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                <div className="login-link">
                  Já tem uma conta? <Link href="/login">Faça login aqui</Link>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}