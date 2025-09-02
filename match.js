// match.js — Soulink · Match Lab
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================
   *  NAV: active link + scroll underline
   * ========================= */
  function initNav() {
    const page = document.body.dataset.page || 'match';
    // pažymim aktyvų
    $$('.topnav a[data-nav]').forEach(a => {
      a.toggleAttribute('data-active', a.dataset.nav === page);
    });

    // scrolled underline
    const nav = $('.topnav') || $('.navbar');
    const onScroll = () => {
      if (!nav) return;
      if (window.scrollY > 6) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* =========================
   *  FILTERS drawer (mobile)
   *  #filtersToggle  -> open
   *  #filtersPanel   -> panel (click backdrop to close)
   * ========================= */
  function initFiltersDrawer() {
    const toggle = $('#filtersToggle');
    const panel = $('#filtersPanel');
    if (!panel) return;

    const backdrop = panel.querySelector('[data-backdrop]') || panel; // jei panelė dengia visą foną
    const closeBtn = panel.querySelector('[data-close="filters"]');

    const open = () => {
      panel.classList.add('open');
      document.body.classList.add('no-scroll');
    };
    const close = () => {
      panel.classList.remove('open');
      document.body.classList.remove('no-scroll');
    };

    toggle?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', e => { if (e.target === backdrop) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* =========================
   *  RING PROGRESS (SVG)
   *  Tikisi elementų su data-score (0..100)
   *  Palaiko dvi struktūras:
   *   1) .match-card [data-score] (JS pats sukurs <svg class="ring">…)
   *   2) .ring-progress[data-score] (jei jau yra konteineris)
   * ========================= */
  function buildRing(container) {
    // jei viduje jau yra svg.ring – panaudosim jį
    let svg = container.querySelector('svg.ring');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 44 44');
      svg.classList.add('ring');
      const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      track.classList.add('track');
      track.setAttribute('cx', '22');
      track.setAttribute('cy', '22');
      track.setAttribute('r', '20');

      const prog = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      prog.classList.add('prog');
      prog.setAttribute('cx', '22');
      prog.setAttribute('cy', '22');
      prog.setAttribute('r', '20');
      prog.setAttribute('stroke-linecap', 'round');

      svg.appendChild(track);
      svg.appendChild(prog);
      container.prepend(svg);
    }
    return svg;
  }

  function animateRing(svg, percent) {
    const prog = svg.querySelector('.prog');
    const r = Number(prog.getAttribute('r')) || 20;
    const CIRC = 2 * Math.PI * r;

    // Pradinės reikšmės
    prog.style.strokeDasharray = CIRC;
    // 0% -> dashoffset = CIRC; 100% -> dashoffset = 0
    const target = CIRC * (1 - Math.max(0, Math.min(1, percent / 100)));
    if (reduceMotion) {
      prog.style.strokeDashoffset = target;
      return;
    }
    const start = performance.now();
    const from = CIRC; // pradėkim nuo 0%
    const dur = 800;

    function tick(t) {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3); // easeOutCubic
      const val = from + (target - from) * eased;
      prog.style.strokeDashoffset = val;
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initRings() {
    // 1) Kortelėse
    const nodes = $$('.match-card [data-score], .ring-progress[data-score]');
    nodes.forEach(node => {
      const score = Number(node.getAttribute('data-score')) || 0;
      const holder = node.classList.contains('ring-progress') ? node : node.closest('.match-card') || node.parentElement;
      if (!holder) return;
      const svg = buildRing(holder);
      animateRing(svg, score);

      // jei norim rodyti skaičių viduje
      const numTarget = holder.querySelector('[data-score-num]');
      if (numTarget) numTarget.textContent = `${Math.round(score)}%`;
    });
  }

  /* =========================
   *  Helpers (demo): pavaizduos placeholder kortas,
   *  jei puslapio turinys nesugeneruotas server-side.
   *  (Nebūtina – veiks tik jei randa .matches-grid ir nėra kortų)
   * ========================= */
  function maybeRenderDemoCards() {
    const grid = $('.matches-grid');
    if (!grid || grid.children.length) return;

    // Paprasti pavyzdžiai — gali trinti, jei kortas kuriate HTML’e
    const demo = [
      { name: 'Aila', score: 86, hobbies: ['🎵 Music', '📚 Reading'], values: ['💎 Honesty', '❤️ Kindness'] },
      { name: 'Milo', score: 74, hobbies: ['🧘 Meditation', '✈️ Travel'], values: ['🌱 Growth', '🌞 Freedom'] },
      { name: 'Nova', score: 68, hobbies: ['🎨 Art', '🍳 Cooking'], values: ['💎 Honesty', '🌱 Growth'] },
    ];

    demo.forEach(d => {
      const card = document.createElement('article');
      card.className = 'match-card glow-card';
      card.innerHTML = `
        <header class="card-top">
          <div class="name">${d.name}</div>
          <div class="ring-progress" data-score="${d.score}">
            <div class="score-num" data-score-num></div>
          </div>
        </header>
        <div class="row small">
          <span class="pill">${d.hobbies.join(' · ')}</span>
        </div>
        <div class="row small">
          <span class="pill">${d.values.join(' · ')}</span>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  /* =========================
   *  INIT
   * ========================= */
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initFiltersDrawer();
    maybeRenderDemoCards();
    initRings();
  });
})();
