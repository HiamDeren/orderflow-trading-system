/* =========================================================
   Shell dùng chung: sidebar, topbar, bottom nav, router chương,
   đồng hồ phiên NY, lưu tiến độ đọc + vị trí học gần nhất.
   ========================================================= */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const store={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
};

const NAV=[
  {k:'home',href:'index.html',label:'Tổng quan',sub:'Bảng điều khiển',c:'var(--brand)',icon:'home'},
  {k:'tools',href:'tools.html',label:'Orderflow Tools',short:'Tools',sub:'DOM · Tape · Footprint · Delta',c:'var(--c-tools)',icon:'fp',chapters:[
    ['tong-quan','00','Tổng quan'],['nen-tang','01','Nền tảng'],['dom','02','DOM'],['tape','03','Tape'],
    ['footprint','04','Footprint'],['delta','05','Delta & CVD'],['kich-ban','06','13 kịch bản'],
    ['ket-hop','07','Kết hợp tại level'],['thuat-ngu','08','Thuật ngữ']]},
  {k:'levels',href:'levels.html',label:'TPO Level Playbook',short:'Level',sub:'TPO · VWAP · CVD · Plan',c:'var(--c-levels)',icon:'tpo',chapters:[
    ['lo-trinh','00','Lộ trình 9 tuần'],['nen-tang','01','Nền tảng TPO'],['cau-truc','02','Day & Open types'],
    ['levels','03','Level map'],['vwap','04','VWAP RTH'],['cvd','05','CVD divergence'],
    ['plan','06','Lên plan mỗi ngày'],['template','07','Đọc template']]},
  {k:'quiz',href:'quiz.html',label:'Trắc nghiệm',short:'Quiz',sub:'Luyện tập · Thi thử',c:'var(--c-quiz)',icon:'quiz',chapters:[
    ['luyen-tap','A','Luyện tập'],['thi-thu','B','Thi thử'],['cau-sai','C','Ôn câu sai']]}
];
const ICON={
  home:'<path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  fp:'<path d="M7 3v18M17 3v18"/><rect x="4.5" y="7" width="5" height="9" rx="1"/><rect x="14.5" y="5" width="5" height="7" rx="1"/>',
  tpo:'<path d="M4 4v16"/><path d="M4 6h5M4 9.5h10M4 13h16M4 16.5h11M4 20h6"/>',
  quiz:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12.2 2.4 2.4 4.7-5"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  close:'<path d="M6 6l12 12M18 6 6 18"/>'
};
const svg=(k,s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const LOGO=`<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" fill="#141B26" stroke="#2A3547"/>
  <rect x="7" y="7" width="7" height="3" rx="1.2" fill="#4CC9F0"/><rect x="7" y="11.5" width="13" height="3" rx="1.2" fill="#EE5A8F"/>
  <rect x="7" y="16" width="20" height="3" rx="1.2" fill="#E7B04B"/><rect x="7" y="20.5" width="14" height="3" rx="1.2" fill="#EE5A8F"/>
  <rect x="7" y="25" width="6" height="3" rx="1.2" fill="#4CC9F0"/></svg>`;

const page=document.body.dataset.page||'home';
const cur=NAV.find(n=>n.k===page)||NAV[0];
document.body.style.setProperty('--c',cur.c);

/* ---------- build shell ---------- */
function buildShell(){
  const main=$('main.ui-main'); if(!main) return;
  const side=document.createElement('aside');side.className='ui-side';side.id='ui-side';side.setAttribute('aria-label','Điều hướng');
  let h=`<a class="ui-logo" href="index.html">${LOGO}<span><b>Orderflow System</b><small>NQ · ATAS · Rithmic</small></span></a><nav class="ui-nav">`;
  NAV.forEach((n,i)=>{
    if(i===1) h+=`<div class="ui-sec-label">Khoá học</div>`;
    if(n.k==='quiz') h+=`<div class="ui-sec-label">Ôn luyện</div>`;
    const on=n.k===page;
    h+=`<a class="ui-item${on?' on':''}" href="${n.href}" style="--c:${n.c}"${on?' aria-current="page"':''}><span class="ico">${svg(n.icon)}</span><span class="lbl">${n.label}<small>${n.sub}</small></span>${n.chapters?`<span class="cnt" data-cnt="${n.k}"></span>`:''}</a>`;
    if(on&&n.chapters){
      h+=`<ol class="ui-toc" style="--c:${n.c}">`+n.chapters.map(([s,no,t])=>`<li><a href="#${s}" data-slug="${s}"><span class="n">${no}</span><span>${t}</span><span class="ck">✓</span></a></li>`).join('')+`</ol>`;
    }
  });
  h+=`</nav><div class="ui-side-foot"><div class="ui-mini" id="ui-mini"></div></div>`;
  side.innerHTML=h;
  document.body.insertBefore(side,main);

  const scrim=document.createElement('div');scrim.className='ui-scrim';scrim.addEventListener('click',closeNav);
  document.body.insertBefore(scrim,main);

  const top=document.createElement('header');top.className='ui-top';
  top.innerHTML=`<div class="ui-top-in"><button class="ui-burger" type="button" aria-label="Mở menu" aria-controls="ui-side" aria-expanded="false">${svg('menu',20)}</button>
    <div class="ui-crumb"><span class="dot"></span>${cur.chapters?`<span class="crumb-course">${cur.label}</span><span class="sep" id="ui-sep" hidden>/</span><b id="ui-chtitle"></b>`:`<b id="ui-chtitle">${cur.label}</b>`}</div>
    <div class="ui-top-right"><span class="ui-clock" id="ui-clock" title="Giờ New York · phiên RTH NQ"><span class="led"></span><span id="ui-clock-t"></span></span></div></div>
    <div class="ui-progress"><i id="ui-prog"></i></div>`;
  main.insertBefore(top,main.firstChild);
  $('.ui-burger',top).addEventListener('click',()=>document.body.classList.contains('nav-open')?closeNav():openNav());

  const bn=document.createElement('nav');bn.className='ui-bottom';bn.setAttribute('aria-label','Điều hướng nhanh');
  bn.innerHTML=NAV.map(n=>`<a href="${n.href}" class="${n.k===page?'on':''}" style="--c:${n.c}">${svg(n.icon,22)}<span>${n.short||'Tổng quan'}</span></a>`).join('');
  document.body.appendChild(bn);
  const t=document.createElement('div');t.className='ui-toast';t.id='ui-toast';t.setAttribute('role','status');document.body.appendChild(t);

  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNav();});
  $$('.ui-toc a',side).forEach(a=>a.addEventListener('click',closeNav));
}
function openNav(){document.body.classList.add('nav-open');const b=$('.ui-burger');b&&b.setAttribute('aria-expanded','true');}
function closeNav(){document.body.classList.remove('nav-open');const b=$('.ui-burger');b&&b.setAttribute('aria-expanded','false');}

/* ---------- toast ---------- */
let tt;function toast(msg){const t=$('#ui-toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2200);}

/* ---------- chapter router ---------- */
const seen=store.get('ofs.seen',{});
function chapterRouter(){
  const secs=$$('[data-chapter]'); if(!secs.length||!cur.chapters) return;
  const list=cur.chapters.filter(([s])=>secs.some(x=>x.dataset.chapter===s));
  const titleOf=s=>(list.find(c=>c[0]===s)||[])[2]||'';
  secs.forEach(sec=>{
    const i=list.findIndex(c=>c[0]===sec.dataset.chapter), prev=list[i-1], next=list[i+1];
    const pg=document.createElement('nav');pg.className='ui-pager';pg.setAttribute('aria-label','Chuyển chương');
    let h='';
    if(prev) h+=`<a class="prev" href="#${prev[0]}"><small>← Chương trước</small><b>${prev[1]} · ${prev[2]}</b></a>`;
    if(next) h+=`<a class="next" href="#${next[0]}"><small>Chương tiếp →</small><b>${next[1]} · ${next[2]}</b></a>`;
    else if(page!=='quiz') h+=`<a class="next cta" href="quiz.html#thi-thu"><small>Hoàn thành khoá →</small><b>Thi thử 50 câu</b></a>`;
    pg.innerHTML=h; sec.appendChild(pg);
  });
  function resolve(){
    const h=decodeURIComponent(location.hash.slice(1));
    if(!h) return {slug:list[0][0]};
    if(list.some(c=>c[0]===h)) return {slug:h};
    const el=document.getElementById(h); const sec=el&&el.closest('[data-chapter]');
    if(sec) return {slug:sec.dataset.chapter,el};
    return {slug:list[0][0]};
  }
  let shown=null;
  function show(){
    const {slug,el}=resolve();
    if(slug!==shown){
      secs.forEach(s=>s.hidden=s.dataset.chapter!==slug);
      shown=slug;
      if(!el) window.scrollTo(0,0);
    }
    if(el) setTimeout(()=>el.scrollIntoView({block:'start'}),30);
    $$('.ui-toc a').forEach(a=>{const on=a.dataset.slug===slug;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
    const i=list.findIndex(c=>c[0]===slug);
    const tEl=$('#ui-chtitle'); if(tEl){tEl.textContent=(list[i][1].length<=2&&/\d/.test(list[i][1])?list[i][1]+' · ':'')+titleOf(slug);}
    const sep=$('#ui-sep'); if(sep) sep.hidden=false;
    const pr=$('#ui-prog'); if(pr) pr.style.width=((i+1)/list.length*100)+'%';
    document.title=`${titleOf(slug)} · ${cur.label} · Orderflow System`;
    seen[page+'/'+slug]=1; store.set('ofs.seen',seen); markSeen();
    store.set('ofs.last',{href:`${cur.href}#${slug}`,page,course:cur.label,title:titleOf(slug),no:list[i][1],ts:Date.now()});
    document.dispatchEvent(new CustomEvent('ofs:chapter',{detail:{slug}}));
  }
  window.addEventListener('hashchange',show);
  show();
}
function markSeen(){
  $$('.ui-toc a').forEach(a=>a.classList.toggle('seen',!!seen[page+'/'+a.dataset.slug]));
  NAV.forEach(n=>{if(!n.chapters||n.k==='quiz')return;const el=$(`[data-cnt="${n.k}"]`);if(el){const d=n.chapters.filter(c=>seen[n.k+'/'+c[0]]).length;el.textContent=`${d}/${n.chapters.length}`;}});
}

/* ---------- NY session clock ---------- */
function nyParts(d){
  const f=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false});
  const p=Object.fromEntries(f.formatToParts(d).map(x=>[x.type,x.value]));
  const wd=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(p.weekday);
  return {wd,h:+p.hour%24,m:+p.minute};
}
const hm=m=>`${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}`;
function session(d=new Date()){
  const {wd,h,m}=nyParts(d), mins=h*60+m, open=570, close=960, wk=wd>=1&&wd<=5;
  let state='closed',msg;
  if(wk&&mins>=open&&mins<close){state='open';msg=`RTH đang mở · còn ${hm(close-mins)}`;}
  else{
    let add=0,dd=wd;
    if(wk&&mins<open){add=open-mins;state=mins>=240?'pre':'closed';}
    else{add=1440-mins+open;dd=(wd+1)%7;while(dd===0||dd===6){add+=1440;dd=(dd+1)%7;}}
    msg=`RTH mở sau ${hm(add)}`;
  }
  return {state,msg,et:`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`};
}
function tick(){
  const s=session(),c=$('#ui-clock'),t=$('#ui-clock-t');if(!c||!t)return;
  c.className='ui-clock '+s.state; t.innerHTML=`<span class="txt-long">NY ${s.et} · </span>${s.msg}`;
}

/* ---------- sidebar mini stats ---------- */
function mini(){
  const el=$('#ui-mini'); if(!el||!window.QZ) return;
  const s=QZ.stats();
  const pOk=s.n?s.ok/s.n*100:0,pBad=s.n?(s.done-s.ok)/s.n*100:0;
  el.innerHTML=`<div>Trắc nghiệm: <b>${s.ok}</b> đúng / <b>${s.done}</b> đã làm · ${s.n} câu</div>
    <div class="meter"><i style="width:${pOk}%;background:var(--buy)"></i><i style="width:${pBad}%;background:var(--sell)"></i></div>
    <div style="display:flex;justify-content:space-between;gap:8px"><a href="quiz.html#cau-sai">Câu sai: ${s.wrong}</a><a href="index.html#backup">Sao lưu tiến độ</a></div>`;
}

window.OFS={store,NAV,session,toast,svg,seen,mini};

buildShell(); markSeen(); tick(); setInterval(tick,30000);
document.addEventListener('DOMContentLoaded',()=>{chapterRouter();mini();});
document.addEventListener('qz:change',mini);
})();
