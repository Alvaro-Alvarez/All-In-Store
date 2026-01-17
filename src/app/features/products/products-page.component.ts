import { CommonModule } from '@angular/common';
import { Component, computed, effect, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Category } from '../../core/models/category.model';
import { Subcategory } from '../../core/models/subcategory.model';
import { ProductListItem } from '../../core/models/product.model';
import { CatalogService, ProductSort } from '../../core/services/catalog.service';
import { PricingService } from '../../core/services/pricing.service';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { CategoryCardsComponent } from './components/category-cards.component';
import { SubcategoryCardsComponent } from './components/subcategory-cards.component';
import { FiltersBarComponent, ProductsFiltersState } from './components/filters-bar.component';
import { ProductsGridComponent } from './components/products-grid.component';

interface ParsedQueryState {
  filters: ProductsFiltersState;
  viewMode: 'categories' | 'subcategories' | 'products';
}

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    CategoryCardsComponent,
    SubcategoryCardsComponent,
    FiltersBarComponent,
    ProductsGridComponent,
    PaginatorComponent
  ],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.css'
})
export class ProductsPageComponent {
  readonly categories = signal<Category[]>([]);
  readonly subcategories = signal<Subcategory[]>([]);
  readonly products = signal<ProductListItem[]>([]);
  readonly totalCount = signal(0);

  readonly categoriesLoading = signal(true);
  readonly categoriesError = signal<string | null>(null);
  readonly productsLoading = signal(false);
  readonly productsError = signal<string | null>(null);
  readonly subcategoriesLoading = signal(false);

  readonly viewMode = signal<'categories' | 'subcategories' | 'products'>('categories');

  readonly filters = signal<ProductsFiltersState>({
    categoryId: null,
    subcategoryId: null,
    query: '',
    minPrice: null,
    maxPrice: null,
    isImported: null,
    hasMinPurchase: null,
    sort: 'newest',
    page: 1
  });

  readonly selectedCategory = computed(() => {
    const categoryId = this.filters().categoryId;
    return this.categories().find((category) => category.id === categoryId) ?? null;
  });

  readonly selectedSubcategory = computed(() => {
    const subcategoryId = this.filters().subcategoryId;
    return this.subcategories().find((subcategory) => subcategory.id === subcategoryId) ?? null;
  });

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [
      {
        label: 'Productos',
        url: this.router.createUrlTree(['/products'])
      }
    ];

    const category = this.selectedCategory();
    const subcategory = this.selectedSubcategory();
    const viewMode = this.viewMode();

    if (category) {
      items.push({
        label: category.name,
        url:
          subcategory != null || viewMode === 'products'
            ? this.router.createUrlTree(['/products'], {
                queryParams: { cat: category.id }
              })
            : null
      });
    }

    if (subcategory) {
      items.push({ label: subcategory.name });
    }

    return items;
  });

  readonly showBreadcrumbs = computed(() => this.viewMode() !== 'categories');

  readonly skeletonItems = Array.from({ length: 6 });

  private productsRequestId = 0;
  private subcategoriesRequestId = 0;

  constructor(
    private readonly catalog: CatalogService,
    private readonly pricing: PricingService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.loadCategories();

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const parsed = this.parseQueryParams(params);
      this.filters.set(parsed.filters);
      this.viewMode.set(parsed.viewMode);

      if (parsed.viewMode !== 'products') {
        this.products.set([]);
        this.totalCount.set(0);
        this.productsError.set(null);
      }
    });

    effect(
      () => {
      const categoryId = this.filters().categoryId;
      if (!categoryId) {
        this.subcategories.set([]);
        return;
      }
      this.loadSubcategories(categoryId);
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
      const view = this.viewMode();
      const filters = this.filters();
      if (view !== 'products') {
        return;
      }
      this.loadProducts(filters);
      },
      { allowSignalWrites: true }
    );
  }

  private parseQueryParams(params: import('@angular/router').ParamMap): ParsedQueryState {
    const categoryId = this.toNumber(params.get('cat'));
    const subcategoryId = this.toNumber(params.get('sub'));
    const query = (params.get('q') ?? '').trim();
    const minPrice = this.toNumber(params.get('min'));
    const maxPrice = this.toNumber(params.get('max'));
    const isImported = this.toBoolean(params.get('imp'));
    const hasMinPurchase = this.toBoolean(params.get('minbuy'));
    const sort = this.toSort(params.get('sort')) ?? 'newest';
    const page = this.toNumber(params.get('page')) ?? 1;

    const hasProductParams =
      params.has('q') ||
      params.has('page') ||
      params.has('min') ||
      params.has('max') ||
      params.has('imp') ||
      params.has('minbuy') ||
      params.has('sort') ||
      params.has('sub');

    const viewMode = hasProductParams
      ? 'products'
      : categoryId
        ? 'subcategories'
        : 'categories';

    return {
      filters: {
        categoryId,
        subcategoryId,
        query,
        minPrice,
        maxPrice,
        isImported,
        hasMinPurchase,
        sort,
        page
      },
      viewMode
    };
  }

  private toNumber(value: string | null): number | null {
    if (value === null || value.trim() === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toBoolean(value: string | null): boolean | null {
    if (value === null) {
      return null;
    }
    return value === '1' || value.toLowerCase() === 'true';
  }

  private toSort(value: string | null): ProductSort | null {
    if (value === 'cheap' || value === 'expensive' || value === 'newest') {
      return value;
    }
    return null;
  }

  private navigateWithParams(queryParams: Record<string, any>): void {
    this.router.navigate([], { relativeTo: this.route, queryParams });
  }

  async loadCategories(): Promise<void> {
    this.categoriesLoading.set(true);
    this.categoriesError.set(null);

    try {
      const categories = await this.catalog.getCategories();
      this.categories.set(categories);
    } catch {
      this.categoriesError.set('No pudimos cargar las categorias. Intenta nuevamente.');
    } finally {
      this.categoriesLoading.set(false);
    }
  }

  async loadSubcategories(categoryId: number): Promise<void> {
    const requestId = ++this.subcategoriesRequestId;
    this.subcategoriesLoading.set(true);

    try {
      const subcategories = await this.catalog.getSubcategories(categoryId);
      if (requestId !== this.subcategoriesRequestId) {
        return;
      }
      this.subcategories.set(subcategories);
    } catch {
      if (requestId !== this.subcategoriesRequestId) {
        return;
      }
      this.subcategories.set([]);
    } finally {
      if (requestId === this.subcategoriesRequestId) {
        this.subcategoriesLoading.set(false);
      }
    }
  }

  async loadProducts(filters: ProductsFiltersState): Promise<void> {
    const requestId = ++this.productsRequestId;
    this.productsLoading.set(true);
    this.productsError.set(null);

    try {
      const useClientPrice =
        filters.minPrice != null ||
        filters.maxPrice != null ||
        filters.sort === 'cheap' ||
        filters.sort === 'expensive';
      const fetchPageSize = useClientPrice ? 500 : 20;

      const response = await this.catalog.getProducts({
        page: useClientPrice ? 1 : filters.page,
        pageSize: fetchPageSize,
        categoryId: filters.categoryId ?? undefined,
        subcategoryId: filters.subcategoryId ?? undefined,
        query: filters.query || undefined,
        minPrice: useClientPrice ? undefined : filters.minPrice ?? undefined,
        maxPrice: useClientPrice ? undefined : filters.maxPrice ?? undefined,
        isImported: filters.isImported ?? undefined,
        hasMinPurchase: filters.hasMinPurchase ?? undefined,
        sort: useClientPrice ? 'newest' : filters.sort
      });

      if (requestId !== this.productsRequestId) {
        return;
      }

      if (!useClientPrice) {
        this.products.set(response.items);
        this.totalCount.set(response.totalCount);
        return;
      }

      const priceMap = await this.pricing.getFinalPriceArsBatch(response.items);
      if (requestId !== this.productsRequestId) {
        return;
      }

      let filtered = response.items.filter((item) => {
        const price = priceMap.get(item.id);
        if (price == null) {
          return false;
        }
        if (filters.minPrice != null && price < filters.minPrice) {
          return false;
        }
        if (filters.maxPrice != null && price > filters.maxPrice) {
          return false;
        }
        return true;
      });

      if (filters.sort === 'cheap') {
        filtered = filtered.sort(
          (a, b) => (priceMap.get(a.id) ?? 0) - (priceMap.get(b.id) ?? 0)
        );
      } else if (filters.sort === 'expensive') {
        filtered = filtered.sort(
          (a, b) => (priceMap.get(b.id) ?? 0) - (priceMap.get(a.id) ?? 0)
        );
      }

      const pageSize = 20;
      const start = (filters.page - 1) * pageSize;
      const paged = filtered.slice(start, start + pageSize);

      this.products.set(paged);
      this.totalCount.set(filtered.length);
    } catch {
      if (requestId !== this.productsRequestId) {
        return;
      }
      this.productsError.set('No pudimos cargar los productos. Intenta nuevamente.');
    } finally {
      if (requestId === this.productsRequestId) {
        this.productsLoading.set(false);
      }
    }
  }

  selectCategory(category: Category): void {
    this.navigateWithParams({ cat: category.id });
  }

  viewAllProducts(): void {
    this.navigateWithParams({ page: 1, sort: 'newest' });
  }

  backToCategories(): void {
    this.navigateWithParams({});
  }

  backToSubcategories(): void {
    const categoryId = this.filters().categoryId;
    if (!categoryId) {
      this.navigateWithParams({});
      return;
    }
    this.navigateWithParams({ cat: categoryId });
  }

  selectSubcategory(subcategory: Subcategory): void {
    const categoryId = this.filters().categoryId;
    this.navigateWithParams({ cat: categoryId, sub: subcategory.id, page: 1, sort: 'newest' });
  }

  updateFilters(patch: Partial<ProductsFiltersState>): void {
    const current = this.filters();
    const next: ProductsFiltersState = {
      ...current,
      ...patch,
      sort: patch.sort ?? current.sort ?? 'newest'
    };

    this.navigateWithParams({
      cat: next.categoryId ?? null,
      sub: next.subcategoryId ?? null,
      q: next.query || null,
      min: next.minPrice ?? null,
      max: next.maxPrice ?? null,
      imp: next.isImported ? 1 : null,
      minbuy: next.hasMinPurchase ? 1 : null,
      sort: next.sort ?? 'newest',
      page: next.page ?? 1
    });
  }

  changePage(page: number): void {
    this.updateFilters({ page });
  }

  clearSearch(): void {
    this.updateFilters({ query: '', page: 1 });
  }
}
