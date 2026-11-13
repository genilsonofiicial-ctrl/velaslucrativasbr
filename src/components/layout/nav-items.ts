import { BookOpen, Heart, LayoutGrid, Sparkles } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/estudio", label: "Estúdio", icon: Sparkles },
  { to: "/biblioteca", label: "Biblioteca", icon: LayoutGrid },
  { to: "/minhas-velas", label: "Minhas velas", icon: Heart },
  { to: "/guia", label: "Guia", icon: BookOpen },
] as const;
