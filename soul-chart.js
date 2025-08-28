
(() => {
  // ===== helpers =====
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const safeJSON = () => { try { return JSON.parse(localStorage.getItem('soulQuiz') || '{}'); } catch { return {}; } };
  const data = () => safeJSON();
  const nameSlug = () => (data().name || 'you').toLowerCase().replace(/\s+/g,'-');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // find canvases defensively (support several id variants)
  const els = {
    love: $('#loveChart') || $('#loveLangChart') || $('#love') || $('canvas[data-chart="love"]'),
    hobbies: $('#hobbyChart') || $('#hobbiesChart') || $('#donutChart') || $('canvas[data-chart="hobbies"]'),
    values: $('#valuesChart') || $('#compassChart') || $('canvas[data-chart="values"]'),
  };

  // ===== intro line (under H1) =====
  function setIntro() {
    const h1 = $('h1');
    if (!h1) return;
    let intro = h1.nextElementSibling instanceof HTMLParagraphElement ? h1.nextElementSibling : null;
    if (!intro) {
      intro = document.createElement('p');
      h1.parentNode.insertBefore(intro, h1.nextSibling);
    }
    intro.className = 'muted';
    const has = !!localStorage.getItem('soulQuiz') && Object.keys(data()).length > 0;
    intro.textContent = has
      ? 'Your Soul Chart reveals the harmony between your heart’s language, your values, and the ways you refuel your spirit. Explore the shapes—hover or tap to see what each facet means.'
      : 'Add your profile details to unlock your Soul Chart ✨';
  }

  // ===== card titles + subtitles (SAFE append) =====
  function setTitle(cardCanvas, title, subtitle) {
    if (!cardCanvas) return;
    const card = cardCanvas.closest('.card') || cardCanvas.parentElement;
    if (!card) return;
    const titleEl = card.querySelector('h2, h3');
    if (titleEl) titleEl.textContent = title;
    let sub = card.querySelector('.subtitle');
    if (!sub) {
      sub = document.createElement('p');
      sub.className = 'subtitle muted';
      card.appendChild(sub);
    }
    sub.textContent = subtitle;
  }

  // ===== chart data builders =====

  // Love languages → radar
  const LOVE_LABELS = [
    'Words of Affirmation',
    'Acts of Service',
    'Receiving Gifts',
    'Quality Time',
    'Physical Touch'
  ];
  function buildLove() {
    const d = data();
    const chosen = Array.isArray(d.loveLanguages) ? d.loveLanguages : (d.loveLanguage ? [d.loveLanguage] : []);
    const primary = chosen[0];
    const scores = LOVE_LABELS.map(lbl => {
      const idx = chosen.findIndex(v => v && v.toLowerCase() === lbl.toLowerCase());
      if (idx === -1) return 0;
      // primary=5, second=4, third=3, etc.
      return Math.max(1, 5 - idx);
    });
    return { scores, primary };
  }

  // Hobbies → doughnut (even split among selected)
  function buildHobbies() {
    const d = data();
    const arr = Array.isArray(d.hobbies) ? d.hobbies.filter(Boolean) : [];
    if (!arr.length) return { labels: [], values: [] };
    const labels = arr.slice(0, 12); // keep it readable
    const values = labels.map(() => 1);
    return { labels, values };
  }

  // Values → Heart / Mind / Spirit radar
  const HEART = ['compassion','kindness','empathy','love','generosity','patience','community','care','forgiveness'];
  const MIND  = ['honesty','integrity','wisdom','logic','curiosity','discipline','learning','responsibility','respect','balance'];
  const SPIRIT= ['spirituality','freedom','growth','purpose','gratitude','mindfulness','adventure','faith','presence'];
  function buildValues() {
    const vals = (Array.isArray(data().values) ? data().values : []).map(v => String(v).toLowerCase());
    const score = (bag) => vals.reduce((a,v)=> a + (bag.some(k=> v.includes(k)) ? 1 : 0), 0);
    let h = score(HEART), m = score(MIND), s = score(SPIRIT);
    const total = h+m+s;
    if (!total) return { labels:['Heart','Mind','Spirit'], values:[0,0,0] };
    const pct = x => Math.round((x/total)*100);
    return { labels:['Heart','Mind','Spirit'], values:[pct(h), pct(m), pct(s)] };
  }

  // ===== Chart.js instances =====
  let chartLove = null, chartHobby = null, chartValues = null;

  function makeLove() {
    if (!els.love) return;
    const { scores, primary } = buildLove();
    if (chartLove) chartLove.destroy();
    chartLove = new Chart(els.love, {
      type: 'radar',
      data: {
        labels: LOVE_LABELS,
        datasets: [{
          label: 'Love Languages',
          data: scores,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { r: { suggestedMin: 0, suggestedMax: 5, ticks: { stepSize: 1, display: false } } },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            callbacks: {
              label: (ctx) => {
                const lbl = ctx.label || '—';
                const v = ctx.parsed.r ?? 0;
                const star = (primary && lbl.toLowerCase() === primary.toLowerCase()) ? ' ★' : '';
                return `${lbl} — ${v}/5${star}`;
              }
            }
          }
        }
      }
    });
  }

  function makeHobbies() {
    if (!els.hobbies) return;
    const { labels, values } = buildHobbies();
    if (chartHobby) chartHobby.destroy();
    chartHobby = new Chart(els.hobbies, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a,b)=>a+b,0) || 1;
                const pct = Math.round((ctx.parsed / total) * 100);
                return `${ctx.label || '—'} — ${pct}%`;
              }
            }
          }
        },
        cutout: '55%'
      }
    });
  }

  function makeValues() {
    if (!els.values) return;
    const { labels, values } = buildValues();
    if (chartValues) chartValues.destroy();
    chartValues = new Chart(els.values, {
      type: 'radar',
      data: {
        labels,
        datasets: [{ label:'Inner Balance', data: values, fill: true }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { r: { suggestedMin: 0, suggestedMax: 100, ticks: { display:false } } },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            callbacks: { label: (ctx) => `${ctx.label} — ${ctx.parsed.r || 0}%` }
          }
        }
      }
    });
  }

  // ===== Titles/Subtitles (per card) =====
  function applyTitles() {
    setTitle(els.love,
      'Your Heart’s Language Balance',
      'Primary love language is highlighted—how you most naturally give and receive love.'
    );
    setTitle(els.hobbies,
      'How You Spend Your Soul’s Energy',
      'Distribution of your favorite rituals and joys.'
    );
    setTitle(els.values,
      'Your Inner Compass of Values',
      'A Heart–Mind–Spirit balance derived from chosen values.'
    );
  }

  // ===== Toast =====
  function toast(msg){
    let t = $('#chartToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'chartToast';
      t.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);background:#014a52;border:1px solid rgba(0,253,216,.35);color:#eaf8f6;padding:10px 12px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.35);z-index:9999;opacity:0;transition:opacity .2s ease';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(()=>{ t.style.opacity = '1'; });
    setTimeout(()=> t.style.opacity = '0', 1400);
  }

  // ===== Export PNG (first chart present) =====
  function bindExport() {
    const btn = $$('button, a').find(el => /export\s*png/i.test(el.textContent));
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const canvas = els.love || els.hobbies || els.values;
      if (!canvas) return;
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `soul-chart-${nameSlug()}.png`;
      a.click();
    });
  }

  // ===== Refresh + Edit Profile buttons =====
  function bindActions() {
    const refresh = $$('button, a').find(el => /refresh/i.test(el.textContent));
    if (refresh) refresh.addEventListener('click', (e)=>{ e.preventDefault(); buildAll(); toast('Chart updated ✨'); });

    const edit = $$('button, a').find(el => /edit\s*profile/i.test(el.textContent));
    if (edit) edit.addEventListener('click', (e)=>{ e.preventDefault(); location.href='edit-profile.html'; });
  }

  // ===== Build everything =====
  function buildAll(){
    setIntro();
    applyTitles();
    makeLove();
    makeHobbies();
    makeValues();
    if (!reduceMotion) bindTooltipDismissOnOutside();
  }

  // Close tooltips on outside tap (mobile)
  function bindTooltipDismissOnOutside(){
    document.addEventListener('pointerdown', (e)=>{
      const inside = (el) => el && (el === e.target || el.contains(e.target));
      const anyCanvas = inside(els.love) || inside(els.hobbies) || inside(els.values);
      if (anyCanvas) return;
      [chartLove, chartHobby, chartValues].forEach(ch => {
        try {
          ch && ch.setActiveElements && ch.setActiveElements([]);
          ch && ch.update && ch.update();
        } catch {}
      });
      // aria-live nudge
      const live = document.createElement('span');
      live.setAttribute('aria-live','polite');
      live.style.position='absolute'; live.style.width='1px'; live.style.height='1px'; live.style.overflow='hidden'; live.style.clip='rect(1px,1px,1px,1px)';
      live.textContent = 'Tooltip closed';
      document.body.appendChild(live);
      setTimeout(()=> live.remove(), 250);
    });
  }

  // Kickoff
  document.addEventListener('DOMContentLoaded', ()=>{
    buildAll();
    bindExport();
    bindActions();
  });
})();

