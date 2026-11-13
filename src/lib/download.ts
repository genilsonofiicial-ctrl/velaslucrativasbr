export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** No celular abre o menu de compartilhar (ex.: "Salvar em Arquivos"); no computador baixa. */
export async function deliverFile(blob: Blob, filename: string) {
  try {
    const file = new File([blob], filename, { type: blob.type });
    const touch = matchMedia("(pointer: coarse)").matches;
    if (touch && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return;
      } catch (e) {
        if ((e as DOMException).name === "AbortError") return;
      }
    }
  } catch {
    // segue para o download normal
  }
  downloadBlob(blob, filename);
}

export function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "vela"
  );
}
