import type { CategoryResponse } from '../category/types';

export interface CustomizationOptionResponse {
  id: number;
  name: string;
  extra_price: string;
}

export interface CustomizationGroupResponse {
  id: number;
  name: string;
  is_required: boolean;
  selection_type: 'single' | 'multiple';
  options: CustomizationOptionResponse[];
}

export interface CustomizationOptionCreate {
  name: string;
  extra_price: number;
}

export interface CustomizationGroupCreate {
  name: string;
  is_required: boolean;
  selection_type: 'single' | 'multiple';
  options: CustomizationOptionCreate[];
}

export interface ProductImageResponse {
  id: string;
  product_id: number;
  storage_key: string;
  url: string;
  original_filename?: string | null;
  content_type: string;
  size_bytes: number;
  width: number;
  height: number;
  alt_text?: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  created_by?: number | null;
}

export interface UpdateProductImageRequest {
  alt_text?: string | null;
  is_primary?: boolean;
  sort_order?: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  price: string; // Decimal serialized as string - see lib/decimal.ts
  stock_quantity: number;
  is_active: boolean;
  image_url?: string | null;
  image_alt?: string | null;
  images?: ProductImageResponse[];
  category_id: number;
  category: CategoryResponse;
  customization_groups: CustomizationGroupResponse[];
}

export interface CreateProductRequest {
  name: string;
  description?: string | null;
  price: number;
  initial_stock?: number;
  category_id: number;
  customization_groups?: CustomizationGroupCreate[];
}

export interface UpdateProductRequest {
  name: string;
  description?: string | null;
  price: number;
  is_active: boolean;
  category_id: number;
  customization_groups?: CustomizationGroupCreate[];
}

export interface AdjustStockRequest {
  change_quantity: number;
  reason?: 'restock' | 'adjustment';
  reference?: string | null;
}
