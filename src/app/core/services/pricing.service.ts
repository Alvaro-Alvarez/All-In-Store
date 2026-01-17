import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ProductListItem } from '../models/product.model';
import { IMPORT_COSTS } from '../config/import-costs.config';

interface BlueRateResponse {
  venta: number;
  fechaActualizacion?: string;
}

interface BlueRateCache {
  venta: number;
  fetchedAt: number;
  updatedAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PricingService {
  private readonly apiUrl = 'https://dolarapi.com/v1/dolares/blue';
  private readonly cacheKey = 'blue_rate_cache_v1';
  private readonly ttlMs = 60 * 60 * 1000;

  private inMemoryCache: BlueRateCache | null = null;
  private inflight: Promise<number> | null = null;

  constructor(private readonly http: HttpClient) {}

  async getFinalPriceArs(product: ProductListItem): Promise<number> {
    const currency = (product.currency ?? 'ARS').toUpperCase();
    const venta = currency === 'USD' ? await this.getBlueRateVenta() : null;
    return this.calculateFinalPrice(product, venta);
  }

  async getFinalPriceArsBatch(products: ProductListItem[]): Promise<Map<number, number>> {
    const needsUsd = products.some(
      (product) => (product.currency ?? 'ARS').toUpperCase() === 'USD'
    );
    const venta = needsUsd ? await this.getBlueRateVenta() : null;
    const entries = products.map((product) => [
      product.id,
      this.calculateFinalPrice(product, venta)
    ] as const);
    return new Map(entries);
  }

  private getImportCostsTotal(subcategorySlug?: string | null): number {
    const slug = subcategorySlug?.toLowerCase() ?? '';
    const costs =
      (slug && IMPORT_COSTS.bySubcategorySlug[slug]) || IMPORT_COSTS.default;
    return costs.reduce((total, item) => total + item.amount, 0);
  }

  private roundUpToTens(value: number): number {
    return Math.ceil(value / 10) * 10;
  }

  private calculateFinalPrice(product: ProductListItem, venta: number | null): number {
    const currency = (product.currency ?? 'ARS').toUpperCase();
    let basePrice = product.price;

    if (currency === 'USD') {
      basePrice = basePrice * (venta ?? 0);
    }

    if (product.is_imported) {
      basePrice += this.getImportCostsTotal(product.subcategory_slug);
    }

    return this.roundUpToTens(basePrice);
  }

  private async getBlueRateVenta(): Promise<number> {
    const cached = this.getValidCache();
    if (cached) {
      return cached.venta;
    }

    if (!this.inflight) {
      this.inflight = this.fetchBlueRateVenta();
    }

    try {
      return await this.inflight;
    } catch {
      const stale = this.readCache();
      if (stale) {
        return stale.venta;
      }
      throw new Error('No se pudo obtener la cotizacion del dolar blue.');
    } finally {
      this.inflight = null;
    }
  }

  private getValidCache(): BlueRateCache | null {
    if (this.inMemoryCache && !this.isExpired(this.inMemoryCache)) {
      return this.inMemoryCache;
    }

    const cached = this.readCache();
    if (!cached) {
      return null;
    }

    if (this.isExpired(cached)) {
      return null;
    }

    this.inMemoryCache = cached;
    return cached;
  }

  private isExpired(cache: BlueRateCache): boolean {
    return Date.now() - cache.fetchedAt > this.ttlMs;
  }

  private readCache(): BlueRateCache | null {
    try {
      const raw = localStorage.getItem(this.cacheKey);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as BlueRateCache;
      if (!Number.isFinite(parsed.venta) || !Number.isFinite(parsed.fetchedAt)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private writeCache(cache: BlueRateCache): void {
    this.inMemoryCache = cache;
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(cache));
    } catch {
      // Ignore storage errors; in-memory cache still works for this session.
    }
  }

  private async fetchBlueRateVenta(): Promise<number> {
    const response = await firstValueFrom(
      this.http.get<BlueRateResponse>(this.apiUrl)
    );
    const venta = Number(response.venta);
    if (!Number.isFinite(venta)) {
      throw new Error('Respuesta invalida de dolar blue.');
    }

    this.writeCache({
      venta,
      fetchedAt: Date.now(),
      updatedAt: response.fechaActualizacion ?? null
    });

    return venta;
  }
}
