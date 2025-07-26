// edit-profile.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profile-form');
  const photoInputs = [
    document.getElementById('photo1'),
    document.getElementById('photo2'),
    document.getElementById('photo3')
  ];
  const previews = ['preview1','preview2','preview3'].map(id => document.getElementById(id));

  // Zodiac & love‑language helper maps
  function getWesternZodiac(d) {
    const m = d.getMonth()+1, day = d.getDate();
    if((m===1&&day>=20)||(m===2&&day<=18)) return 'Aquarius';
    if((m===2&&day>=19)||(m===3&&day<=20)) return 'Pisces';
    if((m===3&&day>=21)||(m===4&&day<=19)) return 'Aries';
    if((m===4&&day>=20)||(m===5&&day<=20)) return 'Taurus';
    if((m===5&&day>=21)||(m===6&&day<=20)) return 'Gemini';
    if((m===6&&day>=21)||(m===7&&day<=22)) return 'Cancer';
    if((m===7&&day>=23)||(m===8&&day<=22)) return 'Leo';
    if((m===8&&day>=23)||(m===9&&day<=22)) return 'Virgo';
    if((m===9&&day>=23)||(m===10&&day<=22)) return 'Libra';
    if((m===10&&day>=23)||(m===11&&day<=21)) return 'Scorpio';
    if((m===11&&day>=22)||(m===12&&day<=21)) return 'Sagittarius';
    return 'Capricorn';
  }
  function getChineseZodiac(d) {
    const signs=['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
    return signs[(d.getFullYear()-4)%12];
  }
  const loveMap = {
    'Words of Affirmation':'Expressing love through kind and encouraging words.',
    'Acts of Service':'Showing love by doing helpful, caring actions.',
    'Receiving Gifts':'Feeling loved through thoughtful presents and symbols.',
    'Quality Time':'Giving undivided attention and shared moments.',
    'Physical Touch':'Feeling love through hugs, kisses, and closeness.'
  };

  // Load from soulQuiz key
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem('soulQuiz')||'{}');
  } catch {
    localStorage.removeItem('soulQuiz');
  }

  // Restore inputs
  Array.from(form.elements).forEach(el => {
    if (!el.name) return;
    const v = saved[el.name];
    if (v == null) return;
    if (el.type==='radio') el.checked = (el.value===v);
    else if (el.type==='checkbox') el.checked = v.includes(el.value);
    else el.value = v;
  });
  // Preview existing photos
  ['photo1','photo2','photo3'].forEach((key,i) => {
    if (saved[key]) previews[i].src = saved[key];
  });
  // Populate live loveDescription
  const loveDesc = document.getElementById('loveDescription');
  form.querySelectorAll('input[name="loveLanguage"]').forEach(r=>{
    r.title = loveMap[r.value]||'';
    r.addEventListener('change',()=>{
      loveDesc.value = loveMap[r.value]||'';
    });
    if (r.checked) loveDesc.value = loveMap[r.value]||'';
  });

  // FileReader preview helper
  photoInputs.forEach((inp,i) => {
    inp.addEventListener('change',() => {
      const file = inp.files[0];
      if (!file) return;
      const r = new FileReader();
      r.onload = () => previews[i].src = r.result;
      r.readAsDataURL(file);
    });
  });

  // Form submit
  form.addEventListener('submit', async e => {
    e.preventDefault();
    // build data object
    const data = {};
    Array.from(form.elements).forEach(el=>{
      if (!el.name) return;
      if (el.type==='radio' && el.checked) data[el.name]=el.value;
      else if (el.type==='checkbox') {
        data[el.name] = data[el.name]||[];
        if (el.checked) data[el.name].push(el.value);
      } else if (!['file','button'].includes(el.type)) {
        data[el.name] = el.value;
      }
    });

    // Attach zodiacs
    const bd = new Date(data.birthday);
    if (!isNaN(bd)) {
      data.westernZodiac = getWesternZodiac(bd);
      data.chineseZodiac = getChineseZodiac(bd);
    }

    // Read photos
    const readImage = file => new Promise(res=>{
      if (!file) return res(null);
      const r = new FileReader();
      r.onload = ()=>res(r.result);
      r.readAsDataURL(file);
    });
    for (let i=1; i<=3; i++) {
      const inp = photoInputs[i-1];
      const file = inp.files[0];
      data['photo'+i] = await readImage(file) || saved['photo'+i] || null;
    }

    // Save & redirect
    localStorage.setItem('soulQuiz', JSON.stringify(data));
    location.href = 'my-soul.html';
  });
});
