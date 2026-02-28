(() => {
  const AUTH_KEY = 'analogyitTicketAdminToken';
  const form = document.querySelector('#ticket-form');
  const list = document.querySelector('#ticket-list');
  const empty = document.querySelector('#empty-state');
  const feedback = document.querySelector('#ticket-feedback');
  const mode = document.querySelector('#ticket-mode');
  const addressWrap = document.querySelector('#address-wrap');
  const addressInput = document.querySelector('#ticket-address');
  const loginForm = document.querySelector('#ticket-login-form');
  const loginFeedback = document.querySelector('#ticket-login-feedback');
  const page = (location.pathname.split('/').pop() || '').toLowerCase();

  const api = async (path, opts = {}, requireAuth = false) => {
    const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
    if (requireAuth) {
      const token = sessionStorage.getItem(AUTH_KEY) || '';
      if (token) headers['x-admin-token'] = token;
    }
    const res = await fetch(path, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const isAuthed = () => Boolean(sessionStorage.getItem(AUTH_KEY));

  const requireAuth = async () => {
    if (page !== 'ticket-dashboard') return;
    if (!isAuthed()) {
      const next = encodeURIComponent('/ticket-dashboard');
      window.location.replace(`/ticket-login?next=${next}`);
      return;
    }
    try {
      await api('/api/tickets', { method: 'GET' }, true);
    } catch {
      sessionStorage.removeItem(AUTH_KEY);
      const next = encodeURIComponent('/ticket-dashboard');
      window.location.replace(`/ticket-login?next=${next}`);
    }
  };

  requireAuth();

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      const password = String(fd.get('password') || '');
      loginFeedback && (loginFeedback.textContent = 'Signing in...');

      try {
        const data = await api('/api/auth', {
          method: 'POST',
          body: JSON.stringify({ password })
        });
        sessionStorage.setItem(AUTH_KEY, String(data.token || ''));
        const next = new URLSearchParams(window.location.search).get('next') || '/ticket-dashboard';
        window.location.href = next;
      } catch (err) {
        loginFeedback && (loginFeedback.textContent = err.message || 'Invalid credentials');
      }
    });
  }

  const id = () => `TCK-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  if (mode && addressWrap && addressInput) {
    const toggleAddress = () => {
      const onsite = mode.value === 'Onsite';
      addressWrap.hidden = !onsite;
      addressInput.required = onsite;
    };
    mode.addEventListener('change', toggleAddress);
    toggleAddress();
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const ticket = {
        id: id(),
        name: String(fd.get('name') || '').trim(),
        phone: String(fd.get('phone') || '').trim(),
        mode: String(fd.get('mode') || ''),
        address: String(fd.get('address') || '').trim(),
        issue: String(fd.get('issue') || '').trim(),
        details: String(fd.get('details') || '').trim(),
        priority: String(fd.get('priority') || 'Medium'),
        status: 'Open',
        createdAt: new Date().toISOString()
      };

      if (!ticket.name || !ticket.phone || !ticket.mode || !ticket.issue || !ticket.details) return;

      try {
        await api('/api/tickets', { method: 'POST', body: JSON.stringify(ticket) });
        form.reset();
        if (feedback) feedback.textContent = `Request ${ticket.id} submitted successfully. I will follow up with next steps soon.`;
        window.setTimeout(() => {
          window.location.href = '/ticket-login?next=/ticket-dashboard';
        }, 900);
      } catch (err) {
        if (feedback) feedback.textContent = err.message || 'Unable to create ticket right now.';
      }
    });
  }

  const render = async (filter = 'all') => {
    if (!list) return;
    let tickets = [];
    try {
      const data = await api('/api/tickets', { method: 'GET' }, true);
      tickets = Array.isArray(data.tickets) ? data.tickets : [];
    } catch {
      sessionStorage.removeItem(AUTH_KEY);
      const next = encodeURIComponent('/ticket-dashboard');
      window.location.replace(`/ticket-login?next=${next}`);
      return;
    }

    const filtered = tickets.filter((t) => (filter === 'all' ? true : t.status === filter));
    list.innerHTML = '';
    empty.hidden = filtered.length > 0;

    filtered.forEach((t) => {
      const card = document.createElement('article');
      card.className = 'card reveal is-visible';
      card.style.gridColumn = 'span 6';
      card.innerHTML = `
        <div class="badge"><span class="dot"></span> ${t.id}</div>
        <h3>${t.issue}</h3>
        <p><strong>Status:</strong> ${t.status} • <strong>Priority:</strong> ${t.priority}</p>
        <p><strong>Client:</strong> ${t.name} (${t.phone})</p>
        <p><strong>Mode:</strong> ${t.mode}${t.address ? ` • ${t.address}` : ''}</p>
        <p>${t.details}</p>
        <div class="row" style="margin-top:.8rem;">
          <button class="btn small" data-action="progress">In Progress</button>
          <button class="btn small primary" data-action="resolved">Resolve</button>
          <button class="btn small ghost" data-action="delete">Delete</button>
        </div>
      `;

      card.querySelector('[data-action="progress"]')?.addEventListener('click', () => updateStatus(t.id, 'In Progress', filter));
      card.querySelector('[data-action="resolved"]')?.addEventListener('click', () => updateStatus(t.id, 'Resolved', filter));
      card.querySelector('[data-action="delete"]')?.addEventListener('click', () => removeTicket(t.id, filter));
      list.appendChild(card);
    });
  };

  const updateStatus = async (ticketId, status, filter) => {
    await api('/api/tickets', { method: 'PATCH', body: JSON.stringify({ id: ticketId, status }) }, true);
    await render(filter);
  };

  const removeTicket = async (ticketId, filter) => {
    await api(`/api/tickets?id=${encodeURIComponent(ticketId)}`, { method: 'DELETE' }, true);
    await render(filter);
  };

  if (list) {
    let activeFilter = 'all';
    document.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        activeFilter = btn.getAttribute('data-filter') || 'all';
        await render(activeFilter);
      });
    });

    const logoutBtn = document.querySelector('[data-ticket-logout]');
    logoutBtn?.addEventListener('click', () => {
      sessionStorage.removeItem(AUTH_KEY);
      window.location.href = '/ticket-login';
    });

    render(activeFilter);
  }
})();
