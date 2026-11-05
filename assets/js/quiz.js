/* =========================================================
   Quiz engine: luyện tập từng câu, thi thử 50/100 câu, ôn câu sai.
   Ngân hàng: window.QBANK (bank-tools.js 87 câu + bank-levels.js 86 câu).
   Tiến độ lưu localStorage, khoá theo id câu (T001…, L001…).
   ========================================================= */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const BANK=window.QBANK||[], MODS=window.QMODS||{};
const BY={}; BANK.forEach(q=>{BY[q.id]=q;});
const COURSE={
  tools:{name:'Orderflow Tools',short:'Tools',c:'var(--c-tools)'},
  levels:{name:'TPO Level',short:'Level',c:'var(--c-levels)'}
};
const KEY='ofs.quiz.v1', CUR='ofs.exam.cur', PASS=0.8;
const LET='ABCD';

/* ---------- state ---------- */
function load(){
  try{const v=JSON.parse(localStorage.getItem(KEY)||'{}')||{};return{ans:v.ans||{},wrong:v.wrong||{},exams:v.exams||[]};}
  catch(e){return{ans:{},wrong:{},exams:[]};}
}
const S=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}document.dispatchEvent(new CustomEvent('qz:change'));}
const getCur=()=>{try{return JSON.parse(localStorage.getItem(CUR)||'null');}catch(e){return null;}};
const setCur=v=>{try{v?localStorage.setItem(CUR,JSON.stringify(v)):localStorage.removeItem(CUR);}catch(e){}};

/* ---------- helpers ---------- */
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function perm(id,n){let x=hash(id)||1;const a=[...Array(n).keys()];for(let k=n-1;k>0;k--){x=(Math.imul(x,1103515245)+12345)>>>0;const j=(x>>>16)%(k+1);[a[k],a[j]]=[a[j],a[k]];}return a;}
function shuffle(a){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
const modLabel=q=>(MODS[q.course]||{})[q.mod]||q.mod;
const idsWhere=(course,mods)=>BANK.filter(q=>(!course||q.course===course)&&(!mods||mods.includes(q.mod))).map(q=>q.id);
function countOf(ids){let done=0,ok=0,wrong=0;ids.forEach(id=>{const a=S.ans[id];if(a!==undefined){done++;if(a===BY[id].a)ok++;}if(S.wrong[id])wrong++;});return{n:ids.length,done,ok,wrong};}
function stats(course,mods){return countOf(idsWhere(course,mods));}
function answer(id,j){S.ans[id]=j;if(j===BY[id].a)delete S.wrong[id];else S.wrong[id]=1;save();}
function visHTML(q){if(!q.vis)return'';try{return`<div class="qz-vis">${q.vis()}</div>`;}catch(e){console.error(e);return'';}}
function fmtDur(ms){const s=Math.max(0,Math.round(ms/1000));return`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}

/* stratified sample: giữ tỉ lệ module trong đề */
function sampleStrat(course,n){
  const g={};BANK.filter(q=>q.course===course).forEach(q=>(g[q.mod]=g[q.mod]||[]).push(q.id));
  const tot=Object.values(g).reduce((s,a)=>s+a.length,0);n=Math.min(n,tot);
  const quota=Object.entries(g).map(([m,a])=>{const x=n*a.length/tot;return{m,a,q:Math.floor(x),f:x-Math.floor(x)};});
  let left=n-quota.reduce((s,o)=>s+o.q,0);quota.sort((p,q)=>q.f-p.f).forEach(o=>{if(left>0){o.q++;left--;}});
  return shuffle(quota.flatMap(o=>shuffle(o.a).slice(0,o.q)));
}

/* ---------- card ---------- */
function cardHTML(q,i,n,ans,mode){
  const done=mode==='review'||(mode==='practice'&&ans!==undefined);
  const order=perm(q.id,q.o.length), c=COURSE[q.course];
  let h=`<article class="qz-card"><div class="qz-card-h"><span class="qz-num">Câu ${i+1}/${n}</span><span class="qz-tag" style="--tc:${c.c}">${c.short} · ${modLabel(q)}</span><span class="qz-id">${q.id}</span></div>
    <p class="qz-q">${q.q}</p>${visHTML(q)}<div class="qz-opts">`;
  order.forEach((j,p)=>{
    let cls='';
    if(done){cls=j===q.a?' ok':j===ans?' bad':' dim';}
    else if(mode==='exam'&&ans===j)cls=' sel';
    h+=`<button type="button" class="qz-opt${cls}" data-j="${j}"${done?' disabled':''}><span class="qz-k">${LET[p]}</span><span>${q.o[j]}</span></button>`;
  });
  h+='</div>';
  if(done){
    const ok=ans===q.a, letter=LET[order.indexOf(q.a)];
    h+=`<div class="qz-ex${ok?'':' bad'}"><b>${ok?'Chính xác.':ans===undefined?'Bỏ trống.':'Chưa đúng.'}</b> ${ok?'':`Đáp án đúng: <b>${letter}</b>. `}${q.e}</div>`;
  }
  return h+'</article>';
}
function keyNav(root,onKey){
  root.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea,select')||e.metaKey||e.ctrlKey||e.altKey)return;
    const k=e.key.toLowerCase();let n='1234'.indexOf(k);if(n<0)n='abcd'.indexOf(k);
    if(n>=0&&k.length===1){const b=$$('.qz-opt',root)[n];if(b&&!b.disabled){b.click();e.preventDefault();}}
    else if(e.key==='ArrowRight'){onKey('next');e.preventDefault();}
    else if(e.key==='ArrowLeft'){onKey('prev');e.preventDefault();}
  });
}
function keepFocus(root,fn){const had=root.contains(document.activeElement);fn();if(had)root.focus({preventScroll:true});}
function scrollCard(root){const c=$('.qz-card',root);if(!c)return;const r=c.getBoundingClientRect();if(r.top<70||r.top>innerHeight*.55)c.scrollIntoView({block:'start',behavior:'smooth'});}
function dotsHTML(list,idx,state){return`<div class="qz-dots${list.length>60?' compact':''}">${list.map((id,i)=>`<button type="button" class="qz-dot${state(id)}${i===idx?' cur':''}" data-go="${i}" aria-label="Câu ${i+1}">${i+1}</button>`).join('')}</div>`;}

/* =========================================================
   PRACTICE
   ========================================================= */
function Practice(root,opt){
  let all=opt.ids(),onlyWrong=false,armed=false,list=all.slice(),idx=firstOpen(list),tried={};
  root.classList.add('qz');root.tabIndex=-1;if(opt.c)root.style.setProperty('--qc',opt.c);
  function firstOpen(l){const i=l.findIndex(id=>S.ans[id]===undefined);return i<0?0:i;}
  function rebuild(keep){all=opt.ids();list=opt.review?all.filter(id=>S.wrong[id]||tried[id]!==undefined):onlyWrong?all.filter(id=>S.wrong[id]):all.slice();const i=keep?list.indexOf(keep):-1;idx=i>=0?i:Math.min(idx,Math.max(0,list.length-1));}
  if(opt.review)rebuild();
  function render(scroll){keepFocus(root,()=>{
    const st=countOf(all);
    let h=`<div class="qz-head"><div class="qz-title">${opt.eyebrow?`<span class="ui-eyebrow">${opt.eyebrow}</span>`:''}<h3 class="qz-h">${opt.title}</h3></div>
      <div class="qz-score">${opt.review?`<b>${list.filter(id=>S.wrong[id]).length}</b> câu cần ôn`:`<b>${st.ok}</b>/${st.n} đúng · ${st.done} đã làm`}</div>
      <div class="qz-actions">${opt.review?'':`<button type="button" class="qz-mini" data-act="wrong" aria-pressed="${onlyWrong}">Chỉ câu sai (${st.wrong})</button>
      <button type="button" class="qz-mini${armed?' warn':''}" data-act="reset">${armed?'Bấm lần nữa để xoá':'Làm lại'}</button>`}</div></div>`;
    if(!opt.review)h+=`<div class="qz-meter"><i class="ok" style="width:${st.n?st.ok/st.n*100:0}%"></i><i class="bad" style="width:${st.n?(st.done-st.ok)/st.n*100:0}%"></i></div>`;
    if(!list.length){root.innerHTML=h+`<div class="qz-empty">${opt.review||onlyWrong?'Không còn câu sai nào cần ôn. Làm thêm ở phần Luyện tập hoặc Thi thử.':'Không có câu nào khớp bộ lọc.'}</div>`;return;}
    h+=dotsHTML(list,idx,id=>{const a=opt.review?tried[id]:S.ans[id];return a===undefined?'':a===BY[id].a?' s-ok':' s-bad';});
    const id=list[idx],q=BY[id];
    const ans=opt.review?tried[id]:S.ans[id];
    h+=cardHTML(q,idx,list.length,ans,'practice');
    const answered=ans!==undefined;
    h+=`<div class="qz-nav"><button type="button" class="qz-navbtn" data-act="prev"${idx===0?' disabled':''}>← Trước</button>
      <span class="pos">${idx+1} / ${list.length}<span class="qz-hint"> · phím 1–4 · ← →</span></span>
      <button type="button" class="qz-navbtn${answered?' go':''}" data-act="next"${idx>=list.length-1?' disabled':''}>Tiếp →</button></div>`;
    root.innerHTML=h;
  });if(scroll)scrollCard(root);}
  function go(d){const n=idx+d;if(n<0||n>=list.length)return;idx=n;armed=false;render(true);}
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||!root.contains(b))return;
    if(b.dataset.j!==undefined){if(b.disabled)return;if(opt.review)tried[list[idx]]=+b.dataset.j;answer(list[idx],+b.dataset.j);armed=false;render();return;}
    if(b.dataset.go!==undefined){idx=+b.dataset.go;armed=false;render(true);return;}
    const a=b.dataset.act;
    if(a==='prev')go(-1);else if(a==='next')go(1);
    else if(a==='wrong'){onlyWrong=!onlyWrong;rebuild();idx=0;render();}
    else if(a==='reset'){
      if(!armed){armed=true;render();setTimeout(()=>{if(armed){armed=false;render();}},3500);return;}
      armed=false;all.forEach(id=>{delete S.ans[id];});save();onlyWrong=false;rebuild();idx=0;render();
    }
  });
  keyNav(root,k=>go(k==='next'?1:-1));
  render();
  return{refresh(){if(opt.review){tried={};idx=0;}rebuild(list[idx]);render();},setIds(fn){opt.ids=fn;onlyWrong=false;rebuild();idx=firstOpen(list);render();}};
}

/* =========================================================
   EXAM
   ========================================================= */
const EXAMS={
  levels:{name:'Đề TPO Level',short:'Level',n:50,c:'var(--c-levels)',desc:'50 câu rút ngẫu nhiên từ 86 câu của khoá Level, giữ tỉ lệ theo chương.',pick:()=>sampleStrat('levels',50)},
  tools:{name:'Đề Orderflow Tools',short:'Tools',n:50,c:'var(--c-tools)',desc:'50 câu rút ngẫu nhiên từ 87 câu của khoá Tools, giữ tỉ lệ theo chương.',pick:()=>sampleStrat('tools',50)},
  all:{name:'Đề tổng hợp',short:'Tổng',n:100,c:'var(--brand)',desc:'100 câu = 50 Level + 50 Tools, xáo trộn. Bài kiểm tra cuối của cả hệ thống.',pick:()=>shuffle(sampleStrat('levels',50).concat(sampleStrat('tools',50)))}
};
const hist=kind=>S.exams.filter(x=>!kind||x.kind===kind);
function streak(kind){let s=0;const h=hist(kind);for(let i=h.length-1;i>=0;i--){if(h[i].right/h[i].n>=PASS)s++;else break;}return s;}
const pct=(a,b)=>b?Math.round(a/b*100):0;

function ring(p,c){const r=62,C=2*Math.PI*r,off=C*(1-p/100);
  return`<svg class="ex-ring" viewBox="0 0 150 150" role="img" aria-label="${p}%"><circle cx="75" cy="75" r="${r}" fill="none" stroke="#1C2533" stroke-width="12"/>
  <circle cx="75" cy="75" r="${r}" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 75 75)"/>
  <text x="75" y="80" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="30" fill="#E4E9F1">${p}%</text>
  <text x="75" y="102" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="11" fill="#8F9BB0">ngưỡng 80%</text></svg>`;}

function Exam(root,opt={}){
  let screen='pick',run=getCur(),result=null,reviewAll=false,armed='',timer=null;
  if(run&&EXAMS[run.kind])screen='run';else{run=null;setCur(null);}
  function stopT(){if(timer){clearInterval(timer);timer=null;}}
  function startT(){stopT();timer=setInterval(()=>{const t=$('.ex-timer',root);if(t&&run)t.textContent=fmtDur(Date.now()-run.t0);},1000);}
  function begin(kind){
    if(kind==='wrong'){const ids=shuffle(Object.keys(S.wrong).filter(id=>BY[id])).slice(0,50);if(!ids.length)return;run={kind,ids,ans:{},t0:Date.now(),idx:0};}
    else run={kind,ids:EXAMS[kind].pick(),ans:{},t0:Date.now(),idx:0};
    setCur(run);screen='run';render();root.scrollIntoView({block:'start'});
  }
  function submit(){
    const by={};let right=0;
    run.ids.forEach(id=>{const q=BY[id],a=run.ans[id],ok=a===q.a;if(ok)right++;
      const k=q.course+':'+q.mod;(by[k]=by[k]||[0,0])[1]++;if(ok)by[k][0]++;
      if(ok)delete S.wrong[id];else S.wrong[id]=1;});
    const rec={ts:Date.now(),kind:run.kind,n:run.ids.length,right,dur:Date.now()-run.t0,by};
    S.exams.push(rec);if(S.exams.length>60)S.exams=S.exams.slice(-60);save();
    result={...rec,ids:run.ids,ans:run.ans};run=null;setCur(null);stopT();screen='result';reviewAll=false;render();root.scrollIntoView({block:'start'});
  }
  const meta=k=>k==='wrong'?{name:'Đề câu sai',short:'Câu sai',c:'var(--sell)'}:EXAMS[k];

  function renderPick(){
    stopT();root.classList.remove('qz');
    const nWrong=Object.keys(S.wrong).filter(id=>BY[id]).length;
    let h=`<div class="ex-pick">`+Object.entries(EXAMS).map(([k,x])=>{
      const H=hist(k),last=H[H.length-1],best=H.reduce((m,r)=>Math.max(m,pct(r.right,r.n)),0),st=streak(k);
      return`<div class="ex-card" style="--c:${x.c}"><span class="ui-eyebrow" style="--c:${x.c}">${x.short}</span><h3>${x.name}</h3>
        <div class="big">${x.n}<small>câu</small></div><p>${x.desc}</p>
        <div class="row"><span>Gần nhất <b>${last?pct(last.right,last.n)+'%':'—'}</b></span><span>Tốt nhất <b>${H.length?best+'%':'—'}</b></span><span>Số lần <b>${H.length}</b></span></div>
        <div class="row" style="align-items:center"><span class="ex-streak">${[0,1,2].map(i=>`<i class="${i<st?'on':''}"></i>`).join('')}</span><span>${st>=3?'<b class="ex-pass">Đã qua bài</b>':`Đạt ≥80% liên tiếp: <b>${Math.min(st,3)}/3</b>`}</span></div>
        <button type="button" class="ui-btn primary" data-begin="${k}" style="${k!=='all'?`background:${x.c};border-color:${x.c}`:''}">Bắt đầu đề ${x.n} câu</button></div>`;}).join('')+`</div>
      <div class="ui-card" style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-top:14px">
        <div><b>Đề câu sai</b><div class="ui-note">Tối đa 50 câu lấy từ danh sách câu bạn đang làm sai (${nWrong} câu). Không chấm qua bài, chỉ để ôn.</div></div>
        <button type="button" class="ui-btn" data-begin="wrong"${nWrong?'':' disabled'}>Làm đề câu sai</button></div>`;
    const H=hist().slice(-12).reverse();
    h+=`<div class="ui-sec" style="margin-top:26px"><div class="ui-sec-h"><h3 class="ui-h2" style="font-size:19px">Lịch sử thi</h3><span class="ui-note">Qua bài khi đạt ≥ 80% ba lần liên tiếp cho cùng một đề</span></div>`;
    h+=H.length?`<div class="ui-tablewrap"><table class="ex-hist"><thead><tr><th>Thời điểm</th><th>Đề</th><th style="text-align:right">Điểm</th><th style="text-align:right">%</th><th style="text-align:right">Thời gian</th></tr></thead><tbody>${H.map(r=>{const p=pct(r.right,r.n);return`<tr><td>${new Date(r.ts).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})}</td><td>${meta(r.kind).name}</td><td class="num">${r.right}/${r.n}</td><td class="num ${p>=80?'ex-pass':'ex-fail'}">${p}%</td><td class="num">${fmtDur(r.dur)}</td></tr>`;}).join('')}</tbody></table></div>`:`<div class="ui-note">Chưa có lần thi nào.</div>`;
    root.innerHTML=h+'</div>';
  }
  function renderRun(scroll){keepFocus(root,()=>{
    root.classList.add('qz');root.tabIndex=-1;const m=meta(run.kind);root.style.setProperty('--qc',m.c);
    const n=run.ids.length,done=run.ids.filter(id=>run.ans[id]!==undefined).length,idx=run.idx,id=run.ids[idx];
    let h=`<div class="qz-head"><div class="qz-title"><span class="ui-eyebrow">Đang thi · không hiện đáp án đến khi nộp</span><h3 class="qz-h">${m.name} · ${n} câu</h3></div>
      <div class="qz-score"><span class="ex-timer">${fmtDur(Date.now()-run.t0)}</span> · <b>${done}</b>/${n} đã chọn</div>
      <div class="qz-actions"><button type="button" class="qz-mini${armed==='quit'?' warn':''}" data-act="quit">${armed==='quit'?'Bấm lần nữa để huỷ':'Huỷ đề'}</button></div></div>
      <div class="qz-meter"><i style="width:${done/n*100}%;background:var(--qc)"></i></div>`;
    h+=dotsHTML(run.ids,idx,x=>run.ans[x]!==undefined?' s-sel':'');
    h+=cardHTML(BY[id],idx,n,run.ans[id],'exam');
    const left=n-done;
    h+=`<div class="qz-nav"><button type="button" class="qz-navbtn" data-act="prev"${idx===0?' disabled':''}>← Trước</button>
      ${idx<n-1?`<button type="button" class="qz-navbtn" data-act="next">Tiếp →</button>`:''}
      <button type="button" class="qz-navbtn go${armed==='submit'?' warn':''}" data-act="submit">${armed==='submit'?`Còn ${left} câu trống · bấm lần nữa`:'Nộp bài'}</button></div>`;
    root.innerHTML=h;
  });if(scroll)scrollCard(root);}
  function renderResult(){
    stopT();root.classList.add('qz');const m=meta(result.kind);root.style.setProperty('--qc',m.c);
    const p=pct(result.right,result.n),pass=p>=80,st=result.kind==='wrong'?0:streak(result.kind);
    const mods=Object.entries(result.by).sort((a,b)=>a[0]<b[0]?-1:1);
    const wrongIds=result.ids.filter(id=>result.ans[id]!==BY[id].a);
    let h=`<div class="qz-head"><div class="qz-title"><span class="ui-eyebrow">Kết quả</span><h3 class="qz-h">${m.name}</h3></div>
      <div class="qz-actions"><button type="button" class="qz-mini" data-act="again">Làm đề mới</button><button type="button" class="qz-mini" data-act="back">Danh sách đề</button></div></div>
      <div class="ex-result">${ring(p,pass?'#35C99B':'#F2636D')}<div style="display:grid;gap:12px;min-width:0;width:100%">
        <div><div style="font-size:22px;font-weight:800" class="${pass?'ex-pass':'ex-fail'}">${pass?'Đạt':'Chưa đạt'} · ${result.right}/${result.n} câu đúng</div>
        <div class="ui-note">Thời gian ${fmtDur(result.dur)}${result.kind!=='wrong'?` · chuỗi đạt liên tiếp ${st}/3${st>=3?' — đã qua bài 🎯':''}`:''}</div></div>
        <div class="ex-mods">${mods.map(([k,[ok,n]])=>{const [c,md]=k.split(':');const pp=pct(ok,n);return`<div class="ex-mod"><span>${COURSE[c].short} · ${(MODS[c]||{})[md]||md}</span><span class="ui-bar"><i style="width:${pp}%;background:${pp>=80?'var(--buy)':pp>=60?'var(--warn)':'var(--sell)'}"></i></span><span>${ok}/${n}</span></div>`;}).join('')}</div>
      </div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><b style="margin-right:6px">Xem lại</b>
        <button type="button" class="ui-chip" data-rev="0" aria-pressed="${!reviewAll}" style="--c:var(--sell)">Câu sai/trống <span class="c">${wrongIds.length}</span></button>
        <button type="button" class="ui-chip" data-rev="1" aria-pressed="${reviewAll}">Tất cả <span class="c">${result.n}</span></button>
        ${wrongIds.length?`<a class="ui-btn sm" href="quiz.html#cau-sai" style="margin-left:auto">Ôn các câu sai →</a>`:''}</div>`;
    const show=reviewAll?result.ids:wrongIds;
    h+=show.length?show.map(id=>cardHTML(BY[id],result.ids.indexOf(id),result.n,result.ans[id],'review')).join(''):`<div class="qz-empty">Không sai câu nào. Xuất sắc!</div>`;
    root.innerHTML=h;
  }
  function render(scroll){if(screen==='run'&&run){renderRun(scroll);startT();}else if(screen==='result'&&result)renderResult();else{screen='pick';renderPick();}}
  function go(d){if(!run)return;const n=run.idx+d;if(n<0||n>=run.ids.length)return;run.idx=n;armed='';setCur(run);renderRun(true);}
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||!root.contains(b))return;
    if(b.dataset.begin){begin(b.dataset.begin);return;}
    if(screen==='run'&&run){
      if(b.dataset.j!==undefined){const id=run.ids[run.idx];run.ans[id]=+b.dataset.j;armed='';setCur(run);renderRun();
        if(run.idx<run.ids.length-1){const at=run.idx;setTimeout(()=>{if(run&&run.idx===at)go(1);},260);}return;}
      if(b.dataset.go!==undefined){run.idx=+b.dataset.go;armed='';setCur(run);renderRun(true);return;}
      const a=b.dataset.act;
      if(a==='prev')go(-1);else if(a==='next')go(1);
      else if(a==='submit'){const left=run.ids.filter(id=>run.ans[id]===undefined).length;if(left&&armed!=='submit'){armed='submit';renderRun();return;}submit();}
      else if(a==='quit'){if(armed!=='quit'){armed='quit';renderRun();setTimeout(()=>{if(armed==='quit'){armed='';run&&renderRun();}},3500);return;}run=null;setCur(null);armed='';screen='pick';render();}
      return;
    }
    if(screen==='result'){
      if(b.dataset.rev!==undefined){reviewAll=b.dataset.rev==='1';renderResult();return;}
      if(b.dataset.act==='again'){begin(result.kind);return;}
      if(b.dataset.act==='back'){screen='pick';result=null;render();}
    }
  });
  keyNav(root,k=>{if(screen==='run')go(k==='next'?1:-1);});
  render();
  return{refresh(){if(screen==='pick')renderPick();}};
}

/* =========================================================
   MOUNTS
   ========================================================= */
function mountInline(){
  $$('[data-qz]').forEach(el=>{
    const [course,modStr]=el.dataset.qz.split(':'),mods=modStr?modStr.split(','):null;
    const n=idsWhere(course,mods).length;
    Practice(el,{ids:()=>idsWhere(course,mods),title:el.dataset.title||'Kiểm tra nhanh',eyebrow:`Trắc nghiệm chương · ${n} câu`,c:COURSE[course].c});
  });
}
function mountCenter(){
  const box=$('#qz-practice');if(!box)return;
  let course='',mod='',open=false;
  const bar=$('#qz-filter');
  const P=Practice(box,{ids:()=>ids(),title:'Ngân hàng câu hỏi',eyebrow:'Luyện tập · có đáp án ngay',c:'var(--c-quiz)'});
  function ids(){let l=idsWhere(course||null,mod?[mod]:null);if(open)l=l.filter(id=>S.ans[id]===undefined);return l;}
  function chips(){
    const tot=c=>idsWhere(c||null).length;
    let h=`<div class="ui-chips">`+[['','Tất cả','var(--brand)'],['levels','TPO Level','var(--c-levels)'],['tools','Orderflow Tools','var(--c-tools)']].map(([k,t,c])=>`<button type="button" class="ui-chip" data-course="${k}" style="--c:${c}" aria-pressed="${course===k}">${t} <span class="c">${tot(k)}</span></button>`).join('')+
      `<button type="button" class="ui-chip" data-open="1" aria-pressed="${open}" style="margin-left:auto">Chỉ câu chưa làm</button></div>`;
    if(course){const M=MODS[course]||{};h+=`<div class="ui-chips"><button type="button" class="ui-chip" data-mod="" aria-pressed="${!mod}" style="--c:${COURSE[course].c}">Mọi chương</button>`+
      Object.entries(M).map(([k,t])=>{const s=stats(course,[k]);return`<button type="button" class="ui-chip" data-mod="${k}" aria-pressed="${mod===k}" style="--c:${COURSE[course].c}">${t} <span class="c">${s.ok}/${s.n}</span></button>`;}).join('')+`</div>`;}
    bar.innerHTML=h;
  }
  bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.course!==undefined){course=b.dataset.course;mod='';}
    else if(b.dataset.mod!==undefined)mod=b.dataset.mod;
    else if(b.dataset.open)open=!open;
    chips();P.setIds(()=>ids());});
  chips();
  document.addEventListener('qz:change',chips);
  const W=$('#qz-wrong')&&Practice($('#qz-wrong'),{ids:()=>BANK.map(q=>q.id),review:true,title:'Ôn câu sai',eyebrow:'Trả lời đúng thì câu tự rời danh sách',c:'var(--sell)'});
  const E=$('#qz-exam')&&Exam($('#qz-exam'));
  document.addEventListener('ofs:chapter',e=>{const s=e.detail.slug;if(s==='cau-sai'&&W)W.refresh();if(s==='luyen-tap')P.refresh();if(s==='thi-thu'&&E)E.refresh();});
}

window.QZ={BANK,BY,MODS,COURSE,EXAMS,S,stats,streak,hist,pct,Practice,Exam,
  resetAll(){S.ans={};S.wrong={};S.exams=[];save();setCur(null);}};
document.addEventListener('DOMContentLoaded',()=>{mountInline();mountCenter();});
})();
