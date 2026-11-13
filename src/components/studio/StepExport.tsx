import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  FileDown,
  FileJson,
  ImageDown,
  Loader2,
  Palette,
  Save,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useArtImage } from "@/hooks/useArtImage";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, track } from "@/lib/analytics";
import { renderArtCanvas } from "@/lib/art-render";
import { SHEETS, cmToPx, formatCm, orientationLabel } from "@/lib/candle";
import { deliverFile, downloadBlob, slugify } from "@/lib/download";
import { buildPrintPdf } from "@/lib/pdf";
import { canExport, canUseTemplate, exportsLeft } from "@/lib/plan";
import { projectPayload } from "@/lib/projects";
import { extensionFor } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { parseStudioInputs, useCandleCalc, useStudio } from "@/stores/studio";
import { CanvaDialog } from "./CanvaDialog";
import { PaywallDialog, type PaywallReason } from "./PaywallDialog";
import { SurveyDialog } from "./SurveyDialog";

const CHECKLIST = [
  "Impressora jato de tinta?",
  "Papel de seda preso à folha?",
  "Impressão em 100%?",
  "Fez um teste em papel comum?",
];

/** iPhones não desenham imagens acima de ~16 milhões de pixels. */
const MAX_PIXELS = 16_000_000;

const canvasToBlob = (c: HTMLCanvasElement, type: string, q?: number) =>
  new Promise<Blob>((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar a imagem."))), type, q),
  );

export function StepExport() {
  const calc = useCandleCalc();
  const inputs = useStudio((s) => s.inputs);
  const transform = useStudio((s) => s.transform);
  const template = useStudio((s) => s.template);
  const custom = useStudio((s) => s.custom);
  const customFile = useStudio((s) => s.customFile);
  const projectId = useStudio((s) => s.projectId);
  const projectName = useStudio((s) => s.projectName);
  const setProject = useStudio((s) => s.setProject);
  const setCustomPath = useStudio((s) => s.setCustomPath);
  const setStep = useStudio((s) => s.setStep);
  const art = useArtImage();
  const { user, plan } = useAuth();
  const queryClient = useQueryClient();

  const [checks, setChecks] = useState<boolean[]>(CHECKLIST.map(() => false));
  const [cutMarks, setCutMarks] = useState(true);
  const [transparent, setTransparent] = useState(false);
  const [pdf, setPdf] = useState<Blob | null>(null);
  const [png, setPng] = useState<{ blob: Blob; dpi: number } | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [paywall, setPaywall] = useState<PaywallReason | null>(null);
  const [canvaOpen, setCanvaOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [name, setName] = useState(projectName);
  const [saving, setSaving] = useState(false);

  const parsed = parseStudioInputs(inputs);
  const result = calc.ok ? calc.result : null;

  // Quantas exportações já foram feitas neste mês.
  useEffect(() => {
    let active = true;
    supabase
      .rpc("export_count_this_month", { _session_id: getSessionId() })
      .then(({ data, error }) => {
        if (active) setCount(error ? 0 : (data ?? 0));
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Prepara os arquivos antes do clique (o download fica instantâneo, inclusive no celular).
  useEffect(() => {
    if (!result || !art.image) return;
    let cancelled = false;
    setPreparing(true);
    setPrepError(null);
    const t = setTimeout(async () => {
      try {
        const image = art.image!;
        const wIn = result.artWidth / 2.54;
        const hIn = result.artHeight / 2.54;
        const dpi = Math.min(300, Math.floor(Math.sqrt(MAX_PIXELS / (wIn * hIn))));
        const pngCanvas = renderArtCanvas(image, result.artWidth, result.artHeight, transform, dpi, transparent ? null : "#ffffff");
        const pngBlob = await canvasToBlob(pngCanvas, "image/png");
        let pdfBlob: Blob | null = null;
        if (result.fits && result.orientation) {
          const pdfCanvas = transparent
            ? renderArtCanvas(image, result.artWidth, result.artHeight, transform, dpi, "#ffffff")
            : pngCanvas;
          pdfBlob = await buildPrintPdf({
            artCanvas: pdfCanvas,
            artW: result.artWidth,
            artH: result.artHeight,
            sheet: inputs.sheet,
            orientation: result.orientation,
            printerMarginCm: parsed.input?.printerMarginCm ?? 1,
            cutMarks,
          });
        }
        if (!cancelled) {
          setPng({ blob: pngBlob, dpi });
          setPdf(pdfBlob);
        }
      } catch {
        if (!cancelled) setPrepError("Não foi possível preparar os arquivos. Tente de novo.");
      } finally {
        if (!cancelled) setPreparing(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [art.image, result?.artWidth, result?.artHeight, result?.orientation, transform, transparent, cutMarks, inputs.sheet]);

  if (!result || !parsed.input) {
    return (
      <div className="card-soft p-8 text-center">
        <p className="font-semibold text-primary">Confira as medidas primeiro.</p>
        <Button variant="gold" className="mt-4" onClick={() => setStep(1)}>
          Ir para Medidas
        </Button>
      </div>
    );
  }

  const baseName = slugify(name || template?.title || "vela");
  const eventProps = {
    mode: inputs.mode,
    sheet: inputs.sheet,
    theme: template?.theme ?? null,
    template_id: template?.id ?? "",
    template_title: template?.title ?? null,
    premium: template?.isPremium ?? false,
    custom_image: !!custom,
  };

  function allowed(): boolean {
    if (template && !canUseTemplate(template.isPremium, plan)) {
      setPaywall("premium");
      return false;
    }
    if (count !== null && !canExport(count, plan)) {
      setPaywall("limit");
      return false;
    }
    return true;
  }

  function afterExport() {
    setCount((c) => (c ?? 0) + 1);
    try {
      if (!sessionStorage.getItem("svl_survey_done")) {
        sessionStorage.setItem("svl_survey_done", "1");
        setTimeout(() => setSurveyOpen(true), 1200);
      }
    } catch {
      // sem sessionStorage: sem pesquisa
    }
  }

  function downloadPdf() {
    if (!pdf || !allowed()) return;
    void deliverFile(pdf, `${baseName}-${inputs.sheet.toLowerCase()}.pdf`);
    track("export_pdf", { ...eventProps, orientation: result!.orientation });
    afterExport();
  }

  function downloadPng(viaCanva = false) {
    if (!png || !allowed()) return;
    void deliverFile(png.blob, `${baseName}-${cmToPx(result!.artWidth, png.dpi)}x${cmToPx(result!.artHeight, png.dpi)}.png`);
    track("export_png", { ...eventProps, dpi: png.dpi, transparent });
    if (viaCanva) {
      track("canva_clicked", eventProps);
      setCanvaOpen(true);
    }
    afterExport();
  }

  function downloadJson() {
    const data = {
      app: "Stúdio Velas Lucrativas",
      versao: 1,
      nome: name,
      vela: {
        diametro_cm: parsed.input!.diameterCm,
        altura_cm: parsed.input!.heightCm,
        margem_cm: parsed.input!.marginCm,
        modo: inputs.mode,
        angulo_graus: inputs.mode === "front" ? inputs.arcDegrees : null,
        folha: inputs.sheet,
        margem_folha_cm: parsed.input!.printerMarginCm,
      },
      arte: {
        largura_cm: Number(result!.artWidth.toFixed(4)),
        altura_cm: Number(result!.artHeight.toFixed(4)),
        modelo: template ? { id: template.id, titulo: template.title } : null,
        imagem_propria: custom ? custom.path ?? custom.name : null,
      },
      ajustes: transform,
      criado_em: new Date().toISOString(),
    };
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `${baseName}.json`);
  }

  async function save() {
    if (!user || !parsed.input) return;
    setSaving(true);
    try {
      let customPath = custom?.path ?? null;
      if (custom && !customPath && customFile) {
        const type = customFile.type || "image/png";
        const path = `${user.id}/${crypto.randomUUID()}.${extensionFor(type)}`;
        const { error } = await supabase.storage.from("user-images").upload(path, customFile, { contentType: type });
        if (error) throw new Error("upload");
        customPath = path;
        setCustomPath(path);
      }
      let thumbnail: string | null = null;
      if (art.image) {
        const dpi = Math.max(20, Math.min(120, (280 / result!.artWidth) * 2.54));
        thumbnail = renderArtCanvas(art.image, result!.artWidth, result!.artHeight, transform, dpi, "#ffffff").toDataURL("image/jpeg", 0.7);
      }
      const payload = projectPayload({ name, input: parsed.input, template, customPath, transform, thumbnail });
      if (projectId) {
        const { error } = await supabase.from("projects").update(payload).eq("id", projectId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("projects").insert(payload).select("id").single();
        if (error) throw error;
        setProject(data.id, payload.name);
      }
      setProject(projectId ?? useStudio.getState().projectId, payload.name);
      track("project_saved", eventProps);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Vela salva em Minhas velas!");
    } catch {
      toast.error("Não foi possível salvar. Confira sua internet e tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  const left = count === null ? null : exportsLeft(count, plan);
  const blocked = !art.image;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="card-soft p-5 md:p-6">
          <h2 className="text-xl font-semibold text-primary">Antes de imprimir</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {CHECKLIST.map((item, i) => (
              <li key={item}>
                <label
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-2 text-sm transition-colors",
                    checks[i] ? "border-success bg-success-soft" : "border-border",
                  )}
                >
                  <Checkbox
                    checked={checks[i] === true}
                    onCheckedChange={(v) => setChecks((c) => c.map((x, j) => (j === i ? v === true : x)))}
                  />
                  {item}
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-soft space-y-4 p-5 md:p-6">
          <h2 className="text-xl font-semibold text-primary">Baixar</h2>
          {prepError && <p className="text-sm text-destructive">{prepError}</p>}
          {art.error && <p className="text-sm text-destructive">{art.error}</p>}

          <div className="rounded-2xl border-2 border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-primary">PDF para imprimir</p>
                <p className="text-sm text-muted-foreground">
                  {result.fits && result.orientation
                    ? `Folha ${SHEETS[inputs.sheet].label} (${orientationLabel(result.orientation)}), arte em tamanho real e quadrado de 5 cm para conferir.`
                    : result.message}
                </p>
              </div>
              <Button variant="gold" onClick={downloadPdf} disabled={blocked || preparing || !pdf}>
                {preparing ? <Loader2 className="animate-spin" /> : <FileDown />} Baixar PDF
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Switch id="corte" checked={cutMarks} onCheckedChange={setCutMarks} />
              <Label htmlFor="corte" className="text-sm">
                Marcas de corte nos cantos
              </Label>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-primary">Imagem PNG</p>
                <p className="text-sm text-muted-foreground">
                  {formatCm(result.artWidth)} × {formatCm(result.artHeight)} cm
                  {png && ` · ${cmToPx(result.artWidth, png.dpi)} × ${cmToPx(result.artHeight, png.dpi)} px a ${png.dpi} DPI`}
                </p>
              </div>
              <Button variant="outline" onClick={() => downloadPng()} disabled={blocked || preparing || !png}>
                <ImageDown /> Baixar PNG
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Switch id="transparente" checked={transparent} onCheckedChange={setTransparent} />
              <Label htmlFor="transparente" className="text-sm">
                Fundo transparente (desligado = branco)
              </Label>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => downloadPng(true)}
            disabled={blocked || preparing || !png}
          >
            <Palette /> Levar para o Canva
          </Button>

          {left !== null && (
            <p className="text-center text-xs text-muted-foreground">
              Plano gratuito: {left === 0 ? "nenhuma exportação restante" : `${left} ${left === 1 ? "exportação restante" : "exportações restantes"}`} este mês.
            </p>
          )}
        </section>
      </div>

      <aside className="card-soft space-y-5 p-5 md:p-6 lg:sticky lg:top-24 lg:self-start">
        <div>
          <h2 className="text-xl font-semibold text-primary">Guardar projeto</h2>
          <p className="text-sm text-muted-foreground">Salve para abrir de novo depois.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nome-projeto">Nome da vela</Label>
          <Input
            id="nome-projeto"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>
        {user ? (
          <Button variant="wine" className="w-full" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {projectId ? "Salvar alterações" : "Salvar em Minhas velas"}
          </Button>
        ) : (
          <Button asChild variant="wine" className="w-full">
            <Link to="/entrar" search={{ redirect: "/estudio" }}>
              <Save /> Entrar para salvar
            </Link>
          </Button>
        )}
        <Button variant="ghost" className="w-full" onClick={downloadJson}>
          <FileJson /> Baixar JSON do projeto
        </Button>

        {template?.isPremium && plan !== "pro" && (
          <p className="flex gap-2 rounded-xl bg-accent p-3 text-xs text-primary">
            <TriangleAlert className="size-4 shrink-0 text-gold" />
            Este é um modelo Pro. Para baixar, é preciso o plano Pro.
          </p>
        )}
        {checks.every(Boolean) && (
          <p className="flex items-center gap-2 text-sm font-semibold text-success">
            <CheckCircle2 className="size-4" /> Tudo conferido. Boa impressão!
          </p>
        )}

        <Button variant="outline" className="w-full" onClick={() => setStep(3)}>
          <ArrowLeft /> Voltar para Ajustar
        </Button>
      </aside>

      <PaywallDialog reason={paywall} onClose={() => setPaywall(null)} />
      <CanvaDialog open={canvaOpen} onClose={() => setCanvaOpen(false)} widthCm={result.artWidth} heightCm={result.artHeight} />
      <SurveyDialog open={surveyOpen} onClose={() => setSurveyOpen(false)} />
    </div>
  );
}
