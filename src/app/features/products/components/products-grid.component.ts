import { Component, Input } from '@angular/core';
import { ProductListItem } from '../../../core/models/product.model';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-products-grid',
  standalone: true,
  imports: [ProductCardComponent],
  templateUrl: './products-grid.component.html',
  styleUrl: './products-grid.component.css'
})
export class ProductsGridComponent {
  @Input({ required: true }) products: ProductListItem[] = [];
}
