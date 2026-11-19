import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";

export function FavoriteButton({ imageId }: { imageId: string }) {
  const { favorites, toggle, user } = useFavorites();
  if (!user) return <Button asChild variant="outline" size="icon" title="Entrar para favoritar"><Link to="/entrar" aria-label="Entrar para favoritar"><Heart /></Link></Button>;
  const selected = favorites.has(imageId);
  return <Button variant="outline" size="icon" aria-label={selected ? "Remover dos favoritos" : "Adicionar aos favoritos"} title={selected ? "Remover dos favoritos" : "Adicionar aos favoritos"} aria-pressed={selected} disabled={toggle.isPending} onClick={() => toggle.mutate(imageId)}><Heart className={selected ? "fill-primary text-primary" : ""} /></Button>;
}