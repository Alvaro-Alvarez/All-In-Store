import { CommonModule } from '@angular/common';
import { Component, Input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Eye, MessageCircle } from 'lucide-angular';
import { ProductListItem } from '../../../core/models/product.model';
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
}
