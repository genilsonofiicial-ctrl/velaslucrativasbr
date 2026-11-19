import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
const environment = z.enum(['sandbox', 'live']);
function serverEnvironment(): 'sandbox' | 'live' { return import.meta.env.DEV ? 'sandbox' : 'live'; }
function verifiedEnvironment(env: 'sandbox' | 'live') { if (env !== serverEnvironment()) throw new Error('Ambiente de pagamento inválido.'); return env; }
export const getBilling = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((d: unknown) => z.object({ environment }).parse(d)).handler(async ({ data, context }) => {
  const env = verifiedEnvironment(data.environment);
  const [access, usage, subscription, payments] = await Promise.all([
    context.supabase.rpc('has_paid_access', { _user_id: context.userId, _env: env }),
    context.supabase.from('print_exports').select('id', { count: 'exact', head: true }).eq('charged_free', true).eq('user_id', context.userId),
    context.supabase.from('subscriptions').select('*').eq('user_id', context.userId).eq('environment', env).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    context.supabase.from('payment_history').select('*').eq('user_id', context.userId).eq('environment', env).order('occurred_at', { ascending: false }).limit(10),
  ]);
  if (access.error || usage.error || subscription.error || payments.error) throw new Error('Não foi possível consultar seu acesso.');
  return { paid: access.data === true, used: usage.count ?? 0, remaining: Math.max(0, 7 - (usage.count ?? 0)), subscription: subscription.data, payments: payments.data ?? [] };
});
export const authorizeExport = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((d: unknown) => z.object({ exportId: z.string().uuid(), format: z.enum(['pdf', 'png']), environment, templateId: z.string().uuid().nullable() }).parse(d)).handler(async ({ data, context }) => {
  const env = verifiedEnvironment(data.environment);
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: result, error } = await supabaseAdmin.rpc('authorize_print_export', { _user_id: context.userId, _export_id: data.exportId, _format: data.format, _env: env, ...(data.templateId ? { _template_id: data.templateId } : {}) });
  if (error) throw new Error('Não foi possível autorizar a exportação. Tente novamente.');
  return z.object({ ok: z.boolean(), reason: z.enum(['premium', 'limit']).optional(), remaining: z.number().optional(), paid: z.boolean().optional() }).parse(result);
});
export const checkoutDetails = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((d: unknown) => z.object({ priceId: z.enum(['studio_velas_monthly', 'studio_velas_annual']), environment }).parse(d)).handler(async ({ data, context }) => {
  const env = verifiedEnvironment(data.environment);
  const { paymentFetch } = await import('@/lib/payments.server');
  const result = await paymentFetch(env, `/prices?external_id=${encodeURIComponent(data.priceId)}`);
  const price = result.data?.[0];
  if (!price?.id) throw new Error('Preço indisponível.');
  return { priceId: String(price.id), userId: context.userId, email: typeof context.claims['email'] === 'string' ? context.claims['email'] : undefined };
});
export const customerPortal = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((d: unknown) => z.object({ environment }).parse(d)).handler(async ({ data, context }) => {
  const env = verifiedEnvironment(data.environment);
  const { data: subscription, error } = await context.supabase.from('subscriptions').select('paddle_customer_id,paddle_subscription_id').eq('user_id', context.userId).eq('environment', env).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error || !subscription) throw new Error('Você ainda não tem uma assinatura.');
  const { paymentFetch } = await import('@/lib/payments.server');
  const result = await paymentFetch(env, `/customers/${subscription.paddle_customer_id}/portal-sessions`, { method: 'POST', body: JSON.stringify({ subscription_ids: [subscription.paddle_subscription_id] }) });
  return String(result.data.urls.general.overview);
});
