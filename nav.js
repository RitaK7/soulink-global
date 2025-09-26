// Soulink — universal navbar glue (active link + mobile toggles)
// Neliečia vizualo. Veikia su .soulink-nav ir .navbar (bei drawer).

(function () {
  // Surenkam galimus konteinerius (skirtingi puslapiai turi skirtingus)
  const roots = Array.from(document.querySelectorAll('.soulink-nav, .navbar'));
  if (!roots.length) return;

  // Visi klikinami meniu linkai (header nav + mobile drawer, jei yra)
  const linkSelectors = [
    '.soulink-nav .nav-links a',
    '.soulink-nav nav .nav-links a',
    '.navbar .nav-links a',
    '#drawer a'            // mobile drawer (edit-profile / match)
  ].join(',');

  // ----- Mobile toggle variantai -----
  // 1) Soulink stiliaus hamburgeris
  roots.forEach(root => {
    const soulinkToggle = root.querySelector('.nav-toggle');
    const soulinkLinks  = root.querySelector('.nav .nav-links') || root.querySelector('.nav-links');
    if (soulinkToggle && soulinkLinks) {
      soulinkToggle.addEventListener('click', () => {
        soulinkLinks.classList.toggle('open');
        soulinkToggle.setAttribute('aria-expanded',
          soulinkLinks.classList.contains('open') ? 'true' : 'false');
      });
    }
  });

  // 2) Paprastas „btn“ (Friends ir pan.)
  const btnToggle = document.getElementById('navToggle');
  const btnLinks  = document.querySelector('.navbar .nav-links');
  if (btnToggle && btnLinks) {
    btnToggle.addEventListener('click', () => {
      btnLinks.classList.toggle('open');
    });
  }

  // 3) Drawer (Edit Profile / Match)
  const drawer       = document.getElementById('drawer');
  const openDrawer   = document.getElementById('openDrawer');
  const closeDrawer  = document.getElementById('closeDrawer');
  const backdrop     = document.getElementById('drawerBackdrop');

  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('no-scroll', open);
  }
  if (openDrawer && drawer)   openDrawer.addEventListener('click', () => setDrawer(true));
  if (closeDrawer && drawer)  closeDrawer.addEventListener('click', () => setDrawer(false));
  if (backdrop && drawer)     backdrop.addEventListener('click', () => setDrawer(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) setDrawer(false);
  });
  if (drawer) {
    drawer.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.tagName === 'A') setDrawer(false);
    });
  }

  // ----- Aktyvus link’as (class + aria-current) -----
  const current = (() => {
    // failo pavadinimas be query/hash; / → index.html; home.html → index.html
    const url  = new URL(window.location.href);
    let file = url.pathname.split('/').pop() || 'index.html';
    if (file === '' || file === '/') file = 'index.html';
    if (file === 'home.html') file = 'index.html';
    return file;
  })();

  // nuimam senus active/aria-current (jei buvo hardcodinta)
  document.querySelectorAll(linkSelectors).forEach(a => {
    a.classList.remove('active');
    a.removeAttribute('aria-current');
  });

  // surandam ir pažymim visus atitinkančius linkus (pvz., header + drawer)
  const allLinks = Array.from(document.querySelectorAll(linkSelectors));
  const matches = allLinks.filter(a => {
    const href = (a.getAttribute('href') || '').split('#')[0].split('?')[0];
    return href === current;
  });
  matches.forEach(a => {
    a.classList.add('active');
    a.setAttribute('aria-current', 'page');
  });
})();
