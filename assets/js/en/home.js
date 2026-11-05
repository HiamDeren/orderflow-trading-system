
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const {store,NAV,session,svg,toast}=window.OFS;

/* ---------- hero art: TPO profile + footprint ---------- */
function art(){
  const el=$('#hero-art');if(!el)return;
  const L=[3,5,6,9,12,15,19,24,27,26,22,18,16,12,8,6,4,2],top=28,rh=14,x0=46,u=9.2;
  const vaA=5,vaB=13,poc=8;let g='';
  g+=`<text x="16" y="18" font-family="JetBrains Mono,monospace" font-size="10" fill="#8F9BB0">TPO · RTH</text>`;
  g+=`<rect x="${x0-6}" y="${top+vaA*rh-2}" width="258" height="${(vaB-vaA+1)*rh+2}" rx="4" fill="rgba(238,90,143,.08)" stroke="rgba(238,90,143,.35)" stroke-dasharray="4 4"/>`;
  L.forEach((n,i)=>{const y=top+i*rh,inVA=i>=vaA&&i<=vaB,isP=i===poc;
    for(let k=0;k<n;k++){g+=`<rect x="${x0+k*u}" y="${y}" width="${u-2}" height="${rh-3}" rx="1.5" fill="${isP?'#F5A623':inVA?'#C2185B':'#2A3446'}" opacity="${isP?1:inVA?.55+.45*(k/n):.9}"/>`;}
    if(i>=2&&i<=6){g+=`<rect x="${x0-14}" y="${y}" width="5" height="${rh-3}" rx="1" fill="#C9A96E" opacity=".8"/>`;}
  });
  const lab=(y,t,c)=>`<text x="${x0-20}" y="${y}" text-anchor="end" font-family="JetBrains Mono,monospace" font-size="9.5" fill="${c}">${t}</text>`;
  g+=lab(top+vaA*rh+8,'VAH','#FFC2D8')+lab(top+poc*rh+8,'POC','#FFE2AD')+lab(top+vaB*rh+8,'VAL','#FFC2D8');
  g+=`<line x1="${x0}" x2="296" y1="${top+poc*rh+5.5}" y2="${top+poc*rh+5.5}" stroke="#F5A623" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/>`;
  // VWAP line
  const pts=[[40,250],[80,236],[120,214],[160,190],[200,170],[240,150],[280,146],[300,140]];
  g+=`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#26C6DA" stroke-width="2" opacity=".9"/><text x="250" y="138" font-family="JetBrains Mono,monospace" font-size="9.5" fill="#B9F1F8">VWAP</text>`;
  // footprint column
  const fx=318,rows=[[6,18],[22,64],[30,92],[41,118],[35,70],[28,40],[12,9]],fy=70,fr=20;
  g+=`<rect x="${fx-8}" y="${fy-24}" width="136" height="${rows.length*fr+52}" rx="10" fill="#0E131B" stroke="#273246"/>`;
  g+=`<text x="${fx}" y="${fy-9}" font-family="JetBrains Mono,monospace" font-size="10" fill="#8F9BB0">Footprint M1</text>`;
  g+=`<rect x="${fx}" y="${fy+fr}" width="6" height="${fr*5}" rx="2" fill="#6F8FB8"/>`;
  rows.forEach(([b,a],i)=>{const y=fy+i*fr,imb=a>=3*((rows[i+1]||[99])[0])&&a>=20,isP=i===3;
    if(isP)g+=`<rect x="${fx+12}" y="${y+2}" width="62" height="${fr-4}" rx="2" fill="none" stroke="#E07B39" stroke-width="1.4"/>`;
    g+=`<text x="${fx+40}" y="${y+14}" text-anchor="end" font-family="JetBrains Mono,monospace" font-size="11" fill="${isP?'#F2A262':'#A3A6AA'}">${b}</text>`;
    g+=`<text x="${fx+48}" y="${y+14}" font-family="JetBrains Mono,monospace" font-size="11" font-weight="${imb?700:400}" fill="${imb?'#FFFFFF':isP?'#F2A262':'#A3A6AA'}">${a}</text>`;
    const w=Math.round((a+b)/159*40);g+=`<rect x="${fx+80}" y="${y+4}" width="${w}" height="${fr-8}" rx="1.5" fill="${a>b?'#3F7FD9':'#4A4A4A'}"/>`;
  });
  g+=`<text x="${fx}" y="${fy+rows.length*fr+18}" font-family="JetBrains Mono,monospace" font-size="10.5" fill="#BFF3E0">Δ +237 · 41%</text>`;
  el.innerHTML=`<svg viewBox="0 0 460 300" role="img" aria-label="Illustration of a TPO profile with value area, POC, VWAP and a footprint candle">${g}</svg>`;
}


function sess(){
  const el=$('#sess');if(!el)return;const s=session();if(!s)return;const {clock}=window.OFS;
  let head;
  if(s.inWindow)head=`<b>In the trade window</b> · ends ${s.wEndVN} (in ${clock(s.wEnd-s.now)})`;
  else if(s.state==='open')head=`<b>RTH is open</b> · closes at ${s.closeVN} (in ${clock(s.close-s.now)})`;
  else head=`<b>RTH opens at ${s.openVN} ${s.openDay}</b> · <span style="white-space:nowrap">in ${clock(s.open-s.now)}</span>`;
  el.className='sess '+s.state;
  el.innerHTML=`<div><i class="led"></i>${head}</div>
    <div>Vietnam <b>${s.vnNow}</b> · New York <b>${s.nyNow}</b> (${s.nyDay})</div>
    <div>Trade window <b>${s.openVN}–${s.wEndVN}</b> Vietnam time · <span style="white-space:nowrap">RTH ${s.openVN}–${s.closeVN}</span></div>`;
}

/* ---------- continue ---------- */
function cont(){
  const el=$('#cont');if(!el)return;const last=store.get('ofs.last',null);
  const n=last&&NAV.find(x=>x.k===last.page);
  if(last&&n){
    el.style.setProperty('--c',n.c);el.href=last.href;
    el.innerHTML=`<span class="ico">${svg(n.icon,20)}</span><span><small>Continue · ${n.label}</small><b>${/\d/.test(last.no)?last.no+' · ':''}${last.title}</b></span><span class="arr">→</span>`;
    const b=$('#cta-cont');if(b){b.href=last.href;b.textContent='Continue: '+last.title;}
  }else{
    el.style.setProperty('--c','var(--c-levels)');el.href='levels.en.html#lo-trinh';
    el.innerHTML=`<span class="ico">${svg('tpo',20)}</span><span><small>Start here</small><b>9-week roadmap · TPO Level Playbook</b></span><span class="arr">→</span>`;
  }
}

/* ---------- courses ---------- */
function courses(){
  ['levels','tools'].forEach(k=>{
    const el=$('#course-'+k);if(!el)return;const n=NAV.find(x=>x.k===k),s=QZ.stats(k);
    el.querySelector('.chs').innerHTML=n.chapters.map(([sl,no,t])=>`<a href="${n.href}#${sl}"><span class="n">${no}</span>${t}</a>`).join('');
    el.querySelector('.meters').innerHTML=`<div><div class="lbl"><span>Correct answers</span><b>${s.ok}/${s.n}</b></div><div class="ui-bar"><i style="width:${s.ok/s.n*100}%;background:var(--buy)"></i><i style="width:${(s.done-s.ok)/s.n*100}%;background:var(--sell)"></i></div></div>`;
  });
  // roadmap ticks (levels)
  const r=$('#rm-mini');if(r&&window.PBR){let done=0,all=0;PBR.forEach(([id,n])=>{all+=n;for(let i=0;i<n;i++)if(store.get(`rm-${id}-${i}`,false))done++;});r.textContent=`${done}/${all}`;}
}

/* ---------- quiz ---------- */
function quiz(){
  const s=QZ.stats(),el=$('#qstats');if(!el)return;
  const acc=s.done?Math.round(s.ok/s.done*100):0;
  el.innerHTML=[[s.n,'questions in the bank'],[s.done,'answered'],[s.done?acc+'%':'—','accuracy'],[s.wrong,'mistakes to review']]
    .map(([v,t],i)=>`<div class="ui-card ui-stat"><b style="${i===3&&s.wrong?'color:var(--sell)':i===2&&s.done?`color:${acc>=80?'var(--buy)':'var(--warn)'}`:''}">${v}</b><span>${t}</span></div>`).join('');
  const ex=$('#ex-mini');if(!ex)return;
  ex.innerHTML=Object.entries(QZ.EXAMS).map(([k,x])=>{const H=QZ.hist(k),last=H[H.length-1],st=QZ.streak(k);
    return`<a class="tool" href="quiz.en.html#thi-thu" style="--c:${x.c}"><i class="dot"></i><span><span class="w">${x.n} questions</span><b>${x.name}</b><span class="d">${last?`Last ${QZ.pct(last.right,last.n)}% · `:'Not taken · '}pass streak ${Math.min(st,3)}/3${st>=3?' ✓':''}</span></span></a>`;}).join('');
}

/* ---------- backup ---------- */
function backup(){
  const box=$('#backup');if(!box)return;
  const dump=()=>{const data={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);data[k]=localStorage.getItem(k);}return{app:'orderflow-system',v:1,ts:new Date().toISOString(),data};};
  $('#bk-export').addEventListener('click',()=>{
    const j=JSON.stringify(dump());const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([j],{type:'application/json'}));a.download=`orderflow-progress-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);a.click();a.remove();toast('Progress file downloaded');});
  $('#bk-copy').addEventListener('click',async()=>{const j=JSON.stringify(dump());
    try{await navigator.clipboard.writeText(j);toast('Progress code copied');}catch(e){$('#bk-text').value=j;$('#bk-text').select();toast('The code is shown in the box, copy it manually');}});
  const apply=txt=>{try{const o=JSON.parse(txt);if(!o||o.app!=='orderflow-system'||!o.data)throw 0;
      Object.entries(o.data).forEach(([k,v])=>localStorage.setItem(k,v));toast('Restored, reloading…');setTimeout(()=>location.reload(),700);}
    catch(e){toast('Invalid code');}};
  $('#bk-import').addEventListener('click',()=>{const t=$('#bk-text').value.trim();if(t)apply(t);else $('#bk-file').click();});
  $('#bk-file').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;f.text().then(apply);});
  let armed=false;const rb=$('#bk-reset');
  rb.addEventListener('click',()=>{if(!armed){armed=true;rb.textContent='Press again to erase everything';setTimeout(()=>{armed=false;rb.textContent='Erase all progress';},3500);return;}
    localStorage.clear();toast('Erased');setTimeout(()=>location.reload(),600);});
}

document.addEventListener('DOMContentLoaded',()=>{art();sess();cont();courses();quiz();backup();(function loop(){sess();setTimeout(loop,1000-Date.now()%1000+5);})();});
document.addEventListener('qz:change',()=>{quiz();courses();});
})();
