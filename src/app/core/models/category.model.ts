export interface Category {
  id: number;
  name: string;
  slug: string;
  icon_name: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
