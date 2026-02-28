(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const normalizeNavHref = (href) => {
    try {
      const url = new URL(href || '', window.location.origin);
      const path = url.pathname.toLowerCase().replace(/\/+$/, '');
      return path.split('/').pop() || 'index.html';
    } catch {
      return String(href || '').toLowerCase().replace(/^\/+/, '').split(/[?#]/)[0];
    }
  };
  const normalizeNavKey = (href) => normalizeNavHref(href).replace(/\.html$/, '');

  // ── Ensure Ticket link appears across all pages ──
  const ensureTicketLinks = () => {
    const isTicketHref = (href) => {
      try {
        const url = new URL(href || '', window.location.origin);
        const path = url.pathname.replace(/\/$/, '').toLowerCase();
        return path.endsWith('/submit-ticket.html');
      } catch {
        return false;
      }
    };

    const dedupeTicketLinks = (container) => {
      if (!container) return;
      const links = Array.from(container.querySelectorAll('a')).filter((a) => isTicketHref(a.getAttribute('href') || ''));
      links.slice(1).forEach((a) => a.remove());
    };

    const addLink = (container, href, label, useDataNav = false) => {
      if (!container) return;
      dedupeTicketLinks(container);
      const exists = Array.from(container.querySelectorAll('a')).some(
        (a) => isTicketHref(a.getAttribute('href') || '')
      );
      if (exists) return;
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      if (useDataNav) a.setAttribute('data-nav', '');
      container.appendChild(a);
    };

    $$('.links').forEach((nav) => addLink(nav, 'submit-ticket.html', 'Ticket', true));
    $$('[data-drawer]').forEach((drawer) => addLink(drawer, 'submit-ticket.html', 'Ticket'));

    // Footer pages column: append Ticket if missing
    $$('.footer h4').forEach((h4) => {
      if (h4.textContent?.trim().toLowerCase() !== 'pages') return;
      const pagesBox = h4.nextElementSibling;
      if (!(pagesBox instanceof HTMLElement)) return;
      dedupeTicketLinks(pagesBox);
      const exists = Array.from(pagesBox.querySelectorAll('a')).some(
        (a) => isTicketHref(a.getAttribute('href') || '')
      );
      if (!exists) {
        const br = document.createElement('br');
        const a = document.createElement('a');
        a.href = 'submit-ticket.html';
        a.textContent = 'Ticket';
        pagesBox.appendChild(br);
        pagesBox.appendChild(a);
      }
    });
  };
  ensureTicketLinks();


  // ── Group related top-nav tabs into dropdowns ──
  const setupNavDropdowns = () => {
    const navGroups = [
      {
        label: 'Services',
        hrefs: ['services.html', 'business-setup.html', 'it-support-geelong.html', 'pricing.html']
      },
      {
        label: 'Company',
        hrefs: ['about.html', 'case-studies.html', 'contact.html']
      }
    ];

    $$('.links').forEach((nav) => {
      if (nav.querySelector('.nav-more')) return;

      const closes = [];

      navGroups.forEach((group) => {
        const groupedKeys = group.hrefs.map((href) => normalizeNavKey(href));
        const anchors = Array.from(nav.querySelectorAll('a'));
        const toCollapse = anchors.filter((a) => groupedKeys.includes(normalizeNavKey(a.getAttribute('href'))));
        if (!toCollapse.length) return;

        const wrap = document.createElement('div');
        wrap.className = 'nav-more';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nav-more-btn';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-haspopup', 'true');
        btn.textContent = group.label;

        const menu = document.createElement('div');
        menu.className = 'nav-more-menu';
        menu.setAttribute('hidden', '');

        toCollapse.forEach((link) => {
          const item = link.cloneNode(true);
          item.classList.remove('active');
          item.classList.add('nav-more-item');
          if (link.classList.contains('active')) btn.classList.add('active');
          menu.appendChild(item);
          link.remove();
        });

        const close = () => {
          menu.setAttribute('hidden', '');
          btn.setAttribute('aria-expanded', 'false');
        };
        const open = () => {
          closes.forEach((fn) => fn());
          menu.removeAttribute('hidden');
          btn.setAttribute('aria-expanded', 'true');
        };

        closes.push(close);

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = !menu.hasAttribute('hidden');
          isOpen ? close() : open();
        });

        menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));

        wrap.appendChild(btn);
        wrap.appendChild(menu);
        nav.appendChild(wrap);
      });

      document.addEventListener('click', (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        if (nav.contains(t)) return;
        closes.forEach((fn) => fn());
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closes.forEach((fn) => fn());
      });
    });
  };
  setupNavDropdowns();


  // ── Mobile menu (accessible toggle) ──
  const menuBtn = $('[data-menu]');
  const drawer = $('[data-drawer]');

  const closeMenu = () => {
    if (!drawer || !menuBtn) return;
    drawer.setAttribute('hidden', '');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };

  const openMenu = () => {
    if (!drawer || !menuBtn) return;
    drawer.removeAttribute('hidden');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
  };

  if (menuBtn && drawer) {
    if (!drawer.id) drawer.id = 'mobile-menu';
    menuBtn.setAttribute('aria-controls', drawer.id);
    menuBtn.setAttribute('aria-expanded', drawer.hasAttribute('hidden') ? 'false' : 'true');

    menuBtn.addEventListener('click', () => {
      const isOpen = !drawer.hasAttribute('hidden');
      isOpen ? closeMenu() : openMenu();
    });

    $$('a', drawer).forEach((a) => a.addEventListener('click', closeMenu));

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    document.addEventListener('click', (e) => {
      if (drawer.hasAttribute('hidden')) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (drawer.contains(target) || menuBtn.contains(target)) return;
      closeMenu();
    });
  }

  // ── Active nav link ──
  const path = normalizeNavHref(location.pathname || 'index.html');
  $$('a[data-nav]').forEach((a) => {
    const href = normalizeNavHref(a.getAttribute('href'));
    if (href === path) a.classList.add('active');
  });

  $$('.nav-more').forEach((wrap) => {
    const btn = wrap.querySelector('.nav-more-btn');
    const hasActiveItem = wrap.querySelector('.nav-more-item.active');
    if (btn && hasActiveItem) btn.classList.add('active');
  });

  // ── Footer year ──
  const y = $('[data-year]');
  if (y) y.textContent = String(new Date().getFullYear());

  // ── Scroll effects ──
  const header = $('.header');
  const onScroll = () => {
    const scrolled = window.scrollY > 10;
    header?.classList.toggle('is-scrolled', scrolled);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Reveal on scroll ──
  const els = $$('.reveal');
  if ('IntersectionObserver' in window && els.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add('is-visible'));
  }

  $$('select').forEach((sel) => {
    const update = () => sel.classList.toggle('has-value', Boolean(sel.value));
    update();
    sel.addEventListener('change', update);
  });

  $$('[data-slider]').forEach((slider) => {
    const track = slider.querySelector('.t-track');
    const slides = Array.from(slider.querySelectorAll('[data-slide]'));
    const prev = slider.querySelector('[data-prev]');
    const next = slider.querySelector('[data-next]');
    if (!track || slides.length < 2) return;

    let i = 0;
    const set = (n) => {
      i = (n + slides.length) % slides.length;
      track.style.transform = `translateX(-${i * 100}%)`;
    };

    prev?.addEventListener('click', () => set(i - 1));
    next?.addEventListener('click', () => set(i + 1));

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (!reduceMotion) {
      let t = window.setInterval(() => set(i + 1), 6500);

      const pause = () => { if (t) { clearInterval(t); t = 0; } };
      const resume = () => { if (!t) t = window.setInterval(() => set(i + 1), 6500); };

      slider.addEventListener('mouseenter', pause);
      slider.addEventListener('mouseleave', resume);
      slider.addEventListener('focusin', pause);
      slider.addEventListener('focusout', resume);
      document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));
    }

    set(0);
  });

  const toTop = document.createElement('button');
  toTop.className = 'to-top';
  toTop.type = 'button';
  toTop.setAttribute('aria-label', 'Back to top');
  toTop.innerHTML = '<span aria-hidden="true">↑</span> Top';
  document.body.appendChild(toTop);

  const toggleToTop = () => {
    toTop.classList.toggle('show', window.scrollY > 700);
  };
  window.addEventListener('scroll', toggleToTop, { passive: true });
  toggleToTop();

  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
