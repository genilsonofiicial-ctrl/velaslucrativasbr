export const FREE_PRINT_EXPORTS = 7;
export const PRICES = { monthly: { id: 'studio_velas_monthly', cents: 1990 }, annual: { id: 'studio_velas_annual', cents: 19900 } } as const;
export function annualComparison() { const monthlyYear = PRICES.monthly.cents * 12; return { monthlyYear: monthlyYear / 100, saving: (monthlyYear - PRICES.annual.cents) / 100, percent: (monthlyYear - PRICES.annual.cents) / monthlyYear * 100, monthly: PRICES.annual.cents / 1200, daily: PRICES.annual.cents / 36500 }; }
export function billingEnvironment(): 'sandbox' | 'live' { return import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN']?.startsWith('test_') ? 'sandbox' : 'live'; }
export function subscriptionActive(status: string, end: string | null, now = Date.now()) { return ['active', 'trialing', 'past_due', 'canceled'].includes(status) && (end ? Date.parse(end) > now : status !== 'canceled'); }
