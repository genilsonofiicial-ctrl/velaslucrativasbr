import { billingEnvironment } from './billing';
import { checkoutDetails } from './billing.functions';
type PaddleClient = { Environment: { set: (env: string) => void }; Initialize: (options: { token: string }) => void; Checkout: { open: (options: unknown) => void } };
declare global { interface Window { Paddle?: PaddleClient } }
let initialization: Promise<void> | undefined;
export async function openSubscription(priceId: 'studio_velas_monthly' | 'studio_velas_annual') {
  const details = await checkoutDetails({ data: { priceId, environment: billingEnvironment() } });
  const token = import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN'];
  if (!token) throw new Error('Pagamentos não configurados.');
  initialization ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script'); script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.onload = () => { if (!window.Paddle) { reject(new Error('Checkout indisponível.')); return; } window.Paddle.Environment.set(billingEnvironment() === 'sandbox' ? 'sandbox' : 'production'); window.Paddle.Initialize({ token }); resolve(); };
    script.onerror = () => { initialization = undefined; reject(new Error('Não foi possível abrir o pagamento.')); }; document.head.appendChild(script);
  });
  await initialization;
  window.Paddle?.Checkout.open({ items: [{ priceId: details.priceId, quantity: 1 }], customer: details.email ? { email: details.email } : undefined, customData: { userId: details.userId }, settings: { displayMode: 'overlay', locale: 'pt', allowLogout: false, successUrl: `${window.location.origin}/assinatura` } });
}
