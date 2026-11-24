import { useEffect, useRef } from "react";
import type { BusinessSettings, ReceiptData } from "../../shared/types/models";
import { formatDate, formatMoney, paymentMethods } from "../../shared/utils/formatters";

type ReceiptModalProps = {
  receipt: ReceiptData | null;
  business: BusinessSettings;
  onClose: () => void;
};

export function ReceiptModal({ receipt, business, onClose }: ReceiptModalProps) {
  const printButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (receipt) {
      const timer = setTimeout(() => {
        printButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [receipt]);

  if (!receipt) return null;

  const shopName = business.name.trim() || "GESTOCK";
  const shopSub = business.subtitle.trim() || "Sistema de Gestión Local";
  const footerMsg = business.footerMessage.trim() || "¡Gracias por su compra!";

  return (
    <div className="modal-backdrop print-only-modal" onClick={onClose}>
      <div className="modal-content" style={{ width: "90mm", maxWidth: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <h3>Comprobante Térmico</h3>
          <button className="close-button" type="button" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {receipt.type === "sale" ? (
            <div className="ticket-print-container">
              <div className="ticket-header">
                <h4>{shopName}</h4>
                <p>{shopSub}</p>
                {business.taxId && <p>CUIT/RUT: {business.taxId}</p>}
                {business.address && <p>{business.address}</p>}
                {business.phone && <p>Tel: {business.phone}</p>}
                <p style={{ marginTop: "4px" }}>Ticket Nro: #{receipt.data.id}</p>
                <p>Fecha: {formatDate(receipt.data.sold_at)}</p>
                <p>Cliente: {receipt.data.client?.name ?? "Consumidor Final"}</p>
                {receipt.data.client?.dni && <p>DNI: {receipt.data.client.dni}</p>}
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
                  {receipt.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.quantity} x {item.product.name}
                        {item.subtotal < item.unit_price * item.quantity && (
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
                <div>
                  Total: <strong>{formatMoney(receipt.data.total_amount)}</strong>
                </div>
                <div>
                  Método:{" "}
                  {receipt.data.payments?.length
                    ? paymentMethods[receipt.data.payments[0].payment_method ?? 0] ?? "Efectivo"
                    : "Cuenta Corriente"}
                </div>
                {receipt.cashReceived !== undefined && receipt.cashReceived > 0 && (
                  <>
                    <div>Recibido: {formatMoney(receipt.cashReceived)}</div>
                    {receipt.changeAmount !== undefined && receipt.changeAmount > 0 && (
                      <div>
                        Su Vuelto: <strong>{formatMoney(receipt.changeAmount)}</strong>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="ticket-footer">
                <p>{footerMsg}</p>
                <p>Conserve este ticket</p>
              </div>
            </div>
          ) : receipt.type === "cobranza" ? (
            <div className="ticket-print-container">
              <div className="ticket-header">
                <h4>{shopName}</h4>
                <p>Recibo de Cobranza / Pago a Cuenta</p>
                {business.taxId && <p>CUIT/RUT: {business.taxId}</p>}
                <p>Fecha: {formatDate(receipt.data.date)}</p>
                <p>Cliente: {receipt.data.clientName}</p>
                {receipt.data.clientDni && <p>DNI: {receipt.data.clientDni}</p>}
              </div>
              <div className="ticket-divider" />
              <table className="ticket-table">
                <tbody>
                  <tr>
                    <td>Monto Cobrado:</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{formatMoney(receipt.data.amount)}</td>
                  </tr>
                  <tr>
                    <td>Método de Pago:</td>
                    <td style={{ textAlign: "right" }}>{paymentMethods[receipt.data.paymentMethod] ?? "Efectivo"}</td>
                  </tr>
                  {receipt.data.saleId && (
                    <tr>
                      <td>Aplicado a Venta:</td>
                      <td style={{ textAlign: "right" }}>#{receipt.data.saleId}</td>
                    </tr>
                  )}
                  <tr style={{ fontWeight: "bold", borderTop: "1px dashed #000" }}>
                    <td>Saldo Restante:</td>
                    <td style={{ textAlign: "right", color: receipt.data.remainingDebt > 0 ? "red" : "black" }}>
                      {formatMoney(receipt.data.remainingDebt)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="ticket-divider" />
              <div className="ticket-footer">
                <p>Comprobante de pago oficial</p>
                <p>{footerMsg}</p>
              </div>
            </div>
          ) : (
            <div className="ticket-print-container">
              <div className="ticket-header">
                <h4>{shopName}</h4>
                <p>Arqueo Diario de Caja</p>
                <p>Cierre Nro: #{receipt.data.id}</p>
                <p>Apertura: {formatDate(receipt.data.opened_at)}</p>
                <p>Cierre: {formatDate(receipt.data.closed_at || receipt.data.opened_at)}</p>
              </div>
              <div className="ticket-divider" />
              <table className="ticket-table">
                <tbody>
                  <tr>
                    <td>Fondo Apertura:</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(receipt.data.opening_cash)}</td>
                  </tr>
                  <tr>
                    <td>Ventas en Efectivo:</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(receipt.data.cash_sales)}</td>
                  </tr>
                  <tr>
                    <td>Ventas Débito:</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(receipt.data.debit_sales)}</td>
                  </tr>
                  <tr>
                    <td>Ventas Crédito:</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(receipt.data.credit_sales)}</td>
                  </tr>
                  <tr>
                    <td>Ventas Transferencia:</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(receipt.data.transfer_sales)}</td>
                  </tr>
                  <tr style={{ fontWeight: "bold" }}>
                    <td>Efectivo Esperado:</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(receipt.data.expected_cash)}</td>
                  </tr>
                  <tr style={{ fontWeight: "bold" }}>
                    <td>Efectivo Contado:</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(receipt.data.counted_cash ?? 0)}</td>
                  </tr>
                  <tr style={{ fontWeight: "bold", borderTop: "1px dashed #000" }}>
                    <td>Diferencia:</td>
                    <td
                      style={{
                        textAlign: "right",
                        color:
                          (receipt.data.difference ?? 0) === 0
                            ? "black"
                            : (receipt.data.difference ?? 0) > 0
                              ? "blue"
                              : "red",
                      }}
                    >
                      {formatMoney(receipt.data.difference ?? 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="ticket-divider" />
              <div className="ticket-footer">
                <p>Informe de arqueo local diario</p>
                <p>{shopName} - Caja Controlada</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer no-print">
          <button ref={printButtonRef} className="primary-button" type="button" onClick={() => window.print()}>
            Imprimir Comprobante [Enter]
          </button>
          <button className="secondary-button" type="button" onClick={onClose}>
            Cerrar [Esc]
          </button>
        </div>
      </div>
    </div>
  );
}
