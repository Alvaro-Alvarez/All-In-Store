import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Subcategory } from '../../../core/models/subcategory.model';

@Component({
  selector: 'app-subcategory-cards',
  standalone: true,
  templateUrl: './subcategory-cards.component.html',
  styleUrl: './subcategory-cards.component.css'
})
export class SubcategoryCardsComponent {
  @Input({ required: true }) subcategories: Subcategory[] = [];
  @Output() selectSubcategory = new EventEmitter<Subcategory>();
}
