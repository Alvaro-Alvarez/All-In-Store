import { Component, EventEmitter, Input, Output, computed } from '@angular/core';

@Component({
  selector: 'app-paginator',
  standalone: true,
  templateUrl: './paginator.component.html',
  styleUrl: './paginator.component.css'
})
export class PaginatorComponent {
  @Input({ required: true }) page = 1;
  @Input({ required: true }) pageSize = 20;
  @Input({ required: true }) total = 0;
  @Output() pageChange = new EventEmitter<number>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total / this.pageSize)));

  readonly pages = computed(() => {
    const totalPages = this.totalPages();
    const current = this.page;
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(totalPages, start + windowSize - 1);

    if (end - start + 1 < windowSize) {
      start = Math.max(1, end - windowSize + 1);
    }

    const result: number[] = [];
    for (let i = start; i <= end; i += 1) {
      result.push(i);
    }
    return result;
  });

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page) {
      return;
    }
    this.pageChange.emit(page);
  }
}
