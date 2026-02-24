(function(){
  const btn = document.querySelector('[data-menu]');
  const drawer = document.querySelector('[data-drawer]');
  if(btn && drawer){
    btn.addEventListener('click', ()=>{
      const hidden = drawer.hasAttribute('hidden');
      if(hidden) drawer.removeAttribute('hidden');
      else drawer.setAttribute('hidden','');
    });
  }

  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('a[data-nav]').forEach(a=>{
    const href = (a.getAttribute('href') || '').toLowerCase();
    if(href === path) a.classList.add('active');
  });

  const y = document.querySelector('[data-year]');
  if(y) y.textContent = new Date().getFullYear();

  const els = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && els.length){
    const io = new IntersectionObserver((entries)=>{
      for(const e of entries){
        if(e.isIntersecting){
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      }
    }, {threshold:0.12});
    els.forEach(el=> io.observe(el));
  }else{
    els.forEach(el=> el.classList.add('is-visible'));
  }
})();
