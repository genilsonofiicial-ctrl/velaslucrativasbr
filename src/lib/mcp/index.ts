import { auth, defineMcp } from "@lovable.dev/mcp-js";

import calculateCandleTool from "./tools/calculate-candle";
import getProjectTool from "./tools/get-project";
import listProjectsTool from "./tools/list-projects";
import listTemplatesTool from "./tools/list-templates";

// O identificador é fixado no build; o endereço público alternativo não serve como emissor OAuth.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "velaslucrativasbr",
  title: "Velaslucrativasbr",
  version: "0.1.0",
  instructions:
    "Ferramentas do Stúdio Velas Lucrativas para calcular artes, consultar modelos ativos e ler somente os projetos da conta autorizada.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
    requireOAuthClientClaim: true,
  }),
  tools: [calculateCandleTool, listTemplatesTool, listProjectsTool, getProjectTool],
});
