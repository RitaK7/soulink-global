(function () {
  if (window.__soulinkNavInit) return;
  window.__soulinkNavInit = true;

  const btn = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');

  function onResize() {
    if (!btn || !menu) return;
    if (window.innerWidth < 800) {
      btn.style.display = 'block';
      menu.style.display = 'none';
    } else {
      btn.style.display = 'none';
      menu.style.display = 'flex';
    }
  }

  if (btn && menu) {
    btn.addEventListener('click', () => {
      const cur = menu.style.display;
      menu.style.display = (cur === 'none' || !cur) ? 'flex' : 'none';
    });
    window.addEventListener('resize', onResize);
    onResize();
  }

  // highlight current page link
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  menu?.querySelectorAll('a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === current) a.classList.add('active');
  });
})();
(function () {
  const btn = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');

  function onResize() {
    if (window.innerWidth < 800) { btn.style.display = 'block'; menu.style.display = 'none'; }
    else { btn.style.display = 'none'; menu.style.display = 'flex'; }
  }
  if (btn && menu) {
    btn.addEventListener('click', () => {
      menu.style.display = (menu.style.display === 'none' || !menu.style.display) ? 'flex' : 'none';
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
