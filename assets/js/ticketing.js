(() => {
  const KEY = 'analogyitTickets';
  const form = document.querySelector('#ticket-form');
  const list = document.querySelector('#ticket-list');
  const empty = document.querySelector('#empty-state');
  const feedback = document.querySelector('#ticket-feedback');
  const mode = document.querySelector('#ticket-mode');
  const addressWrap = document.querySelector('#address-wrap');
  const addressInput = document.querySelector('#ticket-address');

  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  };
  const write = (tickets) => localStorage.setItem(KEY, JSON.stringify(tickets));

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
    form.addEventListener('submit', (e) => {
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
      const tickets = read();
      tickets.unshift(ticket);
      write(tickets);
      form.reset();
      if (feedback) feedback.textContent = `Ticket ${ticket.id} created successfully. You can track it in the dashboard.`;
      window.setTimeout(() => {
        window.location.href = 'ticket-dashboard.html';
      }, 900);
    });
  }

  const render = (filter = 'all') => {
    if (!list) return;
    const tickets = read().filter((t) => filter === 'all' ? true : t.status === filter);
    list.innerHTML = '';
    empty.hidden = tickets.length > 0;

    tickets.forEach((t) => {
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

  const updateStatus = (ticketId, status, filter) => {
    const tickets = read().map((t) => t.id === ticketId ? { ...t, status } : t);
    write(tickets);
    render(filter);
  };

  const removeTicket = (ticketId, filter) => {
    const tickets = read().filter((t) => t.id !== ticketId);
    write(tickets);
    render(filter);
  };

  if (list) {
    let activeFilter = 'all';
    document.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeFilter = btn.getAttribute('data-filter') || 'all';
        render(activeFilter);
      });
    });
    render(activeFilter);
  }
})();
