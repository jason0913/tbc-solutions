# TBC Website Deploy Notes

## Platforms

**Vercel is the official deploy.** Netlify config + `netlify/functions/*` are kept as
a working fallback (parity), but production runs on Vercel. If a teammate only
maintains one platform, maintain Vercel.

## Safe Deploy Rule — read this before deploying

`dist/` is the **static publish folder only** (HTML + images, built by
`scripts/build-deploy.js`). The serverless functions are **NOT** in `dist`:

- Vercel functions live in `/api/*` (`api/claude.js`, `api/lead.js`)
- Netlify functions live in `netlify/functions/*`

The build script intentionally excludes `api/` and `netlify/` from `dist`, so a
**static-only upload of `dist/` will 404 on `/api/claude` and `/api/lead`** — the
AI assistant and the email lead-capture will both break.

### Correct setup

**Vercel (official):**
- Deploy the **whole project from Git** (so `/api/*` are detected as functions).
- Framework preset: Other. **Output Directory: `dist`.** Build command: `node scripts/build-deploy.js`.
- Do **not** drag-and-drop / static-upload `dist/` — that ships no functions.

**Netlify (fallback):**
- Build command: `node scripts/build-deploy.js`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- `/api/claude` and `/api/lead` are routed to functions via `netlify.toml` redirects.

## Build

```bash
node scripts/build-deploy.js
```

## Private Files

Keep API keys in platform environment variables, not in the repo. The build script
hard-fails if any sensitive file (`.env.local`, `.git`, `*.skill`,
`cold-email-tool.html`, `api`, `netlify`) ends up inside `dist`.

## Environment variables

**Claude AI assistant** (`/api/claude`):

- `CLAUDE_API_KEY`
- `CLAUDE_MODEL` — optional; set if the provider needs a specific model slug.

**Lead capture** (`/api/lead`, Resend email notification):

- `RESEND_API_KEY` — from resend.com
- `LEAD_NOTIFY_TO` — where lead notifications are sent, e.g. `shek0913@tbchk.com`
- `LEAD_FROM` — sender address, **must be a Resend-verified domain/sender**
  (e.g. `hello@tbchk.com`). An unverified `from` will make Resend reject the send.

> Until these three are set, the form returns a friendly error (no white screen).

## Spam / abuse note (launch hardening)

`/api/lead` is a public endpoint protected only by a honeypot + email validation
(enough for Lite v1). Before/at launch, add a platform rate limit
(Vercel Firewall / rate limiting). Consider Cloudflare Turnstile later if spam appears.

## Production check

After deploy, test:

- `/`
- `/favicon.ico`
- `/api/claude` — AI assistant replies
- `/api/lead` — submit the email form → a `🟢 New lead` email arrives
- `/.env.local` → not accessible
- `/.git/config` → not accessible
- `/cold-email-tool.html` → not accessible
