import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { Subcategory } from '../../../core/models/subcategory.model';
import { ProductSort } from '../../../core/services/catalog.service';

export interface ProductsFiltersState {
  categoryId: number | null;
  subcategoryId: number | null;
  query: string;
  minPrice: number | null;
  maxPrice: number | null;
  isImported: boolean | null;
  hasMinPurchase: boolean | null;
  sort: ProductSort;
  page: number;
}

@Component({
  selector: 'app-filters-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filters-bar.component.html',
  styleUrl: './filters-bar.component.css'
})
export class FiltersBarComponent implements OnChanges {
  @Input({ required: true }) categories: Category[] = [];
  @Input({ required: true }) subcategories: Subcategory[] = [];
  @Input({ required: true }) filters!: ProductsFiltersState;

  @Output() updateFilters = new EventEmitter<Partial<ProductsFiltersState>>();

  readonly minInput = signal<number | null>(null);
  readonly maxInput = signal<number | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']) {
      this.minInput.set(this.filters.minPrice ?? null);
      this.maxInput.set(this.filters.maxPrice ?? null);
    }
  }

  onCategoryChange(value: number | null): void {
    const categoryId = value ?? null;
    this.updateFilters.emit({ categoryId, subcategoryId: null, page: 1 });
  }

  onSubcategoryChange(value: number | null): void {
    const subcategoryId = value ?? null;
    this.updateFilters.emit({ subcategoryId, page: 1 });
  }

  onSortChange(value: string): void {
    const sort = (value as ProductSort) ?? 'newest';
    this.updateFilters.emit({ sort, page: 1 });
  }

  toggleImported(checked: boolean): void {
    this.updateFilters.emit({ isImported: checked ? true : null, page: 1 });
  }

  toggleMinPurchase(checked: boolean): void {
    this.updateFilters.emit({ hasMinPurchase: checked ? true : null, page: 1 });
  }

  applyPriceRange(): void {
    this.updateFilters.emit({
      minPrice: this.minInput(),
      maxPrice: this.maxInput(),
      page: 1
    });
  }

  parseNumber(value: string | number | null): number | null {
    if (value === null || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
