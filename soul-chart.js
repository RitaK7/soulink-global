(function () {
  if (window.__soulinkChartsV3) return;
  window.__soulinkChartsV3 = true;

  document.addEventListener('DOMContentLoaded', init);

  let charts = { love: null, hobby: null, values: null };

  // --------- helpers ----------
  function getProfile() {
    try { return JSON.parse(localStorage.getItem('soulQuiz') || '{}'); }
    catch { return {}; }
  }
  function $(sel, root = document) { return root.querySelector(sel); }
  function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function safe(val, fallback = 0) { return Number.isFinite(val) ? val : fallback; }

  function destroyAll() {
    Object.values(charts).forEach(c => c?.destroy());
    charts = { love: null, hobby: null, values: null };
  }

  // Gentle card message when data is missing
  function showEmpty(canvas, msg) {
    const card = canvas.closest('.card') || canvas.parentElement;
    if (!card) return;
    card.innerHTML =
      `<div style="padding:1rem 1.25rem;opacity:.8">
         ${msg.replace(/</g,'&lt;')}
         <div style="margin-top:.5rem">
           Go to <a href="edit-profile.html">Edit Profile</a> to add this info.
         </div>
       </div>`;
  }

  // --------- charts ----------
  function buildCharts() {
    if (!window.Chart) return; // Chart.js must be loaded by the page

    destroyAll();

    const profile = getProfile();

    // Common look
    const commonOpts = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 420 },
      plugins: {
        legend: { labels: { color: '#dff', font: { weight: '600' } } },
        tooltip: { titleColor: '#002e30', bodyColor: '#002e30' }
      },
      scales: {
        r: {
          grid: { color: 'rgba(0,253,216,.15)' },
          angleLines: { color: 'rgba(0,253,216,.15)' },
          pointLabels: { color: '#bff' },
          ticks: { display: false, maxTicksLimit: 4 }
        }
      }
    };

    // ---- Love Language (radar) ----
    const loveCanvas = $('#loveChart');
    if (loveCanvas) {
      const llLabels = [
        'Words of Affirmation',
        'Acts of Service',
        'Receiving Gifts',
        'Quality Time',
        'Physical Touch'
      ];
      const primary = (profile.loveLanguage || '').trim();
      if (!primary) {
        showEmpty(loveCanvas, 'Love Language chart is empty.');
      } else {
        const loveData = llLabels.map(lbl => (lbl === primary ? 100 : 35));
        charts.love = new Chart(loveCanvas.getContext('2d'), {
          type: 'radar',
          data: { labels: llLabels, datasets: [{
            label: 'Focus',
            data: loveData,
            backgroundColor: 'rgba(0,253,216,.15)',
            borderColor: '#00fdd8',
            pointBackgroundColor: '#00fdd8'
          }]},
          options: commonOpts
        });
        const caption = loveCanvas.closest('.card')?.querySelector('[data-love-caption]');
        if (caption) caption.textContent = `Primary: ${primary}`;
      }
    }

    // ---- Hobbies (donut) ----
    const hobbyCanvas = $('#hobbyChart');
    if (hobbyCanvas) {
      const picked = Array.isArray(profile.hobbies) ? profile.hobbies : [];

      if (!picked.length) {
        showEmpty(hobbyCanvas, 'Hobbies chart is empty.');
      } else {
        // Map individual hobbies to 4 meta buckets
        // Creative: Art, Music, Dancing, Reading
        // Active: Sports, Travel
        // Mindful: Meditation, Nature
        // Cozy: Cooking, Gaming
        const map = {
          Creative: ['Art', 'Music', 'Dancing', 'Reading'],
          Active: ['Sports', 'Travel'],
          Mindful: ['Meditation', 'Nature'],
          Cozy: ['Cooking', 'Gaming']
        };
        const buckets = Object.keys(map);
        const counts = buckets.map(k =>
          picked.filter(h => map[k].includes(h)).length
        );

        // ensure at least 1 so donut renders (if all zero – split evenly)
        const total = counts.reduce((a,b)=>a+b,0);
        const data = total ? counts : [1,1,1,1];

        const primaryIdx = data.indexOf(Math.max(...data));
        const primaryHobbyLabel = buckets[primaryIdx];

        // Donut centre label plugin
        const centerLabel = {
          id: 'centerLabel',
          afterDraw(chart) {
            const {ctx, chartArea:{width, height}} = chart;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.fillStyle = '#00fdd8';
            ctx.font = '600 14px system-ui';
            ctx.fillText('Your mix', width/2, height/2 - 8);
            ctx.font = '700 18px system-ui';
            ctx.fillStyle = '#dff';
            ctx.fillText(primaryHobbyLabel, width/2, height/2 + 16);
            ctx.restore();
          }
        };

        charts.hobby = new Chart(hobbyCanvas.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: buckets,
            datasets: [{
              data,
              backgroundColor: [
                'rgba(0,253,216,.30)',
                'rgba(0,253,216,.22)',
                'rgba(0,253,216,.18)',
                'rgba(0,253,216,.12)'
              ],
              borderColor: '#00fdd8',
              borderWidth: 1
            }]
          },
          options: {
            ...commonOpts,
            cutout: '55%',
            plugins: { ...commonOpts.plugins, legend: { display: true } }
          },
          plugins: [centerLabel]
        });
      }
    }

    // ---- Core Values Balance (radar) ----
    const valuesCanvas = $('#valuesChart');
    if (valuesCanvas) {
      const chosen = Array.isArray(profile.values) ? profile.values : [];
      if (!chosen.length) {
        showEmpty(valuesCanvas, 'Core Values chart is empty.');
      } else {
        // Heart / Mind / Spirit buckets
        const HEART = ['Kindness', 'Empathy', 'Loyalty', 'Honesty'];
        const MIND  = ['Growth', 'Creativity', 'Adventure'];
        const SPIRIT= ['Spirituality', 'Balance', 'Freedom'];

        const score = (arr) => chosen.filter(v => arr.includes(v)).length;
        const vals = [score(HEART), score(MIND), score(SPIRIT)].map(n => n * 25); // scale 0..100

        charts.values = new Chart(valuesCanvas.getContext('2d'), {
          type: 'radar',
          data: {
            labels: ['Heart', 'Mind', 'Spirit'],
            datasets: [{
              label: 'Balance',
              data: vals,
              backgroundColor: 'rgba(0,253,216,.12)',
              borderColor: '#00fdd8',
              pointBackgroundColor: '#00fdd8'
            }]
          },
          options: commonOpts
        });
      }
    }
  }

  // --------- export (composite png) ----------
  function exportPNG() {
    const canvases = ['loveChart','hobbyChart','valuesChart']
      .map(id => $('#'+id))
      .filter(Boolean);

    if (!canvases.length) return;

    const W = 1500, H = 1000;
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const ctx = off.getContext('2d');

    // background like the site
    ctx.fillStyle = '#083b3c';
    ctx.fillRect(0,0,W,H);

    // Title
    ctx.fillStyle = '#00fdd8';
    ctx.font = '700 36px system-ui';
    ctx.fillText('Soul Chart', 48, 60);

    // draw charts
    function drawFromCanvas(c, x, y, w, h) {
      ctx.drawImage(c, x, y, w, h);
    }
    const [c1,c2,c3] = canvases;
    drawFromCanvas(c1, 40, 100, 700, 400);
    drawFromCanvas(c2, 780, 100, 680, 400);
    drawFromCanvas(c3, 40, 520, 1420, 440);

    const a = document.createElement('a');
    a.href = off.toDataURL('image/png', 1.0);
    a.download = 'soulink-soul-chart.png';
    a.click();
  }

  // --------- wire UI ----------
  function ensureExportButton() {
    // If you already have a button with id="exportPng", use it.
    let btn = $('#exportPng');
    if (!btn) {
      // Try to place next to Refresh button
      const refresh = $('#refreshBtn');
      if (refresh && refresh.parentElement) {
        btn = document.createElement('button');
        btn.id = 'exportPng';
        btn.className = refresh.className || 'btn btn-ghost';
        btn.type = 'button';
        btn.textContent = 'Export PNG';
        refresh.parentElement.insertBefore(btn, refresh.nextSibling);
      }
    }
    btn?.addEventListener('click', exportPNG);
  }

  function init() {
    // Hook buttons
    $('#refreshBtn')?.addEventListener('click', buildCharts);
    ensureExportButton();

    // Build once
    buildCharts();
  }
})();
