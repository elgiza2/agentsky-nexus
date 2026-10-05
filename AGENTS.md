# Megsy — Agent Handbook

Read this before touching anything. It captures the decisions that are easy to
get wrong and expensive to undo.

## 1. What this project is

Megsy AI (megsyai.com) — a React SPA (react-router-dom) that was imported into a
TanStack Start shell so it can be built and hosted on Lovable.

- `src/routes/__root.tsx` — the HTML shell (head, fonts, boot styles, snapshot
  restore, speculation rules). Do not put page UI here.
- `src/routes/$.tsx` — catch-all that mounts the SPA for every non-API path.
- `src/lib/SpaApp.tsx` + `src/lib/spaBoot.ts` — SPA bootstrap (client only).
- `src/App.tsx` + `src/routes-app/*` — the real router, layouts and page tree.
- `src/pages/**`, `src/components/**` — the application itself.
- `src/routes/api/**` — thin TanStack server routes used in local dev only.

Rule: new pages go in `src/pages` and get wired in `src/routes-app/AppRoutes.tsx`.
Do NOT create new files under `src/routes/` except real API endpoints.

## 2. Where the provider keys live (important)

All provider API keys are stored **in the database**, encrypted, in the
`service_keys` table (`key_cipher` + `key_iv`), and they are only ever decrypted
**inside the deployed Supabase Edge Functions**. The app itself never sees a raw
key and must never try to.

Current providers:

| Purpose            | Provider    |
| ------------------ | ----------- |
| Text / chat        | Cerebras    |
| Images + video     | DeAPI, Renderful |
| Computer / agent   | Browser Use |
| Code sandbox       | Freestyle   |

Rotation happens in Postgres via `take_service_key(provider)` (least recently
used, `FOR UPDATE SKIP LOCKED`).

Consequences:

- Chat stays free. Credits use daily, bonus, plan, and purchased buckets; image costs 2, video 25, and agent work 1–50.
- The local `/api/chat` proxy (`src/lib/chat/proxyCore.ts`,
  `src/lib/keys/abliterationKey.ts`) is **off by default**. Enable only for
  offline provider work with `VITE_LOCAL_CHAT_PROXY=1`.
- Never add a provider key to `.env` or to the client bundle.
- Admins can add keys at `/k` (RPC `store_provider_key`, admin-only; counts via
  `provider_key_counts`).

## 3. Backend rules

- External Supabase project `qdnqxjzjecaieuavagvq`. Schema changes go through
  migrations; never edit `src/integrations/supabase/types.ts` by hand.
- Roles live in `user_roles` + `has_role()`. Never trust a client-side role.
- Anything privileged happens in an edge function or a server function, never
  in the browser.

## 4. Front-end rules

- Light chat follows `loving-bonds-app`; empty desktop chat is cinematic and isolated from mobile.
- Localize English and Egyptian Arabic (`ar-eg`) through `useUserLang()`.
- Snapshots use `#snapshot-preview`; never write into `#root` before hydration.
- Lazy-load browser-only libraries; read `localStorage` only in effects.

## 5. Checks before shipping

```bash
bunx tsgo --noEmit     # types
bun run build          # production build
```

Then smoke the routes (`/`, `/pricing`, `/chat`, `/settings`, `/usage`,
`/referrals`) signed in, on mobile width and desktop width.

## 6. Known open items

See `roadmap.md`.

## 7. Restructure rules (Sep 2026)
- New edge functions can't be created from this project; the agent (`kind: "agent"`) and the fixed image model (`kind: "image"`) live inside `media-video`. Why: it is the only function whose deployed code matches the repo.
- Do not redeploy `anything-api` from this repo: its deployed version has modules missing here. Why: redeploying would break live features.
- Agent creates tasks/goals by ending replies with [[TASK|ALARM|GOAL: title | local time]]; ComputerTaskCard saves them via src/lib/life/agentActions.ts. Why: the agent runs on Browser Use and cannot write to our DB.
- Phone alarms/reminders go through the `MegsyAndroid` WebView bridge (src/lib/native/bridge.ts, docs/android-bridge.md); background push + morning plan via pg_cron → /api/public/reminders-tick (FCM connector, key in public.cron_secrets). Why: the Android app wraps the site, so web push doesn't work inside it.
