import { Routes } from '@angular/router';
import { ShellComponent } from './core/layout/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'products' },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products-page.component').then(
            (m) => m.ProductsPageComponent
          )
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/product-detail/product-detail-page.component').then(
            (m) => m.ProductDetailPageComponent
          )
      },
      {
        path: 'faq',
        loadComponent: () =>
          import('./features/faq/faq-page.component').then((m) => m.FaqPageComponent)
      },
      { path: '**', redirectTo: 'products' }
    ]
  }
];
