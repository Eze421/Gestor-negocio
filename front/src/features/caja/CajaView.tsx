import { type FormEvent, useEffect, useRef, useState } from "react";
import { apiPost } from "../../shared/api/client";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { DataTable, Field, Panel, SubmitButton } from "../../shared/components/UI";
import { useToast } from "../../shared/context/ToastContext";
import type { CajaClosing, CajaStatus, Loadable } from "../../shared/types/models";
import { formatDate, formatMoney } from "../../shared/utils/formatters";

type CajaViewProps = {
  cajaStatus: Loadable<CajaStatus>;
  cajaHistory: Loadable<CajaClosing[]>;
  onRefreshCaja: () => Promise<void> | void;
  onPrintArqueo: (record: CajaClosing) => void;
};

export function CajaView({ cajaStatus, cajaHistory, onRefreshCaja, onPrintArqueo }: CajaViewProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"daily" | "history">("daily");
  const [openingCashInput, setOpeningCashInput] = useState("");
  const [countedCashInput, setCountedCashInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementConcept, setMovementConcept] = useState("");
  const [movementType, setMovementType] = useState<"in" | "out">("out");
  const [savingMovement, setSavingMovement] = useState(false);
  const [openingSaving, setOpeningSaving] = useState(false);
  const [closingSaving, setClosingSaving] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openingCashRef = useRef<HTMLInputElement>(null);
  const countedCashRef = useRef<HTMLInputElement>(null);

  const statusData = cajaStatus.data;
  const expectedCash = statusData.expected_cash;
  const difference = (Number(countedCashInput) || 0) - expectedCash;

  useEffect(() => {
    if (activeTab === "daily" && !statusData.is_open) {
      setTimeout(() => {
        openingCashRef.current?.focus();
      }, 50);
    }
  }, [activeTab, statusData.is_open]);

  const openCaja = async (e: FormEvent) => {
    e.preventDefault();
    const cash = Number(openingCashInput);
    if (isNaN(cash) || cash < 0) {
      setError("Ingrese un monto inicial válido.");
      return;
    }

    setOpeningSaving(true);
    setError(null);
    try {
      await apiPost<CajaStatus>("/cash/open", { opening_cash: cash });
      setOpeningCashInput("");
      showToast("Caja abierta correctamente", "success");
      await onRefreshCaja();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al abrir la caja";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setOpeningSaving(false);
    }
  };

  const submitMovement = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(movementAmount);
    if (!amount || amount <= 0) {
      setError("El monto del movimiento debe ser mayor a 0.");
      return;
    }
    if (!movementConcept.trim()) {
      setError("Indique un concepto para el movimiento.");
      return;
    }

    setSavingMovement(true);
    setError(null);
    try {
      await apiPost("/cash/movements", {
        amount,
        concept: movementConcept.trim(),
        movement_type: movementType,
      });
      setMovementAmount("");
      setMovementConcept("");
      showToast("Movimiento de caja registrado", "success");
      await onRefreshCaja();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar movimiento";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSavingMovement(false);
    }
  };

  const requestCloseCaja = () => {
    if (countedCashInput === "") {
      setError("Ingrese el monto de efectivo físicamente contado.");
      countedCashRef.current?.focus();
      return;
    }
    setError(null);
    setConfirmCloseOpen(true);
  };

  const confirmCloseCaja = async () => {
    setClosingSaving(true);
    setError(null);
    try {
      const closing = await apiPost<CajaClosing>("/cash/close", {
        counted_cash: Number(countedCashInput),
        notes: notesInput.trim() || null,
      });
      setCountedCashInput("");
      setNotesInput("");
      setConfirmCloseOpen(false);
      showToast("Cierre de caja registrado", "success");
      await onRefreshCaja();
      onPrintArqueo(closing);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cerrar la caja";
      setError(msg);
      showToast(msg, "error");
      setConfirmCloseOpen(false);
    } finally {
      setClosingSaving(false);
    }
  };

  return (
    <div className="stack">
      <div className="tabs-header">
        <button
          className={`tab-button ${activeTab === "daily" ? "active" : ""}`}
          onClick={() => setActiveTab("daily")}
          type="button"
        >
          Caja Chica y Arqueo Diario
        </button>
        <button
          className={`tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
          type="button"
        >
          Historial de Cierres
        </button>
      </div>

      {error && (
        <div className="notice" style={{ background: "rgba(239,68,68,0.1)", borderColor: "#ef4444", color: "#c5221f" }}>
          {error}
        </div>
      )}

      {activeTab === "daily" ? (
        !statusData.is_open ? (
          <form className="form-panel" onSubmit={(e) => void openCaja(e)} style={{ maxWidth: "440px" }}>
            <h3>Apertura de Caja Diaria</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Ingresa el monto de saldo en efectivo disponible en el cajón de dinero al iniciar el turno.
            </p>
            <Field label="Monto Inicial en Efectivo ($)">
              <input
                ref={openingCashRef}
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej. 5000"
                value={openingCashInput}
                onChange={(e) => setOpeningCashInput(e.target.value)}
              />
            </Field>
            <SubmitButton label="Iniciar Jornada / Abrir Caja" saving={openingSaving} />
          </form>
        ) : (
          <div className="pos-container">
            <div className="stack">
              <div className="panel">
                <h3 style={{ marginBottom: "12px" }}>Estado de Caja Activa</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                  Iniciada el: <strong>{statusData.opened_at ? formatDate(statusData.opened_at) : "Hoy"}</strong>
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="sale-total">
                    <span>Efectivo de Apertura</span>
                    <strong>{formatMoney(statusData.opening_cash)}</strong>
                  </div>
                  <div className="sale-total" style={{ borderLeft: "4px solid var(--color-primary)" }}>
                    <span>Efectivo de Ventas</span>
                    <strong>{formatMoney(statusData.cash_sales)}</strong>
                  </div>
                  <div className="sale-total">
                    <span>Ingresos Manuales</span>
                    <strong style={{ color: "#10b981" }}>+{formatMoney(statusData.manual_in)}</strong>
                  </div>
                  <div className="sale-total">
                    <span>Egresos / Retiros</span>
                    <strong style={{ color: "#ef4444" }}>-{formatMoney(statusData.manual_out)}</strong>
                  </div>
                </div>
              </div>

              <div className="panel">
                <h3 style={{ marginBottom: "16px" }}>Desglose de Ventas del Turno</h3>
                <DataTable
                  columns={["Método de Pago", "Total"]}
                  rows={[
                    ["Efectivo en Ventas", formatMoney(statusData.cash_sales)],
                    ["Débito", formatMoney(statusData.debit_sales)],
                    ["Crédito", formatMoney(statusData.credit_sales)],
                    ["Transferencia", formatMoney(statusData.transfer_sales)],
                    ["Total General de Ventas", formatMoney(statusData.total_sales)],
                  ]}
                />
              </div>

              <form className="panel" onSubmit={(e) => void submitMovement(e)} style={{ padding: "16px" }}>
                <h4 style={{ marginBottom: "12px" }}>Movimiento Rápido de Caja</h4>
                <div className="form-row">
                  <Field label="Tipo">
                    <select value={movementType} onChange={(e) => setMovementType(e.target.value as "in" | "out")}>
                      <option value="out">Egreso / Retiro / Gasto</option>
                      <option value="in">Ingreso Extra / Aporte</option>
                    </select>
                  </Field>
                  <Field label="Monto ($)">
                    <input
                      min="0.01"
                      step="0.01"
                      type="number"
                      required
                      placeholder="0.00"
                      value={movementAmount}
                      onChange={(e) => setMovementAmount(e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Concepto / Motivo">
                  <input
                    required
                    placeholder="Ej. Flete de mercadería, Pago de limpieza..."
                    value={movementConcept}
                    onChange={(e) => setMovementConcept(e.target.value)}
                  />
                </Field>
                <button className="secondary-button" style={{ marginTop: "8px" }} disabled={savingMovement} type="submit">
                  {savingMovement ? "Registrando..." : "Registrar Movimiento"}
                </button>
              </form>
            </div>

            <div className="form-panel">
              <h3>Arqueo y Cierre</h3>
              <Field label="Efectivo Esperado en Caja">
                <input readOnly className="readonly-input" value={formatMoney(expectedCash)} />
              </Field>
              <Field label="Efectivo Contado (Físicamente)">
                <input
                  ref={countedCashRef}
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ingrese el conteo real..."
                  value={countedCashInput}
                  onChange={(e) => setCountedCashInput(e.target.value)}
                />
              </Field>

              <Field label="Observaciones / Notas de Cierre">
                <input
                  placeholder="Notas adicionales..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                />
              </Field>

              <div className="sale-total" style={{ margin: "6px 0" }}>
                <span>Diferencia</span>
                <strong
                  style={{
                    color: difference === 0 ? "var(--text-primary)" : difference > 0 ? "#10b981" : "#ef4444",
                  }}
                >
                  {formatMoney(difference)}
                </strong>
              </div>

              {difference !== 0 && countedCashInput !== "" && (
                <div
                  className="notice"
                  style={{
                    background: difference > 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                    borderColor: difference > 0 ? "#10b981" : "#ef4444",
                    color: difference > 0 ? "#137333" : "#c5221f",
                  }}
                >
                  {difference > 0
                    ? `💰 Sobrante detectado de ${formatMoney(difference)}`
                    : `⚠️ Faltante detectado de ${formatMoney(Math.abs(difference))}`}
                </div>
              )}

              <button className="primary-button" onClick={requestCloseCaja} disabled={closingSaving} type="button">
                {closingSaving ? "Cerrando Caja..." : "Registrar Cierre e Imprimir Arqueo"}
              </button>
            </div>
          </div>
        )
      ) : (
        <Panel title="Historial de Arqueos Registrados">
          <DataTable
            columns={["Fecha Cierre", "Apertura", "Ventas Efec.", "Esperado", "Contado", "Diferencia", "Notas", "Acciones"]}
            rows={cajaHistory.data.map((h) => {
              const diff = h.difference ?? 0;
              return [
                formatDate(h.closed_at || h.opened_at),
                formatMoney(h.opening_cash),
                formatMoney(h.cash_sales),
                formatMoney(h.expected_cash),
                formatMoney(h.counted_cash ?? 0),
                diff === 0
                  ? "Cuadrada"
                  : diff > 0
                    ? `Sobrante (+${formatMoney(diff)})`
                    : `Faltante (-${formatMoney(Math.abs(diff))})`,
                h.notes || "-",
                <button
                  onClick={() => onPrintArqueo(h)}
                  style={{ color: "var(--color-primary)", fontWeight: 700 }}
                  type="button"
                  key={h.id}
                >
                  Imprimir
                </button>,
              ];
            })}
          />
        </Panel>
      )}

      <ConfirmDialog
        open={confirmCloseOpen}
        title="Confirmar Cierre de Caja"
        message={`¿Confirmas el cierre de la caja actual con ${formatMoney(Number(countedCashInput || 0))} contados? (Diferencia: ${formatMoney(difference)})`}
        confirmLabel="Cerrar Caja e Imprimir"
        loading={closingSaving}
        onConfirm={() => void confirmCloseCaja()}
        onCancel={() => setConfirmCloseOpen(false)}
      />
    </div>
  );
}
