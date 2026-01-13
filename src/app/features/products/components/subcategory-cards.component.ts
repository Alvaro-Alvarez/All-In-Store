import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule, LucideIconData, LucideIcons } from 'lucide-angular';
import { icons } from 'lucide-angular/src/icons';
import { Subcategory } from '../../../core/models/subcategory.model';

@Component({
  selector: 'app-subcategory-cards',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './subcategory-cards.component.html',
  styleUrl: './subcategory-cards.component.css'
})
export class SubcategoryCardsComponent {
  @Input({ required: true }) subcategories: Subcategory[] = [];
  @Output() selectSubcategory = new EventEmitter<Subcategory>();

  private readonly iconMap = icons as unknown as LucideIcons;
  private readonly fallbackIcon = this.iconMap['Box'];

  getIcon(name?: string | null): LucideIconData {
    if (!name) {
      return this.fallbackIcon;
    }
    const direct = this.iconMap[name];
    if (direct) {
      return direct;
    }
    const normalized = this.toPascalCase(name);
    return this.iconMap[normalized] ?? this.fallbackIcon;
  }

  private toPascalCase(value: string): string {
    return value
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('');
  }
}
