'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import ProtectedRoute from '../../components/ProtectedRoute'
import { Role } from '../../types/auth'

export default function Dashboard() {
  const [apiStatus, setApiStatus] = useState<string>('Carregando...')

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.message))
      .catch(() => setApiStatus('Erro ao conectar com a API'))
  }, [])

  return (
    <ProtectedRoute requiredRoles={[Role.ADMIN, Role.SELLER, Role.LOGIST]}>
      <DashboardLayout title="Dashboard">
      <div className="row">
        <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
          <div className="card">
            <div className="card-body p-3">
              <div className="row">
                <div className="col-8">
                  <div className="numbers">
                    <p className="text-sm mb-0 text-capitalize font-weight-bold">Today's Money</p>
                    <h5 className="font-weight-bolder mb-0">
                      R$ 53,000
                      <span className="text-success text-sm font-weight-bolder">+55%</span>
                    </h5>
                  </div>
                </div>
                <div className="col-4 text-end">
                  <div className="icon icon-shape bg-gradient-primary shadow-primary text-center rounded-circle">
                    <i className="fas fa-dollar-sign text-lg opacity-10" aria-hidden="true"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
          <div className="card">
            <div className="card-body p-3">
              <div className="row">
                <div className="col-8">
                  <div className="numbers">
                    <p className="text-sm mb-0 text-capitalize font-weight-bold">Today's Users</p>
                    <h5 className="font-weight-bolder mb-0">
                      2,300
                      <span className="text-success text-sm font-weight-bolder">+3%</span>
                    </h5>
                  </div>
                </div>
                <div className="col-4 text-end">
                  <div className="icon icon-shape bg-gradient-danger shadow-danger text-center rounded-circle">
                    <i className="fas fa-users text-lg opacity-10" aria-hidden="true"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
          <div className="card">
            <div className="card-body p-3">
              <div className="row">
                <div className="col-8">
                  <div className="numbers">
                    <p className="text-sm mb-0 text-capitalize font-weight-bold">New Clients</p>
                    <h5 className="font-weight-bolder mb-0">
                      +3,462
                      <span className="text-danger text-sm font-weight-bolder">-2%</span>
                    </h5>
                  </div>
                </div>
                <div className="col-4 text-end">
                  <div className="icon icon-shape bg-gradient-success shadow-success text-center rounded-circle">
                    <i className="fas fa-user-plus text-lg opacity-10" aria-hidden="true"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="card">
            <div className="card-body p-3">
              <div className="row">
                <div className="col-8">
                  <div className="numbers">
                    <p className="text-sm mb-0 text-capitalize font-weight-bold">Sales</p>
                    <h5 className="font-weight-bolder mb-0">
                      R$ 103,430
                      <span className="text-success text-sm font-weight-bolder">+5%</span>
                    </h5>
                  </div>
                </div>
                <div className="col-4 text-end">
                  <div className="icon icon-shape bg-gradient-warning shadow-warning text-center rounded-circle">
                    <i className="fas fa-chart-line text-lg opacity-10" aria-hidden="true"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header pb-0">
              <h6>Status do Sistema</h6>
            </div>
            <div className="card-body px-0 pt-0 pb-2">
              <div className="p-3">
                <p className="mb-2">Frontend: Next.js funcionando!</p>
                <p className="mb-3">Status da API: <span className="badge bg-success">{apiStatus}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
