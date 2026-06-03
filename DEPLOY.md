# TBC Website Deploy Notes

## Safe Deploy Rule

Deploy the generated `dist/` folder only. Do not deploy or share the full repository root.

## Build

```bash
node scripts/build-deploy.js
```

Netlify is configured to run this automatically:

- Build command: `node scripts/build-deploy.js`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

## Private Files

Sensitive or internal files were moved outside the public website folder:

`../TBC Website Private Files/`

Keep API keys in platform environment variables, not in the public website root.

Required environment variables:

- `CLAUDE_API_KEY`
- `CLAUDE_MODEL` optional; set this in Netlify/Vercel if the provider requires a specific model slug.

## Production Check

After deploy, test:

- `/`
- `/favicon.ico`
- `/api/claude`
- `/.env.local` should not be accessible
- `/.git/config` should not be accessible
- `/cold-email-tool.html` should not be accessible
