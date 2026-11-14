export type Plan = "free" | "pro";

export const EMAIL_COOLDOWN_MINUTES = 10;
export const EMAIL_DAILY_LIMIT = 10;
export const EMAIL_LINK_DAYS = 7;
export const MIN_PACK_IMAGES = 3;
export const MAX_PACK_IMAGES = 6;
export const MAX_PACK_IMAGE_MB = 15;

export const PACK_LICENSE =
  "Uso na produção das suas velas. É proibido revender, compartilhar ou redistribuir os arquivos.";

/** Pack grátis: qualquer pessoa logada. Premium: só plano Pro. */
export function canAccessPack(isPremium: boolean, plan: Plan | null | undefined): boolean {
  return !isPremium || plan === "pro";
}

/** Limites de envio por e-mail. Retorna a mensagem de bloqueio, ou null se pode enviar. */
export function emailLimitError(
  sent: { template_id: string | null; created_at: string }[],
  packId: string,
  now: Date = new Date(),
): string | null {
  const t = now.getTime();
  const lastDay = sent.filter((s) => t - new Date(s.created_at).getTime() < 24 * 60 * 60 * 1000);
  if (lastDay.length >= EMAIL_DAILY_LIMIT) return "Você atingiu o limite de 10 envios por dia. Tente amanhã.";
  const recentSame = lastDay.some(
    (s) => s.template_id === packId && t - new Date(s.created_at).getTime() < EMAIL_COOLDOWN_MINUTES * 60 * 1000,
  );
  if (recentSame) return "Este pack já foi enviado há pouco. Aguarde 10 minutos para pedir de novo.";
  return null;
}
