import { useEffect, useMemo, useState } from "react";

import { AppProviders } from "./app/AppProviders";
import { appRoutes } from "./app/router";
import { AjustesView } from "./features/ajustes/AjustesView";
import { CajaView } from "./features/caja/CajaView";
import { CategoriesView } from "./features/categorias/CategoriesView";
import { ClientsView } from "./features/clientes/ClientsView";
import { DashboardView } from "./features/dashboard/DashboardView";
import { InventoryView } from "./features/inventario/InventoryView";
import { SuppliersView } from "./features/proveedores/SuppliersView";
import { ReceiptModal } from "./features/tickets/ReceiptModal";
import { SalesView } from "./features/ventas/SalesView";
import { ShellLayout } from "./layouts/ShellLayout";
import { API_URL, apiGet } from "./shared/api/client";
import { useToast } from "./shared/context/ToastContext";
import type {
  BusinessSettings,
  CajaClosing,
  CajaStatus,
  Category,
  Client,
  Loadable,
  Product,
  ProfitabilitySummary,
  Purchase,
  ReceiptData,
  Sale,
  StockMovement,
  Supplier,
} from "./shared/types/models";
import {
  initialCajaStatus,
  initialLoadable,
  loadBusinessSettings,
  saveBusinessSettings,
} from "./shared/utils/formatters";

function getInitialRoute() {
  const hash = window.location.hash.replace("#", "");
  return appRoutes.some((route) => route.key === hash) ? hash : "dashboard";
}

function AppContent() {
  const { showToast } = useToast();
  const [activeRoute, setActiveRoute] = useState(getInitialRoute);
  const [products, setProducts] = useState(initialLoadable<Product[]>([]));
  const [clients, setClients] = useState(initialLoadable<Client[]>([]));
  const [suppliers, setSuppliers] = useState(initialLoadable<Supplier[]>([]));
  const [categories, setCategories] = useState(initialLoadable<Category[]>([]));
  const [sales, setSales] = useState(initialLoadable<Sale[]>([]));
  const [cajaStatus, setCajaStatus] = useState(initialLoadable<CajaStatus>(initialCajaStatus));
  const [cajaHistory, setCajaHistory] = useState(initialLoadable<CajaClosing[]>([]));
  const [purchases, setPurchases] = useState(initialLoadable<Purchase[]>([]));
  const [stockMovements, setStockMovements] = useState(initialLoadable<StockMovement[]>([]));
  const [reportPeriod, setReportPeriod] = useState<"today" | "week" | "month" | "all">("today");
  const [profitReport, setProfitReport] = useState<ProfitabilitySummary | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") ?? "light";
  });
  const [systemThemeSync, setSystemThemeSync] = useState<boolean>(() => {
    return localStorage.getItem("gestock_system_theme") === "true";
  });
  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem("gestock_accent") ?? "gestock-blue";
  });
  const [daltonism, setDaltonism] = useState<string>(() => {
    return localStorage.getItem("gestock_daltonism") ?? "none";
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem("gestock_high_contrast") === "true";
  });
  const [textScale, setTextScale] = useState<string>(() => {
    return localStorage.getItem("gestock_text_scale") ?? "normal";
  });
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(loadBusinessSettings);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [printReceiptData, setPrintReceiptData] = useState<ReceiptData | null>(null);

  const navigate = (route: string) => {
    window.location.hash = route;
    setActiveRoute(route);
  };

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (printReceiptData) {
          e.preventDefault();
          setPrintReceiptData(null);
        } else if (isSettingsOpen) {
          e.preventDefault();
          setIsSettingsOpen(false);
        }
      }

      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= appRoutes.length) {
          e.preventDefault();
          navigate(appRoutes[num - 1].key);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [printReceiptData, isSettingsOpen]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accentColor);
    localStorage.setItem("gestock_accent", accentColor);
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.setAttribute("data-daltonism", daltonism);
    localStorage.setItem("gestock_daltonism", daltonism);
  }, [daltonism]);

  useEffect(() => {
    document.documentElement.setAttribute("data-high-contrast", String(highContrast));
    localStorage.setItem("gestock_high_contrast", String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.setAttribute("data-text-scale", textScale);
    localStorage.setItem("gestock_text_scale", textScale);
  }, [textScale]);

  useEffect(() => {
    localStorage.setItem("gestock_system_theme", String(systemThemeSync));
    if (systemThemeSync) {
      const matchMedia = window.matchMedia("(prefers-color-scheme: dark)");
      const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
        setTheme(e.matches ? "dark" : "light");
      };
      setTheme(matchMedia.matches ? "dark" : "light");
      matchMedia.addEventListener("change", handleSystemThemeChange);
      return () => matchMedia.removeEventListener("change", handleSystemThemeChange);
    }
  }, [systemThemeSync]);

  const refreshData = async () => {
    setProducts((current) => ({ ...current, loading: true, error: null }));
    setClients((current) => ({ ...current, loading: true, error: null }));
    setSuppliers((current) => ({ ...current, loading: true, error: null }));
    setCategories((current) => ({ ...current, loading: true, error: null }));
    setSales((current) => ({ ...current, loading: true, error: null }));
    setPurchases((current) => ({ ...current, loading: true, error: null }));
    setStockMovements((current) => ({ ...current, loading: true, error: null }));
    setCajaStatus((current) => ({ ...current, loading: true, error: null }));
    setCajaHistory((current) => ({ ...current, loading: true, error: null }));

    const loaders = [
      apiGet<Product[]>("/products/").then(
        (data) => setProducts({ data, error: null, loading: false }),
        (error: Error) => setProducts({ data: [], error: error.message, loading: false }),
      ),
      apiGet<StockMovement[]>("/products/stock-movements").then(
        (data) => setStockMovements({ data, error: null, loading: false }),
        (error: Error) => setStockMovements({ data: [], error: error.message, loading: false }),
      ),
      apiGet<ProfitabilitySummary>(`/reports/profitability?period=${reportPeriod}`).then(
        (data) => setProfitReport(data),
        () => setProfitReport(null),
      ),
      apiGet<Client[]>("/clients/").then(
        (data) => setClients({ data, error: null, loading: false }),
        (error: Error) => setClients({ data: [], error: error.message, loading: false }),
      ),
      apiGet<Supplier[]>("/suppliers/").then(
        (data) => setSuppliers({ data, error: null, loading: false }),
        (error: Error) => setSuppliers({ data: [], error: error.message, loading: false }),
      ),
      apiGet<Category[]>("/categories/").then(
        (data) => setCategories({ data, error: null, loading: false }),
        (error: Error) => setCategories({ data: [], error: error.message, loading: false }),
      ),
      apiGet<Sale[]>("/sales/").then(
        (data) => setSales({ data, error: null, loading: false }),
        (error: Error) => setSales({ data: [], error: error.message, loading: false }),
      ),
      apiGet<Purchase[]>("/purchases/").then(
        (data) => setPurchases({ data, error: null, loading: false }),
        (error: Error) => setPurchases({ data: [], error: error.message, loading: false }),
      ),
      apiGet<CajaStatus>("/cash/status").then(
        (data) => setCajaStatus({ data, error: null, loading: false }),
        (error: Error) => setCajaStatus({ data: initialCajaStatus, error: error.message, loading: false }),
      ),
      apiGet<CajaClosing[]>("/cash/closings").then(
        (data) => setCajaHistory({ data, error: null, loading: false }),
        (error: Error) => setCajaHistory({ data: [], error: error.message, loading: false }),
      ),
    ];

    await Promise.all(loaders);
  };

  useEffect(() => {
    apiGet<ProfitabilitySummary>(`/reports/profitability?period=${reportPeriod}`).then(
      (data) => setProfitReport(data),
      () => setProfitReport(null),
    );
  }, [reportPeriod]);

  useEffect(() => {
    void refreshData();
  }, []);

  useEffect(() => {
    const syncRoute = () => setActiveRoute(getInitialRoute());
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const dashboard = useMemo(() => {
    const totalStockValue = products.data.reduce((total, product) => total + product.price * product.stock, 0);
    const today = new Date().toDateString();
    const todaySales = sales.data.filter((sale) => new Date(sale.sold_at).toDateString() === today);
    const pendingBalance = sales.data.reduce((total, sale) => total + sale.summary.balance, 0);
    const lowStock = products.data.filter((product) => product.active && product.stock <= (product.min_stock ?? 5));

    return { lowStock, pendingBalance, todaySales, totalStockValue };
  }, [products.data, sales.data]);

  const connectionStatus = useMemo(() => {
    const hasError =
      products.error || clients.error || suppliers.error || categories.error || sales.error || purchases.error;
    const anyLoading =
      products.loading ||
      clients.loading ||
      suppliers.loading ||
      categories.loading ||
      sales.loading ||
      purchases.loading;

    if (hasError) return "error";
    if (anyLoading) return "loading";
    return "connected";
  }, [products, clients, suppliers, categories, sales, purchases]);

  const handleSaveBusinessSettings = (settings: BusinessSettings) => {
    setBusinessSettings(settings);
    saveBusinessSettings(settings);
  };

  return (
    <ShellLayout activeRoute={activeRoute} onNavigate={navigate}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Panel operativo</p>
          <h2>{appRoutes.find((route) => route.key === activeRoute)?.label ?? "Dashboard"}</h2>
        </div>
        <div className="topbar-actions">
          <div className="topbar-brand">
            <img src="/logo.jpeg" alt="GESTOCK" />
            <span>{businessSettings.name || "GESTOCK"}</span>
          </div>
          <button
            className={`connection-status-pill ${connectionStatus}`}
            onClick={() => setIsSettingsOpen(true)}
            title="Ver detalles de conexión"
            type="button"
          >
            <span className="pulse-dot" />
            {connectionStatus === "connected"
              ? "Conectado"
              : connectionStatus === "loading"
                ? "Conectando..."
                : "Desconectado"}
          </button>
          <button
            className="icon-button"
            onClick={() => {
              void refreshData();
              showToast("Datos actualizados", "info");
            }}
            title="Actualizar datos"
            type="button"
          >
            ↻
          </button>
        </div>
      </header>

      {isSettingsOpen ? (
        <div className="modal-backdrop" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Configuración de Conexión</h3>
              <button className="close-button" type="button" onClick={() => setIsSettingsOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="settings-group">
                <label>URL del Backend API</label>
                <input readOnly value={API_URL} className="readonly-input" />
                <p className="settings-help">Dirección a la que el frontend realiza las peticiones.</p>
              </div>
              <div className="settings-group">
                <label>Base de Datos Principal</label>
                <div className="db-status-info">
                  <span className="status-label">SQLite Local:</span>
                  <span
                    className="status-value"
                    style={{ color: connectionStatus === "connected" ? "#10b981" : "#ef4444" }}
                  >
                    {connectionStatus === "connected" ? "Activo (gestor_negocio.db)" : "Inactivo / Desconectado"}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="primary-button" type="button" onClick={() => setIsSettingsOpen(false)}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ReceiptModal
        receipt={printReceiptData}
        business={businessSettings}
        onClose={() => setPrintReceiptData(null)}
      />

      {activeRoute === "dashboard" ? (
        <DashboardView
          dashboard={dashboard}
          sales={sales}
          profitReport={profitReport}
          reportPeriod={reportPeriod}
          onPeriodChange={setReportPeriod}
        />
      ) : null}
      {activeRoute === "ventas" ? (
        <SalesView
          clients={clients}
          onCreated={(registeredSale, cashReceived, changeAmount) => {
            showToast("Venta registrada con éxito", "success");
            void refreshData();
            if (registeredSale) {
              setPrintReceiptData({
                type: "sale",
                data: registeredSale,
                cashReceived,
                changeAmount,
              });
            }
          }}
          onReprintSale={(sale) => setPrintReceiptData({ type: "sale", data: sale })}
          onCancelled={() => void refreshData()}
          products={products}
          sales={sales}
          cajaStatus={cajaStatus}
        />
      ) : null}
      {activeRoute === "inventario" ? (
        <InventoryView
          categories={categories}
          onCreated={() => void refreshData()}
          products={products}
          sales={sales}
          stockMovements={stockMovements}
        />
      ) : null}
      {activeRoute === "caja" ? (
        <CajaView
          cajaStatus={cajaStatus}
          cajaHistory={cajaHistory}
          onRefreshCaja={refreshData}
          onPrintArqueo={(record) => {
            setPrintReceiptData({ type: "arqueo", data: record });
          }}
        />
      ) : null}
      {activeRoute === "clientes" ? (
        <ClientsView
          clients={clients}
          onCreated={() => void refreshData()}
          onPaymentRegistered={(receiptData) => {
            void refreshData();
            setPrintReceiptData({ type: "cobranza", data: receiptData });
          }}
          cajaStatus={cajaStatus}
        />
      ) : null}
      {activeRoute === "proveedores" ? (
        <SuppliersView
          onCreated={() => void refreshData()}
          products={products}
          suppliers={suppliers}
          purchases={purchases}
          cajaStatus={cajaStatus}
        />
      ) : null}
      {activeRoute === "categorias" ? (
        <CategoriesView categories={categories} onCreated={() => void refreshData()} />
      ) : null}
      {activeRoute === "ajustes" ? (
        <AjustesView
          theme={theme}
          setTheme={setTheme}
          systemThemeSync={systemThemeSync}
          setSystemThemeSync={setSystemThemeSync}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          daltonism={daltonism}
          setDaltonism={setDaltonism}
          highContrast={highContrast}
          setHighContrast={setHighContrast}
          textScale={textScale}
          setTextScale={setTextScale}
          businessSettings={businessSettings}
          onSaveBusinessSettings={handleSaveBusinessSettings}
          onDatabaseRestored={() => void refreshData()}
        />
      ) : null}
    </ShellLayout>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
