import type { BusinessSettings, CajaStatus, Loadable } from "../types/models";

export const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

export const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

export const saleStatuses = ["Pendiente", "Parcial", "Pagada", "Anulada"];
export const purchaseStatuses = ["A Pagar", "Parcial", "Pagada", "Anulada"];
export const paymentMethods = ["Efectivo", "Débito", "Crédito", "Transferencia"];

export const initialLoadable = <T,>(data: T): Loadable<T> => ({
  data,
  loading: true,
  error: null,
});

export const initialCajaStatus: CajaStatus = {
  is_open: false,
  closing_id: null,
  opened_at: null,
  opening_cash: 0,
  cash_sales: 0,
  debit_sales: 0,
  credit_sales: 0,
  transfer_sales: 0,
  total_sales: 0,
  manual_in: 0,
  manual_out: 0,
  expected_cash: 0,
};

export const defaultBusinessSettings: BusinessSettings = {
  name: "GESTOCK",
  subtitle: "Sistema de Gestión Local",
  taxId: "",
  address: "",
  phone: "",
  footerMessage: "¡Gracias por su compra!",
};

export function loadBusinessSettings(): BusinessSettings {
  try {
    const raw = localStorage.getItem("gestock_business_settings");
    if (!raw) return defaultBusinessSettings;
    return { ...defaultBusinessSettings, ...JSON.parse(raw) };
  } catch {
    return defaultBusinessSettings;
  }
}

export function saveBusinessSettings(settings: BusinessSettings): void {
  localStorage.setItem("gestock_business_settings", JSON.stringify(settings));
}

export function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]): void {
  const escapeCell = (val: string | number | boolean | null | undefined) => {
    const str = val == null ? "" : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent =
    "\uFEFF" +
    [headers.map(escapeCell).join(","), ...rows.map((r) => r.map(escapeCell).join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
