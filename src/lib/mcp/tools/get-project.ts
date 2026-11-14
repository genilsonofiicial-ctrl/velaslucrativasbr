import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_project",
  title: "Abrir uma vela salva",
  description: "Lê as medidas e o ajuste de arte de um projeto da conta autorizada pelo identificador.",
  inputSchema: {
    projectId: z.string().uuid().describe("Identificador do projeto retornado por list_my_projects."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ projectId }, ctx) => {
    const supabase = supabaseForUser(ctx);
    const { data: p, error } = await supabase
      .from("projects")
      .select("id, name, candle_diameter_cm, candle_height_cm, margin_cm, mode, arc_degrees, sheet, printer_margin_cm, template_id, transform, created_at, updated_at")
      .eq("id", projectId)
      .maybeSingle();
    if (error) throw new ToolError("Não foi possível abrir este projeto.");
    if (!p) throw new ToolError("Projeto não encontrado na sua conta.");
    const project = {
      id: p.id,
      name: p.name,
      candleDiameterCm: p.candle_diameter_cm,
      candleHeightCm: p.candle_height_cm,
      marginCm: p.margin_cm,
      mode: p.mode,
      arcDegrees: p.arc_degrees,
      sheet: p.sheet,
      printerMarginCm: p.printer_margin_cm,
      templateId: p.template_id,
      transform: p.transform,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
    return {
      content: [{ type: "text", text: `Projeto “${p.name}” carregado.` }],
      structuredContent: { project },
    };
  },
});
