(function () {
  if (window.__soulinkNavInitV3) return;
  window.__soulinkNavInitV3 = true;

  const btn  = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  const mq   = () => window.innerWidth < 800;

  function setOpen(open) {
    if (!btn || !menu) return;
    document.body.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function onResize() {
    if (!btn || !menu) return;
    if (mq()) {
      btn.style.display = 'block';
      setOpen(false); // start closed on small
    } else {
      btn.style.display = 'none';
      document.body.classList.remove('nav-open');
      menu.style.display = 'flex'; // desktop inline
    }
  }

  if (btn && menu) {
    btn.addEventListener('click', () => {
      const isOpen = document.body.classList.contains('nav-open');
      setOpen(!isOpen);
    });

    // Close after tapping a link
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => { if (mq()) setOpen(false); });
    });

    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mq()) setOpen(false);
    });

    window.addEventListener('resize', onResize);
    onResize();
  }

  // Active link highlight
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  menu?.querySelectorAll('a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === current) a.classList.add('active');
  });
})();
