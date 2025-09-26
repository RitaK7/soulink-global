// Soulink — Navbar glue (active link + mobile toggle)
// Vizualo nekeičiam; tik logika.

(function () {
  const root = document.querySelector('.soulink-nav');
  if (!root) return;

  // Mobile hamburger toggle
  const toggleBtn = root.querySelector('.nav-toggle');
  const linksBox  = root.querySelector('.nav .nav-links');
  if (toggleBtn && linksBox) {
    toggleBtn.addEventListener('click', () => {
      linksBox.classList.toggle('open');
    });
  }

  // Aktyvus puslapis: class="active" + aria-current="page"
  const current = (() => {
    const url = new URL(window.location.href);
    let path = url.pathname.split('/').pop() || 'index.html';
    if (path === '' || path === '/') path = 'index.html';
    if (path === 'home.html') path = 'index.html'; // tolerancija, jei kur likęs
    return path;
  })();

  // Išvalom hardcodintus active/aria-current (jei buvo)
  root.querySelectorAll('.nav .nav-links a').forEach(a => {
    a.classList.remove('active');
    a.removeAttribute('aria-current');
  });

  // Randam atitinkamą <a> pagal href (be query/hash)
  const activeLink = Array.from(root.querySelectorAll('.nav .nav-links a'))
    .find(a => {
      const href = (a.getAttribute('href') || '').split('?')[0].split('#')[0];
      return href === current;
    });

  if (activeLink) {
    activeLink.classList.add('active');
    activeLink.setAttribute('aria-current', 'page');
  }

  // UX: ESC uždaro meniu mobile režime
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && linksBox && linksBox.classList.contains('open')) {
      linksBox.classList.remove('open');
    }
  });

  // UX: paspaudus nuorodą — uždarom mobile meniu
  if (linksBox) {
    linksBox.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.tagName === 'A' && linksBox.classList.contains('open')) {
        linksBox.classList.remove('open');
      }
    });
  }
})();
