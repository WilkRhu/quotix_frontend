"use client"

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import type { TooltipItem } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)

interface SalesPerformanceChartsProps {
  monthlyTotals: {
    labels: string[]
    values: number[]
  }
  statusDistribution: {
    labels: string[]
    values: number[]
  }
  commissionTrend: {
    labels: string[]
    sales: number[]
    commissions: number[]
  }
  formatMoney: (valor: number) => string
  contextLabel?: string
  trendBadgeLabel?: string
  monthlyBadgeLabel?: string
  statusSubtitle?: string
}

const chartPalette = {
  primary: 'rgba(94, 114, 228, 0.85)',
  primaryBorder: 'rgba(94, 114, 228, 1)',
  success: 'rgba(45, 206, 137, 0.8)',
  warning: 'rgba(251, 99, 64, 0.85)',
  muted: 'rgba(168, 175, 187, 0.75)'
}

const emptyMessage = (
  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center text-muted">
    <i className="fas fa-chart-line fa-2x mb-2"></i>
    <span className="text-sm">Sem dados suficientes para exibir o gráfico.</span>
  </div>
)

export default function SalesPerformanceCharts({
  monthlyTotals,
  statusDistribution,
  commissionTrend,
  formatMoney,
  contextLabel = 'Soma do valor vendido nos últimos meses',
  trendBadgeLabel,
  monthlyBadgeLabel,
  statusSubtitle = 'Distribuição por status das vendas realizadas'
}: SalesPerformanceChartsProps) {
  const hasMonthlyData = monthlyTotals.values.some(valor => valor > 0)
  const hasStatusData = statusDistribution.values.some(valor => valor > 0)
  const hasTrendData = commissionTrend.labels.length > 0

  const monthlyChartData = useMemo(() => ({
    labels: monthlyTotals.labels,
    datasets: [
      {
        label: 'Valor vendido',
        data: monthlyTotals.values,
        backgroundColor: chartPalette.primary,
        borderRadius: 12,
        maxBarThickness: 42
      }
    ]
  }), [monthlyTotals])

  const monthlyChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        ticks: {
          callback: (value: string | number) => formatMoney(Number(value))
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => `Valor: ${formatMoney(Number(context.raw ?? 0))}`
        }
      }
    }
  }), [formatMoney])

  const statusChartData = useMemo(() => ({
    labels: statusDistribution.labels,
    datasets: [
      {
        label: 'Vendas',
        data: statusDistribution.values,
        backgroundColor: [chartPalette.primary, chartPalette.success, chartPalette.muted],
        borderWidth: 0
      }
    ]
  }), [statusDistribution])

  const statusChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'doughnut'>) => `${context.label}: ${context.parsed ?? 0}`
        }
      }
    },
    cutout: '65%'
  }), [])

  const trendChartData = useMemo(() => ({
    labels: commissionTrend.labels,
    datasets: [
      {
        label: 'Valor da venda',
        data: commissionTrend.sales,
        borderColor: chartPalette.primaryBorder,
        backgroundColor: 'rgba(94, 114, 228, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: chartPalette.primaryBorder,
        pointHoverRadius: 6
      },
      {
        label: 'Comissão',
        data: commissionTrend.commissions,
        borderColor: chartPalette.warning,
        backgroundColor: 'rgba(251, 99, 64, 0.18)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: chartPalette.warning,
        pointHoverRadius: 6
      }
    ]
  }), [commissionTrend])

  const trendChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        position: 'bottom' as const
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => `${context.dataset.label}: ${formatMoney(Number(context.raw ?? 0))}`
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value: string | number) => formatMoney(Number(value))
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }), [formatMoney])

  return (
    <>
      <div className="row mt-4">
        <div className="col-lg-8 col-12 mb-lg-0 mb-4">
          <div className="card h-100">
            <div className="card-header pb-0">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6>Evolução de Vendas</h6>
                  <p className="text-sm text-muted mb-0">{contextLabel}</p>
                </div>
                <span className="badge bg-gradient-primary">{monthlyBadgeLabel ?? `${monthlyTotals.labels.length} meses`}</span>
              </div>
            </div>
            <div className="card-body">
              <div style={{ height: '260px' }}>
                {hasMonthlyData ? <Bar data={monthlyChartData} options={monthlyChartOptions} /> : emptyMessage}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4 col-12">
          <div className="card h-100">
            <div className="card-header pb-0">
              <h6>Status das Vendas</h6>
              <p className="text-sm text-muted mb-0">{statusSubtitle}</p>
            </div>
            <div className="card-body">
              <div style={{ height: '240px' }}>
                {hasStatusData ? <Doughnut data={statusChartData} options={statusChartOptions} /> : emptyMessage}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="card h-100">
            <div className="card-header pb-0 d-flex justify-content-between align-items-start">
              <div>
                <h6>Comissão x Valor</h6>
                <p className="text-sm text-muted mb-0">Comparativo das últimas vendas registradas</p>
              </div>
              <span className="badge bg-gradient-info">{trendBadgeLabel ?? `Últimas ${Math.max(commissionTrend.labels.length, 0)} vendas`}</span>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                {hasTrendData ? <Line data={trendChartData} options={trendChartOptions} /> : emptyMessage}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
