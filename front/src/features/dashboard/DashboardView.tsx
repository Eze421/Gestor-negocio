import { DataTable, EmptyState, MetricCard, Panel } from "../../shared/components/UI";
import type { Loadable, Product, ProfitabilitySummary, Sale } from "../../shared/types/models";
import { formatDate, formatMoney, saleStatuses } from "../../shared/utils/formatters";

type DashboardViewProps = {
  dashboard: {
    lowStock: Product[];
    pendingBalance: number;
    todaySales: Sale[];
    totalStockValue: number;
  };
  sales: Loadable<Sale[]>;
  profitReport: ProfitabilitySummary | null;
  reportPeriod: "today" | "week" | "month" | "all";
  onPeriodChange: (p: "today" | "week" | "month" | "all") => void;
};

export function DashboardView({
  dashboard,
  sales,
  profitReport,
  reportPeriod,
  onPeriodChange,
}: DashboardViewProps) {
  const periodSales = profitReport
    ? profitReport.total_sales_revenue
    : dashboard.todaySales.reduce((total, sale) => total + sale.total_amount, 0);
  const periodCost = profitReport ? profitReport.total_cost_of_sales : 0;
  const periodProfit = profitReport ? profitReport.gross_profit : 0;
  const periodMargin = profitReport ? profitReport.profit_margin_percent : 0;
  const stockCostValue = profitReport ? profitReport.inventory_cost_value : 0;
  const stockSaleValue = profitReport ? profitReport.inventory_sale_value : dashboard.totalStockValue;

  return (
    <div className="stack">
      <div className="tabs-header" style={{ marginBottom: "0px" }}>
        <button
          className={`tab-button ${reportPeriod === "today" ? "active" : ""}`}
          onClick={() => onPeriodChange("today")}
          type="button"
        >
          Hoy
        </button>
        <button
          className={`tab-button ${reportPeriod === "week" ? "active" : ""}`}
          onClick={() => onPeriodChange("week")}
          type="button"
        >
          Últimos 7 días
        </button>
        <button
          className={`tab-button ${reportPeriod === "month" ? "active" : ""}`}
          onClick={() => onPeriodChange("month")}
          type="button"
        >
          Este Mes
        </button>
        <button
          className={`tab-button ${reportPeriod === "all" ? "active" : ""}`}
          onClick={() => onPeriodChange("all")}
          type="button"
        >
          Histórico Total
        </button>
      </div>

      <section className="metric-grid">
        <MetricCard
          label={`Ventas (${reportPeriod === "today" ? "Hoy" : reportPeriod === "week" ? "7 Días" : reportPeriod === "month" ? "Mes" : "Histórico"})`}
          value={formatMoney(periodSales)}
          meta={`${profitReport?.total_sales_count ?? dashboard.todaySales.length} ventas procesadas`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          }
        />
        <MetricCard
          label="Ganancia Real (Bruta)"
          value={formatMoney(periodProfit)}
          meta={`Margen de ganancia: ${periodMargin}%`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <MetricCard
          label="Costo de Mercadería"
          value={formatMoney(periodCost)}
          meta="Costo de adquisición vendido"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          }
        />
        <MetricCard
          label="Capital en Stock (Costo)"
          value={formatMoney(stockCostValue)}
          meta={`Valor de venta: ${formatMoney(stockSaleValue)}`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          }
        />
      </section>

      {profitReport && (profitReport.top_selling_products.length > 0 || profitReport.top_profitable_products.length > 0) && (
        <section className="panel-grid">
          <section className="panel">
            <div className="panel-header">
              <h3>Top Productos Más Vendidos</h3>
            </div>
            {profitReport.top_selling_products.length === 0 ? (
              <EmptyState message="Sin ventas en este período." />
            ) : (
              <DataTable
                pageSize={10}
                columns={["Producto", "Vendidos", "Recaudación", "Ganancia"]}
                rows={profitReport.top_selling_products.map((p) => [
                  p.product_name,
                  `${p.quantity_sold} u.`,
                  formatMoney(p.total_revenue),
                  formatMoney(p.gross_profit),
                ])}
              />
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <h3>Top Productos Más Rentables</h3>
            </div>
            {profitReport.top_profitable_products.length === 0 ? (
              <EmptyState message="Sin ventas en este período." />
            ) : (
              <DataTable
                pageSize={10}
                columns={["Producto", "Ganancia Aportada", "Margen %"]}
                rows={profitReport.top_profitable_products.map((p) => [
                  p.product_name,
                  formatMoney(p.gross_profit),
                  `${p.profit_margin_percent}%`,
                ])}
              />
            )}
          </section>
        </section>
      )}

      <section className="panel-grid">
        <Panel title="Últimas ventas" state={sales}>
          <DataTable
            pageSize={6}
            columns={["Fecha", "Cliente", "Total", "Estado"]}
            rows={sales.data.slice(0, 6).map((sale) => [
              formatDate(sale.sold_at),
              sale.client?.name ?? "Consumidor final",
              formatMoney(sale.total_amount),
              saleStatuses[sale.status] ?? "Sin estado",
            ])}
          />
        </Panel>

        <section className="panel">
          <div className="panel-header">
            <h3>Alertas de stock ({dashboard.lowStock.length})</h3>
          </div>
          {dashboard.lowStock.length === 0 ? (
            <EmptyState message="No hay productos con stock bajo." />
          ) : (
            <div className="compact-list">
              {dashboard.lowStock.slice(0, 8).map((product) => (
                <div className="compact-row" key={product.id}>
                  <span>{product.name}</span>
                  <strong style={{ color: product.stock === 0 ? "#ef4444" : "#f59e0b" }}>
                    {product.stock} u. {product.stock === 0 ? "(Agotado)" : ""}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
