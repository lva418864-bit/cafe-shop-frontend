import type { OrderStatus } from '@/types/enums';

export interface OrderItemCustomizationRequest {
  group_id: number;
  option_id: number;
}

export interface OrderItemRequest {
  product_id: number;
  quantity: number;
  customizations?: OrderItemCustomizationRequest[];
}

export interface CreateOrderRequest {
  items: OrderItemRequest[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface OrderItemCustomizationResponse {
  id: number;
  group_id: number;
  group_name: string;
  option_id: number;
  option_name: string;
  extra_price: string;
}

export interface OrderItemResponse {
  id: number;
  product_id: number;
  product_name: string;
  product_image_url?: string | null;
  product_image_alt?: string | null;
  unit_price: string; // Decimal-as-string, see lib/decimal.ts
  quantity: number;
  subtotal: string;
  customizations?: OrderItemCustomizationResponse[];
}

export interface OrderResponse {
  id: number;
  user_id: number;
  status: OrderStatus;
  total_amount: string;
  created_at: string;
  items: OrderItemResponse[];
}
