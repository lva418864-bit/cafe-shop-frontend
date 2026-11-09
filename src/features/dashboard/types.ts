// Mirrors report_service's schemas/report_schema.py exactly (Step 1).
export interface SyncResultResponse {
  users_synced: number;
  products_synced: number;
  orders_synced: number;
}

export interface SalesSummaryResponse {
  start_date: string;
  end_date: string;
  total_orders: number;
  paid_orders: number;
  cancelled_orders: number;
  total_revenue: string; // Decimal-as-string
  average_order_value: string;
}

export interface DailySalesPoint {
  day: string;
  order_count: number;
  revenue: string;
}

export interface TopProductResponse {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  revenue: string;
}

export interface InventoryAlertResponse {
  product_id: number;
  product_name: string;
  stock_quantity: number;
}

export interface UserSummaryResponse {
  total_users: number;
  active_users: number;
  inactive_users: number;
  new_users_in_range: number;
  users_by_role: Record<string, number>;
}
