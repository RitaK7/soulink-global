// globalūs Chart numatytieji
if (window.Chart) {
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;
}

(function(){
  if (window.__soulchartClassic) return;
  window.__soulchartClassic = true;

  document.addEventListener('DOMContentLoaded', () => {
    const ChartLib = window.Chart;
    if (!ChartLib) return; // Chart.js turi būti

    const profile = JSON.parse(localStorage.getItem('soulQuiz') || '{}');
    const $ = id => document.getElementById(id);

    // Stabilus aukštis px + fluid plotis
    function setH(el, px){
  if (!el) return;
  // nuimam bet kokius atributus, kuriuos Chart ar kitas kodas galėjo uždėti
  el.removeAttribute('height');
  el.removeAttribute('width');
  // paliekam tik stiliaus lygyje
  el.style.width  = '100%';
  el.style.maxWidth = '100%';
  el.style.height = px + 'px';
}

    const commonRadarOpts = {
      responsive:true, maintainAspectRatio:false,
      animation:{ duration:800, easing:'easeOutQuart' },
      plugins:{ legend:{ labels:{ color:'#dff' } } },
      scales:{ r:{ ticks:{display:false},
        grid:{color:'rgba(0,253,216,.15)'},
        angleLines:{color:'rgba(0,253,216,.15)'},
        pointLabels:{color:'#bff'} } }
    };

    // ---- Love Language (radar) ----
    const love = $('loveLangChart');
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
        options: commonRadarOpts
      });

      const cap = love.closest('.card')?.querySelector('#ll-hint');
      if (cap && primary) cap.textContent = `Primary: ${primary}`;
    }

    // ---- Hobbies (doughnut) ----
    const hobby = $('hobbiesChart');
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
      if (counts.every(v => v === 0)) counts = [1,1,1,1];

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
        options:{
          responsive:true, cutout:'55%',
          animation:{ duration:800, easing:'easeOutQuart' },
          plugins:{ legend:{ labels:{ color:'#dff' } } }
        }
      });
    }

    // ---- Core Values (radar) ----
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
        options: commonRadarOpts
      });
    }

    // Paprastas Refresh (perskaito naujai iš localStorage)
    document.getElementById('refreshCharts')
      ?.addEventListener('click', () => location.reload());
  });
})();
// --- Export PNG (composite of all three charts) ---
document.getElementById('exportPng')?.addEventListener('click', () => {
  const ids = ['loveLangChart', 'hobbiesChart', 'valuesChart'];
  const canvases = ids.map(id => document.getElementById(id)).filter(Boolean);
  if (!canvases.length) return;

  // iš CSS/JS žinomi aukščiai
  const hLove = 360, hHobby = 360, hValues = 520;
  const gap = 32;                 // tarpai tarp plytelių
  const colW = 700;               // viršutinės plytelės plotis
  const rightW = 680;             // dešinės plytelės plotis
  const fullW = 1420;             // apatinės (values) plotis
  const padX = 40, padY = 100;    // kraštinės
  const titleH = 60;

  const W = padX*2 + fullW;
  const H = padY + titleH + gap + Math.max(hLove, hHobby) + gap + hValues + padY/2;

  const scale = Math.max(2, Math.floor((window.devicePixelRatio || 2))); // ryškiau
  const off = document.createElement('canvas');
  off.width = W * scale; off.height = H * scale;
  const ctx = off.getContext('2d');
  ctx.scale(scale, scale);

  // fonas + antraštė
  ctx.fillStyle = '#083b3c';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#00fdd8';
  ctx.font = '700 36px system-ui';
  ctx.fillText('Soul Chart', padX, padY);

  // nubraižom plyteles
  const [cLove, cHobby, cValues] = canvases;
  ctx.drawImage(cLove,   padX,                padY + titleH + gap, colW,  hLove);
  ctx.drawImage(cHobby,  padX + colW + gap,   padY + titleH + gap, rightW, hHobby);
  ctx.drawImage(cValues, padX,                padY + titleH + gap + hLove + gap, fullW, hValues);

  const a = document.createElement('a');
  a.href = off.toDataURL('image/png', 1.0);
  a.download = 'soulink-soul-chart.png';
  a.click();
});

