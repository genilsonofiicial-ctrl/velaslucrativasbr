import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
const eventSchema = z.object({ event_id: z.string(), event_type: z.string(), occurred_at: z.string().datetime(), data: z.record(z.string(), z.any()) });
export const Route = createFileRoute('/api/public/payments/webhook')({ server: { handlers: { POST: async ({ request }) => {
  const env = new URL(request.url).searchParams.get('env');
  if (env !== 'sandbox' && env !== 'live') return new Response('Invalid environment', { status: 400 });
  const { verifyPaymentSignature, paymentFetch } = await import('@/lib/payments.server');
  const body = await request.text();
  if (!await verifyPaymentSignature(body, request.headers.get('paddle-signature'), env)) return new Response('Invalid webhook signature', { status: 401 });
  try {
    const event = eventSchema.parse(JSON.parse(body));
    const supported = ['subscription.created', 'subscription.updated', 'subscription.canceled', 'transaction.completed', 'transaction.payment_failed', 'transaction.canceled'];
    if (!supported.includes(event.event_type)) return Response.json({ received: true });
    if (event.event_type.startsWith('subscription.')) {
      const item = event.data['items']?.[0];
      const priceId = item?.price?.import_meta?.external_id;
      let productId = item?.product?.import_meta?.external_id;
      if (!productId && item?.price?.product_id) productId = (await paymentFetch(env, `/products/${item.price.product_id}`)).data?.import_meta?.external_id;
      if (productId !== 'studio_velas_access' || !['studio_velas_monthly', 'studio_velas_annual'].includes(priceId)) throw new Error('Unknown subscription catalog');
      event.data['app_product_id'] = productId;
      event.data['app_price_id'] = priceId;
    }
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.rpc('apply_payment_event', { _event_id: event.event_id, _env: env, _type: event.event_type, _occurred: event.occurred_at, _data: event.data });
    if (error) throw error;
    return Response.json({ received: true });
  } catch { console.error('Payment event processing failed'); return new Response('Webhook processing failed', { status: 500 }); }
} } } });
