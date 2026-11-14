import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  LIMITS,
  calculateCandle,
  diameterFromCircumference,
  formatNumber,
  parseDecimal,
  type CandleCalc,
  type CandleInput,
  type Mode,
  type Sheet,
} from "@/lib/candle";
import { DEFAULT_TRANSFORM, type ArtTransform } from "@/lib/art-render";

export type Step = 1 | 2 | 3 | 4;

export interface StudioInputs {
  diameterText: string;
  heightText: string;
  marginText: string;
  printerMarginText: string;
  useCircumference: boolean;
  mode: Mode;
  arcDegrees: number;
  sheet: Sheet;
  presetId: string | null;
}

export interface TemplateRef {
  id: string;
  title: string;
  theme: string | null;
  imagePath: string;
  isPremium: boolean;
  /** Pack e estampa, quando a arte vem de um pack (original via link assinado). */
  packId?: string;
  imageId?: string;
}

export interface CustomImage {
  /** Endereço local temporário da imagem (some ao recarregar a página). */
  objectUrl: string;
  /** Caminho no armazenamento, quando já foi enviada. */
  path: string | null;
  name: string;
  widthPx: number;
  heightPx: number;
}

export const PRESETS = [
  { id: "palito", label: "Palito", diameter: "2,2", height: "18" },
  { id: "votiva", label: "Votiva", diameter: "4,5", height: "6" },
  { id: "pilar5", label: "Pilar 5 cm", diameter: "5", height: "10" },
  { id: "pilar75", label: "Pilar 7,5 cm", diameter: "7,5", height: "15" },
  { id: "pote8", label: "Pote 8 cm", diameter: "8", height: "9" },
] as const;

const DEFAULT_INPUTS: StudioInputs = {
  diameterText: "7,5",
  heightText: "15",
  marginText: "0,5",
  printerMarginText: "1",
  useCircumference: false,
  mode: "wrap",
  arcDegrees: LIMITS.arc.default,
  sheet: "A4",
  presetId: "pilar75",
};

interface StudioState {
  step: Step;
  inputs: StudioInputs;
  template: TemplateRef | null;
  custom: CustomImage | null;
  /** Arquivo original da imagem própria (não fica salvo no navegador). */
  customFile: Blob | null;
  transform: ArtTransform;
  history: ArtTransform[];
  projectId: string | null;
  projectName: string;

  setStep: (s: Step) => void;
  setInputs: (patch: Partial<StudioInputs>) => void;
  applyPreset: (id: string) => void;
  toggleCircumference: () => void;
  selectTemplate: (t: TemplateRef) => void;
  /** Troca a estampa do mesmo pack mantendo medidas e ajustes. */
  switchPackImage: (t: TemplateRef) => void;
  setCustom: (c: CustomImage | null, file?: Blob | null) => void;
  setCustomPath: (path: string) => void;
  pushHistory: () => void;
  updateTransform: (patch: Partial<ArtTransform>, opts?: { history?: boolean }) => void;
  undo: () => void;
  center: () => void;
  setProject: (id: string | null, name?: string) => void;
  loadProject: (p: {
    id: string;
    name: string;
    inputs: StudioInputs;
    template: TemplateRef | null;
    custom: CustomImage | null;
    transform: ArtTransform;
  }) => void;
  reset: () => void;
}

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => ({
      step: 1,
      inputs: DEFAULT_INPUTS,
      template: null,
      custom: null,
      customFile: null,
      transform: DEFAULT_TRANSFORM,
      history: [],
      projectId: null,
      projectName: "Minha vela",

      setStep: (step) => set({ step }),
      setInputs: (patch) => set((s) => ({ inputs: { ...s.inputs, presetId: null, ...patch } })),
      applyPreset: (id) => {
        const p = PRESETS.find((x) => x.id === id);
        if (!p) return;
        set((s) => ({
          inputs: {
            ...s.inputs,
            presetId: id,
            useCircumference: false,
            diameterText: p.diameter,
            heightText: p.height,
          },
        }));
      },
      toggleCircumference: () =>
        set((s) => {
          const value = parseDecimal(s.inputs.diameterText);
          let diameterText = s.inputs.diameterText;
          if (value !== null) {
            const next = s.inputs.useCircumference ? value / Math.PI : value * Math.PI;
            diameterText = formatNumber(next, 2).replace(/\./g, "");
          }
          return {
            inputs: { ...s.inputs, useCircumference: !s.inputs.useCircumference, diameterText },
          };
        }),
      selectTemplate: (template) =>
        set((s) => ({
          template,
          custom: null,
          customFile: null,
          history: [...s.history, s.transform].slice(-50),
          transform: { ...DEFAULT_TRANSFORM, mirror: s.transform.mirror },
        })),
      switchPackImage: (template) => set({ template, custom: null, customFile: null }),
      setCustom: (custom, file = null) =>
        set((s) => ({
          custom,
          customFile: file,
          template: custom ? null : s.template,
          transform: custom ? { ...DEFAULT_TRANSFORM, mirror: s.transform.mirror } : s.transform,
        })),
      setCustomPath: (path) => set((s) => (s.custom ? { custom: { ...s.custom, path } } : {})),
      pushHistory: () => set((s) => ({ history: [...s.history, s.transform].slice(-50) })),
      updateTransform: (patch, opts) =>
        set((s) => ({
          history: opts?.history === false ? s.history : [...s.history, s.transform].slice(-50),
          transform: { ...s.transform, ...patch },
        })),
      undo: () => {
        const h = get().history;
        if (h.length === 0) return;
        set({ transform: h[h.length - 1]!, history: h.slice(0, -1) });
      },
      center: () => get().updateTransform({ x: 0, y: 0 }),
      setProject: (projectId, name) =>
        set((s) => ({ projectId, projectName: name ?? s.projectName })),
      loadProject: (p) =>
        set({
          projectId: p.id,
          projectName: p.name,
          inputs: p.inputs,
          template: p.template,
          custom: p.custom,
          customFile: null,
          transform: p.transform,
          history: [],
          step: 3,
        }),
      reset: () =>
        set({
          step: 1,
          inputs: DEFAULT_INPUTS,
          template: null,
          custom: null,
          customFile: null,
          transform: DEFAULT_TRANSFORM,
          history: [],
          projectId: null,
          projectName: "Minha vela",
        }),
    }),
    {
      name: "svl-studio",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        step: s.step,
        inputs: s.inputs,
        template: s.template,
        custom: s.custom?.path ? { ...s.custom, objectUrl: "" } : null,
        transform: s.transform,
        projectId: s.projectId,
        projectName: s.projectName,
      }),
    },
  ),
);

export interface ParsedInputs {
  input: CandleInput | null;
  errors: string[];
}

/** Converte os textos dos campos (aceita vírgula) em números para o cálculo. */
export function parseStudioInputs(i: StudioInputs): ParsedInputs {
  const errors: string[] = [];
  const first = parseDecimal(i.diameterText);
  const height = parseDecimal(i.heightText);
  const margin = parseDecimal(i.marginText);
  const printerMargin = parseDecimal(i.printerMarginText);
  if (first === null) errors.push(i.useCircumference ? "Preencha a circunferência." : "Preencha o diâmetro.");
  if (height === null) errors.push("Preencha a altura.");
  if (margin === null) errors.push("Preencha a margem de segurança.");
  if (printerMargin === null) errors.push("Preencha a margem da folha.");
  if (errors.length > 0 || first === null || height === null || margin === null || printerMargin === null) {
    return { input: null, errors };
  }
  return {
    input: {
      diameterCm: i.useCircumference ? diameterFromCircumference(first) : first,
      heightCm: height,
      marginCm: margin,
      mode: i.mode,
      arcDegrees: i.arcDegrees,
      sheet: i.sheet,
      printerMarginCm: printerMargin,
    },
    errors: [],
  };
}

export function calcFromInputs(i: StudioInputs): CandleCalc {
  const parsed = parseStudioInputs(i);
  if (!parsed.input) return { ok: false, errors: parsed.errors };
  const calc = calculateCandle(parsed.input);
  if (!calc.ok && i.useCircumference) {
    const min = formatNumber(LIMITS.diameter.min * Math.PI);
    const max = formatNumber(LIMITS.diameter.max * Math.PI);
    return {
      ok: false,
      errors: calc.errors.map((e) =>
        e.startsWith("O diâmetro") ? `A circunferência deve ficar entre ${min} e ${max} cm.` : e,
      ),
    };
  }
  return calc;
}

export function useCandleCalc(): CandleCalc {
  const inputs = useStudio((s) => s.inputs);
  return calcFromInputs(inputs);
}
