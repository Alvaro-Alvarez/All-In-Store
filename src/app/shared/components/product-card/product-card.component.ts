import { CommonModule, formatNumber } from '@angular/common';
import { Component, Input, computed, Inject, LOCALE_ID } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Eye, MessageCircle } from 'lucide-angular';
import { ProductListItem } from '../../../core/models/product.model';
import { resolvePublicImage } from '../../../core/utils/image.util';
import { buildWhatsAppLink } from '../../../core/utils/whatsapp.util';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductListItem;
  readonly icons = { Eye, MessageCircle };

  readonly whatsappLink = computed(() => {
    const formattedPrice = formatNumber(this.product.price, this.locale, '1.0-0');
    const price = this.product.currency
      ? `${this.product.currency} ${formattedPrice}`
      : formattedPrice;
    const message = `${environment.whatsappMessageProduct}: ${this.product.title}. Precio: ${price}.`;
    return buildWhatsAppLink(message);
  });

  readonly imageUrl = computed(() => resolvePublicImage(this.product.main_image_path));

  constructor(
    @Inject(LOCALE_ID) private readonly locale: string,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  goToDetail(): void {
    this.router.navigate(['/products', this.product.id], {
      queryParams: this.route.snapshot.queryParams
    });
  }
}
