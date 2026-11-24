import { type FormEvent, type KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiPost } from "../../shared/api/client";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { DataTable, EmptyState, Field, Panel, SubmitButton } from "../../shared/components/UI";
import { useToast } from "../../shared/context/ToastContext";
import type { CajaStatus, Client, Loadable, Product, Sale } from "../../shared/types/models";
import { exportToCsv, formatDate, formatMoney, paymentMethods, saleStatuses } from "../../shared/utils/formatters";

type CartItem = {
  product: Product;
  quantity: number;
  discount: number;
};

type SalesViewProps = {
  clients: Loadable<Client[]>;
  onCreated: (registeredSale: Sale, cashReceived?: number, changeAmount?: number) => void;
  onReprintSale: (sale: Sale) => void;
  onCancelled: () => void;
  products: Loadable<Product[]>;
  sales: Loadable<Sale[]>;
  cajaStatus: Loadable<CajaStatus>;
};

export function SalesView({
  clients,
  onCreated,
  onReprintSale,
  onCancelled,
  products,
  sales,
  cajaStatus,
}: SalesViewProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"pos" | "history">("pos");
  const [searchQuery, setSearchQuery] = useState("");
  const [clientId, setClientId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("0");
  const [status, setStatus] = useState("2");
  const [cashReceivedInput, setCashReceivedInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingSale, setCancellingSale] = useState<Sale | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const checkoutClientRef = useRef<HTMLSelectElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery]);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const matches = products.data.filter((p) => {
      return (
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        p.name.toLowerCase().includes(q)
      );
    });

    return matches.sort((a, b) => {
      const aBarcodeExact = a.barcode && a.barcode.trim().toLowerCase() === q;
      const bBarcodeExact = b.barcode && b.barcode.trim().toLowerCase() === q;
      if (aBarcodeExact && !bBarcodeExact) return -1;
      if (!aBarcodeExact && bBarcodeExact) return 1;

      const aSkuExact = a.sku && a.sku.trim().toLowerCase() === q;
      const bSkuExact = b.sku && b.sku.trim().toLowerCase() === q;
      if (aSkuExact && !bSkuExact) return -1;
      if (!aSkuExact && bSkuExact) return 1;

      return 0;
    });
  }, [searchQuery, products.data]);

  const addToCart = (product: Product) => {
    if (!product.active) return;
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 <= product.stock) {
          return current.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          );
        }
        showToast(`Stock disponible superado para ${product.name} (máx ${product.stock} u.)`, "warning");
        return current;
      }
      if (product.stock > 0) {
        return [...current, { product, quantity: 1, discount: 0 }];
      }
      showToast(`El producto "${product.name}" no posee stock disponible.`, "warning");
      return current;
    });
    setSearchQuery("");
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 40);
  };

  const handleBarcodeOrSearchSubmit = (inputRaw: string) => {
    const raw = inputRaw.trim();
    if (!raw) return;

    const code = raw.replace(/[\x00-\x1F\x7F]/g, "").trim();
    if (!code) return;

    const lowerCode = code.toLowerCase();

    const exactBarcode = products.data.find(
      (p) => p.active && p.barcode && p.barcode.trim().toLowerCase() === lowerCode,
    );
    if (exactBarcode) {
      addToCart(exactBarcode);
      setSearchQuery("");
      return;
    }

    const exactSku = products.data.find(
      (p) => p.active && p.sku && p.sku.trim().toLowerCase() === lowerCode,
    );
    if (exactSku) {
      addToCart(exactSku);
      setSearchQuery("");
      return;
    }

    if (suggestions.length === 1 && suggestions[0].active) {
      addToCart(suggestions[0]);
      setSearchQuery("");
      return;
    }

    const suggestionExact = suggestions.find(
      (p) => p.active && p.barcode && p.barcode.trim().toLowerCase() === lowerCode,
    );
    if (suggestionExact) {
      addToCart(suggestionExact);
      setSearchQuery("");
      return;
    }

    if (/^\d{6,}$/.test(code)) {
      showToast(`Código de barras "${code}" no encontrado en el catálogo.`, "warning");
      setSearchQuery("");
      return;
    }

    if (suggestions.length > 0) {
      const firstAvailable = suggestions.find((p) => p.active && p.stock > 0) || suggestions[0];
      if (firstAvailable && firstAvailable.active) {
        addToCart(firstAvailable);
        setSearchQuery("");
      }
    }
  };

  const handleSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        const item = suggestions[highlightedIndex];
        if (item.active && item.stock > 0) {
          addToCart(item);
          setHighlightedIndex(-1);
          return;
        }
      }
      handleBarcodeOrSearchSubmit(searchQuery);
      setHighlightedIndex(-1);
    } else if (e.key === "Escape") {
      setSearchQuery("");
      setHighlightedIndex(-1);
    } else if (e.key === "F2") {
      e.preventDefault();
      checkoutClientRef.current?.focus();
    }
  };

  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discount = cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity * (item.discount / 100),
      0,
    );
    const total = subtotal - discount;
    return { subtotal, discount, total };
  }, [cart]);

  const cashReceivedNum = cashReceivedInput !== "" ? Number(cashReceivedInput) : 0;
  const changeAmount =
    paymentMethod === "0" && status !== "0" && cashReceivedInput !== ""
      ? Math.max(0, Math.round((cashReceivedNum - cartSummary.total) * 100) / 100)
      : 0;

  const submitSaleDirect = async () => {
    if (cart.length === 0) {
      setError("El carrito debe contener al menos un producto.");
      return;
    }
    if (!cajaStatus.data?.is_open) {
      setError("Debes abrir la Caja antes de realizar ventas.");
      return;
    }
    if (status === "0" && !clientId) {
      setError("Para ventas fiadas / en cuenta corriente debes seleccionar un cliente.");
      return;
    }
    if (status === "2" && paymentMethod === "0" && cashReceivedInput !== "" && cashReceivedNum < cartSummary.total) {
      setError("El efectivo recibido es menor al total de la venta.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const itemsPayload = cart.map((item) => ({
        discount_rate: item.discount,
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const paidAmount =
        status === "2" && paymentMethod === "0" && cashReceivedNum > 0
          ? cashReceivedNum
          : cartSummary.total;

      const sale = await apiPost<Sale>("/sales/", {
        client_id: clientId ? Number(clientId) : null,
        items: itemsPayload,
        payment:
          Number(status) === 0
            ? null
            : {
                amount: paidAmount,
                payment_method: Number(paymentMethod),
              },
        status: Number(status),
      });

      const recordedCash = paymentMethod === "0" && status !== "0" ? cashReceivedNum || cartSummary.total : undefined;
      const recordedChange = paymentMethod === "0" && status !== "0" ? changeAmount : undefined;

      setCart([]);
      setClientId("");
      setCashReceivedInput("");
      onCreated(sale, recordedCash, recordedChange);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al procesar la venta";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmCancelSale = async () => {
    if (!cancellingSale) return;
    setCancelling(true);
    try {
      await apiPost<Sale>(`/sales/${cancellingSale.id}/cancel`);
      setCancellingSale(null);
      showToast(`Venta #${cancellingSale.id} anulada y stock restaurado`, "info");
      onCancelled();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo anular la venta", "error");
      setCancellingSale(null);
    } finally {
      setCancelling(false);
    }
  };

  const handleExportSales = () => {
    exportToCsv(
      `ventas_gestock_${new Date().toISOString().slice(0, 10)}.csv`,
      ["ID", "Fecha", "Cliente", "Items", "Total", "Pagado", "Saldo", "Estado"],
      sales.data.map((s) => [
        s.id,
        formatDate(s.sold_at),
        s.client?.name ?? "Consumidor final",
        s.items.map((i) => `${i.quantity}x ${i.product.name}`).join(" | "),
        s.total_amount,
        s.summary.total_paid,
        s.summary.balance,
        saleStatuses[s.status] ?? "Sin estado",
      ]),
    );
    showToast("Historial de ventas exportado a CSV", "success");
  };

  useEffect(() => {
    let buffer = "";
    let lastTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab === "pos") {
        if (e.key === "F4") {
          e.preventDefault();
          searchInputRef.current?.focus();
          return;
        }
        if (e.key === "F2") {
          e.preventDefault();
          checkoutClientRef.current?.focus();
          return;
        }
        if (e.ctrlKey && e.key === "Enter") {
          e.preventDefault();
          if (cart.length > 0 && cajaStatus.data?.is_open) {
            void submitSaleDirect();
          }
          return;
        }
      }

      const target = e.target as HTMLElement | null;
      const isSearchInput = target === searchInputRef.current;
      const isOtherInput =
        !isSearchInput &&
        (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT");

      if (isOtherInput) return;

      const now = Date.now();
      if (now - lastTime > 400) {
        buffer = "";
      }
      lastTime = now;

      if (e.key === "Enter") {
        if (buffer.length >= 3) {
          const scannedCode = buffer.trim();
          buffer = "";
          handleBarcodeOrSearchSubmit(scannedCode);
          e.preventDefault();
        }
      } else if (e.key.length === 1 && !isSearchInput) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products.data, suggestions, searchQuery, activeTab, cart, cajaStatus.data?.is_open]);

  useEffect(() => {
    if (activeTab === "pos") {
      searchInputRef.current?.focus();
    }
  }, [activeTab]);

  const updateQuantity = (productId: number, qty: number) => {
    const prod = products.data.find((p) => p.id === productId);
    if (!prod) return;

    if (qty <= 0) {
      setCart((current) => current.filter((item) => item.product.id !== productId));
      return;
    }

    if (qty > prod.stock) {
      showToast(`Solo hay ${prod.stock} unidades en stock para ${prod.name}.`, "warning");
      return;
    }

    setCart((current) =>
      current.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item)),
    );
  };

  const updateDiscount = (productId: number, disc: number) => {
    const valid = Math.max(0, Math.min(100, disc));
    setCart((current) =>
      current.map((item) => (item.product.id === productId ? { ...item, discount: valid } : item)),
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((current) => current.filter((item) => item.product.id !== productId));
  };

  const submitSale = async (e?: FormEvent) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    await submitSaleDirect();
  };

  return (
    <div className="stack">
      <div className="tabs-header">
        <button
          className={`tab-button ${activeTab === "pos" ? "active" : ""}`}
          onClick={() => setActiveTab("pos")}
          type="button"
        >
          Punto de Venta (POS)
        </button>
        <button
          className={`tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
          type="button"
        >
          Historial de Ventas
        </button>
      </div>

      {activeTab === "pos" ? (
        <div className="pos-container">
          <div className="stack">
            <div className="panel pos-search-panel" style={{ padding: "20px" }}>
              <div className="keyboard-shortcuts-bar" style={{ marginBottom: "14px" }}>
                <span><kbd>↑</kbd> <kbd>↓</kbd> Navegar</span>
                <span><kbd>Enter</kbd> Agregar / Escanear</span>
                <span><kbd>F4</kbd> Buscador</span>
                <span><kbd>F2</kbd> Ir a Pago</span>
                <span><kbd>Ctrl+Enter</kbd> Cobrar</span>
                <span><kbd>Esc</kbd> Limpiar</span>
              </div>
              <div className="field">
                <label style={{ fontWeight: 700, marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Buscador Inteligente de Productos (Nombre, SKU, Código de Barras o Pistola)</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-secondary)" }}>
                    Presiona <strong>Enter</strong> o escanea para agregar
                  </span>
                </label>
                <div className="pos-search-wrapper">
                  <input
                    ref={searchInputRef}
                    placeholder="Escribe el nombre del producto, SKU o escanea el código de barras completo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                  />
                  {suggestions.length > 0 && (
                    <div className="pos-search-suggestions">
                      {suggestions.map((p, idx) => {
                        const disabled = !p.active || p.stock === 0;
                        const isExactBarcode =
                          p.barcode && p.barcode.trim().toLowerCase() === searchQuery.trim().toLowerCase();
                        return (
                          <div
                            className={`pos-suggestion-item ${disabled ? "disabled" : ""} ${isExactBarcode ? "exact-match" : ""} ${idx === highlightedIndex ? "highlighted" : ""}`}
                            key={p.id}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            onClick={() => !disabled && addToCart(p)}
                          >
                            <div>
                              <div className="pos-suggestion-name" style={{ fontWeight: 600 }}>
                                {p.name}
                              </div>
                              <div className="pos-suggestion-meta">
                                {p.barcode ? (
                                  <span className="barcode-badge" title="Código de barras completo">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14" />
                                    </svg>
                                    {p.barcode}
                                  </span>
                                ) : null}
                                {p.sku ? <span className="sku-badge">SKU: {p.sku}</span> : null}
                                <span className="stock-badge">Stock: {p.stock} u.</span>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3>Carrito de Compra</h3>
                {cart.length > 0 && (
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                    onClick={() => setCart([])}
                  >
                    Vaciar carrito
                  </button>
                )}
              </div>
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
                          <td style={{ fontWeight: 600 }}>
                            {item.product.name}
                            {item.product.barcode && (
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  fontFamily: "ui-monospace, monospace",
                                  color: "var(--text-secondary)",
                                  marginTop: "2px",
                                }}
                              >
                                Cód: {item.product.barcode}
                              </div>
                            )}
                          </td>
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
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    searchInputRef.current?.focus();
                                  }
                                }}
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
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  searchInputRef.current?.focus();
                                }
                              }}
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

            <Field label="Cliente [F2]">
              <select
                ref={checkoutClientRef}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
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
              <Field label="Método de pago">
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
              <div
                className="sale-total"
                style={{ background: "transparent", padding: "4px 0", border: 0, color: "#ea580c" }}
              >
                <span>Descuento aplicado</span>
                <span>-{formatMoney(cartSummary.discount)}</span>
              </div>
              <div className="sale-total">
                <span>Total Final</span>
                <strong>{formatMoney(cartSummary.total)}</strong>
              </div>
            </div>

            {status !== "0" && paymentMethod === "0" && cart.length > 0 && (
              <div className="stack" style={{ gap: "8px", marginBottom: "10px" }}>
                <Field label="Efectivo recibido ($)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={`Exacto (${formatMoney(cartSummary.total)})`}
                    value={cashReceivedInput}
                    onChange={(e) => setCashReceivedInput(e.target.value)}
                  />
                </Field>
                <div className="quick-cash-grid">
                  <button
                    type="button"
                    className="quick-cash-btn"
                    onClick={() => setCashReceivedInput(String(cartSummary.total))}
                  >
                    Exacto
                  </button>
                  {[1000, 2000, 5000, 10000, 20000].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      className="quick-cash-btn"
                      onClick={() => setCashReceivedInput(String(bill))}
                    >
                      ${bill.toLocaleString("es-AR")}
                    </button>
                  ))}
                </div>
                {cashReceivedInput !== "" && cashReceivedNum >= cartSummary.total && (
                  <div className="change-highlight">
                    <span>Vuelto a entregar:</span>
                    <span>{formatMoney(changeAmount)}</span>
                  </div>
                )}
              </div>
            )}

            <SubmitButton label="Registrar e Imprimir Ticket [Ctrl+Enter]" saving={saving} />
            {error ? <p className="form-error">{error}</p> : null}
            {!cajaStatus.data?.is_open && (
              <p className="form-error" style={{ color: "#d97706" }}>
                ⚠️ La caja diaria está CERRADA. Abre la caja en el menú correspondiente para vender.
              </p>
            )}
          </form>
        </div>
      ) : (
        <Panel
          title="Historial de Ventas"
          state={sales}
          actions={
            <button type="button" className="secondary-button action-btn-sm" onClick={handleExportSales}>
              ⬇ Exportar CSV
            </button>
          }
        >
          <DataTable
            columns={["#", "Fecha", "Cliente", "Items", "Total", "Método", "Pagado", "Estado", "Acciones"]}
            rows={sales.data.map((sale) => [
              `#${sale.id}`,
              formatDate(sale.sold_at),
              sale.client?.name ?? "Consumidor final",
              sale.items
                .map(
                  (item) =>
                    `${item.quantity} x ${item.product.name}${item.discount_rate > 0 ? ` (-${item.discount_rate}%)` : ""}`,
                )
                .join(", "),
              formatMoney(sale.total_amount),
              sale.payments && sale.payments.length > 0 && sale.payments[0].payment_method != null
                ? paymentMethods[sale.payments[0].payment_method] ?? "Efectivo"
                : sale.status === 0
                  ? "Pendiente"
                  : "Efectivo",
              formatMoney(sale.summary.total_paid),
              saleStatuses[sale.status] ?? "Sin estado",
              <div style={{ display: "flex", gap: "6px" }} key={`sale-act-${sale.id}`}>
                <button
                  type="button"
                  className="secondary-button action-btn-sm"
                  onClick={() => onReprintSale(sale)}
                >
                  Ticket
                </button>
                {sale.status !== 3 && (
                  <button
                    type="button"
                    className="secondary-button action-btn-sm"
                    style={{ color: "#ef4444" }}
                    onClick={() => setCancellingSale(sale)}
                  >
                    Anular
                  </button>
                )}
              </div>,
            ])}
          />
        </Panel>
      )}

      <ConfirmDialog
        open={cancellingSale !== null}
        title={`Anular Venta #${cancellingSale?.id ?? ""}`}
        message={`¿Seguro que deseas anular esta venta por ${formatMoney(cancellingSale?.total_amount ?? 0)}? El stock se reincorporará automáticamente al Kardex y se revertirá el movimiento de caja.`}
        confirmLabel="Anular Venta"
        danger
        loading={cancelling}
        onConfirm={() => void confirmCancelSale()}
        onCancel={() => setCancellingSale(null)}
      />
    </div>
  );
}
