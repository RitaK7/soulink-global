/* Soulink — Soul Chart polish (tooltips, intro, titles, toast, export naming) */

/* ===== utilities ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const getData = () => {
  try { return JSON.parse(localStorage.getItem('soulQuiz') || '{}'); }
  catch { return {}; }
};
const list = v => Array.isArray(v) ? v : (typeof v === 'string' ? v.split(/[\n,]/).map(s=>s.trim()).filter(Boolean) : []);

const LOVE_LABELS = [
  'Words of Affirmation','Acts of Service','Receiving Gifts','Quality Time','Physical Touch'
];
const VALUE_AXES = ['Heart','Mind','Spirit'];

function hasAnyData(d){
  return list(d.loveLanguages || d.loveLanguage).length ||
         list(d.values).length || list(d.hobbies).length;
}

/* ===== intro + empty ===== */
function ensureIntro(){
  const d = getData();
  const h1 = document.querySelector('h1, .page-title, .title') || document.body;
  if (!h1) return;

  // jei jau yra mūsų intro – nieko nedarom
  if ($('#chartIntro')) return;

  const p = document.createElement('p');
  p.id = 'chartIntro';
  p.style.marginTop = '.5rem';
  p.style.color = 'var(--muted, #bde5df)';
  p.style.maxWidth = '70ch';
  p.innerText = hasAnyData(d)
    ? 'Your Soul Chart reveals the harmony between your heart’s language, your values, and the ways you refuel your spirit. Explore the shapes—hover or tap to see what each facet means.'
    : 'Add your profile details to unlock your Soul Chart ✨';

  // bandome įdėti po h1, jei tokio nėra – virš grid’o
  if (h1.insertAdjacentElement) {
    h1.insertAdjacentElement('afterend', p);
  } else {
    const grid = $('.grid') || $('main') || document.body;
    grid.prepend(p);
  }
}

/* ===== per-kortą: antraštė + subtitras ===== */
function setCardTitleForCanvas(canvas, title, subtitle){
  const card = canvas.closest('.card') || canvas.parentElement;
  if (!card) return;
  const h3 = card.querySelector('h3, .card-title') || document.createElement('h3');
  if (!h3.parentNode) card.prepend(h3);
  h3.textContent = title;

  let sub = card.querySelector('.muted-sub');
  if (!sub) {
    sub = document.createElement('p');
    sub.className = 'muted-sub';
    sub.style.margin = '6px 0 0';
    sub.style.color = 'var(--muted, #bde5df)';
    sub.style.fontSize = '.95rem';
    h3.insertAdjacentElement('afterend', sub);
  }
  sub.textContent = subtitle;
}

/* ===== accessibility helpers ===== */
function ensureAriaLive(){
  let al = $('#chartAnnounce');
  if (!al){
    al = document.createElement('div');
    al.id = 'chartAnnounce';
    al.setAttribute('aria-live', 'polite');
    al.style.position = 'absolute';
    al.style.width = '1px';
    al.style.height = '1px';
    al.style.overflow = 'hidden';
    al.style.clip = 'rect(1px, 1px, 1px, 1px)';
    document.body.appendChild(al);
  }
  return al;
}
function announce(msg){
  const al = ensureAriaLive();
  al.textContent = '';
  setTimeout(()=> al.textContent = msg, 30);
}

/* ===== toast ===== */
function showToast(msg){
  let t = $('#chartToast');
  if(!t){
    t = document.createElement('div');
    t.id = 'chartToast';
    t.style.position='fixed';
    t.style.left='50%';
    t.style.bottom='18px';
    t.style.transform='translateX(-50%)';
    t.style.background='rgba(0,253,216,.12)';
    t.style.border='1px solid rgba(0,253,216,.35)';
    t.style.color='var(--fg,#eaf8f6)';
    t.style.padding='10px 14px';
    t.style.borderRadius='12px';
    t.style.boxShadow='0 10px 30px rgba(0,253,216,.08)';
    t.style.zIndex='2000';
    t.style.backdropFilter='blur(6px)';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity='1';
  setTimeout(()=> t.style.opacity='0', 1400);
}

/* ===== tooltip + mobile tap-to-pin ===== */
function wireTooltipAndTap(chart, type, ctx){
  // tooltip callbacks
  chart.options.plugins = chart.options.plugins || {};
  chart.options.plugins.tooltip = chart.options.plugins.tooltip || {};
  const original = chart.options.plugins.tooltip.callbacks || {};
  chart.options.plugins.tooltip.callbacks = {
    ...original,
    label: (c) => {
      try {
        if (type === 'love') {
          const label = c.label || (chart.data.labels[c.dataIndex] ?? '—');
          const raw = c.raw ?? 0;
          const max = (chart.options.scales?.r?.suggestedMax || chart.options.scales?.r?.max || 5);
          const primary = (ctx.primaryLove || '').toLowerCase();
          const star = (label || '').toLowerCase() === primary ? ' ★' : '';
          return `${label}${star} — ${raw}/${max}`;
        }
        if (type === 'hobbies') {
          const label = c.label || '—';
          const val = Number(c.raw || 0);
          const total = (chart.data.datasets?.[0]?.data || []).reduce((a,b)=>a+Number(b||0),0) || 1;
          const pct = Math.round((val/total)*100);
          return `${label} — ${pct}%`;
        }
        if (type === 'values') {
          const label = c.label || VALUE_AXES[c.dataIndex] || '—';
          const val = Math.round(Number(c.raw || 0));
          return `${label} — ${val}%`;
        }
      } catch {}
      // fallback
      const l = c.label || chart.data.labels?.[c.dataIndex] || '';
      const v = Array.isArray(c.raw) ? c.raw.join(', ') : c.raw;
      return `${l}: ${v}`;
    }
  };

  // mobile tap-to-pin
  const canvas = chart.canvas;
  canvas.style.touchAction = 'manipulation';
  canvas.addEventListener('click', (evt)=>{
    const points = chart.getElementsAtEventForMode(evt, 'nearest', {intersect:true}, true);
    if(points.length){
      chart.setActiveElements(points);
      chart.tooltip.setActiveElements(points);
      chart.update();
      announce('Detail shown.');
    }else{
      chart.setActiveElements([]);
      chart.tooltip.setActiveElements([]);
      chart.update();
      announce('Tooltip hidden.');
    }
  });
}

/* ===== export naming ===== */
function wireExportNaming(){
  const d = getData();
  const name = (d.name || 'soul').toLowerCase().replace(/[^a-z0-9\-]+/g,'-');
  // ieškome mygtukų "Export PNG"
  const btns = $$('button, a').filter(b => /export\s*png/i.test(b.textContent||'') || b.dataset.export === 'png');
  if (!btns.length) return;

  btns.forEach(btn=>{
    // jeigu jau yra mūsų handleris – neperrašom
    if (btn.dataset._exportWired) return;
    btn.dataset._exportWired = '1';

    btn.addEventListener('click', (e)=>{
      // surandam arčiausią canvas (arba pirmą puslapyje)
      const card = btn.closest('.card');
      let cvs = card ? card.querySelector('canvas') : $('canvas');
      if(!cvs) return;
      const chart = Chart.getChart(cvs);
      if(!chart) return;

      // sugeneruojam PNG ir atsiunčiam vardiniu pavadinimu
      const link = document.createElement('a');
      link.download = `soul-chart-${name}.png`;
      link.href = chart.toBase64Image();
      link.click();
      e.preventDefault();
    });
  });
}

/* ===== rename sections + wire tooltips to existing charts ===== */
function enhanceCharts(){
  const d = getData();
  const primaryLove = (list(d.loveLanguages || d.loveLanguage)[0] || '').trim();

  // perbėgam per visus canvas ir atpažįstam, kas yra kas
  $$('canvas').forEach(cvs=>{
    const chart = Chart.getChart(cvs);
    if(!chart) return;

    // heuristika: love radar turi LOVE_LABELS etikečių daugumą
    const labels = (chart.data?.labels || []).map(x=>String(x||''));
    const set = new Set(labels.map(s=>s.toLowerCase()));
    const hasLove = LOVE_LABELS.filter(l=> set.has(l.toLowerCase())).length >= 3;
    const hasValues = VALUE_AXES.filter(l=> set.has(l.toLowerCase())).length >= 2;
    const isDoughnut = (chart.config?.type === 'doughnut' || chart.config?.type === 'pie');

    if (hasLove) {
      setCardTitleForCanvas(cvs, 'Your Heart’s Language Balance',
        'Primary love language is highlighted—how you most naturally give and receive love.');
      wireTooltipAndTap(chart, 'love', {primaryLove});
      chart.update();
      return;
    }
    if (isDoughnut) {
      setCardTitleForCanvas(cvs, 'How You Spend Your Soul’s Energy',
        'Distribution of your favorite rituals and joys.');
      wireTooltipAndTap(chart, 'hobbies');
      chart.update();
      return;
    }
    if (hasValues) {
      setCardTitleForCanvas(cvs, 'Your Inner Compass of Values',
        'A Heart–Mind–Spirit balance derived from chosen values.');
      wireTooltipAndTap(chart, 'values');
      chart.update();
      return;
    }
  });
}

/* ===== refresh button (optional) ===== */
function wireRefreshToast(){
  const btn = $('[data-action="refresh"], #refreshBtn');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    // tik lengvas pranešimas – grafikų perskaičiavimą daro esamas kodas
    setTimeout(()=> showToast('Chart updated ✨'), 180);
  });
}

/* ===== init ===== */
document.addEventListener('DOMContentLoaded', ()=>{
  ensureIntro();
  enhanceCharts();
  wireExportNaming();
  wireRefreshToast();
});
