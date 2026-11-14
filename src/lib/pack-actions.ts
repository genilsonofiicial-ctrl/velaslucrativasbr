import { downloadBlob, slugify } from "@/lib/download";
import { PACK_LICENSE } from "@/lib/pack-rules";

export type PackAction = { type: "email" | "download" | "studio"; packId: string; imageId?: string };
type Pending = PackAction & { marketing: boolean; at: number };

const KEY = "svl_pending_pack";

export function savePendingAction(a: PackAction, marketing: boolean) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...a, marketing, at: Date.now() } satisfies Pending));
  } catch {
    // sem armazenamento: a pessoa só precisa clicar de novo
  }
}

/** Lê e apaga a ação pendente (válida por 2 dias). */
export function takePendingAction(packId: string): Pending | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Pending;
    if (p.packId !== packId) return null;
    localStorage.removeItem(KEY);
    if (Date.now() - p.at > 2 * 24 * 60 * 60 * 1000) return null;
    return p;
  } catch {
    return null;
  }
}

export function openUnlock(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function extFrom(path: string) {
  const m = /\.([a-z0-9]+)$/i.exec(path);
  return m ? m[1]!.toLowerCase() : "png";
}

/** Monta o ZIP no navegador com as estampas e um TXT de licença. */
export async function downloadPackZip(
  title: string,
  images: { title: string; path: string; url: string | null }[],
) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  let n = 0;
  for (const img of images) {
    if (!img.url) continue;
    const res = await fetch(img.url);
    if (!res.ok) continue;
    n++;
    zip.file(`${String(n).padStart(2, "0")}-${slugify(img.title)}.${extFrom(img.path)}`, await res.blob());
  }
  if (n === 0) throw new Error("Não foi possível baixar as estampas.");
  zip.file("LICENCA.txt", `${title}\n\n${PACK_LICENSE}\n`);
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `${slugify(title)}.zip`);
}
