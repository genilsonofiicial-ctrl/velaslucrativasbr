import { defineTool, ToolError } from "@lovable.dev/mcp-js";

import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_projects",
  title: "Listar minhas velas",
  description: "Lista até 50 projetos salvos da conta autorizada, sem expor projetos de outros usuários.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async (_args, ctx) => {
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, candle_diameter_cm, candle_height_cm, margin_cm, mode, arc_degrees, sheet, printer_margin_cm, template_id, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw new ToolError("Não foi possível carregar seus projetos.");
    const projects = (data ?? []).map((p) => ({
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
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
    return {
      content: [{ type: "text", text: `${projects.length} projeto(s) encontrado(s) na sua conta.` }],
      structuredContent: { projects },
    };
  },
});
