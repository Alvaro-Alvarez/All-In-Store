import { Injectable } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { Category } from '../models/category.model';
import { Subcategory } from '../models/subcategory.model';
import { ProductListItem } from '../models/product.model';
import { ProductImage } from '../models/product-image.model';
import { FaqItem } from '../models/faq.model';

export type ProductSort = 'cheap' | 'expensive' | 'newest';

export interface ProductsQueryParams {
  page: number;
  pageSize: number;
  categoryId?: number | null;
  subcategoryId?: number | null;
  query?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  isImported?: boolean | null;
  hasMinPurchase?: boolean | null;
  sort?: ProductSort | null;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  constructor(private readonly supabase: SupabaseClientService) {}

  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async getSubcategories(categoryId: number): Promise<Subcategory[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('subcategories')
      .select('*')
      .eq('is_active', true)
      .eq('category_id', categoryId)
      .order('sort_order');

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async getProducts(params: ProductsQueryParams): Promise<{ items: ProductListItem[]; totalCount: number }> {
    const { page, pageSize } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    type RelatedName = { name: string };
    type RelatedMaybeArray = RelatedName | RelatedName[] | null;
    type ProductRow = ProductListItem & {
      categories?: RelatedMaybeArray;
      subcategories?: RelatedMaybeArray;
      brands?: RelatedMaybeArray;
    };

    let query = this.supabase
      .getClient()
      .from('products')
      .select(
        'id,title,description,price,currency,is_imported,min_purchase_qty,main_image_path,created_at,updated_at,is_active,category_id,subcategory_id,brand_id, categories:categories(name), subcategories:subcategories(name), brands:brands(name)',
        { count: 'exact' }
      )
      .eq('is_active', true);

    if (params.categoryId) {
      query = query.eq('category_id', params.categoryId);
    }

    if (params.subcategoryId) {
      query = query.eq('subcategory_id', params.subcategoryId);
    }

    if (params.minPrice != null) {
      query = query.gte('price', params.minPrice);
    }

    if (params.maxPrice != null) {
      query = query.lte('price', params.maxPrice);
    }

    if (params.isImported != null) {
      query = query.eq('is_imported', params.isImported);
    }

    if (params.hasMinPurchase) {
      query = query.not('min_purchase_qty', 'is', null).gte('min_purchase_qty', 2);
    }

    if (params.query) {
      const like = `%${params.query}%`;
      query = query.or(`title.ilike.${like},description.ilike.${like}`);
    }

    switch (params.sort) {
      case 'cheap':
        query = query.order('price', { ascending: true });
        break;
      case 'expensive':
        query = query.order('price', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw error;
    }

    const items = (data ?? []).map((item) => {
      const row = item as ProductRow;
      return {
        ...row,
        category_name: this.extractName(row.categories),
        subcategory_name: this.extractName(row.subcategories),
        brand_name: this.extractName(row.brands)
      };
    });

    return {
      items,
      totalCount: count ?? 0
    };
  }

  async getProductById(id: number): Promise<ProductListItem | null> {
    type RelatedName = { name: string };
    type RelatedMaybeArray = RelatedName | RelatedName[] | null;
    type ProductRow = ProductListItem & {
      categories?: RelatedMaybeArray;
      subcategories?: RelatedMaybeArray;
      brands?: RelatedMaybeArray;
    };

    const { data, error } = await this.supabase
      .getClient()
      .from('products')
      .select(
        'id,title,description,price,currency,is_imported,min_purchase_qty,main_image_path,created_at,updated_at,is_active,category_id,subcategory_id,brand_id, categories:categories(name), subcategories:subcategories(name), brands:brands(name)'
      )
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const row = data as ProductRow;
    return {
      ...data,
      category_name: this.extractName(row.categories),
      subcategory_name: this.extractName(row.subcategories),
      brand_name: this.extractName(row.brands)
    };
  }

  private extractName(value: { name: string } | { name: string }[] | null | undefined): string | null {
    if (!value) {
      return null;
    }
    if (Array.isArray(value)) {
      return value[0]?.name ?? null;
    }
    return value.name ?? null;
  }

  async getProductImages(productId: number): Promise<ProductImage[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order');

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async getFaqItems(): Promise<FaqItem[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('faq_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      throw error;
    }

    return data ?? [];
  }
}
