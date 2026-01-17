export interface Product {
  id: number;
  title: string;
  description: string | null;
  category_id: number | null;
  subcategory_id: number | null;
  brand_id: number | null;
  price: number;
  currency: string;
  is_imported: boolean;
  min_purchase_qty: number | null;
  is_active: boolean;
  main_image_path: string;
  created_at: string;
  updated_at: string;
}

export interface ProductListItem extends Product {
  category_name?: string | null;
  subcategory_name?: string | null;
  subcategory_slug?: string | null;
  brand_name?: string | null;
}
