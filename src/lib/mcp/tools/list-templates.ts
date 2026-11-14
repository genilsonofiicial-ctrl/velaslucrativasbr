import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_templates",
  title: "Listar modelos de estampa",
  description: "Lista até 50 modelos ativos da biblioteca, com filtros opcionais de tema e ocasião.",
  inputSchema: {
    theme: z.string().optional().describe("Tema exato, como Natal, Casamento ou Bebê."),
    occasion: z.string().optional().describe("Ocasião exata cadastrada no modelo."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ theme, occasion }, ctx) => {
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("templates")
      .select("id, title, theme, occasion, tags, description, aspect_ratio, is_premium")
      .eq("is_active", true)
      .order("is_premium", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(50);
    if (theme !== undefined) query = query.eq("theme", theme);
    if (occasion !== undefined) query = query.eq("occasion", occasion);
    const { data, error } = await query;
    if (error) throw new ToolError("Não foi possível carregar os modelos.");
    const templates = (data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      theme: t.theme,
      occasion: t.occasion,
      tags: [...t.tags],
      description: t.description,
      aspectRatio: t.aspect_ratio,
      isPremium: t.is_premium,
    }));
    return {
      content: [{ type: "text", text: `${templates.length} modelo(s) ativo(s) encontrado(s).` }],
      structuredContent: { templates },
    };
  },
});
