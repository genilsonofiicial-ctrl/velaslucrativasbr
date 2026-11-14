import { useEffect, useState } from "react";

import type { ArtImage } from "@/lib/art-render";
import { supabase } from "@/integrations/supabase/client";
import { useStudio } from "@/stores/studio";
import { getTemplateFileUrls } from "@/lib/template-files.functions";
import { getPackImageUrls } from "@/lib/packs.functions";

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
    img.src = url;
  });
}

const cache = new Map<string, ArtImage>();

async function blobFromStorage(bucket: "templates" | "user-images", path: string): Promise<Blob> {
  let data: Blob | null = null;
  if (bucket === "templates") {
    const urls = await getTemplateFileUrls({ data: { paths: [path] } }).catch(() => ({}) as Record<string, string>);
    if (urls[path]) {
      const res = await fetch(urls[path]);
      if (res.ok) data = await res.blob();
    } else {
      // Admins can still read inactive template files directly.
      data = (await supabase.storage.from(bucket).download(path)).data;
    }
  } else {
    data = (await supabase.storage.from(bucket).download(path)).data;
  }
  if (!data) throw new Error("Não foi possível baixar a imagem.");
  if (path.toLowerCase().endsWith(".svg")) {
    return new Blob([await data.arrayBuffer()], { type: "image/svg+xml" });
  }
  return data;
}

interface State {
  key: string | null;
  image: ArtImage | null;
  loading: boolean;
  error: string | null;
}

/** Carrega a arte escolhida (modelo ou imagem própria) pronta para desenhar. */
export function useArtImage(): State {
  const template = useStudio((s) => s.template);
  const custom = useStudio((s) => s.custom);

  const key = custom
    ? custom.objectUrl
      ? `u:${custom.objectUrl}`
      : custom.path
        ? `p:${custom.path}`
        : null
    : template
      ? template.imageId
        ? `i:${template.imageId}`
        : `t:${template.imagePath}`
      : null;

  const [state, setState] = useState<State>({ key: null, image: null, loading: false, error: null });

  useEffect(() => {
    if (!key) {
      setState({ key: null, image: null, loading: false, error: null });
      return;
    }
    const cached = cache.get(key);
    if (cached) {
      setState({ key, image: cached, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ key, image: null, loading: true, error: null });
    (async () => {
      let url: string;
      if (custom?.objectUrl) {
        url = custom.objectUrl;
      } else if (custom?.path) {
        url = URL.createObjectURL(await blobFromStorage("user-images", custom.path));
      } else if (template?.packId && template.imageId) {
        const r = await getPackImageUrls({ data: { packId: template.packId, imageIds: [template.imageId] } }).catch((e: unknown) => {
          throw new Error(
            e instanceof Error && e.message.includes("PREMIUM")
              ? "Esta estampa é de um pack premium."
              : "Entre com seu e-mail para usar esta estampa.",
          );
        });
        const signed = r.images[0]?.url;
        if (!signed) throw new Error("Não foi possível abrir a estampa.");
        const res = await fetch(signed);
        if (!res.ok) throw new Error("Não foi possível baixar a estampa.");
        url = URL.createObjectURL(await res.blob());
      } else if (template) {
        url = URL.createObjectURL(await blobFromStorage("templates", template.imagePath));
      } else {
        return;
      }
      const img = await loadImage(url);
      const art: ArtImage = { source: img, width: img.naturalWidth, height: img.naturalHeight };
      cache.set(key, art);
      if (!cancelled) setState({ key, image: art, loading: false, error: null });
    })().catch((e: unknown) => {
      if (!cancelled) {
        setState({
          key,
          image: null,
          loading: false,
          error: e instanceof Error ? e.message : "Não foi possível abrir a imagem.",
        });
      }
    });
    return () => {
      cancelled = true;
    };
    // custom/template are read through the key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
