/** Only allow same-site paths like "/minhas-velas" — never external URLs. */
export function safeRedirect(value: string | undefined, fallback = "/minhas-velas"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
