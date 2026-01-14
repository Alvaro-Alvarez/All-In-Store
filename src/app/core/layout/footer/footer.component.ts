import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { buildWhatsAppLink } from '../../utils/whatsapp.util';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
  readonly whatsappLink = buildWhatsAppLink(environment.whatsappMessageGeneral);
  readonly instagramLink = environment.instagramUrl;
}
