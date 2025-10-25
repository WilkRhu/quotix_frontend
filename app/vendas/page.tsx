import DashboardLayout from '../../components/DashboardLayout'

export default function Vendas() {
  return (
    <DashboardLayout title="Vendas">
      <div className="row">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header pb-0">
              <h6>Gestão de Vendas</h6>
            </div>
            <div className="card-body px-0 pt-0 pb-2">
              <div className="p-3">
                <p>Página para gerenciar vendas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}