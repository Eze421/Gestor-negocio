import type { ModuleCardItem } from "../types";

export const moduleCards: ModuleCardItem[] = [
  {
    key: "dashboard",
    name: "Dashboard",
    status: "Planificado",
    description: "Resumen general del negocio, alertas y metricas clave.",
  },
  {
    key: "ventas",
    name: "Ventas",
    status: "Planificado",
    description: "Registro de ventas, detalle de items y medios de pago.",
  },
  {
    key: "caja",
    name: "Caja",
    status: "Planificado",
    description: "Aperturas, cierres, movimientos y control diario.",
  },
  {
    key: "cobros",
    name: "Cobros",
    status: "Planificado",
    description: "Seguimiento de pagos pendientes y cuenta corriente.",
  },
  {
    key: "inventario",
    name: "Inventario",
    status: "Planificado",
    description: "Stock, categorias, costos y actualizaciones de productos.",
  },
  {
    key: "clientes",
    name: "Clientes",
    status: "Planificado",
    description: "Ficha de clientes, historial y estados de cuenta.",
  },
];
