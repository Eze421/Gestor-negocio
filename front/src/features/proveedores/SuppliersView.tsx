import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiDelete, apiPatch, apiPost } from "../../shared/api/client";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { DataTable, Field, MetricCard, Panel, SubmitButton } from "../../shared/components/UI";
import { useToast } from "../../shared/context/ToastContext";
import type { CajaStatus, Loadable, Product, Purchase, Supplier } from "../../shared/types/models";
import { formatDate, formatMoney, paymentMethods, purchaseStatuses } from "../../shared/utils/formatters";

type PurchaseDraftItem = {
  product: Product;
  quantity: number;
  unit_cost: number;
};

type SuppliersViewProps = {
  onCreated: () => void;
  products: Loadable<Product[]>;
  suppliers: Loadable<Supplier[]>;
  purchases: Loadable<Purchase[]>;
  cajaStatus: Loadable<CajaStatus>;
};

export function SuppliersView({ onCreated, products, suppliers, purchases }: SuppliersViewProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"catalog" | "new_purchase" | "history" | "new_supplier">("catalog");

  const [form, setForm] = useState({ address: "", email: "", name: "", phone: "", productId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [purchaseSupplierId, setPurchaseSupplierId] = useState("");
  const [purchaseInvoiceNumber, setPurchaseInvoiceNumber] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState("2");
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState("0");
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [purchaseItems, setPurchaseItems] = useState<PurchaseDraftItem[]>([]);
  const [selectedProdId, setSelectedProdId] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemCost, setItemCost] = useState("");
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const [payingPurchase, setPayingPurchase] = useState<Purchase | null>(null);
  const [payPurchaseAmount, setPayPurchaseAmount] = useState("");
  const [payPurchaseMethod, setPayPurchaseMethod] = useState("0");
  const [savingPayPurchase, setSavingPayPurchase] = useState(false);
  const [payPurchaseError, setPayPurchaseError] = useState<string | null>(null);

  // Edit & Delete supplier state
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  const purchaseSupplierSelectRef = useRef<HTMLSelectElement>(null);
  const newSupplierNameRef = useRef<HTMLInputElement>(null);
  const payPurchaseAmountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "new_purchase") {
      setTimeout(() => purchaseSupplierSelectRef.current?.focus(), 50);
    } else if (activeTab === "new_supplier") {
      setTimeout(() => newSupplierNameRef.current?.focus(), 50);
    }
  }, [activeTab]);

  useEffect(() => {
    if (payingPurchase) {
      setTimeout(() => payPurchaseAmountRef.current?.focus(), 50);
    }
  }, [payingPurchase]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && payingPurchase) {
        e.preventDefault();
        setPayingPurchase(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [payingPurchase]);

  const totalSupplierDebt = useMemo(() => {
    return purchases.data.reduce((sum, p) => sum + (p.summary.balance ?? 0), 0);
  }, [purchases.data]);

  const purchaseTotal = useMemo(() => {
    return purchaseItems.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
  }, [purchaseItems]);

  const addDraftItem = () => {
    if (!selectedProdId) return;
    const prod = products.data.find((p) => p.id === Number(selectedProdId));
    if (!prod) return;
    const qty = Number(itemQty);
    const cost = Number(itemCost);
    if (qty <= 0 || isNaN(qty)) {
      showToast("Ingrese una cantidad válida", "warning");
      return;
    }
    if (cost < 0 || isNaN(cost)) {
      showToast("Ingrese un precio de costo válido", "warning");
      return;
    }

    setPurchaseItems((current) => {
      const existing = current.find((i) => i.product.id === prod.id);
      if (existing) {
        return current.map((i) =>
          i.product.id === prod.id ? { ...i, quantity: i.quantity + qty, unit_cost: cost } : i,
        );
      }
      return [...current, { product: prod, quantity: qty, unit_cost: cost }];
    });

    setSelectedProdId("");
    setItemQty("1");
    setItemCost("");
  };

  const removeDraftItem = (prodId: number) => {
    setPurchaseItems((current) => current.filter((i) => i.product.id !== prodId));
  };

  const submitPurchase = async (e: FormEvent) => {
    e.preventDefault();
    if (!purchaseSupplierId) {
      setPurchaseError("Selecciona un proveedor.");
      return;
    }
    if (purchaseItems.length === 0) {
      setPurchaseError("Agrega al menos un producto a la compra.");
      return;
    }

    setSavingPurchase(true);
    setPurchaseError(null);
    try {
      const itemsPayload = purchaseItems.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
        unit_cost: i.unit_cost,
      }));

      await apiPost<Purchase>("/purchases/", {
        supplier_id: Number(purchaseSupplierId),
        invoice_number: purchaseInvoiceNumber || null,
        status: Number(purchaseStatus),
        notes: purchaseNotes || null,
        items: itemsPayload,
        payment:
          Number(purchaseStatus) === 0
            ? null
            : {
                amount: purchaseTotal,
                payment_method: Number(purchasePaymentMethod),
              },
      });

      setPurchaseItems([]);
      setPurchaseSupplierId("");
      setPurchaseInvoiceNumber("");
      setPurchaseNotes("");
      setActiveTab("history");
      showToast("Compra e ingreso de stock registrados", "success");
      onCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar la compra";
      setPurchaseError(msg);
      showToast(msg, "error");
    } finally {
      setSavingPurchase(false);
    }
  };

  const openPayPurchaseModal = (p: Purchase) => {
    setPayingPurchase(p);
    setPayPurchaseAmount(String(p.summary.balance));
    setPayPurchaseMethod("0");
    setPayPurchaseError(null);
  };

  const submitPayPurchase = async (e: FormEvent) => {
    e.preventDefault();
    if (!payingPurchase) return;
    const amount = Number(payPurchaseAmount);
    if (isNaN(amount) || amount <= 0) {
      setPayPurchaseError("El monto debe ser numérico y mayor a 0.");
      return;
    }

    setSavingPayPurchase(true);
    setPayPurchaseError(null);
    try {
      await apiPost<Purchase>(`/purchases/${payingPurchase.id}/payments`, {
        amount,
        payment_method: Number(payPurchaseMethod),
      });
      setPayingPurchase(null);
      showToast("Pago a proveedor registrado", "success");
      onCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar el pago a la factura";
      setPayPurchaseError(msg);
      showToast(msg, "error");
    } finally {
      setSavingPayPurchase(false);
    }
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setEditForm({
      name: s.name,
      phone: s.phone ?? "",
      email: s.email ?? "",
      address: s.address ?? "",
    });
  };

  const submitEditSupplier = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    setSavingEdit(true);
    try {
      await apiPatch<Supplier>(`/suppliers/${editingSupplier.id}`, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || null,
        email: editForm.email.trim() || null,
        address: editForm.address.trim() || null,
      });
      setEditingSupplier(null);
      showToast("Proveedor actualizado", "success");
      onCreated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo actualizar el proveedor", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeleteSupplier = async () => {
    if (!deletingSupplier) return;
    setDeleting(true);
    try {
      await apiDelete(`/suppliers/${deletingSupplier.id}`);
      setDeletingSupplier(null);
      showToast("Proveedor eliminado", "success");
      onCreated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo eliminar el proveedor", "error");
      setDeletingSupplier(null);
    } finally {
      setDeleting(false);
    }
  };

  const submitNewSupplier = async (event: FormEvent<HTMLFormElement>) => {
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
      setActiveTab("catalog");
      showToast("Proveedor registrado con éxito", "success");
      onCreated();
    } catch (caught) {
      const msg = caught instanceof Error ? caught.message : "No se pudo crear el proveedor";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack">
      <div className="tabs-header">
        <button
          className={`tab-button ${activeTab === "catalog" ? "active" : ""}`}
          onClick={() => setActiveTab("catalog")}
          type="button"
        >
          Directorio de Proveedores
        </button>
        <button
          className={`tab-button ${activeTab === "new_purchase" ? "active" : ""}`}
          onClick={() => setActiveTab("new_purchase")}
          type="button"
        >
          Nueva Compra / Ingreso de Stock
        </button>
        <button
          className={`tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
          type="button"
        >
          Historial de Compras y Deudas
        </button>
        <button
          className={`tab-button ${activeTab === "new_supplier" ? "active" : ""}`}
          onClick={() => setActiveTab("new_supplier")}
          type="button"
        >
          Nuevo Proveedor
        </button>
      </div>

      <section className="metric-grid">
        <MetricCard
          label="Deuda a Proveedores por Pagar"
          value={formatMoney(totalSupplierDebt)}
          meta="Cuentas por pagar pendientes"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          }
        />
        <MetricCard
          label="Facturas de Compra"
          value={purchases.data.length.toString()}
          meta="Compras registradas"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12" y2="18" />
            </svg>
          }
        />
        <MetricCard
          label="Proveedores Activos"
          value={suppliers.data.length.toString()}
          meta="Contactos comerciales"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          }
        />
      </section>

      {activeTab === "catalog" && (
        <Panel title="Directorio de Proveedores" state={suppliers}>
          <DataTable
            columns={["Nombre", "Teléfono", "Email", "Dirección", "Productos Asociados", "Saldo por Pagar", "Acciones"]}
            rows={suppliers.data.map((supplier) => {
              const supplierDebt = purchases.data
                .filter((p) => p.supplier.id === supplier.id)
                .reduce((sum, p) => sum + p.summary.balance, 0);
              return [
                supplier.name,
                supplier.phone ?? "-",
                supplier.email ?? "-",
                supplier.address ?? "-",
                supplier.products.map((product) => product.name).join(", ") || "-",
                <span style={{ fontWeight: 700, color: supplierDebt > 0 ? "#ef4444" : "inherit" }} key={supplier.id}>
                  {formatMoney(supplierDebt)}
                </span>,
                <div style={{ display: "flex", gap: "6px" }} key={`act-${supplier.id}`}>
                  <button
                    className="secondary-button action-btn-sm"
                    type="button"
                    onClick={() => openEditSupplier(supplier)}
                  >
                    Editar
                  </button>
                  <button
                    className="secondary-button action-btn-sm"
                    style={{ color: "#ef4444" }}
                    type="button"
                    onClick={() => setDeletingSupplier(supplier)}
                  >
                    Eliminar
                  </button>
                </div>,
              ];
            })}
          />
        </Panel>
      )}

      {activeTab === "new_purchase" && (
        <form className="form-panel" onSubmit={(e) => void submitPurchase(e)} style={{ maxWidth: "800px" }}>
          <h3>Registrar Nueva Compra / Entrada de Mercadería</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
            El stock de los productos ingresados aumentará automáticamente al confirmar la compra.
          </p>

          <div className="form-row">
            <Field label="Proveedor">
              <select
                ref={purchaseSupplierSelectRef}
                required
                value={purchaseSupplierId}
                onChange={(e) => setPurchaseSupplierId(e.target.value)}
              >
                <option value="">Seleccionar proveedor...</option>
                {suppliers.data.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nro. Factura / Remito">
              <input
                placeholder="Ej. FC-0001-12345"
                value={purchaseInvoiceNumber}
                onChange={(e) => setPurchaseInvoiceNumber(e.target.value)}
              />
            </Field>
          </div>

          <div className="panel" style={{ padding: "16px", margin: "16px 0", background: "var(--color-surface)" }}>
            <h4 style={{ marginBottom: "12px" }}>Agregar Productos al Pedido</h4>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
              <Field label="Producto">
                <select
                  value={selectedProdId}
                  onChange={(e) => {
                    setSelectedProdId(e.target.value);
                    const prod = products.data.find((p) => p.id === Number(e.target.value));
                    if (prod) setItemCost(String(prod.cost_price || ""));
                  }}
                >
                  <option value="">Elegir producto...</option>
                  {products.data.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.barcode ? `[Cód: ${p.barcode}]` : ""} (Stock: {p.stock} u.)
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cantidad">
                <input
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDraftItem();
                    }
                  }}
                />
              </Field>
              <Field label="Costo Unitario ($)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={itemCost}
                  onChange={(e) => setItemCost(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDraftItem();
                    }
                  }}
                />
              </Field>
              <button
                className="secondary-button"
                style={{ height: "40px", marginBottom: "8px" }}
                type="button"
                onClick={addDraftItem}
              >
                + Agregar
              </button>
            </div>

            {purchaseItems.length > 0 ? (
              <div className="table-wrap" style={{ marginTop: "12px" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cant.</th>
                      <th>Costo Unit.</th>
                      <th>Subtotal</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseItems.map((item) => (
                      <tr key={item.product.id}>
                        <td>{item.product.name}</td>
                        <td>+{item.quantity} u.</td>
                        <td>{formatMoney(item.unit_cost)}</td>
                        <td style={{ fontWeight: 700 }}>{formatMoney(item.quantity * item.unit_cost)}</td>
                        <td>
                          <button
                            type="button"
                            style={{ color: "#ef4444", fontWeight: 700 }}
                            onClick={() => removeDraftItem(item.product.id)}
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "8px" }}>
                No hay productos en el pedido. Selecciona un producto para agregarlo.
              </p>
            )}
          </div>

          <div className="form-row">
            <Field label="Condición de Pago">
              <select value={purchaseStatus} onChange={(e) => setPurchaseStatus(e.target.value)}>
                <option value="2">Pagada al Contado</option>
                <option value="0">A Pagar (Cuenta Corriente / Fiado)</option>
              </select>
            </Field>
            <Field label="Método de Pago">
              <select
                disabled={purchaseStatus === "0"}
                value={purchasePaymentMethod}
                onChange={(e) => setPurchasePaymentMethod(e.target.value)}
              >
                {paymentMethods.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Observaciones / Notas">
            <input
              placeholder="Detalles de la compra..."
              value={purchaseNotes}
              onChange={(e) => setPurchaseNotes(e.target.value)}
            />
          </Field>

          <div className="sale-total" style={{ margin: "16px 0" }}>
            <span>Total de la Compra</span>
            <strong>{formatMoney(purchaseTotal)}</strong>
          </div>

          {purchaseStatus === "2" && purchasePaymentMethod === "0" && (
            <p style={{ fontSize: "0.85rem", color: "var(--color-primary)", marginBottom: "12px" }}>
              ℹ️ Al pagar en efectivo, el egreso se registrará automáticamente en la Caja diaria activa.
            </p>
          )}

          <SubmitButton label="Confirmar Compra e Ingresar Stock" saving={savingPurchase} />
          {purchaseError && <p className="form-error">{purchaseError}</p>}
        </form>
      )}

      {activeTab === "history" && (
        <Panel title="Historial de Compras a Proveedores" state={purchases}>
          <DataTable
            columns={["Fecha", "Factura/Remito", "Proveedor", "Total", "Pagado", "Saldo Adeudado", "Estado", "Acción"]}
            rows={purchases.data.map((p) => {
              const bal = p.summary.balance;
              return [
                formatDate(p.purchased_at),
                p.invoice_number || "-",
                p.supplier.name,
                formatMoney(p.total_amount),
                formatMoney(p.summary.total_paid),
                <span key={`bal-${p.id}`} style={{ fontWeight: 700, color: bal > 0 ? "#ef4444" : "inherit" }}>
                  {formatMoney(bal)}
                </span>,
                purchaseStatuses[p.status] ?? "Sin estado",
                bal > 0 ? (
                  <button
                    className="primary-button"
                    style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                    onClick={() => openPayPurchaseModal(p)}
                    type="button"
                    key={p.id}
                  >
                    Pagar Saldo
                  </button>
                ) : (
                  <span key={`paid-${p.id}`} style={{ color: "#10b981", fontWeight: 700 }}>
                    Saldada
                  </span>
                ),
              ];
            })}
          />
        </Panel>
      )}

      {activeTab === "new_supplier" && (
        <form className="form-panel" onSubmit={(event) => void submitNewSupplier(event)} style={{ maxWidth: "500px" }}>
          <h3>Nuevo proveedor</h3>
          <Field label="Nombre">
            <input
              ref={newSupplierNameRef}
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Teléfono">
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </Field>
          <Field label="Dirección">
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
      )}

      {payingPurchase && (
        <div className="modal-backdrop" onClick={() => setPayingPurchase(null)}>
          <div className="modal-content" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pagar Factura a Proveedor</h3>
              <button className="close-button" type="button" onClick={() => setPayingPurchase(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={(e) => void submitPayPurchase(e)}>
              <div className="modal-body">
                <div style={{ background: "rgba(239,68,68,0.08)", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                  <div>
                    Proveedor: <strong>{payingPurchase.supplier.name}</strong>
                  </div>
                  <div>
                    Factura: <strong>{payingPurchase.invoice_number || `#${payingPurchase.id}`}</strong>
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#c5221f", marginTop: "4px" }}>
                    Saldo Pendiente: {formatMoney(payingPurchase.summary.balance)}
                  </div>
                </div>

                <Field label="Monto a Pagar ($)">
                  <input
                    ref={payPurchaseAmountRef}
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={payPurchaseAmount}
                    onChange={(e) => setPayPurchaseAmount(e.target.value)}
                  />
                </Field>

                <Field label="Método de Pago">
                  <select value={payPurchaseMethod} onChange={(e) => setPayPurchaseMethod(e.target.value)}>
                    {paymentMethods.map((m, idx) => (
                      <option key={m} value={idx}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>

                {payPurchaseMethod === "0" && (
                  <p style={{ fontSize: "0.85rem", color: "var(--color-primary)", marginTop: "6px" }}>
                    ℹ️ El pago en efectivo se descontará de la Caja diaria activa.
                  </p>
                )}

                {payPurchaseError && <p className="form-error">{payPurchaseError}</p>}
              </div>

              <div className="modal-footer">
                <button className="primary-button" disabled={savingPayPurchase} type="submit">
                  {savingPayPurchase ? "Registrando Pago..." : "Confirmar Pago a Proveedor"}
                </button>
                <button className="secondary-button" type="button" onClick={() => setPayingPurchase(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editingSupplier && (
        <div className="modal-backdrop" onClick={() => setEditingSupplier(null)}>
          <div className="modal-content" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Proveedor</h3>
              <button className="close-button" type="button" onClick={() => setEditingSupplier(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={(e) => void submitEditSupplier(e)}>
              <div className="modal-body">
                <Field label="Nombre">
                  <input
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </Field>
                <Field label="Teléfono">
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </Field>
                <Field label="Dirección">
                  <input
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </Field>
              </div>
              <div className="modal-footer">
                <button className="secondary-button" type="button" onClick={() => setEditingSupplier(null)}>
                  Cancelar
                </button>
                <SubmitButton label="Guardar Cambios" saving={savingEdit} />
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deletingSupplier !== null}
        title="Eliminar Proveedor"
        message={`¿Seguro que deseas eliminar al proveedor "${deletingSupplier?.name ?? ""}"? No se puede eliminar si tiene compras registradas.`}
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={() => void confirmDeleteSupplier()}
        onCancel={() => setDeletingSupplier(null)}
      />
    </div>
  );
}
