import { CommonModule, formatNumber } from '@angular/common';
import { Component, Input, computed, Inject, LOCALE_ID, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Eye, MessageCircle } from 'lucide-angular';
import { ProductListItem } from '../../../core/models/product.model';
import { resolvePublicImage } from '../../../core/utils/image.util';
import { buildWhatsAppLink } from '../../../core/utils/whatsapp.util';
import { environment } from '../../../../environments/environment';
import { PricingService } from '../../../core/services/pricing.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  private _product!: ProductListItem;
  @Input({ required: true }) set product(value: ProductListItem) {
    this._product = value;
    void this.updatePrice();
  }
  get product(): ProductListItem {
    return this._product;
  }
  readonly icons = { Eye, MessageCircle };
  readonly displayPrice = signal<number | null>(null);

  readonly whatsappLink = computed(() => {
    const price = this.displayPrice();
    const formattedPrice = price === null ? '...' : formatNumber(price, this.locale, '1.0-0');
    const relativeUrl = this.router.serializeUrl(
      this.router.createUrlTree(['/products', this.product.id], {
        queryParams: this.route.snapshot.queryParams
      })
    );
    const productUrl = `${window.location.origin}${relativeUrl}`;
    const message = `${environment.whatsappMessageProduct}: ${this.product.title}. Precio: ARS ${formattedPrice}: ${productUrl}`;
    return buildWhatsAppLink(message);
  });

  readonly imageUrl = computed(() => resolvePublicImage(this.product.main_image_path));

  private priceRequestId = 0;

  constructor(
    @Inject(LOCALE_ID) private readonly locale: string,
    private readonly pricing: PricingService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  private async updatePrice(): Promise<void> {
    const requestId = ++this.priceRequestId;
    this.displayPrice.set(null);
    try {
      const price = await this.pricing.getFinalPriceArs(this.product);
      if (requestId === this.priceRequestId) {
        this.displayPrice.set(price);
      }
    } catch {
      if (requestId === this.priceRequestId) {
        this.displayPrice.set(null);
      }
    }
  }

  goToDetail(): void {
    this.router.navigate(['/products', this.product.id], {
      queryParams: this.route.snapshot.queryParams
    });
  }
}
