import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { CatalogService } from '../../core/services/catalog.service';
import { FaqItem } from '../../core/models/faq.model';

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq-page.component.html',
  styleUrl: './faq-page.component.css'
})
export class FaqPageComponent {
  readonly items = signal<FaqItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor(private readonly catalog: CatalogService) {
    this.loadFaq();
  }

  async loadFaq(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const items = await this.catalog.getFaqItems();
      this.items.set(items);
    } catch {
      this.error.set('No pudimos cargar las preguntas frecuentes. Intenta nuevamente.');
    } finally {
      this.loading.set(false);
    }
  }
}
