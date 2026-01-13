import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-cards',
  standalone: true,
  templateUrl: './category-cards.component.html',
  styleUrl: './category-cards.component.css'
})
export class CategoryCardsComponent {
  @Input({ required: true }) categories: Category[] = [];
  @Output() selectCategory = new EventEmitter<Category>();
  @Output() viewAll = new EventEmitter<void>();
}
