// quiz.js
// (logic unchanged; minor formatting)
function getWesternZodiac(d) {
  const m = d.getMonth()+1, day = d.getDate();
  if (m==1 && day>=20 || m==2 && day<=18) return 'Aquarius';
  if (m==2 && day>=19 || m==3 && day<=20) return 'Pisces';
  if (m==3 && day>=21 || m==4 && day<=19) return 'Aries';
  if (m==4 && day>=20 || m==5 && day<=20) return 'Taurus';
  if (m==5 && day>=21 || m==6 && day<=20) return 'Gemini';
  if (m==6 && day>=21 || m==7 && day<=22) return 'Cancer';
  if (m==7 && day>=23 || m==8 && day<=22) return 'Leo';
  if (m==8 && day>=23 || m==9 && day<=22) return 'Virgo';
  if (m==9 && day>=23 || m==10 && day<=22) return 'Libra';
  if (m==10 && day>=23 || m==11 && day<=21) return 'Scorpio';
  if (m==11 && day>=22 || m==12 && day<=21) return 'Sagittarius';
  return 'Capricorn';
}
function getChineseZodiac(d) {
  const signs = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
  return signs[(d.getFullYear() - 4) % 12];
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quizForm');
  const saved = JSON.parse(localStorage.getItem('soulQuiz')||'{}');

  for (let key in saved) {
    const el = form.elements[key];
    if (!el) continue;
    if (el.type==='radio' || el.type==='checkbox') {
      Array.from(el.length? el : [el]).forEach(inp => {
        inp.checked = Array.isArray(saved[key]) && saved[key].includes(inp.value);
      });
    } else {
      el.value = saved[key];
    }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = {};
    Array.from(form.elements).forEach(inp => {
      if (!inp.name) return;
      if (inp.type==='radio' && inp.checked) {
        data[inp.name] = inp.value;
      } else if (inp.type==='checkbox') {
        data[inp.name] = data[inp.name]||[];
        if (inp.checked) data[inp.name].push(inp.value);
      } else if (inp.type!=='button') {
        data[inp.name] = inp.value;
      }
    });
    const bd = new Date(data.birthdate);
    data.westernZodiac = getWesternZodiac(bd);
    data.chineseZodiac = getChineseZodiac(bd);

    localStorage.setItem('soulQuiz', JSON.stringify(data));
    location.href = 'my-soul.html';
  });
});
