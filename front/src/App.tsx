import { FormEvent, useEffect, useMemo, useState, useRef } from "react";

import { AppProviders } from "./app/AppProviders";
import { appRoutes } from "./app/router";
import { ShellLayout } from "./layouts/ShellLayout";
import { API_URL, apiGet, apiPost, apiPatch } from "./shared/api/client";

type Category = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  categories: Category[];
};

type Client = {
  id: number;
  dni: string | null;
  name: string;
  phone: string | null;
  active: boolean;
};

type Supplier = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  products: Product[];
};

type SaleItem = {
  id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product: Product;
};

type SalePayment = {
  id: number;
  amount: number;
  paid_at: string;
  is_excess: boolean;
};

type Sale = {
  id: number;
  sold_at: string;
  total_amount: number;
  status: number;
  client: Client | null;
  items: SaleItem[];
  payments: SalePayment[];
  summary: {
    total_amount: number;
    total_paid: number;
    balance: number;
    status: number;
  };
};

type Loadable<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

type StockAudit = {
  id: number;
  date: string;
  productId: number;
  productName: string;
  type: string;
  quantity: number;
  notes: string;
};

type CajaSession = {
  isOpen: boolean;
  openedAt: string | null;
  openingCash: number;
};

type CajaHistoryRecord = {
  id: number;
  openedAt: string;
  closedAt: string;
  openingCash: number;
  cashSales: number;
  debitSales: number;
  creditSales: number;
  transferSales: number;
  expectedCash: number;
  countedCash: number;
  difference: number;
};

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

const saleStatuses = ["Pendiente", "Parcial", "Pagada"];
const paymentMethods = ["Efectivo", "Debito", "Credito", "Transferencia"];

const initialLoadable = <T,>(data: T): Loadable<T> => ({
  data,
  error: null,
  loading: true,
});

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function getInitialRoute() {
  const hash = window.location.hash.replace("#", "");
  return appRoutes.some((route) => route.key === hash) ? hash : "dashboard";
}

export default function App() {
  const [activeRoute, setActiveRoute] = useState(getInitialRoute);
  const [products, setProducts] = useState(initialLoadable<Product[]>([]));
  const [clients, setClients] = useState(initialLoadable<Client[]>([]));
  const [suppliers, setSuppliers] = useState(initialLoadable<Supplier[]>([]));
  const [categories, setCategories] = useState(initialLoadable<Category[]>([]));
  const [sales, setSales] = useState(initialLoadable<Sale[]>([]));
  const [notice, setNotice] = useState<string | null>(null);

  // Theme states
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem("theme") as 'light' | 'dark') ?? 'light';
  });
  const [systemThemeSync, setSystemThemeSync] = useState<boolean>(() => {
    return localStorage.getItem("gestock_system_theme") === "true";
  });

  // Settings / Accessibility states
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

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // POS / Shopping Cart state
  type CartItem = {
    product: Product;
    quantity: number;
    discount: number; // percentage
  };
  const [cart, setCart] = useState<CartItem[]>([]);

  // Product extra details (SKU and Barcode) locally managed
  const [extraDetails, setExtraDetails] = useState<Record<number, { sku: string; barcode: string }>>(() => {
    const raw = localStorage.getItem("gestock_product_details");
    return raw ? JSON.parse(raw) : {};
  });

  // Stock audit logs manually entered
  const [manualAudits, setManualAudits] = useState<StockAudit[]>(() => {
    const raw = localStorage.getItem("gestock_stock_audits");
    return raw ? JSON.parse(raw) : [];
  });

  // Caja / Daily cash reconciliation
  const [cajaSession, setCajaSession] = useState<CajaSession>(() => {
    const raw = localStorage.getItem("gestock_caja_session");
    return raw ? JSON.parse(raw) : { isOpen: false, openedAt: null, openingCash: 0 };
  });
  const [cajaHistory, setCajaHistory] = useState<CajaHistoryRecord[]>(() => {
    const raw = localStorage.getItem("gestock_caja_history");
    return raw ? JSON.parse(raw) : [];
  });

  // Receipt printable data
  const [printReceiptData, setPrintReceiptData] = useState<{ type: 'sale' | 'arqueo'; data: any } | null>(null);

  // Local payment methods tracker to bypass missing fields on API
  const [localPaymentMethods, setLocalPaymentMethods] = useState<Record<number, number>>(() => {
    const raw = localStorage.getItem("gestock_sale_payment_methods");
    return raw ? JSON.parse(raw) : {};
  });

  // Barcode scanner listener helper
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState(0);

  // Apply visual settings changes
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

  // Global barcode scanner listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const diff = now - lastKeyTime;
      setLastKeyTime(now);

      if (e.key === "Enter") {
        if (barcodeBuffer.length > 2 && diff < 55) {
          e.preventDefault();
          const code = barcodeBuffer;
          setBarcodeBuffer("");

          // Search catalog
          const found = products.data.find((p) => {
            const extra = extraDetails[p.id] || {};
            return extra.barcode === code || extra.sku === code || p.name.toLowerCase() === code.toLowerCase();
          });

          if (found) {
            setCart((current) => {
              const idx = current.findIndex((item) => item.product.id === found.id);
              if (idx > -1) {
                const item = current[idx];
                if (item.quantity + 1 <= found.stock) {
                  const updated = [...current];
                  updated[idx] = { ...item, quantity: item.quantity + 1 };
                  showNotice(`Añadido: ${found.name} (Cantidad: ${item.quantity + 1})`);
                  return updated;
                } else {
                  showNotice("Stock insuficiente en inventario");
                  return current;
                }
              } else {
                if (found.stock > 0) {
                  showNotice(`Añadido: ${found.name}`);
                  return [...current, { product: found, quantity: 1, discount: 0 }];
                } else {
                  showNotice("Producto sin stock disponible");
                  return current;
                }
              }
            });
          } else {
            showNotice(`Código de barras no registrado: ${code}`);
          }
        } else {
          setBarcodeBuffer("");
        }
      } else if (e.key.length === 1) {
        if (diff > 90) {
          setBarcodeBuffer(e.key);
        } else {
          setBarcodeBuffer((prev) => prev + e.key);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [barcodeBuffer, lastKeyTime, products.data, extraDetails]);

  const refreshData = async () => {
    setProducts((current) => ({ ...current, loading: true, error: null }));
    setClients((current) => ({ ...current, loading: true, error: null }));
    setSuppliers((current) => ({ ...current, loading: true, error: null }));
    setCategories((current) => ({ ...current, loading: true, error: null }));
    setSales((current) => ({ ...current, loading: true, error: null }));

    const loaders = [
      apiGet<Product[]>("/products/").then(
        (data) => setProducts({ data, error: null, loading: false }),
        (error: Error) => setProducts({ data: [], error: error.message, loading: false }),
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
    ];

    await Promise.all(loaders);
  };

  useEffect(() => {
    void refreshData();
  }, []);

  useEffect(() => {
    const syncRoute = () => setActiveRoute(getInitialRoute());
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const navigate = (route: string) => {
    window.location.hash = route;
    setActiveRoute(route);
  };

  const dashboard = useMemo(() => {
    const totalStockValue = products.data.reduce((total, product) => total + product.price * product.stock, 0);
    const today = new Date().toDateString();
    const todaySales = sales.data.filter((sale) => new Date(sale.sold_at).toDateString() === today);
    const pendingBalance = sales.data.reduce((total, sale) => total + sale.summary.balance, 0);
    const lowStock = products.data.filter((product) => product.stock <= 5);

    return { lowStock, pendingBalance, todaySales, totalStockValue };
  }, [products.data, sales.data]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3000);
  };

  const connectionStatus = useMemo(() => {
    const hasError = products.error || clients.error || suppliers.error || categories.error || sales.error;
    const anyLoading = products.loading || clients.loading || suppliers.loading || categories.loading || sales.loading;
    
    if (hasError) return "error";
    if (anyLoading) return "loading";
    return "connected";
  }, [products, clients, suppliers, categories, sales]);

  return (
    <AppProviders>
      <ShellLayout activeRoute={activeRoute} onNavigate={navigate}>
        <header className="topbar">
          <div>
            <p className="eyebrow">Panel operativo</p>
            <h2>{appRoutes.find((route) => route.key === activeRoute)?.label ?? "Dashboard"}</h2>
          </div>
          <div className="topbar-actions">
            <div className="topbar-brand">
              <img src="/logo.jpeg" alt="GESTOCK" />
              <span>GESTOCK</span>
            </div>
            <button 
              className={`connection-status-pill ${connectionStatus}`} 
              onClick={() => setIsSettingsOpen(true)}
              title="Ver detalles de conexión"
              type="button"
            >
              <span className="pulse-dot" />
              {connectionStatus === "connected" ? "Conectado" : connectionStatus === "loading" ? "Conectando..." : "Desconectado"}
            </button>
            <button className="icon-button" onClick={() => void refreshData()} title="Actualizar datos" type="button">
              ↻
            </button>
          </div>
        </header>

        {notice ? <div className="notice">{notice}</div> : null}

        {isSettingsOpen ? (
          <div className="modal-backdrop" onClick={() => setIsSettingsOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Configuración de Conexión</h3>
                <button className="close-button" onClick={() => setIsSettingsOpen(false)}>&times;</button>
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
                    <span className="status-value" style={{ color: connectionStatus === "connected" ? "#10b981" : "#ef4444" }}>
                      {connectionStatus === "connected" ? "Activo (gestor_negocio.db)" : "Inactivo / Desconectado"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="primary-button" onClick={() => setIsSettingsOpen(false)}>Aceptar</button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Printable Ticket Receipt Backdrop Modal */}
        {printReceiptData ? (
          <div className="modal-backdrop print-only-modal" onClick={() => setPrintReceiptData(null)}>
            <div className="modal-content" style={{ width: "90mm", maxWidth: "100%" }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header no-print">
                <h3>Comprobante Termico</h3>
                <button className="close-button" onClick={() => setPrintReceiptData(null)}>&times;</button>
              </div>
              <div className="modal-body">
                {printReceiptData.type === "sale" ? (
                  <div className="ticket-print-container">
                    <div className="ticket-header">
                      <h4>GESTOCK</h4>
                      <p>Sistema de Gestión Local</p>
                      <p>Ticket Nro: #{printReceiptData.data.id}</p>
                      <p>Fecha: {formatDate(printReceiptData.data.sold_at)}</p>
                      <p>Cliente: {printReceiptData.data.client?.name ?? "Consumidor Final"}</p>
                      {printReceiptData.data.client?.dni && <p>DNI: {printReceiptData.data.client.dni}</p>}
                    </div>
                    <div className="ticket-divider" />
                    <table className="ticket-table">
                      <thead>
                        <tr>
                          <th>Cant x Desc</th>
                          <th style={{ textAlign: "right" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printReceiptData.data.items.map((item: any) => (
                          <tr key={item.id}>
                            <td>
                              {item.quantity} x {item.product.name}
                              {item.subtotal < (item.unit_price * item.quantity) && (
                                <div style={{ fontSize: "0.75rem", fontStyle: "italic" }}>
                                  Desc. aplicado (orig. {formatMoney(item.unit_price * item.quantity)})
                                </div>
                              )}
                            </td>
                            <td style={{ textAlign: "right" }}>{formatMoney(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="ticket-divider" />
                    <div className="ticket-totals">
                      <div>Total: <strong>{formatMoney(printReceiptData.data.total_amount)}</strong></div>
                      <div>Método: {paymentMethods[localPaymentMethods[printReceiptData.data.id] ?? 0]}</div>
                    </div>
                    <div className="ticket-footer">
                      <p>¡Gracias por su compra en GESTOCK!</p>
                      <p>Conserve este ticket</p>
                    </div>
                  </div>
                ) : (
                  <div className="ticket-print-container">
                    <div className="ticket-header">
                      <h4>GESTOCK</h4>
                      <p>Arqueo Diario de Caja</p>
                      <p>Cierre Nro: #{printReceiptData.data.id}</p>
                      <p>Apertura: {formatDate(printReceiptData.data.openedAt)}</p>
                      <p>Cierre: {formatDate(printReceiptData.data.closedAt)}</p>
                    </div>
                    <div className="ticket-divider" />
                    <table className="ticket-table">
                      <tbody>
                        <tr>
                          <td>Fondo Apertura:</td>
                          <td style={{ textAlign: "right" }}>{formatMoney(printReceiptData.data.openingCash)}</td>
                        </tr>
                        <tr>
                          <td>Ventas en Efectivo:</td>
                          <td style={{ textAlign: "right" }}>{formatMoney(printReceiptData.data.cashSales)}</td>
                        </tr>
                        <tr>
                          <td>Ventas Débito:</td>
                          <td style={{ textAlign: "right" }}>{formatMoney(printReceiptData.data.debitSales)}</td>
                        </tr>
                        <tr>
                          <td>Ventas Crédito:</td>
                          <td style={{ textAlign: "right" }}>{formatMoney(printReceiptData.data.creditSales)}</td>
                        </tr>
                        <tr>
                          <td>Ventas Transferencia:</td>
                          <td style={{ textAlign: "right" }}>{formatMoney(printReceiptData.data.transferSales)}</td>
                        </tr>
                        <tr style={{ fontWeight: "bold" }}>
                          <td>Efectivo Esperado:</td>
                          <td style={{ textAlign: "right" }}>{formatMoney(printReceiptData.data.expectedCash)}</td>
                        </tr>
                        <tr style={{ fontWeight: "bold" }}>
                          <td>Efectivo Contado:</td>
                          <td style={{ textAlign: "right" }}>{formatMoney(printReceiptData.data.countedCash)}</td>
                        </tr>
                        <tr style={{ fontWeight: "bold", borderTop: "1px dashed #000" }}>
                          <td>Diferencia:</td>
                          <td style={{ textAlign: "right", color: printReceiptData.data.difference === 0 ? "black" : printReceiptData.data.difference > 0 ? "blue" : "red" }}>
                            {formatMoney(printReceiptData.data.difference)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="ticket-divider" />
                    <div className="ticket-footer">
                      <p>Informe de arqueo local diario</p>
                      <p>GESTOCK - Caja Controlada</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer no-print">
                <button className="primary-button" onClick={() => window.print()}>Imprimir Comprobante</button>
                <button className="secondary-button" onClick={() => setPrintReceiptData(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        ) : null}

        {activeRoute === "dashboard" ? (
          <DashboardView dashboard={dashboard} sales={sales} />
        ) : null}
        {activeRoute === "ventas" ? (
          <SalesView
            clients={clients}
            onCreated={(registeredSale) => {
              showNotice("Venta registrada con éxito");
              void refreshData();
              if (registeredSale) {
                setPrintReceiptData({ type: "sale", data: registeredSale });
              }
            }}
            products={products}
            sales={sales}
            extraDetails={extraDetails}
            cajaSession={cajaSession}
            localPaymentMethods={localPaymentMethods}
            setLocalPaymentMethods={setLocalPaymentMethods}
          />
        ) : null}
        {activeRoute === "inventario" ? (
          <InventoryView
            categories={categories}
            onCreated={() => {
              showNotice("Producto creado con éxito");
              void refreshData();
            }}
            products={products}
            extraDetails={extraDetails}
            setExtraDetails={(details) => {
              setExtraDetails(details);
              localStorage.setItem("gestock_product_details", JSON.stringify(details));
            }}
            manualAudits={manualAudits}
            setManualAudits={(audits) => {
              setManualAudits(audits);
              localStorage.setItem("gestock_stock_audits", JSON.stringify(audits));
            }}
            sales={sales}
          />
        ) : null}
        {activeRoute === "caja" ? (
          <CajaView
            sales={sales}
            cajaSession={cajaSession}
            setCajaSession={(session) => {
              setCajaSession(session);
              localStorage.setItem("gestock_caja_session", JSON.stringify(session));
            }}
            cajaHistory={cajaHistory}
            setCajaHistory={(history) => {
              setCajaHistory(history);
              localStorage.setItem("gestock_caja_history", JSON.stringify(history));
            }}
            onPrintArqueo={(record) => {
              setPrintReceiptData({ type: "arqueo", data: record });
            }}
            localPaymentMethods={localPaymentMethods}
          />
        ) : null}
        {activeRoute === "clientes" ? (
          <ClientsView
            clients={clients}
            onCreated={() => {
              showNotice("Cliente registrado con éxito");
              void refreshData();
            }}
          />
        ) : null}
        {activeRoute === "proveedores" ? (
          <SuppliersView
            onCreated={() => {
              showNotice("Proveedor registrado con éxito");
              void refreshData();
            }}
            products={products}
            suppliers={suppliers}
          />
        ) : null}
        {activeRoute === "categorias" ? (
          <CategoriesView
            categories={categories}
            onCreated={() => {
              showNotice("Categoría registrada con éxito");
              void refreshData();
            }}
          />
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
          />
        ) : null}
      </ShellLayout>
    </AppProviders>
  );
}

function DashboardView({
  dashboard,
  sales,
}: {
  dashboard: {
    lowStock: Product[];
    pendingBalance: number;
    todaySales: Sale[];
    totalStockValue: number;
  };
  sales: Loadable<Sale[]>;
}) {
  const totalToday = dashboard.todaySales.reduce((total, sale) => total + sale.total_amount, 0);

  return (
    <div className="stack">
      <section className="metric-grid">
        <MetricCard 
          label="Ventas de hoy" 
          value={formatMoney(totalToday)} 
          meta={`${dashboard.todaySales.length} operaciones`} 
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          }
        />
        <MetricCard 
          label="Valor inventario" 
          value={formatMoney(dashboard.totalStockValue)} 
          meta="Stock actual valorizado" 
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          }
        />
        <MetricCard 
          label="Saldo pendiente" 
          value={formatMoney(dashboard.pendingBalance)} 
          meta="Cuentas por cobrar" 
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12" y2="18"></line>
              <path d="M17 12h-5v2h5v-2z"></path>
            </svg>
          }
        />
        <MetricCard 
          label="Stock bajo" 
          value={dashboard.lowStock.length.toString()} 
          meta="Productos con 5 o menos" 
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          }
        />
      </section>

      <section className="panel-grid">
        <Panel title="Últimas ventas" state={sales}>
          <DataTable
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
            <h3>Alertas de stock</h3>
          </div>
          {dashboard.lowStock.length === 0 ? (
            <EmptyState message="No hay productos con stock bajo." />
          ) : (
            <div className="compact-list">
              {dashboard.lowStock.slice(0, 8).map((product) => (
                <div className="compact-row" key={product.id}>
                  <span>{product.name}</span>
                  <strong>{product.stock} u.</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

function SalesView({
  clients,
  onCreated,
  products,
  sales,
  extraDetails,
  cajaSession,
  localPaymentMethods,
  setLocalPaymentMethods,
}: {
  clients: Loadable<Client[]>;
  onCreated: (registeredSale: Sale) => void;
  products: Loadable<Product[]>;
  sales: Loadable<Sale[]>;
  extraDetails: Record<number, { sku: string; barcode: string }>;
  cajaSession: CajaSession;
  localPaymentMethods: Record<number, number>;
  setLocalPaymentMethods: React.Dispatch<React.SetStateAction<Record<number, number>>>;
}) {
  const [activeTab, setActiveTab] = useState<"pos" | "history">("pos");
  const [searchQuery, setSearchQuery] = useState("");
  const [clientId, setClientId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("0");
  const [status, setStatus] = useState("2");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cart item management
  type CartItem = {
    product: Product;
    quantity: number;
    discount: number; // percentage
  };
  const [cart, setCart] = useState<CartItem[]>([]);

  // Filter products by query (name, sku, barcode)
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products.data.filter((p) => {
      const extra = extraDetails[p.id] || {};
      return (
        p.name.toLowerCase().includes(q) ||
        (extra.sku || "").toLowerCase().includes(q) ||
        (extra.barcode || "").toLowerCase().includes(q)
      );
    });
  }, [searchQuery, products.data, extraDetails]);

  const addToCart = (product: Product) => {
    if (!product.active) return;
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 <= product.stock) {
          return current.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          alert("Stock disponible superado");
          return current;
        }
      } else {
        if (product.stock > 0) {
          return [...current, { product, quantity: 1, discount: 0 }];
        } else {
          alert("El producto no posee stock");
          return current;
        }
      }
    });
    setSearchQuery("");
  };

  const updateQuantity = (productId: number, qty: number) => {
    const prod = products.data.find((p) => p.id === productId);
    if (!prod) return;

    if (qty <= 0) {
      setCart((current) => current.filter((item) => item.product.id !== productId));
      return;
    }

    if (qty > prod.stock) {
      alert(`Solo hay ${prod.stock} unidades en stock.`);
      return;
    }

    setCart((current) =>
      current.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  const updateDiscount = (productId: number, disc: number) => {
    const valid = Math.max(0, Math.min(100, disc));
    setCart((current) =>
      current.map((item) => (item.product.id === productId ? { ...item, discount: valid } : item))
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((current) => current.filter((item) => item.product.id !== productId));
  };

  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discount = cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity * (item.discount / 100),
      0
    );
    const total = subtotal - discount;
    return { subtotal, discount, total };
  }, [cart]);

  const submitSale = async (e: FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError("El carrito debe contener al menos un producto.");
      return;
    }
    if (!cajaSession.isOpen) {
      setError("Debes abrir la Caja antes de realizar ventas.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const itemsPayload = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        // Send discounted subtotal
        discount_rate: item.discount,
      }));

      // Post to API
      const sale = await apiPost<Sale>("/sales/", {
        client_id: clientId ? Number(clientId) : null,
        items: itemsPayload,
        payment: Number(status) === 0 ? null : { 
          amount: cartSummary.total, 
          payment_method: Number(paymentMethod) 
        },
        status: Number(status),
      });

      // Save the payment method mapping locally!
      if (Number(status) !== 0) {
        const methods = { ...localPaymentMethods, [sale.id]: Number(paymentMethod) };
        setLocalPaymentMethods(methods);
        localStorage.setItem("gestock_sale_payment_methods", JSON.stringify(methods));
      }

      setCart([]);
      setClientId("");
      onCreated(sale);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la venta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack">
      <div className="tabs-header">
        <button 
          className={`tab-button ${activeTab === "pos" ? "active" : ""}`}
          onClick={() => setActiveTab("pos")}
        >
          Punto de Venta (POS)
        </button>
        <button 
          className={`tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Historial de Ventas
        </button>
      </div>

      {activeTab === "pos" ? (
        <div className="pos-container">
          <div className="stack">
            <div className="panel" style={{ padding: "20px" }}>
              <div className="field">
                <label style={{ fontWeight: 700, marginBottom: "8px", display: "block" }}>
                  Buscador Inteligente de Productos (Nombre, SKU, Código de Barras o Pistola)
                </label>
                <div className="pos-search-wrapper">
                  <input
                    placeholder="Escribe el nombre del producto, SKU o escanea un código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {suggestions.length > 0 && (
                    <div className="pos-search-suggestions">
                      {suggestions.map((p) => {
                        const disabled = !p.active || p.stock === 0;
                        return (
                          <div 
                            className={`pos-suggestion-item ${disabled ? "disabled" : ""}`}
                            key={p.id}
                            onClick={() => !disabled && addToCart(p)}
                          >
                            <div>
                              <div className="pos-suggestion-name">{p.name}</div>
                              <div className="pos-suggestion-meta">
                                SKU: {extraDetails[p.id]?.sku || "N/A"} | Stock: {p.stock} u.
                              </div>
                            </div>
                            <div className="pos-suggestion-price">{formatMoney(p.price)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="panel" style={{ padding: "20px" }}>
              <h3 style={{ marginBottom: "16px" }}>Carrito de Compra</h3>
              {cart.length === 0 ? (
                <EmptyState message="El carrito está vacío. Escanea o busca productos para agregarlos." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Cant.</th>
                        <th>Desc. %</th>
                        <th>Subtotal</th>
                        <th style={{ width: "60px" }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.product.id}>
                          <td style={{ fontWeight: 600 }}>{item.product.name}</td>
                          <td>{formatMoney(item.product.price)}</td>
                          <td>
                            <div className="quantity-controls">
                              <button 
                                className="quantity-btn"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                type="button"
                              >
                                -
                              </button>
                              <input 
                                className="quantity-input"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.product.id, Number(e.target.value))}
                                type="number"
                              />
                              <button 
                                className="quantity-btn"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                type="button"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td>
                            <input 
                              className="cart-discount-input"
                              value={item.discount}
                              min="0"
                              max="100"
                              onChange={(e) => updateDiscount(item.product.id, Number(e.target.value))}
                              type="number"
                            />
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            {formatMoney(item.product.price * item.quantity * (1 - item.discount / 100))}
                          </td>
                          <td>
                            <button 
                              onClick={() => removeFromCart(item.product.id)}
                              style={{ color: "#ef4444", fontWeight: 700 }}
                              type="button"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <form className="form-panel" onSubmit={(e) => void submitSale(e)}>
            <h3>Resumen y Pago</h3>
            
            <Field label="Cliente">
              <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Consumidor Final</option>
                {clients.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="form-row">
              <Field label="Estado">
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="2">Pagada</option>
                  <option value="1">Cobro Parcial</option>
                  <option value="0">Fiado / Pendiente</option>
                </select>
              </Field>
              <Field label="Metodo de pago">
                <select 
                  disabled={status === "0"} 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {paymentMethods.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="stack" style={{ gap: "8px", margin: "10px 0" }}>
              <div className="sale-total" style={{ background: "transparent", padding: "4px 0", border: 0 }}>
                <span>Subtotal</span>
                <span>{formatMoney(cartSummary.subtotal)}</span>
              </div>
              <div className="sale-total" style={{ background: "transparent", padding: "4px 0", border: 0, color: "#ea580c" }}>
                <span>Descuento aplicado</span>
                <span>-{formatMoney(cartSummary.discount)}</span>
              </div>
              <div className="sale-total">
                <span>Total Final</span>
                <strong>{formatMoney(cartSummary.total)}</strong>
              </div>
            </div>

            <SubmitButton label="Registrar e Imprimir Ticket" saving={saving} />
            {error ? <p className="form-error">{error}</p> : null}
            {!cajaSession.isOpen && (
              <p className="form-error" style={{ color: "#d97706" }}>
                ⚠️ La caja diaria está CERRADA. Abre la caja en el menú correspondiente para vender.
              </p>
            )}
          </form>
        </div>
      ) : (
        <section className="panel">
          <DataTable
            columns={["Fecha", "Cliente", "Items", "Total", "Pagado", "Estado"]}
            rows={sales.data.map((sale) => [
              formatDate(sale.sold_at),
              sale.client?.name ?? "Consumidor final",
              sale.items.map((item) => `${item.quantity} x ${item.product.name}`).join(", "),
              formatMoney(sale.total_amount),
              formatMoney(sale.summary.total_paid),
              saleStatuses[sale.status] ?? "Sin estado",
            ])}
          />
        </section>
      )}
    </div>
  );
}

function InventoryView({
  categories,
  onCreated,
  products,
  extraDetails,
  setExtraDetails,
  manualAudits,
  setManualAudits,
  sales,
}: {
  categories: Loadable<Category[]>;
  onCreated: () => void;
  products: Loadable<Product[]>;
  extraDetails: Record<number, { sku: string; barcode: string }>;
  setExtraDetails: (details: Record<number, { sku: string; barcode: string }>) => void;
  manualAudits: StockAudit[];
  setManualAudits: (audits: StockAudit[]) => void;
  sales: Loadable<Sale[]>;
}) {
  const [activeTab, setActiveTab] = useState<"catalog" | "adjust" | "history" | "new">("catalog");
  
  // Product Form states
  const [form, setForm] = useState({ name: "", price: "", stock: "", sku: "", barcode: "" });
  const [selectedParentId, setSelectedParentId] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual stock adjustment states
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustType, setAdjustType] = useState("Entrada"); // "Entrada" o "Ajuste"
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Parse Parent and Subcategories
  const parentCategories = useMemo(() => {
    return categories.data.filter((c) => !c.name.includes(" > "));
  }, [categories.data]);

  const subCategories = useMemo(() => {
    if (!selectedParentId) return [];
    const parent = parentCategories.find((c) => c.id === Number(selectedParentId));
    if (!parent) return [];
    return categories.data.filter((c) => c.name.startsWith(parent.name + " > "));
  }, [selectedParentId, categories.data, parentCategories]);

  // Combined stock audit log
  const auditHistory = useMemo(() => {
    // 1. Outputs from sales
    const salesAudits = sales.data.flatMap((sale) =>
      sale.items.map((item) => ({
        id: `sale-${sale.id}-${item.id}`,
        date: sale.sold_at,
        productName: item.product.name,
        type: "Salida (Venta)",
        quantity: -item.quantity,
        notes: `Venta registrada #${sale.id} (${sale.client?.name ?? "Consumidor Final"})`,
      }))
    );

    // 2. Manual stock adjustments
    const manualLogs = manualAudits.map((a) => ({
      id: `manual-${a.id}`,
      date: a.date,
      productName: a.productName,
      type: a.type,
      quantity: a.quantity,
      notes: a.notes,
    }));

    return [...salesAudits, ...manualLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [sales.data, manualAudits]);

  const submitProduct = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const chosenCatId = selectedSubId ? Number(selectedSubId) : selectedParentId ? Number(selectedParentId) : null;
      
      const newProduct = await apiPost<Product>("/products/", {
        active: true,
        category_ids: chosenCatId ? [chosenCatId] : [],
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock),
      });

      // Save local SKU & Barcode
      const updatedDetails = {
        ...extraDetails,
        [newProduct.id]: { sku: form.sku, barcode: form.barcode },
      };
      setExtraDetails(updatedDetails);

      // Save initial audit record if stock > 0
      if (Number(form.stock) > 0) {
        const auditRecord: StockAudit = {
          id: Date.now(),
          date: new Date().toISOString(),
          productId: newProduct.id,
          productName: newProduct.name,
          type: "Entrada (Inicial)",
          quantity: Number(form.stock),
          notes: "Carga inicial de producto al crear",
        };
        setManualAudits([...manualAudits, auditRecord]);
      }

      setForm({ name: "", price: "", stock: "", sku: "", barcode: "" });
      setSelectedParentId("");
      setSelectedSubId("");
      setActiveTab("catalog");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el producto");
    } finally {
      setSaving(false);
    }
  };

  const submitAdjustment = async (e: FormEvent) => {
    e.preventDefault();
    if (!adjustProductId) {
      setAdjustError("Selecciona un producto.");
      return;
    }
    const qty = Number(adjustQty);
    if (isNaN(qty)) {
      setAdjustError("La cantidad debe ser numérica.");
      return;
    }

    setAdjusting(true);
    setAdjustError(null);

    try {
      const targetProd = products.data.find((p) => p.id === Number(adjustProductId));
      if (!targetProd) throw new Error("Producto no encontrado");

      let nextStock = targetProd.stock;
      if (adjustType === "Entrada") {
        nextStock += qty;
      } else {
        // Absolute Adjust
        nextStock = qty;
      }

      if (nextStock < 0) {
        throw new Error("El stock final no puede ser menor a 0.");
      }

      // API Patch
      await apiPatch(`/products/${targetProd.id}/`, { stock: nextStock });

      // Local Audit log record
      const change = adjustType === "Entrada" ? qty : (qty - targetProd.stock);
      const auditRecord: StockAudit = {
        id: Date.now(),
        date: new Date().toISOString(),
        productId: targetProd.id,
        productName: targetProd.name,
        type: adjustType === "Entrada" ? "Entrada (Manual)" : "Corrección de Stock",
        quantity: change,
        notes: adjustNotes || "Ajuste manual de inventario",
      };

      setManualAudits([...manualAudits, auditRecord]);
      setAdjustProductId("");
      setAdjustQty("");
      setAdjustNotes("");
      setActiveTab("catalog");
      showAdjustmentNotice();
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : "Error al guardar el ajuste");
    } finally {
      setAdjusting(false);
    }
  };

  const showAdjustmentNotice = () => {
    alert("Inventario actualizado correctamente.");
    onCreated();
  };

  return (
    <div className="stack">
      <div className="tabs-header">
        <button 
          className={`tab-button ${activeTab === "catalog" ? "active" : ""}`}
          onClick={() => setActiveTab("catalog")}
        >
          Catálogo de Productos
        </button>
        <button 
          className={`tab-button ${activeTab === "new" ? "active" : ""}`}
          onClick={() => setActiveTab("new")}
        >
          Nuevo Producto
        </button>
        <button 
          className={`tab-button ${activeTab === "adjust" ? "active" : ""}`}
          onClick={() => setActiveTab("adjust")}
        >
          Ajustar Stock
        </button>
        <button 
          className={`tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Auditoría de Stock (Kardex)
        </button>
      </div>

      {activeTab === "catalog" && (
        <Panel title="Inventario de Productos" state={products}>
          <DataTable
            columns={["Producto", "Categoría / Sub", "SKU / Código", "Precio", "Stock", "Estado"]}
            rows={products.data.map((p) => {
              const details = extraDetails[p.id] || {};
              const catNames = p.categories.map((c) => c.name).join(", ");
              const displayCategory = catNames || "Sin categoría";
              return [
                p.name,
                displayCategory,
                `${details.sku || "-"} / ${details.barcode || "-"}`,
                formatMoney(p.price),
                `${p.stock} u.`,
                p.active ? "Activo" : "Inactivo",
              ];
            })}
          />
        </Panel>
      )}

      {activeTab === "new" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}>
          <form className="form-panel" onSubmit={(e) => void submitProduct(e)}>
            <h3>Agregar Nuevo Producto al Catálogo</h3>
            
            <Field label="Nombre del Producto">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>

            <div className="form-row">
              <Field label="Precio de Venta ($)">
                <input min="0.01" step="0.01" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </Field>
              <Field label="Stock Inicial">
                <input min="0" type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </Field>
            </div>

            <div className="form-row">
              <Field label="SKU / Identificador Código">
                <input placeholder="Ej. SKU-PROD123" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </Field>
              <Field label="Código de Barras (EAN / UPC)">
                <input placeholder="Ej. 7791234567890" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              </Field>
            </div>

            <div className="form-row">
              <Field label="Categoría Principal">
                <select value={selectedParentId} onChange={(e) => { setSelectedParentId(e.target.value); setSelectedSubId(""); }}>
                  <option value="">Ninguna</option>
                  {parentCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Subcategoría">
                <select 
                  disabled={!selectedParentId} 
                  value={selectedSubId} 
                  onChange={(e) => setSelectedSubId(e.target.value)}
                >
                  <option value="">Seleccionar subcategoría</option>
                  {subCategories.map((c) => {
                    const cleanSub = c.name.split(" > ")[1] || c.name;
                    return (
                      <option key={c.id} value={c.id}>
                        {cleanSub}
                      </option>
                    );
                  })}
                </select>
              </Field>
            </div>

            <SubmitButton label="Crear Producto en Sistema" saving={saving} />
            {error ? <p className="form-error">{error}</p> : null}
          </form>

          <div className="panel" style={{ padding: "20px" }}>
            <h4>Ayuda de Registro</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "10px", lineHeight: "1.4" }}>
              Ingresa el código SKU y el Código de barras para posibilitar el uso de lectores rápidos de barra de pistolas POS y búsquedas inteligentes por texto parcial.
            </p>
          </div>
        </div>
      )}

      {activeTab === "adjust" && (
        <form className="form-panel" onSubmit={(e) => void submitAdjustment(e)} style={{ maxWidth: "600px" }}>
          <h3>Ajuste de Stock Manual</h3>

          <Field label="Producto a Modificar">
            <select value={adjustProductId} onChange={(e) => setAdjustProductId(e.target.value)}>
              <option value="">Elegir producto...</option>
              {products.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock actual: {p.stock} u.)
                </option>
              ))}
            </select>
          </Field>

          <div className="form-row">
            <Field label="Tipo de Movimiento">
              <select value={adjustType} onChange={(e) => setAdjustType(e.target.value)}>
                <option value="Entrada">Entrada (Sumar al stock existente)</option>
                <option value="Ajuste">Ajuste Físico (Sobrescribir stock total)</option>
              </select>
            </Field>
            <Field label="Cantidad">
              <input min="0" required type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
            </Field>
          </div>

          <Field label="Notas / Concepto de Auditoría">
            <input 
              placeholder="Ej. Entrada por compra de proveedor o Corrección por rotura de stock" 
              value={adjustNotes} 
              onChange={(e) => setAdjustNotes(e.target.value)} 
            />
          </Field>

          <SubmitButton label="Guardar Ajuste Físico" saving={adjusting} />
          {adjustError ? <p className="form-error">{adjustError}</p> : null}
        </form>
      )}

      {activeTab === "history" && (
        <Panel title="Registro de Entradas, Salidas y Ajustes">
          <DataTable
            columns={["Fecha", "Producto", "Movimiento", "Cant.", "Concepto / Notas"]}
            rows={auditHistory.map((h) => [
              formatDate(h.date),
              h.productName,
              h.type,
              h.quantity > 0 ? `+${h.quantity} u.` : `${h.quantity} u.`,
              h.notes,
            ])}
          />
        </Panel>
      )}
    </div>
  );
}

function CajaView({
  sales,
  cajaSession,
  setCajaSession,
  cajaHistory,
  setCajaHistory,
  onPrintArqueo,
  localPaymentMethods,
}: {
  sales: Loadable<Sale[]>;
  cajaSession: CajaSession;
  setCajaSession: (session: CajaSession) => void;
  cajaHistory: CajaHistoryRecord[];
  setCajaHistory: (history: CajaHistoryRecord[]) => void;
  onPrintArqueo: (record: CajaHistoryRecord) => void;
  localPaymentMethods: Record<number, number>;
}) {
  const [activeTab, setActiveTab] = useState<"daily" | "history">("daily");
  const [openingCashInput, setOpeningCashInput] = useState("");
  const [countedCashInput, setCountedCashInput] = useState("");

  const salesBreakdown = useMemo(() => {
    if (!cajaSession.isOpen || !cajaSession.openedAt) {
      return { cash: 0, debit: 0, credit: 0, transfer: 0, total: 0 };
    }

    const sessionSales = sales.data.filter((s) => {
      return new Date(s.sold_at).getTime() >= new Date(cajaSession.openedAt!).getTime();
    });

    let cash = 0;
    let debit = 0;
    let credit = 0;
    let transfer = 0;

    sessionSales.forEach((s) => {
      if (s.status !== 0) {
        const method = localPaymentMethods[s.id] ?? 0;
        const amount = s.summary.total_paid;
        
        if (method === 0) cash += amount;
        else if (method === 1) debit += amount;
        else if (method === 2) credit += amount;
        else if (method === 3) transfer += amount;
      }
    });

    return { cash, debit, credit, transfer, total: cash + debit + credit + transfer };
  }, [sales.data, cajaSession, localPaymentMethods]);

  const expectedCash = cajaSession.openingCash + salesBreakdown.cash;
  const countedCash = Number(countedCashInput) || 0;
  const difference = countedCash - expectedCash;

  const openCaja = (e: FormEvent) => {
    e.preventDefault();
    const cash = Number(openingCashInput);
    if (isNaN(cash) || cash < 0) {
      alert("Ingrese un monto inicial válido.");
      return;
    }

    setCajaSession({
      isOpen: true,
      openedAt: new Date().toISOString(),
      openingCash: cash,
    });
    setOpeningCashInput("");
  };

  const closeCaja = () => {
    if (countedCashInput === "") {
      alert("Ingrese el monto de efectivo físicamente contado.");
      return;
    }

    const newRecord: CajaHistoryRecord = {
      id: Date.now(),
      openedAt: cajaSession.openedAt!,
      closedAt: new Date().toISOString(),
      openingCash: cajaSession.openingCash,
      cashSales: salesBreakdown.cash,
      debitSales: salesBreakdown.debit,
      creditSales: salesBreakdown.credit,
      transferSales: salesBreakdown.transfer,
      expectedCash: expectedCash,
      countedCash: countedCash,
      difference: difference,
    };

    setCajaHistory([newRecord, ...cajaHistory]);
    setCajaSession({ isOpen: false, openedAt: null, openingCash: 0 });
    setCountedCashInput("");
    onPrintArqueo(newRecord);
  };

  return (
    <div className="stack">
      <div className="tabs-header">
        <button 
          className={`tab-button ${activeTab === "daily" ? "active" : ""}`}
          onClick={() => setActiveTab("daily")}
        >
          Caja Chica y Arqueo Diario
        </button>
        <button 
          className={`tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Historial de Cierres
        </button>
      </div>

      {activeTab === "daily" ? (
        !cajaSession.isOpen ? (
          <form className="form-panel" onSubmit={openCaja} style={{ maxWidth: "440px" }}>
            <h3>Apertura de Caja Diaria</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Ingresa el monto de saldo en efectivo disponible en el cajón de dinero al iniciar el turno.
            </p>
            <Field label="Monto Inicial en Efectivo ($)">
              <input required type="number" min="0" placeholder="Ej. 5000" value={openingCashInput} onChange={(e) => setOpeningCashInput(e.target.value)} />
            </Field>
            <button className="primary-button" type="submit">Iniciar Jornada / Abrir Caja</button>
          </form>
        ) : (
          <div className="pos-container">
            <div className="stack">
              <div className="panel">
                <h3 style={{ marginBottom: "12px" }}>Estado de Caja Activa</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                  Iniciada el: <strong>{formatDate(cajaSession.openedAt!)}</strong>
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sale-total">
                    <span>Efectivo de Apertura</span>
                    <strong>{formatMoney(cajaSession.openingCash)}</strong>
                  </div>
                  <div className="sale-total" style={{ borderLeft: "4px solid var(--color-primary)" }}>
                    <span>Efectivo de Ventas</span>
                    <strong>{formatMoney(salesBreakdown.cash)}</strong>
                  </div>
                </div>
              </div>

              <div className="panel">
                <h3 style={{ marginBottom: "16px" }}>Desglose de Ventas del Turno</h3>
                <DataTable
                  columns={["Método de Pago", "Vendido"]}
                  rows={[
                    ["Efectivo (Fondo + Ventas)", formatMoney(expectedCash)],
                    ["Débito", formatMoney(salesBreakdown.debit)],
                    ["Crédito", formatMoney(salesBreakdown.credit)],
                    ["Transferencia", formatMoney(salesBreakdown.transfer)],
                    ["Total General de Turno", formatMoney(salesBreakdown.total)],
                  ]}
                />
              </div>
            </div>

            <div className="form-panel">
              <h3>Arqueo y Cierre</h3>
              <Field label="Efectivo Esperado en Caja">
                <input readOnly className="readonly-input" value={formatMoney(expectedCash)} />
              </Field>
              <Field label="Efectivo Contado (Físicamente)">
                <input 
                  required 
                  type="number" 
                  min="0" 
                  placeholder="Ingrese el conteo real..." 
                  value={countedCashInput} 
                  onChange={(e) => setCountedCashInput(e.target.value)}
                />
              </Field>

              <div className="sale-total" style={{ margin: "6px 0" }}>
                <span>Diferencia</span>
                <strong style={{ color: difference === 0 ? "var(--text-primary)" : difference > 0 ? "#10b981" : "#ef4444" }}>
                  {formatMoney(difference)}
                </strong>
              </div>

              {difference !== 0 && countedCashInput !== "" && (
                <div 
                  className="notice" 
                  style={{ 
                    background: difference > 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                    borderColor: difference > 0 ? "#10b981" : "#ef4444",
                    color: difference > 0 ? "#137333" : "#c5221f"
                  }}
                >
                  {difference > 0 ? `💰 Sobrante detectado de ${formatMoney(difference)}` : `⚠️ Faltante detectado de ${formatMoney(Math.abs(difference))}`}
                </div>
              )}

              <button className="primary-button" onClick={closeCaja} type="button">
                Registrar Cierre e Imprimir Arqueo
              </button>
            </div>
          </div>
        )
      ) : (
        <Panel title="Historial de Arqueos Registrados">
          <DataTable
            columns={["Fecha Cierre", "Apertura", "Vendido (Efec.)", "Esperado", "Contado", "Diferencia", "Acciones"]}
            rows={cajaHistory.map((h) => [
              formatDate(h.closedAt),
              formatMoney(h.openingCash),
              formatMoney(h.cashSales),
              formatMoney(h.expectedCash),
              formatMoney(h.countedCash),
              h.difference === 0 ? "Cuadrada" : h.difference > 0 ? `Sobrante (+${formatMoney(h.difference)})` : `Faltante (-${formatMoney(Math.abs(h.difference))})`,
              <button 
                onClick={() => onPrintArqueo(h)}
                style={{ color: "var(--color-primary)", fontWeight: 700 }}
                type="button"
                key={h.id}
              >
                Imprimir
              </button> as any
            ])}
          />
        </Panel>
      )}
    </div>
  );
}

function ClientsView({ clients, onCreated }: { clients: Loadable<Client[]>; onCreated: () => void }) {
  const [form, setForm] = useState({ dni: "", name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiPost<Client>("/clients/", { active: true, dni: form.dni || null, name: form.name, phone: form.phone || null });
      setForm({ dni: "", name: "", phone: "" });
      onCreated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear el cliente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="work-grid">
      <Panel title="Clientes" state={clients}>
        <DataTable
          columns={["Nombre", "DNI", "Telefono", "Estado"]}
          rows={clients.data.map((client) => [client.name, client.dni ?? "-", client.phone ?? "-", client.active ? "Activo" : "Inactivo"])}
        />
      </Panel>

      <form className="form-panel" onSubmit={(event) => void submit(event)}>
        <h3>Nuevo cliente</h3>
        <Field label="Nombre">
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label="DNI">
          <input value={form.dni} onChange={(event) => setForm({ ...form, dni: event.target.value })} />
        </Field>
        <Field label="Telefono">
          <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </Field>
        <SubmitButton label="Crear cliente" saving={saving} />
        {error ? <p className="form-error">{error}</p> : null}
      </form>
    </section>
  );
}

function SuppliersView({
  onCreated,
  products,
  suppliers,
}: {
  onCreated: () => void;
  products: Loadable<Product[]>;
  suppliers: Loadable<Supplier[]>;
}) {
  const [form, setForm] = useState({ address: "", email: "", name: "", phone: "", productId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiPost<Supplier>("/suppliers/", {
        address: form.address || null,
        email: form.email || null,
        name: form.name,
        phone: form.phone || null,
        product_ids: form.productId ? [Number(form.productId)] : [],
      });
      setForm({ address: "", email: "", name: "", phone: "", productId: "" });
      onCreated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear el proveedor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="work-grid">
      <Panel title="Proveedores" state={suppliers}>
        <DataTable
          columns={["Nombre", "Telefono", "Email", "Productos"]}
          rows={suppliers.data.map((supplier) => [
            supplier.name,
            supplier.phone ?? "-",
            supplier.email ?? "-",
            supplier.products.map((product) => product.name).join(", ") || "-",
          ])}
        />
      </Panel>

      <form className="form-panel" onSubmit={(event) => void submit(event)}>
        <h3>Nuevo proveedor</h3>
        <Field label="Nombre">
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label="Telefono">
          <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </Field>
        <Field label="Email">
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </Field>
        <Field label="Direccion">
          <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
        </Field>
        <Field label="Producto asociado">
          <select value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })}>
            <option value="">Sin producto</option>
            {products.data.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </Field>
        <SubmitButton label="Crear proveedor" saving={saving} />
        {error ? <p className="form-error">{error}</p> : null}
      </form>
    </section>
  );
}

function CategoriesView({ categories, onCreated }: { categories: Loadable<Category[]>; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parent categories (no " > " in name)
  const parentCategories = useMemo(() => {
    return categories.data.filter((c) => !c.name.includes(" > "));
  }, [categories.data]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let finalName = name;
      if (parentId) {
        const parent = parentCategories.find((c) => c.id === Number(parentId));
        if (parent) {
          finalName = `${parent.name} > ${name}`;
        }
      }
      await apiPost<Category>("/categories/", { name: finalName });
      setName("");
      setParentId("");
      onCreated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear la categoria");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="work-grid">
      <Panel title="Categorias" state={categories}>
        <DataTable 
          columns={["ID", "Nombre / Jerarquía"]} 
          rows={categories.data.map((category) => [
            category.id.toString(), 
            category.name
          ])} 
        />
      </Panel>

      <form className="form-panel" onSubmit={(event) => void submit(event)}>
        <h3>Nueva categoria</h3>
        <Field label="Nombre de Categoría">
          <input required value={name} onChange={(event) => setName(event.target.value)} />
        </Field>

        <Field label="Categoría Padre (Opcional)">
          <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Ninguna (Sería categoría principal)</option>
            {parentCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <SubmitButton label="Crear categoria" saving={saving} />
        {error ? <p className="form-error">{error}</p> : null}
      </form>
    </section>
  );
}

function AjustesView({
  theme,
  setTheme,
  systemThemeSync,
  setSystemThemeSync,
  accentColor,
  setAccentColor,
  daltonism,
  setSystemThemeSync: _skip1, // suppress React warning if passed accidentally
  setDaltonism,
  highContrast,
  setHighContrast,
  textScale,
  setTextScale,
}: {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  systemThemeSync: boolean;
  setSystemThemeSync: (s: boolean) => void;
  accentColor: string;
  setAccentColor: (a: string) => void;
  daltonism: string;
  setDaltonism: (d: string) => void;
  highContrast: boolean;
  setHighContrast: (h: boolean) => void;
  textScale: string;
  setTextScale: (s: string) => void;
  [key: string]: any;
}) {
  return (
    <div className="pos-container">
      <div className="stack">
        <div className="panel">
          <h3 style={{ marginBottom: "20px" }}>Visualización y Accesibilidad</h3>
          
          <div className="settings-group">
            <label style={{ fontWeight: 700, display: "block", marginBottom: "8px" }}>Tema Visual</label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button 
                className={`secondary-button ${theme === "light" && !systemThemeSync ? "active" : ""}`}
                style={{ borderColor: theme === "light" && !systemThemeSync ? "var(--color-primary)" : "var(--border-color)" }}
                onClick={() => { setSystemThemeSync(false); setTheme("light"); }}
                type="button"
              >
                Claro
              </button>
              <button 
                className={`secondary-button ${theme === "dark" && !systemThemeSync ? "active" : ""}`}
                style={{ borderColor: theme === "dark" && !systemThemeSync ? "var(--color-primary)" : "var(--border-color)" }}
                onClick={() => { setSystemThemeSync(false); setTheme("dark"); }}
                type="button"
              >
                Oscuro
              </button>
              <button 
                className={`secondary-button ${systemThemeSync ? "active" : ""}`}
                style={{ borderColor: systemThemeSync ? "var(--color-primary)" : "var(--border-color)" }}
                onClick={() => setSystemThemeSync(true)}
                type="button"
              >
                Sincronizar con Sistema
              </button>
            </div>
          </div>

          <div className="settings-group" style={{ marginTop: "24px" }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: "8px" }}>Color de Acento (Identidad)</label>
            <select value={accentColor} onChange={(e) => setAccentColor(e.target.value)}>
              <option value="gestock-blue">Azul GESTOCK (Original)</option>
              <option value="emerald-green">Verde Esmeralda</option>
              <option value="purple">Púrpura Vibrante</option>
              <option value="orange">Naranja Intenso</option>
            </select>
          </div>

          <div className="settings-group" style={{ marginTop: "24px" }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: "8px" }}>Filtro de Contraste para Daltonismo</label>
            <select value={daltonism} onChange={(e) => setDaltonism(e.target.value)}>
              <option value="none">Sin corrección (Por defecto)</option>
              <option value="deutan">Deuteranopía (Verde/Rojo suave)</option>
              <option value="protan">Protanopía (Rojo/Verde suave)</option>
              <option value="tritan">Tritanopía (Azul/Amarillo suave)</option>
            </select>
          </div>

          <div className="settings-group" style={{ marginTop: "24px", display: "flex", gap: "24px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700, cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={highContrast} 
                onChange={(e) => setHighContrast(e.target.checked)} 
                style={{ width: "20px", height: "20px", cursor: "pointer" }}
              />
              Modo Alto Contraste (Realzar Bordes y Legibilidad)
            </label>
          </div>

          <div className="settings-group" style={{ marginTop: "24px" }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: "8px" }}>Escala del Texto General</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                className="secondary-button"
                style={{ borderColor: textScale === "small" ? "var(--color-primary)" : "var(--border-color)" }}
                onClick={() => setTextScale("small")}
                type="button"
              >
                Pequeño
              </button>
              <button 
                className="secondary-button"
                style={{ borderColor: textScale === "normal" ? "var(--color-primary)" : "var(--border-color)" }}
                onClick={() => setTextScale("normal")}
                type="button"
              >
                Normal
              </button>
              <button 
                className="secondary-button"
                style={{ borderColor: textScale === "large" ? "var(--color-primary)" : "var(--border-color)" }}
                onClick={() => setTextScale("large")}
                type="button"
              >
                Grande
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: "20px" }}>
        <h4>Información de Accesibilidad</h4>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "10px", lineHeight: "1.4" }}>
          La configuración de GESTOCK cumple con las pautas de accesibilidad para herramientas operativas comerciales. El modo de alto contraste y los preajustes de daltonismo están orientados a mejorar la lectura en pantallas táctiles y entornos con luz variable.
        </p>
      </div>
    </div>
  );
}

function MetricCard({ label, meta, value, icon }: { label: string; meta: string; value: string; icon?: React.ReactNode }) {
  return (
    <article className="metric-card">
      <div className="metric-header">
        <span>{label}</span>
        {icon && <span className="metric-icon">{icon}</span>}
      </div>
      <strong>{value}</strong>
      <p>{meta}</p>
    </article>
  );
}

function Panel<T>({ children, state, title }: { children: React.ReactNode; state?: Loadable<T>; title: string }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{title}</h3>
        {state?.loading ? <span className="loading-pill">Cargando</span> : null}
      </div>
      {state?.error ? <EmptyState message={`No se pudo cargar: ${state.error}`} /> : children}
    </section>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: (string | React.ReactNode)[][] }) {
  if (rows.length === 0) {
    return <EmptyState message="Todavia no hay datos para mostrar." />;
  }

  const renderCell = (cell: string | React.ReactNode) => {
    if (typeof cell !== "string") {
      return cell;
    }
    const trimmed = cell.trim();
    if (trimmed === "Pagada" || trimmed === "Activo" || trimmed === "Cuadrada") {
      return <span className="badge badge-success">{trimmed}</span>;
    }
    if (trimmed === "Pendiente" || trimmed === "Parcial") {
      return <span className="badge badge-warning">{trimmed}</span>;
    }
    if (trimmed === "Inactivo" || trimmed.startsWith("Faltante")) {
      return <span className="badge badge-danger">{trimmed}</span>;
    }
    if (trimmed.startsWith("Sobrante")) {
      return <span className="badge badge-success" style={{ background: "var(--badge-success-bg)", color: "var(--badge-success-text)" }}>{trimmed}</span>;
    }
    if (trimmed === "Sin categoria" || trimmed === "-") {
      return <span className="badge badge-neutral">{trimmed}</span>;
    }
    return cell;
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{renderCell(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SubmitButton({ label, saving }: { label: string; saving: boolean }) {
  return (
    <button className="primary-button" disabled={saving} type="submit">
      {saving ? "Guardando..." : label}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="empty-state">{message}</p>;
}
