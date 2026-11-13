import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Crown, ImageOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { loadImage } from "@/hooks/useArtImage";
import { supabase } from "@/integrations/supabase/client";
import { THEMES, allTemplatesQuery, type TemplateWithUrl } from "@/lib/templates";

export const Route = createFileRoute("/_authenticated/admin/modelos")({
  head: () => ({ meta: [{ title: "Modelos — Admin · Stúdio Velas Lucrativas" }] }),
  component: AdminModelos,
});

const LICENSE_HELP =
  "Informe a origem da arte (criada por você, gerada por IA com licença comercial, comprada). Guarde o comprovante.";
const ADMIN_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

interface FormState {
  title: string;
  theme: string;
  occasion: string;
  tags: string;
  description: string;
  is_premium: boolean;
  is_active: boolean;
  license_note: string;
  file: File | null;
}

const EMPTY: FormState = {
  title: "",
  theme: THEMES[0],
  occasion: "",
  tags: "",
  description: "",
  is_premium: false,
  is_active: true,
  license_note: "",
  file: null,
};

async function uploadTemplateImage(file: File) {
  const ext = file.type === "image/svg+xml" ? "svg" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `modelos/${crypto.randomUUID()}.${ext}`;
  const url = URL.createObjectURL(file);
  let aspect: number | null = null;
  try {
    const img = await loadImage(url);
    if (img.naturalHeight > 0) aspect = Number((img.naturalWidth / img.naturalHeight).toFixed(4));
  } finally {
    URL.revokeObjectURL(url);
  }
  const { error } = await supabase.storage.from("templates").upload(path, file, { contentType: file.type });
  if (error) throw new Error("Não foi possível enviar a imagem.");
  return { path, aspect };
}

function AdminModelos() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery(allTemplatesQuery);
  const [editing, setEditing] = useState<TemplateWithUrl | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [deleting, setDeleting] = useState<TemplateWithUrl | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["templates"] });

  function openEdit(t: TemplateWithUrl | "new") {
    setEditing(t);
    setForm(
      t === "new"
        ? EMPTY
        : {
            title: t.title,
            theme: t.theme ?? THEMES[0],
            occasion: t.occasion ?? "",
            tags: (t.tags ?? []).join(", "),
            description: t.description ?? "",
            is_premium: t.is_premium,
            is_active: t.is_active,
            license_note: t.license_note ?? "",
            file: null,
          },
    );
  }

  const save = useMutation({
    mutationFn: async () => {
      const isNew = editing === "new";
      if (!form.title.trim()) throw new Error("Informe o título.");
      if (isNew && !form.license_note.trim()) throw new Error("A licença é obrigatória.");
      if (isNew && !form.file) throw new Error("Escolha a imagem do modelo.");
      if (form.file && !ADMIN_IMAGE_TYPES.includes(form.file.type)) throw new Error("Use PNG, JPG, WEBP ou SVG.");

      const fields = {
        title: form.title.trim(),
        theme: form.theme,
        occasion: form.occasion.trim() || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        description: form.description.trim() || null,
        is_premium: form.is_premium,
        is_active: form.is_active,
        license_note: form.license_note.trim() || null,
      };
      let image: { image_path: string; thumb_path: string; aspect_ratio: number | null } | null = null;
      if (form.file) {
        const up = await uploadTemplateImage(form.file);
        image = { image_path: up.path, thumb_path: up.path, aspect_ratio: up.aspect };
      }
      if (isNew) {
        const { error } = await supabase.from("templates").insert({ ...fields, ...image });
        if (error) throw new Error("Não foi possível criar o modelo.");
      } else if (editing) {
        const { error } = await supabase.from("templates").update({ ...fields, ...(image ?? {}) }).eq("id", editing.id);
        if (error) throw new Error("Não foi possível salvar o modelo.");
        if (image && editing.image_path && editing.image_path !== image.image_path) {
          await supabase.storage.from("templates").remove([editing.image_path]);
        }
      }
    },
    onSuccess: () => {
      toast.success("Modelo salvo.");
      setEditing(null);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível salvar."),
  });

  const toggleActive = useMutation({
    mutationFn: async (t: TemplateWithUrl) => {
      const { error } = await supabase.from("templates").update({ is_active: !t.is_active }).eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error("Não foi possível mudar o status."),
  });

  const remove = useMutation({
    mutationFn: async (t: TemplateWithUrl) => {
      const { error } = await supabase.from("templates").delete().eq("id", t.id);
      if (error) throw error;
      const paths = Array.from(new Set([t.image_path, t.thumb_path].filter((p): p is string => !!p)));
      if (paths.length) await supabase.storage.from("templates").remove(paths);
    },
    onSuccess: () => {
      toast.success("Modelo apagado.");
      setDeleting(null);
      invalidate();
    },
    onError: () => toast.error("Não foi possível apagar."),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  const isNew = editing === "new";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Modelos</h1>
          <p className="mt-1 text-muted-foreground">{data ? `${data.length} modelos cadastrados` : " "}</p>
        </div>
        <Button variant="gold" onClick={() => openEdit("new")}>
          <Plus /> Novo modelo
        </Button>
      </div>

      <div className="card-soft mt-6 overflow-x-auto">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center p-10 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="mt-2 font-semibold">Não foi possível carregar os modelos.</p>
            <Button variant="outline" className="mt-3" onClick={() => refetch()}>
              Tentar de novo
            </Button>
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Imagem</th>
                <th className="p-3 font-medium">Título</th>
                <th className="p-3 font-medium">Tema</th>
                <th className="p-3 font-medium">Plano</th>
                <th className="p-3 font-medium">Ativo</th>
                <th className="p-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <div className="flex h-12 w-16 items-center justify-center overflow-hidden rounded-lg bg-muted">
                      {t.thumbUrl ? (
                        <img src={t.thumbUrl} alt="" loading="lazy" className="size-full object-cover" />
                      ) : (
                        <ImageOff className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{t.title}</p>
                    {!t.license_note && <p className="text-xs text-destructive">Sem licença informada</p>}
                  </td>
                  <td className="p-3 text-muted-foreground">{t.theme ?? "—"}</td>
                  <td className="p-3">
                    {t.is_premium ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        <Crown className="size-3 text-gold" /> Pro
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Grátis</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Switch
                      checked={t.is_active}
                      onCheckedChange={() => toggleActive.mutate(t)}
                      aria-label={t.is_active ? `Desativar ${t.title}` : `Ativar ${t.title}`}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                        <Pencil /> Editar
                      </Button>
                      <Button size="sm" variant="ghost" aria-label={`Apagar ${t.title}`} onClick={() => setDeleting(t)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary">
              {isNew ? "Novo modelo" : "Editar modelo"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="m-title">Título *</Label>
              <Input id="m-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tema</Label>
                <Select value={form.theme} onValueChange={(v) => setForm({ ...form, theme: v })}>
                  <SelectTrigger aria-label="Tema">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THEMES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-occ">Ocasião</Label>
                <Input id="m-occ" value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-tags">Etiquetas (separe por vírgula)</Label>
              <Input id="m-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-desc">Descrição</Label>
              <Textarea id="m-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-lic">Licença da arte {isNew && "*"}</Label>
              <Textarea
                id="m-lic"
                rows={2}
                required={isNew}
                value={form.license_note}
                onChange={(e) => setForm({ ...form, license_note: e.target.value })}
                aria-describedby="m-lic-help"
              />
              <p id="m-lic-help" className="text-xs text-muted-foreground">
                {LICENSE_HELP}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-file">{isNew ? "Imagem *" : "Trocar imagem"}</Label>
              <Input
                id="m-file"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                required={isNew}
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.is_premium} onCheckedChange={(v) => setForm({ ...form, is_premium: v })} />
                Modelo Pro
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                Ativo (aparece na biblioteca)
              </label>
            </div>
            <Button type="submit" variant="gold" className="w-full" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />} Salvar modelo
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar “{deleting?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              O modelo e a imagem serão apagados. Se quiser só esconder, desative em vez de apagar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleting) remove.mutate(deleting);
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
