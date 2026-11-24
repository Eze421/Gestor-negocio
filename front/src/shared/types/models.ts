export type Category = {
  id: number;
  name: string;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  sku: string | null;
  barcode: string | null;
  active: boolean;
  categories: Category[];
};

export type Client = {
  id: number;
  dni: string | null;
  name: string;
  phone: string | null;
  active: boolean;
  total_debt?: number;
};

export type ClientPendingSale = {
  sale_id: number;
  sold_at: string;
  total_amount: number;
  total_paid: number;
  balance: number;
};

export type ClientPaymentHistory = {
  id: number;
  sale_id: number;
  amount: number;
  payment_method: number;
  paid_at: string;
};

export type ClientAccount = {
  client: Client;
  total_debt: number;
  pending_sales: ClientPendingSale[];
  recent_payments: ClientPaymentHistory[];
};

export type Supplier = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  products: Product[];
};

export type PurchaseItem = {
  id: number;
  product_id: number;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  product: Product;
};

export type PurchasePayment = {
  id: number;
  amount: number;
  payment_method: number;
  paid_at: string;
};

export type Purchase = {
  id: number;
  purchased_at: string;
  invoice_number: string | null;
  total_amount: number;
  status: number;
  notes: string | null;
  supplier: Supplier;
  items: PurchaseItem[];
  payments: PurchasePayment[];
  summary: {
    total_amount: number;
    total_paid: number;
    balance: number;
    status: number;
  };
};

export type SaleItem = {
  id: number;
  quantity: number;
  unit_price: number;
  unit_cost?: number;
  discount_rate: number;
  subtotal: number;
  product: Product;
};

export type SalePayment = {
  id: number;
  amount: number;
  payment_method: number;
  paid_at: string;
  is_excess: boolean;
};

export type Sale = {
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

export type Loadable<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

export type StockMovement = {
  id: number;
  product_id: number;
  product_name?: string | null;
  product_sku?: string | null;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  current_stock: number;
  reference_id?: number | null;
  reference_type?: string | null;
  notes?: string | null;
  created_at: string;
};

export type ProductPerformance = {
  product_id: number;
  product_name: string;
  sku?: string | null;
  quantity_sold: number;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  profit_margin_percent: number;
};

export type ProfitabilitySummary = {
  period: string;
  start_date?: string | null;
  end_date?: string | null;
  total_sales_revenue: number;
  total_cost_of_sales: number;
  gross_profit: number;
  profit_margin_percent: number;
  total_sales_count: number;
  inventory_cost_value: number;
  inventory_sale_value: number;
  top_selling_products: ProductPerformance[];
  top_profitable_products: ProductPerformance[];
};

export type CajaStatus = {
  is_open: boolean;
  closing_id: number | null;
  opened_at: string | null;
  opening_cash: number;
  cash_sales: number;
  debit_sales: number;
  credit_sales: number;
  transfer_sales: number;
  total_sales: number;
  manual_in: number;
  manual_out: number;
  expected_cash: number;
};

export type CajaClosing = {
  id: number;
  opened_at: string;
  closed_at: string | null;
  opening_cash: number;
  cash_sales: number;
  debit_sales: number;
  credit_sales: number;
  transfer_sales: number;
  total_sales: number;
  expected_cash: number;
  counted_cash: number | null;
  difference: number | null;
  notes: string | null;
  is_closed: boolean;
};

export type BusinessSettings = {
  name: string;
  subtitle: string;
  taxId: string;
  address: string;
  phone: string;
  footerMessage: string;
};

export type ReceiptData =
  | { type: "sale"; data: Sale; cashReceived?: number; changeAmount?: number }
  | { type: "arqueo"; data: CajaClosing }
  | {
      type: "cobranza";
      data: {
        clientName: string;
        clientDni?: string | null;
        amount: number;
        paymentMethod: number;
        remainingDebt: number;
        saleId?: number | null;
        date: string;
      };
    };
