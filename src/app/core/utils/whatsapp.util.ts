import { environment } from '../../../environments/environment';

export function buildWhatsAppLink(message: string): string {
  const phone = environment.whatsappPhone;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}
