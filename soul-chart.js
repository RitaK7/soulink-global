(function(){
  if (window.__soulchartClassic) return;
  window.__soulchartClassic = true;

  document.addEventListener('DOMContentLoaded', () => {
    const ChartLib = window.Chart;
    if (!ChartLib) return; // Chart.js must be loaded

    const profile = JSON.parse(localStorage.getItem('soulQuiz') || '{}');
    const $ = id => document.getElementById(id);

    // Stable canvas height (px) + fluid width
    function setH(el, px){
      if(!el) return;
      el.style.width = '100%';
      el.style.maxWidth = '100%';
      el.style.height = px + 'px';
    }

    // ---------- Love Language (radar) ----------
    const love = $('loveLangChart');           // ← matches HTML
    if (love){
      setH(love, 360);
      const labels = [
        'Words of Affirmation','Acts of Service','Receiving Gifts','Quality Time','Physical Touch'
      ];
      const primary = (profile.loveLanguage || '').trim();
      const data = labels.map(l => l === primary ? 100 : 35);

      new ChartLib(love, {
        type:'radar',
        data:{ labels, datasets:[{
          label:'Focus', data,
          backgroundColor:'rgba(0,253,216,.15)', borderColor:'#00fdd8',
          pointBackgroundColor:'#00fdd8'
        }]},
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ labels:{ color:'#dff' } } },
          scales:{ r:{ ticks:{display:false},
            grid:{color:'rgba(0,253,216,.15)'},
            angleLines:{color:'rgba(0,253,216,.15)'},
            pointLabels:{color:'#bff'} } }
        }
      });

      const cap = love.closest('.card')?.querySelector('#ll-hint');
      if (cap && primary) cap.textContent = `Primary: ${primary}`;
    }

    // ---------- Hobbies (doughnut) ----------
    const hobby = $('hobbiesChart');           // ← matches HTML
    if (hobby){
      setH(hobby, 360);
      const picked = Array.isArray(profile.hobbies) ? profile.hobbies : [];
      const map = {
        Creative:['Art','Music','Dancing','Reading'],
        Active:['Sports','Travel'],
        Mindful:['Meditation','Nature'],
        Cozy:['Cooking','Gaming']
      };
      const buckets = Object.keys(map);
      let counts = buckets.map(k => picked.filter(h => map[k].includes(h)).length);
      if (counts.every(v => v === 0)) counts = [1,1,1,1]; // avoid 0-donut

      new ChartLib(hobby, {
        type:'doughnut',
        data:{ labels:buckets, datasets:[{
          data:counts,
          backgroundColor:[
            'rgba(0,253,216,.30)','rgba(0,253,216,.22)',
            'rgba(0,253,216,.18)','rgba(0,253,216,.12)'
          ],
          borderColor:'#00fdd8', borderWidth:1
        }]},
        options:{ responsive:true, cutout:'55%',
          plugins:{ legend:{ labels:{ color:'#dff' } } } }
      });
    }

    // ---------- Core Values (radar) ----------
    const values = $('valuesChart');
    if (values){
      setH(values, 520);
      const chosen = Array.isArray(profile.values) ? profile.values : [];
      const buckets = {
        Heart:['Kindness','Empathy','Loyalty','Honesty'],
        Mind:['Growth','Creativity','Adventure'],
        Spirit:['Spirituality','Balance','Freedom']
      };
      const labels = Object.keys(buckets);
      const points = labels.map(k => chosen.filter(v => buckets[k].includes(v)).length * 25);

      new ChartLib(values, {
        type:'radar',
        data:{ labels, datasets:[{
          label:'Balance', data:points,
          backgroundColor:'rgba(0,253,216,.12)', borderColor:'#00fdd8',
          pointBackgroundColor:'#00fdd8'
        }]},
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ labels:{ color:'#dff' } } },
          scales:{ r:{ ticks:{display:false},
            grid:{color:'rgba(0,253,216,.15)'},
            angleLines:{color:'rgba(0,253,216,.15)'},
            pointLabels:{color:'#bff'} } }
        }
      });
    }

    // ---------- Buttons ----------
    // Refresh (reads fresh localStorage)
    document.getElementById('refreshCharts')
      ?.addEventListener('click', () => location.reload());

    // Export PNG (simple composite)
    document.getElementById('exportPng')
      ?.addEventListener('click', () => {
        const canvases = ['loveLangChart','hobbiesChart','valuesChart']
          .map(id => $(id)).filter(Boolean);
        if (!canvases.length) return;

        const W = 1500, H = 1000;
        const off = document.createElement('canvas');
        off.width = W; off.height = H;
        const ctx = off.getContext('2d');

        ctx.fillStyle = '#083b3c'; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#00fdd8'; ctx.font = '700 36px system-ui';
        ctx.fillText('Soul Chart', 48, 60);

        const [c1,c2,c3] = canvases;
        ctx.drawImage(c1, 40, 100, 700, 400);
        ctx.drawImage(c2, 780, 100, 680, 400);
        ctx.drawImage(c3, 40, 520, 1420, 440);

        const a = document.createElement('a');
        a.href = off.toDataURL('image/png', 1.0);
        a.download = 'soulink-soul-chart.png';
        a.click();
      });
  });
})();
