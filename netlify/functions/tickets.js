import { getStore } from '@netlify/blobs';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json' }
});

const isAuthed = (req) => {
  const provided = req.headers.get('x-admin-token') || '';
  const expected = process.env.TICKET_ADMIN_TOKEN || '';
  return Boolean(expected) && provided === expected;
};

const sanitize = (obj = {}) => ({
  id: String(obj.id || ''),
  name: String(obj.name || ''),
  phone: String(obj.phone || ''),
  mode: String(obj.mode || ''),
  address: String(obj.address || ''),
  issue: String(obj.issue || ''),
  details: String(obj.details || ''),
  priority: String(obj.priority || 'Medium'),
  status: String(obj.status || 'Open'),
  createdAt: String(obj.createdAt || new Date().toISOString())
});

export default async (req) => {
  const store = getStore('tickets');

  if (req.method === 'POST') {
    let body = {};
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const ticket = sanitize(body);
    if (!ticket.id || !ticket.name || !ticket.phone || !ticket.mode || !ticket.issue || !ticket.details) {
      return json({ error: 'Missing required fields' }, 400);
    }

    await store.setJSON(`ticket:${ticket.id}`, ticket);
    return json({ ticket }, 201);
  }

  if (!isAuthed(req)) return json({ error: 'Unauthorized' }, 401);

  if (req.method === 'GET') {
    const listed = await store.list({ prefix: 'ticket:' });
    const tickets = await Promise.all(
      listed.blobs.map(async (b) => store.get(b.key, { type: 'json' }))
    );

    const clean = tickets
      .filter(Boolean)
      .map((t) => sanitize(t))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return json({ tickets: clean });
  }

  if (req.method === 'PATCH') {
    let body = {};
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const id = String(body.id || '');
    const status = String(body.status || '');
    if (!id || !status) return json({ error: 'id and status required' }, 400);

    const existing = await store.get(`ticket:${id}`, { type: 'json' });
    if (!existing) return json({ error: 'Ticket not found' }, 404);

    const updated = sanitize({ ...existing, status });
    await store.setJSON(`ticket:${id}`, updated);
    return json({ ticket: updated });
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url);
    const id = url.searchParams.get('id') || '';
    if (!id) return json({ error: 'id required' }, 400);
    await store.delete(`ticket:${id}`);
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
};
