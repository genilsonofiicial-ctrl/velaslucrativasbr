import { supabase } from "@/integrations/supabase/client";

export interface OAuthClientDetails {
  name?: string;
  redirect_uri?: string;
  redirect_uris?: string[];
}

export interface OAuthAuthorizationDetails {
  client?: OAuthClientDetails;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
}

interface OAuthDecision {
  redirect_url?: string;
  redirect_to?: string;
}

type OAuthError = { message: string } | null;
type OAuthResponse<T> = { data: T | null; error: OAuthError };

interface SupabaseOAuthApi {
  getAuthorizationDetails: (id: string) => Promise<OAuthResponse<OAuthAuthorizationDetails>>;
  approveAuthorization: (id: string) => Promise<OAuthResponse<OAuthDecision>>;
  denyAuthorization: (id: string) => Promise<OAuthResponse<OAuthDecision>>;
}

// O namespace OAuth é beta e nem toda versão das tipagens do cliente o declara.
const api = () => (supabase.auth as unknown as { oauth: SupabaseOAuthApi }).oauth;

export function getAuthorizationDetails(id: string) {
  return api().getAuthorizationDetails(id);
}

export function approveAuthorization(id: string) {
  return api().approveAuthorization(id);
}

export function denyAuthorization(id: string) {
  return api().denyAuthorization(id);
}
