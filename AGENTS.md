<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Admin rights live only in `public.user_roles` checked via `public.has_role()`; never add a role/admin flag to `profiles` — a user-editable row would allow privilege escalation.
- `profiles.plan` is writable only by the backend: `authenticated` has column-level UPDATE on `email` only, so users cannot upgrade themselves.
- Signed-in-only pages live under `src/routes/_authenticated/` (client-only gate redirecting to `/entrar`); Estúdio and Biblioteca stay public top-level routes so they work without login.
- Session state comes from `useAuth` (`src/hooks/useAuth.tsx`), the single `onAuthStateChange` listener; `ProtectedRoute` only decides what to show — RLS protects the data.
- Storage bucket `templates` is private with admin-only read; public visitors get signed URLs from `getTemplateFileUrls` (server, active templates only).
- Layout chrome (header, mobile bottom nav, footer) is mounted once in `src/routes/__root.tsx`; nav items come from `src/components/layout/nav-items.ts`.
- Candle math lives in pure `src/lib/candle.ts` (tested in `src/test/candle.test.ts`); UI never re-implements formulas, it rounds only for display via `formatCm`.
- Studio state is one Zustand store (`src/stores/studio.ts`) persisted to localStorage with `skipHydration`, rehydrated once in `__root.tsx` to avoid SSR mismatches; image blobs/object URLs are never persisted.
- Art placement math (`placement`/`drawArt` in `src/lib/art-render.ts`) is shared by the flat preview, cylinder preview, PNG and PDF so exports match the preview exactly.
- Exports are generated fully in the browser (jsPDF loaded via dynamic import) and prepared before the click so downloads keep user activation on mobile.
- Plan rules (free monthly export limit, premium templates) live in `src/lib/plan.ts`; monthly export count comes from the `export_count_this_month` RPC because events are admin-read-only.
- Admin dashboards read aggregates through security-definer RPCs (`admin_metrics`, `admin_set_plan`) that check `has_role` first; plan changes never go through a client-writable column.
- Usage events go through `track()` in `src/lib/analytics.ts`, which never throws and stores an anonymous session id in localStorage.
- Agent integrations live in `src/lib/mcp/` with OAuth caller-scoped clients; browser WebMCP tools stay in their owning components and share UI actions so external access follows the same RLS and permissions.
