export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'content-type': 'application/json' } });
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const password = String(body.password || '');
  const expected = process.env.TICKET_ADMIN_PASSWORD || '';
  const token = process.env.TICKET_ADMIN_TOKEN || '';

  if (!expected || !token) {
    return new Response(JSON.stringify({ error: 'Server not configured. Add TICKET_ADMIN_PASSWORD and TICKET_ADMIN_TOKEN env vars.' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }

  if (password !== expected) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { 'content-type': 'application/json' } });
  }

  return new Response(JSON.stringify({ token }), { status: 200, headers: { 'content-type': 'application/json' } });
};
