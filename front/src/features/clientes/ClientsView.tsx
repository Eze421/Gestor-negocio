import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "../../shared/api/client";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { DataTable, EmptyState, Field, MetricCard, Panel, SubmitButton } from "../../shared/components/UI";
import { useToast } from "../../shared/context/ToastContext";
import type { CajaStatus, Client, ClientAccount, Loadable } from "../../shared/types/models";
import { formatDate, formatMoney, paymentMethods } from "../../shared/utils/formatters";

type ClientsViewProps = {
  clients: Loadable<Client[]>;
  onCreated: () => void;
  onPaymentRegistered: (receipt: {
    clientName: string;
    clientDni?: string | null;
    amount: number;
    paymentMethod: number;
    remainingDebt: number;
    saleId?: number | null;
    date: string;
  }) => void;
  cajaStatus: Loadable<CajaStatus>;
};

export function ClientsView({ clients, onCreated, onPaymentRegistered, cajaStatus }: ClientsViewProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"directory" | "new">("directory");
  const [search, setSearch] = useState("");
  const [onlyDebtors, setOnlyDebtors] = useState(false);

  const [form, setForm] = useState({ dni: "", name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedClientForPayment, setSelectedClientForPayment] = useState<Client | null>(null);
  const [clientAccount, setClientAccount] = useState<ClientAccount | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("0");
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [viewingAccountClient, setViewingAccountClient] = useState<Client | null>(null);

  // Edit & Deactivate client state
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState({ name: "", dni: "", phone: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [togglingClient, setTogglingClient] = useState<Client | null>(null);
  const [toggling, setToggling] = useState(false);

  const newClientNameRef = useRef<HTMLInputElement>(null);
  const paymentAmountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "new") {
      setTimeout(() => newClientNameRef.current?.focus(), 50);
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedClientForPayment) {
      setTimeout(() => paymentAmountRef.current?.focus(), 50);
    }
  }, [selectedClientForPayment]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedClientForPayment) {
          e.preventDefault();
          setSelectedClientForPayment(null);
        } else if (viewingAccountClient) {
          e.preventDefault();
          setViewingAccountClient(null);
        } else if (editingClient) {
          e.preventDefault();
          setEditingClient(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedClientForPayment, viewingAccountClient, editingClient]);

  const totalDebts = useMemo(() => {
    return clients.data.reduce((sum, c) => sum + (c.total_debt ?? 0), 0);
  }, [clients.data]);

  const debtorCount = useMemo(() => {
    return clients.data.filter((c) => (c.total_debt ?? 0) > 0.009).length;
  }, [clients.data]);

  const filteredClients = useMemo(() => {
    return clients.data.filter((c) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.dni && c.dni.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q));
      const matchDebtor = !onlyDebtors || (c.total_debt ?? 0) > 0.009;
      return matchSearch && matchDebtor;
    });
  }, [clients.data, search, onlyDebtors]);

  const submitNewClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiPost<Client>("/clients/", {
        active: true,
        dni: form.dni || null,
        name: form.name,
        phone: form.phone || null,
      });
      setForm({ dni: "", name: "", phone: "" });
      setActiveTab("directory");
      showToast("Cliente registrado con éxito", "success");
      onCreated();
    } catch (caught) {
      const msg = caught instanceof Error ? caught.message : "No se pudo crear el cliente";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const openEditClient = (c: Client) => {
    setEditingClient(c);
    setEditForm({ name: c.name, dni: c.dni ?? "", phone: c.phone ?? "" });
  };

  const submitEditClient = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setSavingEdit(true);
    try {
      await apiPatch<Client>(`/clients/${editingClient.id}`, {
        name: editForm.name.trim(),
        dni: editForm.dni.trim() || null,
        phone: editForm.phone.trim() || null,
      });
      setEditingClient(null);
      showToast("Cliente actualizado con éxito", "success");
      onCreated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo actualizar el cliente", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmToggleClient = async () => {
    if (!togglingClient) return;
    setToggling(true);
    try {
      if (togglingClient.active) {
        await apiDelete(`/clients/${togglingClient.id}`);
        showToast(`Cliente "${togglingClient.name}" dado de baja`, "info");
      } else {
        await apiPatch(`/clients/${togglingClient.id}`, { active: true });
        showToast(`Cliente "${togglingClient.name}" reactivado`, "success");
      }
      setTogglingClient(null);
      onCreated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo cambiar el estado del cliente", "error");
      setTogglingClient(null);
    } finally {
      setToggling(false);
    }
  };

  const openPaymentModal = async (client: Client) => {
    setSelectedClientForPayment(client);
    setPaymentAmount(String(client.total_debt ?? 0));
    setPaymentMethod("0");
    setSelectedSaleId(null);
    setPaymentError(null);
    setLoadingAccount(true);

    try {
      const acc = await apiGet<ClientAccount>(`/clients/${client.id}/account`);
      setClientAccount(acc);
      setPaymentAmount(String(acc.total_debt));
    } catch {
      // fallback
    } finally {
      setLoadingAccount(false);
    }
  };

  const openAccountStatement = async (client: Client) => {
    setViewingAccountClient(client);
    setLoadingAccount(true);
    try {
      const acc = await apiGet<ClientAccount>(`/clients/${client.id}/account`);
      setClientAccount(acc);
    } catch {
      // fallback
    } finally {
      setLoadingAccount(false);
    }
  };

  const submitPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedClientForPayment) return;
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setPaymentError("El monto debe ser numérico y mayor a 0.");
      return;
    }

    setSavingPayment(true);
    setPaymentError(null);
    try {
      const updatedAccount = await apiPost<ClientAccount>(`/clients/${selectedClientForPayment.id}/payments`, {
        amount,
        payment_method: Number(paymentMethod),
        sale_id: selectedSaleId,
      });

      const clientName = selectedClientForPayment.name;
      const clientDni = selectedClientForPayment.dni;
      const remainingDebt = updatedAccount.total_debt;
      const payMethodNum = Number(paymentMethod);
      const targetSale = selectedSaleId;

      setSelectedClientForPayment(null);
      setClientAccount(null);
      showToast("Cobranza registrada con éxito", "success");

      onPaymentRegistered({
        clientName,
        clientDni,
        amount,
        paymentMethod: payMethodNum,
        remainingDebt,
        saleId: targetSale,
        date: new Date().toISOString(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar el cobro";
      setPaymentError(msg);
      showToast(msg, "error");
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <div className="stack">
      <div className="tabs-header">
        <button
          className={`tab-button ${activeTab === "directory" ? "active" : ""}`}
          onClick={() => setActiveTab("directory")}
          type="button"
        >
          Directorio y Cuentas Corrientes
        </button>
        <button
          className={`tab-button ${activeTab === "new" ? "active" : ""}`}
          onClick={() => setActiveTab("new")}
          type="button"
        >
          Nuevo Cliente
        </button>
      </div>

      <section className="metric-grid">
        <MetricCard
          label="Total Deudas por Cobrar"
          value={formatMoney(totalDebts)}
          meta={`${debtorCount} clientes con saldo deudor`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12" y2="18" />
              <path d="M17 12h-5v2h5v-2z" />
            </svg>
          }
        />
        <MetricCard
          label="Clientes con Deuda"
          value={debtorCount.toString()}
          meta="Cuentas activas fiadas"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
          }
        />
        <MetricCard
          label="Total Clientes"
          value={clients.data.length.toString()}
          meta="Cartera de clientes"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
      </section>

      {activeTab === "directory" ? (
        <div className="stack">
          <div className="panel" style={{ padding: "16px", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "240px" }}>
              <input
                placeholder="Buscar por nombre, DNI o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={onlyDebtors}
                onChange={(e) => setOnlyDebtors(e.target.checked)}
              />
              Solo con saldo deudor (fiados)
            </label>
          </div>

          <Panel title="Cartera de Clientes" state={clients}>
            <DataTable
              columns={["Nombre", "DNI", "Teléfono", "Saldo Deudor (Cta Cte)", "Estado", "Acciones"]}
              rows={filteredClients.map((client) => {
                const debt = client.total_debt ?? 0;
                return [
                  client.name,
                  client.dni ?? "-",
                  client.phone ?? "-",
                  <span key={`debt-${client.id}`} style={{ fontWeight: 700, color: debt > 0.009 ? "#ef4444" : "inherit" }}>
                    {formatMoney(debt)} {debt > 0.009 ? "⚠️" : ""}
                  </span>,
                  client.active ? "Activo" : "Inactivo",
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }} key={client.id}>
                    {debt > 0.009 && (
                      <button
                        className="primary-button action-btn-sm"
                        onClick={() => void openPaymentModal(client)}
                        type="button"
                      >
                        Cobrar
                      </button>
                    )}
                    <button
                      className="secondary-button action-btn-sm"
                      onClick={() => void openAccountStatement(client)}
                      type="button"
                    >
                      Cuenta
                    </button>
                    <button
                      className="secondary-button action-btn-sm"
                      onClick={() => openEditClient(client)}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      className="secondary-button action-btn-sm"
                      style={{ color: client.active ? "#ef4444" : "#10b981" }}
                      onClick={() => setTogglingClient(client)}
                      type="button"
                    >
                      {client.active ? "Baja" : "Activar"}
                    </button>
                  </div>,
                ];
              })}
            />
          </Panel>
        </div>
      ) : (
        <form className="form-panel" onSubmit={(event) => void submitNewClient(event)} style={{ maxWidth: "500px" }}>
          <h3>Nuevo cliente</h3>
          <Field label="Nombre">
            <input
              ref={newClientNameRef}
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="DNI">
            <input value={form.dni} onChange={(event) => setForm({ ...form, dni: event.target.value })} />
          </Field>
          <Field label="Teléfono">
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </Field>
          <SubmitButton label="Crear cliente" saving={saving} />
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      )}

      {selectedClientForPayment && (
        <div className="modal-backdrop" onClick={() => setSelectedClientForPayment(null)}>
          <div className="modal-content" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cobranza de Cuenta Corriente</h3>
              <button className="close-button" type="button" onClick={() => setSelectedClientForPayment(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={(e) => void submitPayment(e)}>
              <div className="modal-body">
                <div style={{ background: "rgba(239,68,68,0.08)", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    Cliente: <strong>{selectedClientForPayment.name}</strong>
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#c5221f", marginTop: "4px" }}>
                    Deuda Total: {formatMoney(clientAccount?.total_debt ?? selectedClientForPayment.total_debt ?? 0)}
                  </div>
                </div>

                {loadingAccount ? (
                  <p>Cargando detalle de cuenta corriente...</p>
                ) : clientAccount && clientAccount.pending_sales.length > 0 ? (
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", display: "block" }}>
                      Ventas con Saldo Pendiente:
                    </label>
                    <div className="table-wrap" style={{ maxHeight: "160px", overflowY: "auto" }}>
                      <table style={{ fontSize: "0.85rem" }}>
                        <thead>
                          <tr>
                            <th>Venta</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Saldo</th>
                            <th>Aplicar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientAccount.pending_sales.map((sale) => (
                            <tr
                              key={sale.sale_id}
                              style={{ background: selectedSaleId === sale.sale_id ? "rgba(37,99,235,0.08)" : undefined }}
                            >
                              <td>#{sale.sale_id}</td>
                              <td>{formatDate(sale.sold_at)}</td>
                              <td>{formatMoney(sale.total_amount)}</td>
                              <td style={{ fontWeight: 700, color: "#ef4444" }}>{formatMoney(sale.balance)}</td>
                              <td>
                                <button
                                  type="button"
                                  className="secondary-button"
                                  style={{ padding: "2px 6px", fontSize: "0.75rem" }}
                                  onClick={() => {
                                    if (selectedSaleId === sale.sale_id) {
                                      setSelectedSaleId(null);
                                      setPaymentAmount(String(clientAccount.total_debt));
                                    } else {
                                      setSelectedSaleId(sale.sale_id);
                                      setPaymentAmount(String(sale.balance));
                                    }
                                  }}
                                >
                                  {selectedSaleId === sale.sale_id ? "Deseleccionar" : "Pagar esta"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                      {selectedSaleId
                        ? `Cobrando específicamente venta #${selectedSaleId}`
                        : "El cobro se distribuirá automáticamente en las ventas más antiguas (FIFO)."}
                    </div>
                  </div>
                ) : null}

                <div className="form-row">
                  <Field label="Monto a Cobrar ($)">
                    <input
                      ref={paymentAmountRef}
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </Field>
                  <Field label="Método de Pago">
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      {paymentMethods.map((m, idx) => (
                        <option key={m} value={idx}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {!cajaStatus.data.is_open && paymentMethod === "0" && (
                  <p className="form-error" style={{ color: "#d97706" }}>
                    ⚠️ La caja diaria está cerrada. Si cobras en efectivo, se registrará el pago pero no impactará en un
                    turno abierto.
                  </p>
                )}

                {paymentError && <p className="form-error">{paymentError}</p>}
              </div>

              <div className="modal-footer">
                <button className="primary-button" disabled={savingPayment} type="submit">
                  {savingPayment ? "Procesando Cobro..." : "Confirmar Cobro e Imprimir Recibo"}
                </button>
                <button className="secondary-button" type="button" onClick={() => setSelectedClientForPayment(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingAccountClient && (
        <div className="modal-backdrop" onClick={() => setViewingAccountClient(null)}>
          <div className="modal-content" style={{ maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Estado de Cuenta - {viewingAccountClient.name}</h3>
              <button className="close-button" type="button" onClick={() => setViewingAccountClient(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <div>DNI: {viewingAccountClient.dni || "Sin registrar"}</div>
                  <div>Teléfono: {viewingAccountClient.phone || "Sin registrar"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Saldo Deudor Total:</div>
                  <div
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: 700,
                      color: (clientAccount?.total_debt ?? 0) > 0 ? "#ef4444" : "#10b981",
                    }}
                  >
                    {formatMoney(clientAccount?.total_debt ?? 0)}
                  </div>
                </div>
              </div>

              <h4 style={{ marginBottom: "8px" }}>Ventas Pendientes de Pago</h4>
              {clientAccount?.pending_sales.length === 0 ? (
                <EmptyState message="El cliente no tiene ventas adeudadas." />
              ) : (
                <div className="table-wrap" style={{ marginBottom: "16px" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Venta</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Pagado</th>
                        <th>Saldo Pendiente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientAccount?.pending_sales.map((s) => (
                        <tr key={s.sale_id}>
                          <td>#{s.sale_id}</td>
                          <td>{formatDate(s.sold_at)}</td>
                          <td>{formatMoney(s.total_amount)}</td>
                          <td>{formatMoney(s.total_paid)}</td>
                          <td style={{ fontWeight: 700, color: "#ef4444" }}>{formatMoney(s.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h4 style={{ marginBottom: "8px" }}>Historial de Pagos Realizados</h4>
              {clientAccount?.recent_payments.length === 0 ? (
                <EmptyState message="No se han registrado pagos aún." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Venta Asociada</th>
                        <th>Método</th>
                        <th>Monto Pagado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientAccount?.recent_payments.map((p) => (
                        <tr key={p.id}>
                          <td>{formatDate(p.paid_at)}</td>
                          <td>#{p.sale_id}</td>
                          <td>{paymentMethods[p.payment_method] ?? "Efectivo"}</td>
                          <td style={{ fontWeight: 700, color: "#10b981" }}>+{formatMoney(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="secondary-button" type="button" onClick={() => setViewingAccountClient(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {editingClient && (
        <div className="modal-backdrop" onClick={() => setEditingClient(null)}>
          <div className="modal-content" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Cliente</h3>
              <button className="close-button" type="button" onClick={() => setEditingClient(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={(e) => void submitEditClient(e)}>
              <div className="modal-body">
                <Field label="Nombre">
                  <input
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </Field>
                <Field label="DNI">
                  <input
                    value={editForm.dni}
                    onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
                  />
                </Field>
                <Field label="Teléfono">
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </Field>
              </div>
              <div className="modal-footer">
                <button className="secondary-button" type="button" onClick={() => setEditingClient(null)}>
                  Cancelar
                </button>
                <SubmitButton label="Guardar Cambios" saving={savingEdit} />
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={togglingClient !== null}
        title={togglingClient?.active ? "Dar de baja cliente" : "Reactivar cliente"}
        message={
          togglingClient?.active
            ? `¿Seguro que deseas dar de baja a "${togglingClient.name}"?`
            : `¿Deseas reactivar a "${togglingClient?.name ?? ""}"?`
        }
        confirmLabel={togglingClient?.active ? "Dar de baja" : "Reactivar"}
        danger={Boolean(togglingClient?.active)}
        loading={toggling}
        onConfirm={() => void confirmToggleClient()}
        onCancel={() => setTogglingClient(null)}
      />
    </div>
  );
}
