export type Plan = "free" | "pro";

export const FREE_EXPORTS_PER_MONTH = 5;

/** Pode exportar? Pro: sempre. Grátis: até 5 exportações no mês. */
export function canExport(exportsThisMonth: number, plan: Plan | null): boolean {
  if (plan === "pro") return true;
  return exportsThisMonth < FREE_EXPORTS_PER_MONTH;
}

/** Modelos premium só exportam no plano Pro. */
export function canUseTemplate(isPremium: boolean, plan: Plan | null): boolean {
  return !isPremium || plan === "pro";
}

export function exportsLeft(exportsThisMonth: number, plan: Plan | null): number | null {
  if (plan === "pro") return null;
  return Math.max(0, FREE_EXPORTS_PER_MONTH - exportsThisMonth);
}
