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

## Notes
- Ticket data is stored server-side via Netlify Blobs (not browser localStorage).
- Dashboard access is controlled server-side through the auth function.
- For stronger security, add additional edge protection (e.g. Netlify access controls / Cloudflare Access) for admin routes.
