import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { LucideAngularModule, Menu, Search, X } from 'lucide-angular';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { buildWhatsAppLink } from '../../utils/whatsapp.util';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  readonly icons = { Menu, Search, X };
  readonly menuOpen = signal(false);
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly whatsappLink = buildWhatsAppLink(environment.whatsappMessageGeneral);
  readonly instagramLink = environment.instagramUrl;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.route.queryParamMap
      .pipe(
        map((params) => params.get('q') ?? ''),
        takeUntilDestroyed()
      )
      .subscribe((query) => {
        if (this.searchControl.value !== query) {
          this.searchControl.setValue(query, { emitEvent: false });
        }
      });
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  submitSearch(): void {
    const query = this.searchControl.value.trim();
    const currentParams = { ...this.route.snapshot.queryParams };

    if (query.length > 0) {
      currentParams['q'] = query;
      currentParams['page'] = 1;
    } else {
      currentParams['q'] = null;
      currentParams['page'] = null;
    }

    this.closeMenu();
    this.router.navigate(['/products'], { queryParams: currentParams });
  }
}
