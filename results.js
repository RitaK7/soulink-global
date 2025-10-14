// Soulink · Results — normalios kortelės + mažas avataras + overview
(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // ===== Helpers =====
  const READ = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const digits = s => String(s||'').replace(/\D/g,'');
  const uniq = a => [...new Set(a)];
  const toList = v => Array.isArray(v) ? v
                    : typeof v === 'string' ? v.split(/[,;|/]\s*|\s{2,}|\n/).map(s=>s.trim()).filter(Boolean)
                    : [];

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
      return `<span class="sl-avatar"><img src="${escapeHTML(photo)}" alt=""></span>`;
    }
    const ch = String(name||'?').trim().charAt(0).toUpperCase() || '?';
    return `<span class="sl-avatar" aria-hidden="true">${escapeHTML(ch)}</span>`;
  }

  function ringHTML(p){
    const C=2*Math.PI*32, off=C*(1-Math.max(0,Math.min(1,p/100)));
    return `<div class="sl-score score-ring" title="Compatibility">
      <svg viewBox="0 0 76 76" aria-hidden="true">
        <circle class="ring-track" cx="38" cy="38" r="32"></circle>
        <circle class="ring-prog" cx="38" cy="38" r="32" stroke-dasharray="${C}" stroke-dashoffset="${off}"></circle>
      </svg>
      <div class="score-num">${p}<small>%</small></div>
    </div>`;
  }

  // scoring
  const sameLL=(a,b)=> (a&&b&&a.trim().toLowerCase()===b.trim().toLowerCase())?1:0;
  const jaccard=(A,B)=>{
    const a=new Set(A||[]), b=new Set(B||[]);
    if(!a.size && !b.size) return 0;
    let inter=0; a.forEach(x=>{ if(b.has(x)) inter++; });
    return inter/(a.size+b.size-inter);
  };
  function score(me,f,w=1){
    const sLL=25*sameLL(me.ll,f.ll)*w;
    const sCT=15*((me.ct==='Any'||!me.ct)?1:(f.ct==='Both'||me.ct==='Both')?1:String(me.ct).toLowerCase()===String(f.ct).toLowerCase()?1:0);
    const sH =30*jaccard(me.hobbies,f.hobbies);
    const sV =30*jaccard(me.values,f.values);
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
      photo: f.photo || ''
    };
  }

  function subline(f){ return `${escapeHTML(f.ct||'Unknown')} • ${escapeHTML(f.ll||'Unknown')}`; }
  function chips(title, arr){
    const list = toList(arr);
    if(!list.length) return '';
    return `<div class="sl-badges"><b style="margin-right:4px">${title}:</b> ${
      list.slice(0,12).map(v=>`<span class="pill">${escapeHTML(v)}</span>`).join(' ')
    }</div>`;
  }
  function messageBtn(f){
    if (f.whatsapp && digits(f.whatsapp)) return `<a class="btn" href="https://wa.me/${digits(f.whatsapp)}" target="_blank" rel="noopener">Message</a>`;
    if (f.instagram){
      const u=/^https?:\/\//i.test(f.instagram)?f.instagram:`https://instagram.com/${f.instagram.replace(/^@/,'')}`;
      return `<a class="btn" href="${u}" target="_blank" rel="noopener">Message</a>`;
    }
    if (f.facebook){
      const u=/^https?:\/\//i.test(f.facebook)?f.facebook:`https://facebook.com/${f.facebook.replace(/^@/,'')}`;
      return `<a class="btn" href="${u}" target="_blank" rel="noopener">Message</a>`;
    }
    if (f.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return `<a class="btn" href="mailto:${f.email}">Message</a>`;
    return `<a class="btn" href="friends.html">Message</a>`;
  }

  function cardHTML(f, s, includeCompare=true){
    return `
    <article class="sl-card card">
      <div class="sl-head">
        ${avatarHTML(f.name, f.photo)}
        <div style="min-width:0">
          <div class="sl-name">${escapeHTML(f.name)}</div>
          <div class="sl-sub">${subline(f)}</div>
        </div>
        ${ringHTML(s)}
      </div>
      ${chips('Hobbies', f.hobbies)}
      ${chips('Values',  f.values)}
      <div class="sl-actions">
        <a class="btn" href="friends.html">Edit in Friends</a>
        ${messageBtn(f)}
        ${includeCompare ? `<a class="btn" href="friends.html">Compare →</a>` : ''}
      </div>
    </article>`;
  }

  // compute + render
  function render(weight=1){
    const ME = me();
    $('#me-name')    && ($('#me-name').textContent = ME.name);
    $('#me-ct')      && ($('#me-ct').textContent   = ME.ct || '—');
    $('#me-ll')      && ($('#me-ll').textContent   = ME.ll || '—');
    $('#me-hobbies') && ($('#me-hobbies').textContent = (ME.hobbies.join(', ') || '—'));
    $('#me-values')  && ($('#me-values').textContent  = (ME.values.join(', ')  || '—'));

    const friends = mergeFriends().map(normalizeFriend).map(f=>{
      return { ...f, score: score(ME, f, weight),
        whatsapp: f.whatsapp, instagram: f.instagram, facebook: f.facebook, email: f.email, contact:f.contact, notes:f.notes };
    });

    // overview
    const all = friends.slice().sort((a,b)=> b.score - a.score || a.name.localeCompare(b.name));
    const avg = all.length ? Math.round(all.reduce((s,x)=>s+x.score,0)/all.length) : 0;
    const top3 = all.slice(0,3).map(x=>x.name);
    $('#topOverview') && ($('#topOverview').innerHTML =
      `<span><b>Average score:</b> ${avg}%</span>${top3.length?` · <span><b>Top matches:</b> ${top3.join(', ')}</span>`:''}`);

    // shared hobbies/values (su ME)
    const SH = new Map(), SV = new Map();
    all.forEach(f=>{
      f.hobbies.forEach(h=>{ if(ME.hobbies.includes(h)) SH.set(h,(SH.get(h)||0)+1); });
      f.values.forEach(v=>{ if(ME.values.includes(v))  SV.set(v,(SV.get(v)||0)+1); });
    });
    const topH=[...SH.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k);
    const topV=[...SV.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k);
    $('#insights') && ($('#insights').innerHTML =
      (topH.length? `<div><b>Shared Hobbies</b> ${topH.map(t=>`<span class="pill">${escapeHTML(t)}</span>`).join(' ')}</div>`:'') +
      (topV.length? `<div><b>Shared Values</b> ${topV.map(t=>`<span class="pill">${escapeHTML(t)}</span>`).join(' ')}</div>`:'')
    );

    // lists (Romantic / Friendship / Both patenka į abu)
    const rom = all.filter(f=>/romantic/i.test(f.ct)||/both/i.test(f.ct));
    const fri = all.filter(f=>/friend/i.test(f.ct)||/both/i.test(f.ct));

    $('#romantic')  && ($('#romantic').innerHTML  = rom.map(f=>cardHTML(f,f.score,true)).join(''));
    $('#friendship')&& ($('#friendship').innerHTML = fri.map(f=>cardHTML(f,f.score,true)).join(''));

    const has = rom.length + fri.length > 0;
    $('#empty') && ($('#empty').style.display = has ? 'none' : 'block');

    // label
    $('#llw-label') && ($('#llw-label').textContent = weight.toFixed(1) + '×');
  }

  // feedback stars
  (function feedback(){
    const stars = $('#fbStars'); if(!stars) return;
    for(let i=1;i<=5;i++){
      const id=`fb-s-${i}`;
      const input=document.createElement('input');
      input.type='radio'; input.name='fb-stars'; input.id=id; input.value=String(i); input.hidden=true;
      const label=document.createElement('label'); label.setAttribute('for',id); label.textContent='★'; label.title=`Rate ${i}`;
      input.addEventListener('change',()=>{ [...stars.querySelectorAll('label')].forEach((L,idx)=> L.classList.toggle('active', idx < i)); });
      stars.append(input,label);
    }
    $('#fbSend')?.addEventListener('click', ()=>{
      const n = +(stars.querySelector('input[name="fb-stars"]:checked')?.value||0);
      const payload = { stars:n, email:$('#fbEmail')?.value||'', msg:$('#fbMsg')?.value||'', at:new Date().toISOString() };
      try{
        const arr = READ('soulink.feedback') || [];
        arr.push(payload);
        localStorage.setItem('soulink.feedback', JSON.stringify(arr));
        alert('Ačiū! Your feedback was saved locally.');
        $('#fbEmail')&&( $('#fbEmail').value='' ); $('#fbMsg')&&( $('#fbMsg').value='' );
        stars.querySelectorAll('input').forEach(i=>i.checked=false);
        stars.querySelectorAll('label').forEach(L=>L.classList.remove('active'));
      }catch{ alert('Could not store feedback.'); }
    });
  })();

  // settings slider
  const slider = $('#llWeight');
  function run(){ render(parseFloat(slider?.value||'1')||1); }
  slider?.addEventListener('input', run);

  document.addEventListener('DOMContentLoaded', run);
})();
