# Vercel deploy + Supabase env (jbmanager)

This repo runs a **static** site. To connect production to Supabase without committing secrets:

1. Create a Supabase project, run `supabase/migrations/20250406000000_initial.sql`, and copy **Project URL** + **anon public** key.
2. In [Vercel](https://vercel.com) → your project → **Settings → Environment Variables**, add:

| Name | Value |
|------|--------|
| `JB_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `JB_SUPABASE_ANON_KEY` | anon public key from Supabase |
| `JB_STORAGE_MODE` | optional; default `supabase` when both URL and key are set. Use `local` to force browser-only storage. |
| `JB_SYNTHETIC_EMAIL_DOMAIN` | optional; default `jbphonelogin.local` |

3. Deploy. The **build** runs `npm run vercel-build` (see `vercel.json`). `scripts/vercel-build.js` loads optional `.env*` files, then if **`JB_SUPABASE_URL`** and **`JB_SUPABASE_ANON_KEY`** are both set **and** the build runs on Vercel (`VERCEL=1`), it **overwrites** `auth-config.js` in the output. Locally, set **`JB_WRITE_AUTH_CONFIG=1`** when running `npm run vercel-build` to rewrite `auth-config.js` (do not commit real keys). If keys are missing, the repo `auth-config.js` is left as-is.

4. Every page loads `js/jb-auth-patch.js` after `auth-config.js`. You can inject `window.__JB_AUTH_PATCH__` in an inline script **before** `auth-config.js` for one-off overrides (advanced).

5. Never put the Supabase **service role** key in the client or in these variables for the frontend.

See also `.env.example` and `docs/SUPABASE-VERCEL.md`.
