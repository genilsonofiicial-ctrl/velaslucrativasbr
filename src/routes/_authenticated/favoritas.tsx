import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/library/FavoriteButton";
import { useFavorites } from "@/hooks/useFavorites";
import { activeTemplatesQuery } from "@/lib/templates";

export const Route = createFileRoute("/_authenticated/favoritas")({
  head: () => ({ meta: [
    { title: "Minhas Favoritas — Stúdio Velas Lucrativas" },
    { name: "description", content: "Suas estampas favoritas para criar novas velas." },
    { property: "og:title", content: "Minhas Favoritas — Stúdio Velas Lucrativas" },
    { property: "og:description", content: "Suas estampas favoritas reunidas em um lugar." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: FavoritesPage,
});
function FavoritesPage() {
  const { favorites, isLoading, isError } = useFavorites();
  const packs = useQuery(activeTemplatesQuery);
  const images = (packs.data ?? []).flatMap((pack) => pack.images.filter((image) => favorites.has(image.id)).map((image) => ({ image, pack })));
  return <div className="mx-auto max-w-6xl px-4 py-10"><h1 className="text-3xl font-semibold text-primary">Minhas Favoritas</h1>
    {isLoading || packs.isLoading ? <p className="mt-6">Carregando…</p> : isError || packs.isError ? <p className="mt-6 text-destructive">Não foi possível carregar suas favoritas. Tente novamente.</p> : images.length === 0 ? <div className="py-12 text-center"><Heart className="mx-auto size-8 text-gold" /><p className="mt-3">Nenhuma estampa favorita ainda.</p><Button asChild variant="gold" className="mt-4"><Link to="/biblioteca">Abrir biblioteca</Link></Button></div> :
    <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">{images.map(({ image, pack }) => <li key={image.id} className="card-soft overflow-hidden">{image.thumbUrl && <img src={image.thumbUrl} alt={image.title ?? pack.title} className="aspect-square w-full object-contain" />}<div className="space-y-3 p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{image.title ?? pack.title}</span><FavoriteButton imageId={image.id} /></div><p className="text-xs text-muted-foreground">{pack.theme}</p><Button asChild variant="wine" className="w-full"><Link to="/biblioteca/$id" params={{ id: pack.id }}>Abrir estampa</Link></Button></div></li>)}</ul>}
  </div>;
}