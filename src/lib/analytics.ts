import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "svl_session_id";

export type EventName =
  | "calc_completed"
  | "template_selected"
  | "custom_image_uploaded"
  | "export_pdf"
  | "export_png"
  | "canva_clicked"
  | "project_saved"
  | "paywall_seen"
  | "pro_clicked"
  | "pack_viewed"
  | "pack_signup_started"
  | "pack_signup_completed"
  | "pack_email_sent"
  | "pack_downloaded"
  | "pack_image_to_studio"
  | "pack_image_switched_in_studio"
  | "unlock_clicked";

/** ID anônimo da visita, guardado no navegador. */
export function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "sem-sessao";
  }
}

/** Registra um evento de uso. Nunca quebra a tela se falhar. */
export async function track(name: EventName, props: Record<string, unknown> = {}): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    await supabase.from("events").insert({
      name,
      props: props as Json,
      session_id: getSessionId(),
      user_id: data.session?.user.id ?? null,
    });
  } catch {
    // métricas nunca devem atrapalhar quem está usando o app
  }
}
