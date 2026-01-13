import { Component, Input, computed, signal } from '@angular/core';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css'
})
export class GalleryComponent {
  @Input({ required: true }) images: string[] = [];

  readonly icons = { ChevronLeft, ChevronRight };
  readonly index = signal(0);

  readonly currentImage = computed(() => this.images[this.index()] ?? '');
  readonly lightboxOpen = signal(false);

  prev(): void {
    if (this.index() > 0) {
      this.index.update((value) => value - 1);
    }
  }

  next(): void {
    if (this.index() < this.images.length - 1) {
      this.index.update((value) => value + 1);
    }
  }

  select(index: number): void {
    if (index >= 0 && index < this.images.length) {
      this.index.set(index);
    }
  }

  openLightbox(): void {
    if (!this.currentImage()) {
      return;
    }
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }
}
