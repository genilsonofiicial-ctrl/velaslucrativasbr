export type PaymentEnv = 'sandbox' | 'live';
export async function paymentFetch(env: PaymentEnv, path: string, init?: RequestInit) {
  const connection = process.env[env === 'sandbox' ? 'PADDLE_SANDBOX_API_KEY' : 'PADDLE_LIVE_API_KEY'];
  const key = process.env['LOVABLE_API_KEY'];
  if (!connection || !key) throw new Error('Pagamentos não configurados.');
  const response = await fetch(`https://connector-gateway.lovable.dev/paddle${path}`, { ...init, headers: { 'Content-Type': 'application/json', 'X-Connection-Api-Key': connection, 'Lovable-API-Key': key, ...init?.headers } });
  if (!response.ok) throw new Error(`Pagamento indisponível (${response.status}).`);
  return response.json();
}
export async function verifyPaymentSignature(body: string, signature: string | null, env: PaymentEnv) {
  const secret = process.env[env === 'sandbox' ? 'PAYMENTS_SANDBOX_WEBHOOK_SECRET' : 'PAYMENTS_LIVE_WEBHOOK_SECRET'];
  if (!secret || !signature) return false;
  const parts = signature.split(';');
  const timestamp = parts.find(p => p.startsWith('ts='))?.slice(3);
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  for (const part of parts.filter(p => p.startsWith('h1='))) {
    const hex = part.slice(3);
    if (!/^[a-f0-9]{64}$/i.test(hex)) continue;
    const bytes = Uint8Array.from(hex.match(/.{2}/g) ?? [], value => parseInt(value, 16));
    if (await crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(`${timestamp}:${body}`))) return true;
  }
  return false;
}
