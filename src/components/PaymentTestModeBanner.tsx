import { billingEnvironment } from '@/lib/billing';
export function PaymentTestModeBanner() { if (billingEnvironment() !== 'sandbox') return null; return <div className="border-b border-gold bg-accent px-4 py-2 text-center text-xs text-primary">Pagamentos em teste: nenhuma cobrança real é realizada na prévia.</div>; }
