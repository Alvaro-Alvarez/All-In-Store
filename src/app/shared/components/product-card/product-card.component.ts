import { CommonModule } from '@angular/common';
import { Component, Input, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Eye, MessageCircle } from 'lucide-angular';
import { ProductListItem } from '../../../core/models/product.model';
import { resolvePublicImage } from '../../../core/utils/image.util';
import { buildWhatsAppLink } from '../../../core/utils/whatsapp.util';

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
    const price = this.product.currency
      ? `${this.product.currency} ${this.product.price}`
      : `${this.product.price}`;
    const message = `Hola! Me interesa el producto: ${this.product.title}. Precio: ${price}. Me pasas info de pago y envio?`;
    return buildWhatsAppLink(message);
  });

  readonly imageUrl = computed(() => resolvePublicImage(this.product.main_image_path));

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  goToDetail(): void {
    this.router.navigate(['/products', this.product.id], {
      queryParams: this.route.snapshot.queryParams
    });
  }
}
