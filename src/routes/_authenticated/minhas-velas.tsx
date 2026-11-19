import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Copy, Crown, Flame, FolderOpen, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCm } from "@/lib/candle";
import { FREE_EXPORTS_PER_MONTH } from "@/lib/plan";
import { inputsFromProject, transformFromJson, type ProjectRow } from "@/lib/projects";
import { useStudio, type TemplateRef } from "@/stores/studio";

export const Route = createFileRoute("/_authenticated/minhas-velas")({
  head: () => ({
    meta: [
      { title: "Minhas velas — Stúdio Velas Lucrativas" },
      { name: "description", content: "Seus projetos de vela salvos: abra, duplique, renomeie ou apague." },
      { property: "og:title", content: "Minhas velas — Stúdio Velas Lucrativas" },
      { property: "og:description", content: "Seus projetos de vela salvos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <MinhasVelas />
    </ProtectedRoute>
  ),
});

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

function MinhasVelas() {
  const { user, plan } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const loadProject = useStudio((s) => s.loadProject);
  const [renaming, setRenaming] = useState<ProjectRow | null>(null);
  const [newName, setNewName] = useState("");
  const [deleting, setDeleting] = useState<ProjectRow | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  const { data: projetos, isLoading, isError, refetch } = useQuery({
    queryKey: ["projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["projects"] });

  const rename = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("projects").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nome atualizado.");
      setRenaming(null);
      invalidate();
    },
    onError: () => toast.error("Não foi possível renomear. Tente de novo."),
  });

  const duplicate = useMutation({
    mutationFn: async (p: ProjectRow) => {
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...rest } = p;
      const { error } = await supabase.from("projects").insert({ ...rest, name: `Cópia de ${p.name}` });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vela duplicada.");
      invalidate();
    },
    onError: () => toast.error("Não foi possível duplicar. Tente de novo."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vela apagada.");
      setDeleting(null);
      invalidate();
    },
    onError: () => toast.error("Não foi possível apagar. Tente de novo."),
  });

  async function open(p: ProjectRow) {
    setOpening(p.id);
    try {
      let template: TemplateRef | null = null;
      if (p.template_id) {
        const { data, error } = await supabase
          .from("templates")
          .select("id, title, theme, image_path, is_premium")
          .eq("id", p.template_id)
          .maybeSingle();
        if (error) throw error;
        if (data && p.template_image_id) {
          const { data: image, error: imageError } = await supabase.from("template_images").select("id, original_path, title").eq("id", p.template_image_id).eq("template_id", data.id).maybeSingle();
          if (imageError || !image) throw new Error("Estampa indisponível.");
          template = { id: data.id, title: image.title ?? data.title, theme: data.theme, imagePath: image.original_path, isPremium: data.is_premium, packId: data.id, imageId: image.id };
        } else if (data?.image_path) {
          template = {
            id: data.id,
            title: data.title,
            theme: data.theme,
            imagePath: data.image_path,
            isPremium: data.is_premium,
          };
        }
      }
      loadProject({
        id: p.id,
        name: p.name,
        inputs: inputsFromProject(p),
        template,
        custom: p.custom_image_path
          ? { objectUrl: "", path: p.custom_image_path, name: "Minha imagem", widthPx: 0, heightPx: 0 }
          : null,
        transform: transformFromJson(p.transform),
      });
      navigate({ to: "/estudio" });
    } catch {
      toast.error("Não foi possível abrir esta vela. Tente de novo.");
    } finally {
      setOpening(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="Minhas velas" title="Seus projetos" description={user?.email ?? undefined}>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-accent px-4 py-1.5 text-sm">
            <Crown className="size-4 text-gold" />
            Plano: <strong className="text-primary">{plan === "pro" ? "Pro" : "Grátis"}</strong>
          </span>
          {plan !== "pro" && (
            <span className="text-sm text-muted-foreground">
              {FREE_EXPORTS_PER_MONTH} exportações por mês e modelos grátis.
            </span>
          )}
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-soft overflow-hidden">
              <Skeleton className="aspect-[16/9] rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card-soft flex flex-col items-center p-10 text-center">
          <AlertCircle className="size-10 text-destructive" />
          <p className="mt-3 font-semibold text-primary">Não conseguimos carregar suas velas.</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : projetos && projetos.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projetos.map((p) => (
            <li key={p.id} className="card-soft flex flex-col overflow-hidden">
              <div className="flex aspect-[16/9] items-center justify-center bg-muted">
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt={`Miniatura da vela ${p.name}`} loading="lazy" className="size-full object-contain" />
                ) : (
                  <Flame className="size-8 text-gold" />
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-sans text-base font-semibold text-primary">{p.name}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Vela {formatCm(p.candle_diameter_cm ?? 0)} × {formatCm(p.candle_height_cm ?? 0)} cm ·{" "}
                  {p.mode === "front" ? "só na frente" : "ao redor"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Atualizada em {dateFmt.format(new Date(p.updated_at))}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="gold" onClick={() => open(p)} disabled={opening === p.id}>
                    {opening === p.id ? <Loader2 className="animate-spin" /> : <FolderOpen />} Abrir
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => duplicate.mutate(p)} disabled={duplicate.isPending}>
                    <Copy /> Duplicar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRenaming(p);
                      setNewName(p.name);
                    }}
                  >
                    <Pencil /> Renomear
                  </Button>
                  <Button size="sm" variant="ghost" aria-label={`Apagar ${p.name}`} onClick={() => setDeleting(p)}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card-soft p-10 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-primary">
            <Flame className="size-7" />
          </div>
          <p className="mt-4 font-display text-xl text-primary">Nenhuma vela salva ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">Crie no estúdio e salve na última etapa.</p>
          <Button asChild variant="gold" className="mt-6">
            <Link to="/estudio">
              <Plus /> Criar minha primeira vela
            </Link>
          </Button>
        </div>
      )}

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">Renomear vela</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (renaming && newName.trim()) rename.mutate({ id: renaming.id, name: newName.trim() });
            }}
            className="space-y-4"
          >
            <Input
              aria-label="Novo nome"
              value={newName}
              maxLength={80}
              onChange={(e) => setNewName(e.target.value)}
              className="h-11 rounded-xl"
              autoFocus
            />
            <Button type="submit" variant="gold" className="w-full" disabled={rename.isPending || !newName.trim()}>
              {rename.isPending && <Loader2 className="animate-spin" />} Salvar nome
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>Esta vela sairá da sua lista. Não dá para desfazer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleting) remove.mutate(deleting.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {remove.isPending && <Loader2 className="animate-spin" />} Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
