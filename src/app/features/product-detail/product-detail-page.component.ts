import { CommonModule, formatNumber } from '@angular/common';
import { Component, computed, signal, Inject, LOCALE_ID } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, UrlTree } from '@angular/router';
import { LucideAngularModule, Share2, MessageCircle } from 'lucide-angular';
import { CatalogService } from '../../core/services/catalog.service';
import { ProductListItem } from '../../core/models/product.model';
import { ProductImage } from '../../core/models/product-image.model';
import { resolvePublicImage } from '../../core/utils/image.util';
import { buildWhatsAppLink } from '../../core/utils/whatsapp.util';
import { environment } from '../../../environments/environment';
import { PricingService } from '../../core/services/pricing.service';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { GalleryComponent } from './components/gallery.component';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    BreadcrumbsComponent,
    ToastComponent,
    GalleryComponent
  ],
  templateUrl: './product-detail-page.component.html',
  styleUrl: './product-detail-page.component.css'
})
export class ProductDetailPageComponent {
  readonly icons = { Share2, MessageCircle };

  readonly product = signal<ProductListItem | null>(null);
  readonly images = signal<string[]>([]);
  readonly priceArs = signal<number | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly toastVisible = signal(false);
  readonly toastMessage = signal('Link copiado');

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const product = this.product();
    const params = this.route.snapshot.queryParams;
    const items: BreadcrumbItem[] = [
      {
        label: 'Productos',
        url: this.router.createUrlTree(['/products'], { queryParams: params })
      }
    ];

    if (!product) {
      return items;
    }

    if (product.category_id && product.category_name) {
      items.push({
        label: product.category_name,
        url: this.router.createUrlTree(['/products'], {
          queryParams: { ...params, cat: product.category_id, sub: null, page: null }
        })
      });
    }

    if (product.subcategory_id && product.subcategory_name) {
      items.push({
        label: product.subcategory_name,
        url: this.router.createUrlTree(['/products'], {
          queryParams: {
            ...params,
            cat: product.category_id ?? null,
            sub: product.subcategory_id,
            page: null
          }
        })
      });
    }

    items.push({ label: product.title });
    return items;
  });

  readonly whatsappLink = computed(() => {
    const product = this.product();
    if (!product) {
      return '#';
    }
    const price = this.priceArs();
    const formattedPrice = price === null ? '...' : formatNumber(price, this.locale, '1.0-0');
    const message = `${environment.whatsappMessageProduct}: ${product.title}. Precio: ARS ${formattedPrice}: ${window.location.href}`;
    return buildWhatsAppLink(message);
  });

  constructor(
    @Inject(LOCALE_ID) private readonly locale: string,
    private readonly pricing: PricingService,
    private readonly catalog: CatalogService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.loadProduct();
  }

  private priceRequestId = 0;

  get backLink(): UrlTree {
    return this.router.createUrlTree(['/products'], {
      queryParams: this.route.snapshot.queryParams
    });
  }

  async loadProduct(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;

    if (!Number.isFinite(id)) {
      this.error.set('Producto no encontrado.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const [product, images] = await Promise.all([
        this.catalog.getProductById(id),
        this.catalog.getProductImages(id)
      ]);

      if (!product) {
        this.error.set('Producto no encontrado.');
        return;
      }

      this.product.set(product);
      this.images.set(this.mergeImages(product.main_image_path, images));
      await this.updatePrice(product);
    } catch {
      this.error.set('No pudimos cargar este producto. Intenta nuevamente.');
    } finally {
      this.loading.set(false);
    }
  }

  private async updatePrice(product: ProductListItem): Promise<void> {
    const requestId = ++this.priceRequestId;
    this.priceArs.set(null);
    try {
      const price = await this.pricing.getFinalPriceArs(product);
      if (requestId === this.priceRequestId) {
        this.priceArs.set(price);
      }
    } catch {
      if (requestId === this.priceRequestId) {
        this.priceArs.set(null);
      }
    }
  }

  mergeImages(mainImage: string, images: ProductImage[]): string[] {
    const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
    return [mainImage, ...sorted.map((image) => image.image_path)]
      .map((path) => resolvePublicImage(path))
      .filter(Boolean);
  }

  async shareLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.showToast('Link copiado');
    } catch {
      this.showToast('No se pudo copiar el link');
    }
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 2000);
  }
}
