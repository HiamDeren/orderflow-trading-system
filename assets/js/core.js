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
  {k:'levels',href:'levels.html',label:'TPO Level',short:'Level',sub:'TPO · VWAP · CVD · Plan',c:'var(--c-levels)',icon:'tpo',chapters:[
    ['nen-tang','01','Nền tảng TPO'],['cau-truc','02','Day & Open types'],
    ['initial-balance','03','Initial Balance'],['levels','04','Level map'],['vwap','05','VWAP RTH'],
    ['cvd','06','CVD divergence'],['plan','07','Lên plan mỗi ngày']]},
  {k:'tools',href:'tools.html',label:'Orderflow Tools',short:'Tools',sub:'DOM · Tape · Footprint · Delta',c:'var(--c-tools)',icon:'fp',chapters:[
    ['tong-quan','00','Tổng quan'],['nen-tang','01','Nền tảng'],['thuat-ngu','02','Thuật ngữ'],['dom','03','DOM'],
    ['tape','04','Tape'],['footprint','05','Footprint'],['delta','06','Delta & CVD'],['kich-ban','07','13 kịch bản'],
    ['ket-hop','08','Kết hợp tại level']]},
  {k:'plan',href:'plan.html',label:'Plan Builder',short:'Plan',sub:'Plan + bản đồ level',c:'var(--warn)',icon:'map'},
  {k:'quiz',href:'quiz.html',label:'Trắc nghiệm',short:'Quiz',sub:'Luyện tập · Thi thử',c:'var(--c-quiz)',icon:'quiz',chapters:[
    ['luyen-tap','A','Luyện tập'],['thi-thu','B','Thi thử'],['cau-sai','C','Ôn câu sai']]}
];
const ICON={
  home:'<path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  fp:'<path d="M7 3v18M17 3v18"/><rect x="4.5" y="7" width="5" height="9" rx="1"/><rect x="14.5" y="5" width="5" height="7" rx="1"/>',
  tpo:'<path d="M4 4v16"/><path d="M4 6h5M4 9.5h10M4 13h16M4 16.5h11M4 20h6"/>',
  quiz:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12.2 2.4 2.4 4.7-5"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  map:'<path d="M4 6h16M4 12h16M4 18h16" stroke-dasharray="3 2"/><rect x="6" y="9" width="12" height="6" rx="1"/>',
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
/* ---------- ngôn ngữ: trang VI = x.html, trang EN = x.en.html ---------- */
const LANG=document.documentElement.lang==='en'?'en':'vi';
const FILE={home:'index',tools:'tools',levels:'levels',plan:'plan',quiz:'quiz'}[page]||'index';
const langHref=to=>FILE+(to==='en'?'.en':'')+'.html'+location.hash;
(function(){const pref=store.get('ofs.lang',null);if(pref&&pref!==LANG&&!/[?&]stay/.test(location.search))location.replace(langHref(pref));})();


/* ---------- build shell ---------- */
function buildShell(){
  const main=$('main.ui-main'); if(!main) return;
  const side=document.createElement('aside');side.className='ui-side';side.id='ui-side';side.setAttribute('aria-label','Điều hướng');
  let h=`<a class="ui-logo" href="index.html">${LOGO}<span><b>Orderflow System</b><small>NQ · ATAS · Rithmic</small></span></a><nav class="ui-nav">`;
  NAV.forEach((n,i)=>{
    if(i===1) h+=`<div class="ui-sec-label">Khoá học</div>`;
    if(n.k==='plan') h+=`<div class="ui-sec-label">Công cụ</div>`;
    if(n.k==='quiz') h+=`<div class="ui-sec-label">Ôn luyện</div>`;
    const on=n.k===page;
    h+=`<a class="ui-item${on?' on':''}" href="${n.href}" style="--c:${n.c}"${on?' aria-current="page"':''}><span class="ico">${svg(n.icon)}</span><span class="lbl">${n.label}<small>${n.sub}</small></span></a>`;
    if(on&&n.chapters){
      h+=`<ol class="ui-toc" style="--c:${n.c}">`+n.chapters.map(([s,no,t])=>`<li><a href="#${s}" data-slug="${s}"><span class="n">${no}</span><span>${t}</span></a></li>`).join('')+`</ol>`;
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
    <div class="ui-top-right"><div class="ui-lang" role="group" aria-label="Ngôn ngữ"><a href="${langHref('vi')}" data-lang="vi" class="${LANG==='vi'?'on':''}" hreflang="vi">VI</a><a href="${langHref('en')}" data-lang="en" class="${LANG==='en'?'on':''}" hreflang="en">EN</a></div><span class="ui-clock" id="ui-clock" title="Giờ New York · phiên RTH NQ"><span class="led"></span><span id="ui-clock-t"></span></span></div></div>
    <div class="ui-progress"><i id="ui-prog"></i></div>`;
  main.insertBefore(top,main.firstChild);
  $$('.ui-lang a',top).forEach(a=>a.addEventListener('click',e=>{e.preventDefault();store.set('ofs.lang',a.dataset.lang);location.href=langHref(a.dataset.lang);}));
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
    store.set('ofs.last',{href:`${cur.href}#${slug}`,page,course:cur.label,title:titleOf(slug),no:list[i][1],ts:Date.now()});
    document.dispatchEvent(new CustomEvent('ofs:chapter',{detail:{slug}}));
  }
  window.addEventListener('hashchange',show);
  show();
}

/* ---------- Phiên RTH: tính theo New York, hiển thị theo giờ Việt Nam (tự xử lý DST) ---------- */
const TZ_NY='America/New_York', TZ_VN='Asia/Ho_Chi_Minh';
function zparts(d,tz){
  const f=new Intl.DateTimeFormat('en-US',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  const p=Object.fromEntries(f.formatToParts(d).map(x=>[x.type,x.value]));
  return{y:+p.year,mo:+p.month,d:+p.day,h:+p.hour%24,mi:+p.minute,s:+(p.second||0)};
}
function nyDate(y,mo,d,h,mi){ // giờ NY → Date thật
  const want=Date.UTC(y,mo-1,d,h,mi);let t=want;
  for(let k=0;k<3;k++){const p=zparts(new Date(t),TZ_NY);t-=Date.UTC(p.y,p.mo-1,p.d,p.h,p.mi)-want;}
  return new Date(t);
}
const p2=n=>String(n).padStart(2,'0');
const hhmm=(d,tz)=>{const p=zparts(d,tz);return`${p2(p.h)}:${p2(p.mi)}`;};
const hhmmss=(d,tz)=>{const p=zparts(d,tz);return`${p2(p.h)}:${p2(p.mi)}:${p2(p.s)}`;};
/* đếm ngược realtime dạng hh:mm:ss (thêm số ngày nếu > 24h) */
function clock(ms){const t=Math.max(0,Math.floor(ms/1000)),d=Math.floor(t/86400),h=Math.floor(t%86400/3600),m=Math.floor(t%3600/60),s=t%60;return(d?d+' ngày ':'')+`${p2(h)}:${p2(m)}:${p2(s)}`;}
const dayVN=d=>d.toLocaleDateString('vi-VN',{timeZone:TZ_VN,weekday:'long',day:'2-digit',month:'2-digit'});
const dkey=(d,tz)=>{const p=zparts(d,tz);return p.y*10000+p.mo*100+p.d;};
function relDay(d,now=new Date()){const a=dkey(d,TZ_VN),b=dkey(now,TZ_VN),t=dkey(new Date(now.getTime()+864e5),TZ_VN);
  return a===b?'hôm nay':a===t?'ngày mai':dayVN(d);}
function dur(ms,short){const m=Math.max(0,Math.round(ms/6e4)),h=Math.floor(m/60),r=m%60;
  if(short)return h>=24?`${Math.floor(h/24)}n${h%24}g`:h?`${h}g${String(r).padStart(2,'0')}p`:`${r}p`;
  if(h>=24)return`${Math.floor(h/24)} ngày ${h%24} giờ`;
  return h?`${h} giờ ${r} phút`:`${r} phút`;}
function session(now=new Date()){
  const p=zparts(now,TZ_NY);
  for(let k=0;k<9;k++){
    const b=new Date(Date.UTC(p.y,p.mo-1,p.d+k)),wd=b.getUTCDay();if(wd===0||wd===6)continue;
    const y=b.getUTCFullYear(),mo=b.getUTCMonth()+1,d=b.getUTCDate();
    const open=nyDate(y,mo,d,9,30),wEnd=nyDate(y,mo,d,11,30),close=nyDate(y,mo,d,16,0);
    if(now<close){
      const state=now>=open?'open':(open-now<=5.5*36e5?'pre':'closed');
      return{now,open,wEnd,close,state,inWindow:now>=open&&now<wEnd,
        vnNow:hhmmss(now,TZ_VN),nyNow:hhmmss(now,TZ_NY),openVN:hhmm(open,TZ_VN),wEndVN:hhmm(wEnd,TZ_VN),closeVN:hhmm(close,TZ_VN),
        openDay:relDay(open,now),nyDay:now.toLocaleDateString('vi-VN',{timeZone:TZ_NY,weekday:'long',day:'2-digit',month:'2-digit'})};
    }
  }
}
function tick(){
  const s=session(),c=$('#ui-clock'),t=$('#ui-clock-t');if(!c||!t||!s)return;
  let msg;
  if(s.inWindow)msg=`<span class="txt-mid">Cửa sổ trade · </span>còn ${clock(s.wEnd-s.now)}`;
  else if(s.state==='open')msg=`RTH đang mở · đóng ${s.closeVN}`;
  else msg=`<span class="txt-mid">RTH ${s.openVN} · </span>còn ${clock(s.open-s.now)}`;
  c.className='ui-clock '+s.state;c.title=`Giờ Việt Nam. RTH NQ 9:30–16:00 ET = ${s.openVN}–${s.closeVN} giờ VN`;
  t.innerHTML=`<span class="txt-long">VN ${s.vnNow} · </span>${msg}`;
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

window.OFS={store,NAV,session,dur,clock,toast,svg,mini,LANG};

try{localStorage.removeItem('ofs.seen');}catch(e){}
buildShell(); tick(); (function loop(){tick();setTimeout(loop,1000-Date.now()%1000+5);})();
document.addEventListener('DOMContentLoaded',()=>{chapterRouter();mini();});
document.addEventListener('qz:change',mini);
})();
