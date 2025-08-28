/* soul-chart.js — full, clean build (Chart.js v4.x)
   - Intro + titles + subtitles
   - Tooltips (hover/tap), primary ★
   - Refresh toast, Export PNG (combines 3 charts)
   - Reads from localStorage.soulQuiz
*/

(() => {
  // ---------- helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function getQuiz() {
    try {
      const raw = localStorage.getItem('soulQuiz');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
  const list = (v) =>
    Array.isArray(v) ? v.slice() : (typeof v === 'string' ? v.split(/[\n,]/).map(s => s.trim()).filter(Boolean) : []);

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- DOM refs ----------
  const ui = {
    intro: $('#chartIntro'),
    ann: $('#chartAnn'),
    toast: $('#chartToast'),

    btnRefresh: $('#refreshCharts'),
    btnExport: $('#exportPng'),

    loveCanvas: $('#loveLangChart'),
    hobbyCanvas: $('#hobbiesChart'),
    valuesCanvas: $('#valuesChart'),
  };

  // ---------- copy for titles & subtitles ----------
  function setCardCopy() {
    // Love languages
    setTitleBlock(ui.loveCanvas, "Your Heart’s Language Balance",
      "Primary love language is highlighted—how you most naturally give and receive love.");

    // Hobbies
    setTitleBlock(ui.hobbyCanvas, "How You Spend Your Soul’s Energy",
      "Distribution of your favorite rituals and joys.");

    // Values
    setTitleBlock(ui.valuesCanvas, "Your Inner Compass of Values",
      "A Heart–Mind–Spirit balance derived from chosen values.");
  }
  function setTitleBlock(canvas, title, subtitle) {
    if (!canvas) return;
    const card = canvas.closest('.card');
    if (!card) return;
    const h = card.querySelector('h3');
    if (h) h.textContent = title;
    // subtitle as muted small
    let sub = card.querySelector('.muted-sub');
    if (!sub) {
      sub = document.createElement('p');
      sub.className = 'muted-sub';
      sub.style.cssText = 'color:var(--muted);margin:.5rem 0 0;font-size:.95rem;';
      card.insertBefore(sub, canvas.parentElement ?? canvas);
    }
    sub.textContent = subtitle;
  }

  // ---------- intro / empty state ----------
  function paintIntro(d) {
    const hasAny =
      (list(d.loveLanguages || d.loveLanguage).length) ||
      (list(d.hobbies).length) ||
      (list(d.values).length);
    if (!hasAny) {
      ui.intro.textContent = 'Add your profile details to unlock your Soul Chart ✨';
      return;
    }
    ui.intro.innerHTML =
      `Your Soul Chart reveals the harmony between your heart’s language, your values, and the ways you refuel your spirit.<br/>
       Explore the shapes—hover or tap to see what each facet means.`;
  }

  // ---------- data mappers ----------
  const LOVE_LABELS = [
    'Words of Affirmation',
    'Acts of Service',
    'Receiving Gifts',
    'Quality Time',
    'Physical Touch',
  ];

  function loveDataset(d) {
    const loves = list(d.loveLanguages || d.loveLanguage);
    const primary = loves[0];
    // score: 5 for primary, 3 for other selected, 1 for non-selected
    const arr = LOVE_LABELS.map(lbl => {
      if (!loves.length) return 0;
      if (lbl === primary) return 5;
      return loves.includes(lbl) ? 3 : 1;
    });
    return { data: arr, primary };
  }

  function hobbiesDataset(d) {
    const h = list(d.hobbies);
    if (!h.length) {
      return { labels: ['No data'], data: [1], empty: true };
    }
    // simple equal slices for selected hobbies
    return { labels: h, data: h.map(() => 1), empty: false };
  }

  // Map values to three axes: Heart, Mind, Spirit
  const HEART = new Set(['Compassion','Kindness','Love','Empathy','Family','Community','Loyalty','Respect','Generosity','Care']);
  const MIND  = new Set(['Honesty','Integrity','Curiosity','Growth','Wisdom','Balance','Responsibility','Discipline','Learning']);
  const SPIRIT= new Set(['Freedom','Creativity','Spirituality','Adventure','Gratitude','Presence','Faith','Wonder']);

  function valuesDataset(d) {
    const vals = list(d.values).map(v => String(v).trim());
    if (!vals.length) return { labels: ['Heart','Mind','Spirit'], data: [0,0,0], empty: true };
    let heart=0, mind=0, spirit=0;
    for (const v of vals) {
      const key = v.charAt(0).toUpperCase()+v.slice(1).toLowerCase();
      if (HEART.has(key)) heart++;
      else if (MIND.has(key)) mind++;
      else if (SPIRIT.has(key)) spirit++;
      else {
        // unknown -> distribute softly
        spirit += 0.4; heart += 0.3; mind += 0.3;
      }
    }
    const sum = heart+mind+spirit || 1;
    const pct = [heart, mind, spirit].map(n => Math.round((n/sum)*100));
    return { labels: ['Heart','Mind','Spirit'], data: pct, empty: false };
  }

  // ---------- Chart.js instances ----------
  let loveChart, hobbyChart, valuesChart;

  function buildCharts() {
    const d = getQuiz();
    paintIntro(d);
    setCardCopy();

    // LOVE (radar)
    const L = loveDataset(d);
    loveChart = buildRadar(ui.loveCanvas, LOVE_LABELS, L.data, 'Love Languages', {
      tooltip: (ctx) => {
        const lbl = ctx.label;
        const val = ctx.raw;
        const star = (L.primary === lbl) ? ' ★' : '';
        return `${lbl}${star} — ${val}/5`;
      }
    });

    // HOBBIES (doughnut)
    const H = hobbiesDataset(d);
    hobbyChart = buildDoughnut(ui.hobbyCanvas, H.labels, H.data, 'Hobbies Mix', {
      tooltip: (ctx) => {
        if (H.empty) return 'No data yet';
        const total = ctx.dataset.data.reduce((a,b)=>a+b,0) || 1;
        const pct = Math.round((ctx.raw/total)*100);
        return `${ctx.label} — ${pct}%`;
      }
    });

    // VALUES (radar)
    const V = valuesDataset(d);
    valuesChart = buildRadar(ui.valuesCanvas, V.labels, V.data, 'Core Values', {
      tooltip: (ctx) => {
        if (V.empty) return 'No data yet';
        return `${ctx.label} — ${ctx.raw}%`;
      },
      min: 0, max: 100, step: 20
    });

    enableTapToHide([loveChart, hobbyChart, valuesChart]);
  }

  function updateCharts() {
    // re-read and update data, keep instances
    const d = getQuiz();
    paintIntro(d);

    // Love
    const L = loveDataset(d);
    loveChart.data.labels = LOVE_LABELS;
    loveChart.data.datasets[0].data = L.data;
    loveChart.options.plugins.tooltip.callbacks.label = (ctx) => {
      const lbl = ctx.label;
      const star = (L.primary === lbl) ? ' ★' : '';
      return `${lbl}${star} — ${ctx.raw}/5`;
    };
    loveChart.update();

    // Hobbies
    const H = hobbiesDataset(d);
    hobbyChart.data.labels = H.labels;
    hobbyChart.data.datasets[0].data = H.data;
    hobbyChart.options.plugins.tooltip.callbacks.label = () => ' ';
    hobbyChart.options.plugins.tooltip.callbacks.label = (ctx) => {
      if (H.empty) return 'No data yet';
      const total = ctx.dataset.data.reduce((a,b)=>a+b,0) || 1;
      const pct = Math.round((ctx.raw/total)*100);
      return `${ctx.label} — ${pct}%`;
    };
    hobbyChart.update();

    // Values
    const V = valuesDataset(d);
    valuesChart.data.labels = V.labels;
    valuesChart.data.datasets[0].data = V.data;
    valuesChart.options.plugins.tooltip.callbacks.label = (ctx) => {
      if (V.empty) return 'No data yet';
      return `${ctx.label} — ${ctx.raw}%`;
    };
    valuesChart.update();

    toast('Chart updated ✨');
  }

  // ---------- Chart builders ----------
  function baseColors(alphaFill = .18, alphaLine = .9) {
    const neon = 'rgba(0,253,216,';
    return {
      border: neon + alphaLine + ')',
      fill: neon + alphaFill + ')',
      point: neon + '1)',
      grid: 'rgba(0,253,216,.2)'
    };
  }

  function buildRadar(canvas, labels, data, label, extra = {}) {
    const C = baseColors();
    return new Chart(canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label,
          data,
          borderColor: C.border,
          backgroundColor: C.fill,
          pointBackgroundColor: C.point,
          pointRadius: 3,
          pointHoverRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            min: extra.min ?? 0,
            max: extra.max ?? undefined,
            ticks: { display: false, stepSize: extra.step ?? 1 },
            grid: { color: C.grid, circular: true },
            angleLines: { color: 'rgba(0,253,216,.15)' },
            pointLabels: { color: '#eaf8f6', font: { size: 12 } },
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            intersect: false,
            callbacks: {
              label: extra.tooltip || ((ctx) => `${ctx.label}: ${ctx.raw}`)
            }
          }
        },
        animation: reduceMotion ? false : { duration: 400 }
      }
    });
  }

  function buildDoughnut(canvas, labels, data, label, extra = {}) {
    return new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          label,
          data,
          // let Chart.js generate default colors; we avoid specifying exact colors per constraints
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            position: 'nearest',
            callbacks: {
              label: extra.tooltip || ((ctx) => `${ctx.label}: ${ctx.raw}`)
            }
          }
        },
        animation: reduceMotion ? false : { duration: 400 }
      }
    });
  }

  // ---------- Mobile: tap outside to hide tooltip ----------
  function enableTapToHide(charts) {
    document.addEventListener('click', (e) => {
      // if click is not on a canvas, clear tooltips
      if (!e.target.closest('canvas')) {
        charts.forEach(ch => {
          if (!ch) return;
          ch.tooltip.setActiveElements([], { x: 0, y: 0 });
          ch.update();
        });
        if (ui.ann) {
          ui.ann.textContent = '';
          setTimeout(() => { ui.ann.textContent = ' '; }, 0);
        }
      }
    });
  }

  // ---------- toast ----------
  function toast(msg) {
    if (!ui.toast) return;
    ui.toast.textContent = msg;
    ui.toast.style.opacity = '1';
    ui.toast.style.transform = 'translateY(0)';
    setTimeout(() => {
      ui.toast.style.opacity = '0';
      ui.toast.style.transform = 'translateY(6px)';
    }, 1200);
  }

  // ---------- export ----------
  function exportPNG() {
    const name = (getQuiz().name || 'soul').toLowerCase().replace(/\s+/g,'-');
    const canvases = [ui.loveCanvas, ui.hobbyCanvas, ui.valuesCanvas].filter(Boolean);

    // compute combined size (stacked vertically, same width)
    const pad = 24;
    const w = Math.max(...canvases.map(c => c.width));
    const h = canvases.reduce((a,c) => a + c.height, 0) + pad*(canvases.length+1);

    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#003c43';
    ctx.fillRect(0,0,w,h);

    let y = pad;
    canvases.forEach(cv => {
      const x = (w - cv.width) / 2;
      ctx.drawImage(cv, x, y);
      y += cv.height + pad;
    });

    const a = document.createElement('a');
    a.href = out.toDataURL('image/png');
    a.download = `soul-chart-${name}.png`;
    a.click();
  }

  // ---------- wire up ----------
  function init() {
    setCardCopy();
    buildCharts();

    ui.btnRefresh?.addEventListener('click', () => updateCharts());
    ui.btnExport?.addEventListener('click', exportPNG);

    // Accessibility live note on tap (mobile)
    [ui.loveCanvas, ui.hobbyCanvas, ui.valuesCanvas].forEach(cv => {
      cv?.addEventListener('pointerdown', () => {
        if (ui.ann) { ui.ann.textContent = 'Value shown. Tap outside to close.'; }
      });
    });
  }

  // Start after DOM + Chart.js loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
