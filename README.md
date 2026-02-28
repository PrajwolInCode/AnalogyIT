# AnalogyIT

AnalogyIT is a static marketing website with a Netlify-ready ticketing workflow.

## Netlify production setup (ticketing)

This project now uses **Netlify Functions** + **Netlify Blobs** for production ticket storage.

### 1) Deploy to Netlify
1. Push this repo to GitHub.
2. In Netlify: **Add new site** → import from Git.
3. Build settings:
   - Build command: *(leave empty)*
   - Publish directory: `.`

`netlify.toml` already configures:
- Functions directory: `netlify/functions`
- API redirect: `/api/*` → `/.netlify/functions/:splat`

### 2) Set environment variables
In Netlify dashboard:
**Site configuration → Environment variables**

Add these:
- `TICKET_ADMIN_PASSWORD` = your admin dashboard login password
- `TICKET_ADMIN_TOKEN` = a long random secret token (different from password)

Example token generation (local terminal):
```bash
openssl rand -hex 32
```

### 3) Deploy and test
After redeploy:
1. Open `/submit-ticket.html` and create a ticket.
2. Open `/ticket-login.html` and sign in with `TICKET_ADMIN_PASSWORD`.
3. Open `/ticket-dashboard.html` and verify list/update/delete actions.

### 4) If redeploying does not fix the issue
If you deploy again and see the same failure, the problem is usually **runtime configuration** in Netlify (not GitHub).

Check these in order:
1. **Environment variables are set on Netlify for this site**
   - `TICKET_ADMIN_PASSWORD`
   - `TICKET_ADMIN_TOKEN`
   - After changing env vars, trigger a new deploy (or clear cache + deploy).
2. **Functions are being built**
   - In Deploy logs, confirm Netlify detects `netlify/functions` and bundles functions.
3. **Functions are reachable**
   - Visit `/.netlify/functions/auth` (GET should return 405 "Method not allowed").
   - If this returns 404, functions are not being published by the current deploy settings.
4. **Redirect is active**
   - `/api/auth` should route to `/.netlify/functions/auth` via `netlify.toml`.
5. **Domain points to the correct Netlify site/deploy**
   - Ensure you are not testing an older site, branch deploy, or cached custom domain.

Tip: GitHub's role here is mainly source hosting + webhook trigger. The live API behavior is controlled by Netlify build/runtime settings.

## Notes
- Ticket data is stored server-side via Netlify Blobs (not browser localStorage).
- Dashboard access is controlled server-side through the auth function.
- For stronger security, add additional edge protection (e.g. Netlify access controls / Cloudflare Access) for admin routes.
