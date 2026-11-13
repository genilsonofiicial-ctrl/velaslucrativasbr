export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Valida a imagem enviada; devolve a mensagem de erro em português ou null. */
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Use uma imagem PNG, JPG ou WEBP.";
  }
  if (file.size > MAX_IMAGE_BYTES) return "A imagem passa de 10 MB. Escolha uma menor.";
  return null;
}

export function extensionFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}
