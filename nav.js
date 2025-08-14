(function () {
  if (window.__soulinkNavInitV2) return;
  window.__soulinkNavInitV2 = true;

  const btn  = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');

  function setOpen(open) {
    if (!btn || !menu) return;
    menu.style.display = open ? 'flex' : 'none';
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function onResize() {
    if (!btn || !menu) return;
    if (window.innerWidth < 800) {
      btn.style.display = 'block';
      // always start closed on small screens
      setOpen(false);
      menu.style.flexDirection = 'column';
    } else {
      btn.style.display = 'none';
      menu.style.display = 'flex';
      menu.style.flexDirection = 'row';
    }
  }

  if (btn && menu) {
    btn.addEventListener('click', () => {
      const open = !(menu.style.display === 'flex');
      setOpen(open);
    });

    // close after click on any link (mobile)
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (window.innerWidth < 800) setOpen(false);
      });
    });

    // close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && window.innerWidth < 800) setOpen(false);
    });

    window.addEventListener('resize', onResize);
    onResize();
  }

  // highlight current page
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  menu?.querySelectorAll('a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === current) a.classList.add('active');
  });
})();
