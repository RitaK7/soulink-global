// Soulink · Results — UX polish:
// - score pill top-right
// - Message only if contact (proper links)
// - filter contact-like tokens from Values
// - live slider label
// - bullets off (CSS in HTML)
// - sticky left (CSS in HTML)
// - feedback toast (fade)
(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // ===== Helpers =====
  const READ = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const esc  = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const digits = s => String(s||'').replace(/\D/g,'');
  const uniq = a => [...new Set(a)];
  const toList = v => Array.isArray(v) ? v
                    : typeof v === 'string' ? v.split(/[,;|/]\s*|\s{2,}|\n/).map(s=>s.trim()).filter(Boolean)
                    : [];

  const isHandle   = v => /^@[\w.]{2,}$/i.test(v || '');
  const isEmail    = v => /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(v || '');
  const isURL      = v => /^https?:\/\//i.test(v || '') || /^mailto:|^tel:/i.test(v || '');
  const isPhone    = v => /^\+?\d[\d\s-]{6,}$/.test(v || '');
  const looksContact = v => isHandle(v) || isEmail(v) || isURL(v) || isPhone(v);

  function mergeFriends() {
    const stacks = [
      READ('soulink.friends.list'),
      READ('soulink.friends'),
      READ('soulFriends')
    ].filter(Array.isArray);
    const flat = stacks.flat();
    const map = new Map();
    flat.forEach(f=>{
      const key=(f?.name||'').trim().toLowerCase();
      if(!map.has(key)) map.set(key,f);
    });
    return Array.from(map.values());
  }

  function me(){
    const q = READ('soulink.soulQuiz') || READ('soulQuiz') || {};
    return {
      name: q.name || '—',
      ct:   q.connectionType || q.connection || 'Both',
      ll:   Array.isArray(q.loveLanguages)?(q.loveLanguages[0]||''):(q.loveLanguage||''),
      hobbies: uniq(toList(q.hobbies).map(x=>x.toLowerCase())),
      values:  uniq(toList(q.values).map(x=>x.toLowerCase()))
    };
  }

  function avatarHTML(name, photo){
    if (photo && /^https?:|^data:image/i.test(photo)) {
      return `<span class="sl-avatar"><img src="${esc(photo)}" alt=""></span>`;
    }
    const ch = String(name||'?').trim().charAt(0).toUpperCase() || '?';
    return `<span class="sl-avatar" aria-hidden="true">${esc(ch)}</span>`;
  }

  // scoring (neliečiam logikos)
  const sameLL=(a,b)=> (a&&b&&a.trim().toLowerCase()===b.trim().toLowerCase())?1:0;
  const jaccard=(A,B)=>{
    const a=new Set(A||[]), b=new Set(B||[]);
    if(!a.size && !b.size) return 0;
    let inter=0; a.forEach(x=>{ if(b.has(x)) inter++; });
    return inter/(a.size+b.size-inter);
  };
  function score(me,fr,w=1){
    const sLL=25*sameLL(me.ll,fr.ll)*w;
    const sCT=15*((me.ct==='Any'||!me.ct)?1:(fr.ct==='Both'||me.ct==='Both')?1:String(me.ct).toLowerCase()===String(fr.ct).toLowerCase()?1:0);
    const sH =30*jaccard(me.hobbies,fr.hobbies);
    const sV =30*jaccard(me.values, fr.values);
    return Math.max(0,Math.min(100,Math.round(sLL+sCT+sH+sV)));
  }

  function normalizeFriend(f){
    const ctRaw = String(f.ct || f.connection || '').toLowerCase();
    const ct = /rom/.test(ctRaw) ? 'Romantic' : /friend/.test(ctRaw) ? 'Friendship' : /both|any/.test(ctRaw) ? 'Both' : (f.ct||'');
    return {
      name: f.name || '—',
      ct,
      ll: f.ll || f.loveLanguage || '',
      hobbies: uniq(toList(f.hobbies).map(x=>x.toLowerCase())),
      values:  uniq(toList(f.values).map(x=>x.toLowerCase())),
      photo: f.photo || '',
      whatsapp: f.whatsapp, instagram: f.instagram, facebook: f.facebook, email: f.email, contact: f.contact, notes: f.notes
    };
  }

  // subline – be "•"
  const subline = f => `${esc(f.ct || 'Unknown')} — ${esc(f.ll || 'Unknown')}`;

  function chips(title, arr){
    let list = toList(arr).filter(Boolean).filter(v => !looksContact(v));
    if(!list.length) return '';
    return `<div class="sl-badges"><b style="margin-right:4px">${esc(title)}:</b> ${
      list.slice(0,12).map(v=>`<span class="pill">${esc(v)}</span>`).join(' ')
    }</div>`;
  }

  // Message tik jei yra kontaktas
  function hasContact(f){
    return !!(f.whatsapp || f.instagram || f.facebook || f.email || f.contact);
  }
  function messageBtn(f){
    if (!hasContact(f)) return '';
    if (f.whatsapp && digits(f.whatsapp)) return `<a class="btn" href="https://wa.me/${digits(f.whatsapp)}" target="_blank" rel="noopener">Message</a>`;
    if (f.instagram){
      const u=/^https?:\/\//i.test(f.instagram)?f.instagram:`https://instagram.com/${f.instagram.replace(/^@/,'')}`;
      return `<a class="btn" href="${u}" target="_blank" rel="noopener">Message</a>`;
    }
    if (f.facebook){
      const u=/^https?:\/\//i.test(f.facebook)?f.facebook:`https://facebook.com/${f.facebook.replace(/^@/,'')}`;
      return `<a class="btn" href="${u}" target="_blank" rel="noopener">Message</a>`;
    }
    if (f.email && isEmail(f.email)) return `<a class="btn" href="mailto:${esc(f.email)}">Message</a>`;
    if (f.contact){
      const v=f.contact.trim();
      if (isURL(v))  return `<a class="btn" href="${esc(v)}" target="_blank" rel="noopener">Message</a>`;
      if (isEmail(v))return `<a class="btn" href="mailto:${esc(v)}">Message</a>`;
      if (isPhone(v))return `<a class="btn" href="tel:${digits(v)}">Message</a>`;
      if (isHandle(v))return `<a class="btn" href="https://instagram.com/${esc(v.replace(/^@/,''))}" target="_blank" rel="noopener">Message</a>`;
    }
    return '';
  }

  function cardHTML(f, s, includeCompare=true){
    const cls = s>=75 ? 'good' : s>=55 ? 'ok' : 'low';
    return `
    <article class="sl-card card">
      <span class="score ${cls} score-badge">${s}%</span>
      <div class="sl-head">
        ${avatarHTML(f.name, f.photo)}
        <div style="min-width:0">
          <div class="sl-name">${esc(f.name)}</div>
          <div class="sl-sub">${subline(f)}</div>
        </div>
      </div>
      ${chips('Hobbies', f.hobbies)}
      ${chips('Values',  f.values)}
      ${f.notes ? `<div style="margin:.2rem 0 .4rem"><i>${esc(f.notes)}</i></div>` : ''}
      <div class="sl-actions">
        <a class="btn" href="friends.html">Edit in Friends</a>
        ${messageBtn(f)}
        ${includeCompare ? `<a class="btn" href="friends.html">Compare →</a>` : ''}
      </div>
    </article>`;
  }

  function render(weight=1){
    const ME = me();
    $('#me-name')    && ($('#me-name').textContent = ME.name);
    $('#me-ct')      && ($('#me-ct').textContent   = ME.ct || '—');
    $('#me-ll')      && ($('#me-ll').textContent   = ME.ll || '—');
    $('#me-hobbies') && ($('#me-hobbies').textContent = (ME.hobbies.join(', ') || '—'));
    $('#me-values')  && ($('#me-values').textContent  = (ME.values.join(', ')  || '—'));

    const friends = mergeFriends().map(normalizeFriend).map(f=>({ ...f, score: score(ME,f,weight) }));
    const all = friends.slice().sort((a,b)=> b.score - a.score || a.name.localeCompare(b.name));
    const avg = all.length ? Math.round(all.reduce((s,x)=>s+x.score,0)/all.length) : 0;
    const top3 = all.slice(0,3).map(x=>x.name);

    $('#topOverview') && ($('#topOverview').innerHTML =
      `<span><b>Average score:</b> ${avg}%</span>${top3.length?` · <span><b>Top matches:</b> ${top3.join(', ')}</span>`:''}`);

    // shared su ME
    const SH = new Map(), SV = new Map();
    all.forEach(f=>{
      f.hobbies.forEach(h=>{ if(ME.hobbies.includes(h)) SH.set(h,(SH.get(h)||0)+1); });
      f.values.forEach(v=>{ if(ME.values.includes(v))  SV.set(v,(SV.get(v)||0)+1); });
    });
    const topH=[...SH.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k);
    const topV=[...SV.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k);
    $('#insights') && ($('#insights').innerHTML =
      (topH.length? `<div><b>Shared Hobbies</b> ${topH.map(t=>`<span class="pill">${esc(t)}</span>`).join(' ')}</div>`:'') +
      (topV.length? `<div><b>Shared Values</b> ${topV.map(t=>`<span class="pill">${esc(t)}</span>`).join(' ')}</div>`:'')
    );

    const rom = all.filter(f=>/romantic/i.test(f.ct)||/both/i.test(f.ct));
    const fri = all.filter(f=>/friend/i.test(f.ct)||/both/i.test(f.ct));

    $('#romantic')  && ($('#romantic').innerHTML  = rom.map(f=>cardHTML(f,f.score,true)).join(''));
    $('#friendship')&& ($('#friendship').innerHTML = fri.map(f=>cardHTML(f,f.score,true)).join(''));

    const has = rom.length + fri.length > 0;
    $('#empty') && ($('#empty').style.display = has ? 'none' : 'block');

    // slider label live
    const lab = $('#llw-label'); if(lab){ lab.textContent = `${(weight||1).toFixed(1)}×`; }
  }

  // feedback toast + local save (nekeičiant galimos EmailJS integracijos)
  (function feedback(){
    const stars = $('#fbStars'); if(!stars) return;

    if (!stars.querySelector('input')){
      for(let i=1;i<=5;i++){
        const id=`fb-s-${i}`;
        const input=document.createElement('input');
        input.type='radio'; input.name='fb-stars'; input.id=id; input.value=String(i); input.hidden=true;
        const label=document.createElement('label'); label.setAttribute('for',id); label.textContent='★'; label.title=`Rate ${i}`;
        input.addEventListener('change',()=>{ [...stars.querySelectorAll('label')].forEach((L,idx)=> L.classList.toggle('active', idx < i)); });
        stars.append(input,label);
      }
    }

    const toast = $('#fbToast');
    function showToast(){
      if(!toast) return;
      toast.hidden = false;
      toast.classList.remove('hide');
      toast.classList.add('show');
      setTimeout(()=>{ toast.classList.add('hide'); toast.classList.remove('show'); }, 2000);
      setTimeout(()=>{ toast.hidden = true; }, 2400);
    }

    $('#fbSend')?.addEventListener('click', ()=>{
      const n = +(stars.querySelector('input[name="fb-stars"]:checked')?.value||0);
      const payload = { stars:n, email:$('#fbEmail')?.value||'', msg:$('#fbMsg')?.value||'', at:new Date().toISOString() };
      try{
        const arr = READ('soulink.feedback') || [];
        arr.push(payload);
        localStorage.setItem('soulink.feedback', JSON.stringify(arr));
        showToast();
        $('#fbEmail')&&( $('#fbEmail').value='' ); $('#fbMsg')&&( $('#fbMsg').value='' );
        stars.querySelectorAll('input').forEach(i=>i.checked=false);
        stars.querySelectorAll('label').forEach(L=>L.classList.remove('active'));
      }catch{
        showToast(); // bent jau UX reakcija
      }
    });
  })();

  // settings slider
  const slider = $('#llWeight');
  const run = ()=> render(parseFloat(slider?.value||'1')||1);
  slider?.addEventListener('input', run);

  document.addEventListener('DOMContentLoaded', run);
})();
// === Results: Export & Print wiring (safe add-on) ===
(() => {
  const $ = s => document.querySelector(s);
  const READ = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };

  function exportJSON(){
    const payload = {
      me: READ('soulink.soulQuiz') || READ('soulQuiz') || {},
      friends: (READ('soulink.friends.list') || READ('soulink.friends') || READ('soulFriends') || [])
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `soulink-results-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  $('#btnExport')?.addEventListener('click', exportJSON);
  $('#btnPrint') ?.addEventListener('click', () => window.print());
})();
const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = `soulink-results-${new Date().toISOString().slice(0,10)}.json`;
