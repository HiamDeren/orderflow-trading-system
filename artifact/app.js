/* plan-core.js (đồng bộ từ repo HiamDeren/orderflow-trading-system) */
/* plan-core.js · Composite × pRTH × OVN
 * Hàm thuần dùng chung cho trang Trade Plan (plan.html, trình duyệt), API /api/plan (server, Node) và artifact claude.ai:
 * tìm HVN từ VA các phiên, xếp vị trí, bias, setup, vẽ ảnh plan (SVG).
 * Không dùng DOM. Trình duyệt: window.PlanCore. Node: require / import default.
 */
(function(root, factory){
  if(typeof module === "object" && module.exports) module.exports = factory();
  else root.PlanCore = factory();
})(typeof self !== "undefined" ? self : this, function(){
"use strict";
const fmt = n => (n==null||isNaN(n)) ? "—" : Number(n).toLocaleString("en-US",{maximumFractionDigits:2});
const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const COL = { hvn:"#26A69A", rth:"#E0A458", ovn:"#6F9BD9", rpoc:"#FF9F1A", opoc:"#E87BA4", up:"#3fbf7f", dn:"#ef5350", txt:"#e6e8eb", mut:"#9aa0a8", grid:"#2c2f35" };
const FONT = "Be Vietnam Pro, sans-serif", MONO = "JetBrains Mono, monospace";
const P_OPTS = [
 {k:"in",    n:"Trong HVN",          d:"Giá ở giữa một vùng balance, cách hai mép xa hơn ngưỡng sát mép."},
 {k:"edgeU", n:"Sát mép trên HVN",   d:"Giá ở mép trên một HVN (ngay trong hoặc ngay ngoài). Điểm quyết định: bị từ chối thì fade xuống, được chấp nhận thì continuation lên."},
 {k:"edgeD", n:"Sát mép dưới HVN",   d:"Giá ở mép dưới một HVN. Bị từ chối thì fade lên, được chấp nhận thì continuation xuống."},
 {k:"lvn",   n:"Trong LVN",          d:"Giá nằm giữa hai HVN. Ít người đồng ý giá ở đây, giá thường đi nhanh tới một trong hai mép."},
 {k:"out",   n:"Ngoài composite",    d:"Giá ở trên hoặc dưới mọi HVN: đang khám phá giá. Ưu tiên đi theo, không fade."}
];
const B_OPTS = [
 {k:"accU", n:"Chấp nhận lên",        dir:1,  d:"Đóng trên VAH, hoặc value cao hơn hôm trước, không có tail trên."},
 {k:"accD", n:"Chấp nhận xuống",      dir:-1, d:"Đóng dưới VAL, hoặc value thấp hơn hôm trước, không có tail dưới."},
 {k:"bal",  n:"Balance",              dir:0,  d:"Đóng trong VA, profile cân (D / Normal), không phía nào được chấp nhận."},
 {k:"rejU", n:"Thử lên bị từ chối",   dir:-1, d:"Đi lên trên VAH hoặc mép HVN nhưng để lại tail / poor high, đóng lại phía dưới."},
 {k:"rejD", n:"Thử xuống bị từ chối", dir:1,  d:"Đi xuống dưới VAL hoặc mép HVN nhưng để lại tail dưới, đóng lại phía trên."}
];
const O_OPTS = [
 {k:"up",   n:"Lệch lên / trên VA pRTH",   dir:1,  d:"VA OVN cao hơn VA pRTH: overlap lệch lên hoặc nằm hẳn phía trên."},
 {k:"down", n:"Lệch xuống / dưới VA pRTH", dir:-1, d:"VA OVN thấp hơn VA pRTH: overlap lệch xuống hoặc nằm hẳn phía dưới."},
 {k:"in",   n:"Trong VA pRTH",             dir:0,  d:"Qua đêm chấp nhận value hôm qua, chưa chọn hướng."},
 {k:"wide", n:"Bao trùm VA pRTH",          dir:0,  d:"Qua đêm đi hai chiều, quét cả hai phía value hôm qua. Chờ IB."}
];
const byK = (arr,k) => arr.find(x=>x.k===k);
function biasOf(bk, ok){
  const dB = byK(B_OPTS,bk).dir, dO = byK(O_OPTS,ok).dir;
  let dir=0, conf, cls, need;
  if(dB!==0 && dO===dB){ dir=dB; conf="A củng cố"; cls=dB>0?"up":"dn"; need="Open type không ngược hướng là đủ."; }
  else if(dB!==0 && dO===0){ dir=dB; conf="A cần xác nhận"; cls="nt"; need=`Cần OD/OTD ${dB>0?"lên":"xuống"} và EMA 9/34 cùng hướng lúc 10:00.`; }
  else if(dB===0 && dO!==0){ dir=dO; conf="A cần xác nhận"; cls="nt"; need=`Cần OD/OTD ${dO>0?"lên":"xuống"} cùng hướng OVN.`; }
  else if(dB!==0 && dO===-dB){ dir=0; conf="Xung đột"; cls="dn"; need="pRTH và OVN ngược nhau. Chờ IB, đi theo phía IB được chấp nhận."; }
  else { dir=0; conf="Balance"; cls="nt"; need="Không có hướng. Fade trong HVN, chờ mép."; }
  if(ok==="wide") need += " OVN bao trùm: không trade A period.";
  const word = dir>0?"Lên":dir<0?"Xuống":"Trung tính";
  return {dir, conf, cls, need, word};
}
function setupOf(pk, dir, ctx){
  ctx = ctx || {};
  const z = ctx.z, up = ctx.up, dn = ctx.dn, side = ctx.side;
  const L = (v, t) => v!=null ? fmt(v) : t;
  const zHi = L(z&&z.hi,"mép trên HVN"), zLo = L(z&&z.lo,"mép dưới HVN"), zMid = L(z&&z.mid,"giữa HVN");
  const upLo = up ? fmt(up.lo) : null, dnHi = dn ? fmt(dn.hi) : null;
  const R = (type, text, target, flip) => ({type, text, target, flip});
  if(pk==="in"){
    if(dir===0) return R("Fade", `Fade hai mép HVN ${z?zLo+"–"+zHi:""}: short ở mép trên, long ở mép dưới khi có trigger M1. Target ${zMid}.`, z?z.mid:null, `Period 30' đóng ngoài một mép → chuyển sang continuation theo phía đó.`);
    if(dir>0) return R("Theo bias trong HVN", `Mua pullback trong HVN (về POC / VWAP) theo bias lên, target mép trên ${zHi}. Không short ở mép dưới. Tới mép trên thì xử lý như "Sát mép trên".`, z?z.hi:null, `Period đóng dưới ${zLo} → bias hỏng.`);
    return R("Theo bias trong HVN", `Bán nhịp hồi trong HVN (về POC / VWAP) theo bias xuống, target mép dưới ${zLo}. Không long ở mép trên. Tới mép dưới thì xử lý như "Sát mép dưới".`, z?z.lo:null, `Period đóng trên ${zHi} → bias hỏng.`);
  }
  if(pk==="edgeU"){
    const tgt = upLo ? `mép dưới HVN kế trên ${upLo}` : (ctx.numeric ? "IB extension (không có HVN phía trên trong composite)" : "mép dưới HVN kế trên");
    if(dir>0) return R("Continuation lên", `Chờ 1 period 30' đóng trên ${zHi}. Long ở lần retest ${zHi} trên M1 (nến giữ phía trên, delta dương, EMA 9 > 34). Target ${tgt}.`, up?up.lo:null, `Period kế tiếp đóng lại dưới ${zHi} → breakout thất bại, đứng ngoài hoặc fade về ${zMid}.`);
    if(dir<0) return R("Fade mép trên", `Short khi giá bị từ chối ở ${zHi} (nến đóng lại vào trong, delta âm hoặc absorption). Target ${zMid}, sau đó ${zLo}.`, z?z.mid:null, `Period 30' đóng trên ${zHi} → ngừng fade, cân nhắc continuation lên.`);
    return R("Chờ phản ứng ở mép", `${zHi} là điểm quyết định. Bị từ chối → fade về ${zMid}. Period đóng trên → continuation tới ${tgt}.`, null, "Phản ứng nào đến trước thì theo phía đó.");
  }
  if(pk==="edgeD"){
    const tgt = dnHi ? `mép trên HVN kế dưới ${dnHi}` : (ctx.numeric ? "IB extension (không có HVN phía dưới trong composite)" : "mép trên HVN kế dưới");
    if(dir<0) return R("Continuation xuống", `Chờ 1 period 30' đóng dưới ${zLo}. Short ở lần retest ${zLo} trên M1 (nến giữ phía dưới, delta âm, EMA 9 < 34). Target ${tgt}.`, dn?dn.hi:null, `Period kế tiếp đóng lại trên ${zLo} → breakdown thất bại, đứng ngoài hoặc fade về ${zMid}.`);
    if(dir>0) return R("Fade mép dưới", `Long khi giá bị từ chối ở ${zLo} (nến đóng lại vào trong, delta dương hoặc absorption). Target ${zMid}, sau đó ${zHi}.`, z?z.mid:null, `Period 30' đóng dưới ${zLo} → ngừng fade, cân nhắc continuation xuống.`);
    return R("Chờ phản ứng ở mép", `${zLo} là điểm quyết định. Bị từ chối → fade về ${zMid}. Period đóng dưới → continuation tới ${tgt}.`, null, "Phản ứng nào đến trước thì theo phía đó.");
  }
  if(pk==="lvn"){
    const a = upLo || "mép dưới HVN phía trên", b = dnHi || "mép trên HVN phía dưới";
    if(dir>0) return R("Continuation lên qua LVN", `Đi theo lên tới ${a}. Vào ở retest ${b} hoặc pullback VWAP có trigger. Không mua ở giữa LVN.`, up?up.lo:null, `Period đóng dưới ${b} → hướng lên hỏng.`);
    if(dir<0) return R("Continuation xuống qua LVN", `Đi theo xuống tới ${b}. Vào ở retest ${a} hoặc nhịp hồi về VWAP có trigger. Không bán ở giữa LVN.`, dn?dn.hi:null, `Period đóng trên ${a} → hướng xuống hỏng.`);
    return R("Chờ IB", `Giá lơ lửng trong LVN (${b} – ${a}). Chờ IB. Phía nào được chấp nhận trước thì đi theo tới mép HVN đó.`, null, "LVN thường không giữ giá lâu.");
  }
  // out
  const sideTxt = side>0 ? "trên" : side<0 ? "dưới" : "ngoài";
  const nearEdge = z ? (side>0 ? z.hi : z.lo) : null;
  if(dir!==0 && (side===0 || side===undefined || dir===side)) return R("Đi theo (khám phá giá)", `Giá ở ${sideTxt} composite và bias cùng phía: chỉ đi theo bằng pullback VWAP hoặc retest IB, không fade. Target IB 1.5x–2x.`, null, "Period đóng quay lại vào composite → dừng đi theo.");
  if(dir!==0) return R("Quay lại composite", `Bias ngược phía giá đang khám phá. Chỉ trade khi period đóng quay lại vào trong HVN${nearEdge!=null?" (qua "+fmt(nearEdge)+")":""}, target ${z?fmt(z.mid):"giữa HVN gần nhất"}.`, z?z.mid:null, "Không có period đóng quay lại thì đứng ngoài.");
  return R("Chờ IB", "Giá đang khám phá ngoài composite, không có hướng rõ. Chờ IB, không fade.", null, "—");
}
function vwapGate(type, dir){
  const w = dir>0?"lên":dir<0?"xuống":"";
  if(/^Fade/.test(type)) return "Chỉ fade khi VWAP RTH phẳng. VWAP dốc ra phía mép đang fade thì bỏ. Mép trùng band ±2σ là chỗ fade tốt nhất.";
  if(/^Continuation|^Đi theo/.test(type)) return `Cần VWAP RTH dốc ${w||"theo hướng phá"} và giá giữ phía đó. Pullback về VWAP / ±1σ là điểm vào; giá cắt lại VWAP thì bỏ.`;
  if(type==="Theo bias trong HVN") return `Giá phải giữ phía VWAP RTH theo bias ${w}; vào ở lần chạm VWAP đầu tiên có trigger.`;
  if(type==="Chờ phản ứng ở mép") return "VWAP phẳng → nghiêng về fade. VWAP dốc ra phía mép → chờ continuation.";
  return "Chờ VWAP RTH chọn độ dốc sau IB rồi mới trade theo phía đó.";
}
function parseVA(text){
  const out=[];
  text.split(/\r?\n/).forEach(line=>{
    const t = line.trim().replace(/[,;\t]+/g," ").split(/\s+/);
    if(t.length<4) return;
    const typ = t[1].toUpperCase(); if(typ!=="RTH" && typ!=="OVN") return;
    let a=parseFloat(t[2]), b=parseFloat(t[3]); if(isNaN(a)||isNaN(b)) return;
    if(a>b){ const x=a; a=b; b=x; }
    out.push({date:t[0], typ, lo:a, hi:b});
  });
  return out;
}
function findZones(rows, opt){
  const dates = [...new Set(rows.map(r=>r.date))].sort();
  const keep = new Set(dates.slice(-opt.n));
  rows = rows.filter(r=>keep.has(r.date));
  if(!rows.length) return null;
  const lo = Math.min(...rows.map(r=>r.lo)), hi = Math.max(...rows.map(r=>r.hi));
  const span = hi-lo; const step = span>2500?10:5;
  const g0 = Math.floor(lo/step)*step, n = Math.ceil((hi-g0)/step)+1;
  const cR=new Array(n).fill(0), cO=new Array(n).fill(0);
  rows.forEach(r=>{ const a=Math.ceil((r.lo-g0)/step), b=Math.floor((r.hi-g0)/step); for(let i=Math.max(0,a);i<=Math.min(n-1,b);i++){ if(r.typ==="RTH") cR[i]++; else cO[i]++; } });
  const half = Math.max(1, Math.ceil(opt.k/2));
  const cnt = cR.map((v,i)=> opt.mode==="rth"?v : opt.mode==="ovn"?cO[i] : v+cO[i]);
  const isH = cnt.map((v,i)=> opt.mode==="inter" ? (cR[i]>=half && cO[i]>=half) : v>=opt.k);
  let zones=[]; let s=-1;
  for(let i=0;i<=n;i++){ if(i<n && isH[i]){ if(s<0) s=i; } else if(s>=0){ zones.push({lo:g0+s*step, hi:g0+(i-1)*step+step}); s=-1; } }
  // gộp khe nhỏ
  const merged=[]; zones.forEach(z=>{ const p=merged[merged.length-1]; if(p && z.lo-p.hi <= opt.merge) p.hi=z.hi; else merged.push({...z}); });
  merged.forEach(z=>{ z.w=z.hi-z.lo; z.small = z.w < opt.minw;
    let best=-1, bi=0; for(let i=Math.round((z.lo-g0)/step); i<=Math.round((z.hi-g0)/step) && i<n; i++){ if(cnt[i]>best){best=cnt[i]; bi=i;} } z.peak=g0+bi*step+step/2; });
  const gaps=[]; for(let i=1;i<merged.length;i++){ const a=merged[i-1].hi, b=merged[i].lo; const ja=Math.round((a-g0)/step), jb=Math.round((b-g0)/step); let mn=Infinity; for(let j=ja; j<jb; j++) mn=Math.min(mn,cnt[j]||0);
    let best=null, cs=-1; for(let j=ja;j<=jb;j++){ const inCore = j<jb && (cnt[j]||0)===mn; if(inCore){ if(cs<0) cs=j; } else if(cs>=0){ if(!best || (j-cs)>(best[1]-best[0])) best=[cs,j]; cs=-1; } }
    gaps.push({lo:a, hi:b, w:b-a, clear: mn===0, min:mn, core: best?{lo:g0+best[0]*step, hi:g0+best[1]*step}:null}); }
  return {zones:merged, gaps, cnt, isH, g0, step, n, lo:g0, hi:g0+n*step, days:keep.size, rows:rows.length};
}
function locate(px, zs, tol){
  if(px==null || !zs.length) return null;
  for(const z of zs){ if(Math.abs(px-z.hi)<=tol) return {pk:"edgeU", z}; if(Math.abs(px-z.lo)<=tol) return {pk:"edgeD", z}; }
  for(const z of zs){ if(px>z.lo && px<z.hi) return {pk:"in", z}; }
  if(px>zs[zs.length-1].hi) return {pk:"out", z:zs[zs.length-1], side:1};
  if(px<zs[0].lo) return {pk:"out", z:zs[0], side:-1};
  const dn=[...zs].reverse().find(z=>z.hi<px), up=zs.find(z=>z.lo>px);
  return {pk:"lvn", dn, up, z:null};
}
function ovnKey(r,o){
  if(o.val>=r.val && o.vah<=r.vah) return "in";
  if(o.val<=r.val && o.vah>=r.vah) return "wide";
  return ((o.vah+o.val)/2 > (r.vah+r.val)/2) ? "up" : "down";
}
function geomOf(pk, dir, ctx){
  const z=ctx.z, up=ctx.up, dn=ctx.dn, w=15; const E=[]; let edge=null;
  if(pk==="in" && z){ if(dir===0){ E.push({lo:z.hi-w,hi:z.hi},{lo:z.lo,hi:z.lo+w}); } edge = dir>0?z.lo: dir<0?z.hi : null; }
  else if(pk==="edgeU" && z){ edge=z.hi; E.push(dir>0?{lo:z.hi,hi:z.hi+w}: dir<0?{lo:z.hi-w,hi:z.hi+5}:{lo:z.hi-w,hi:z.hi+w}); }
  else if(pk==="edgeD" && z){ edge=z.lo; E.push(dir<0?{lo:z.lo-w,hi:z.lo}: dir>0?{lo:z.lo-5,hi:z.lo+w}:{lo:z.lo-w,hi:z.lo+w}); }
  else if(pk==="lvn"){ if(dir>0 && dn){ edge=dn.hi; E.push({lo:dn.hi,hi:dn.hi+w}); } else if(dir<0 && up){ edge=up.lo; E.push({lo:up.lo-w,hi:up.lo}); } }
  return {edge, entries:E};
}
function spread(labels, top, bot, gap){
  labels.sort((a,b)=>a.y-b.y);
  for(let i=0;i<labels.length;i++){ labels[i].ly=Math.max(labels[i].y, i?labels[i-1].ly+gap:top); }
  for(let i=labels.length-1;i>=0;i--){ const lim = i===labels.length-1?bot:labels[i+1].ly-gap; if(labels[i].ly>lim) labels[i].ly=lim; }
  return labels;
}
let drawSeq=0;
function wrapText(t, n){
  const out=[]; String(t||"").split(/\n/).forEach(par=>{ let line="";
    par.split(/\s+/).forEach(w=>{ if(!w) return; if((line+" "+w).trim().length>n && line){ out.push(line); line=w; } else line=(line+" "+w).trim(); });
    if(line) out.push(line); });
  return out;
}
function drawPlan(D, M){
  M = M || {}; const u = "p"+(++drawSeq);
  const panel = Array.isArray(M.panel) && M.panel.length ? M.panel : null;
  const x0=70, x1=640, top=88, PX=830;
  const W = panel ? 1300 : 820;
  // khối chữ bên phải: tính chiều cao trước
  const PW = W-24-PX, CH = Math.floor((PW-32)/7.0);
  let blocks=[], need=18;
  if(panel){ blocks = panel.map(it=>({k:it.k, c:it.c, lines:wrapText(it.v, CH)})); blocks.forEach(b=>{ need += 18 + b.lines.length*20 + 12; }); }
  const H = Math.max(660, panel ? top+need+70 : 0), bot=H-64;
  // thang giá: tập trung vào số liệu của phiên, chỉ kéo thêm tới mép HVN gần
  const core=[D.px,D.rvah,D.rval,D.rpoc,D.ovah,D.oval,D.opoc,D.onh,D.onl,D.rhi,D.rlo,D.target].filter(v=>v!=null&&!isNaN(v));
  (M.entries||[]).forEach(e=>core.push(e.lo,e.hi)); if(M.edge!=null) core.push(M.edge);
  let lo=Math.min(...core), hi=Math.max(...core);
  D.zones.forEach(z=>{ if(z.lo>=lo-120 && z.lo<=hi+120) { lo=Math.min(lo,z.lo); hi=Math.max(hi,z.lo); } if(z.hi>=lo-120 && z.hi<=hi+120){ lo=Math.min(lo,z.hi); hi=Math.max(hi,z.hi); } });
  if(hi-lo<250){ const m=(hi+lo)/2; lo=m-125; hi=m+125; }
  const pad=(hi-lo)*0.05; lo-=pad; hi+=pad;
  const y=v=>top+(hi-v)/(hi-lo)*(bot-top); const cl=v=>Math.max(top,Math.min(bot,y(v)));
  const dir = M.dir||0, bcol = dir>0?COL.up:dir<0?COL.dn:"#9aa0a8";
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bản đồ plan ${esc(M.date||"")}: HVN, LVN, VA pRTH, VA OVN, giá, vùng vào lệnh và target">`;
  s+=`<defs><pattern id="hatch${u}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#3a3d44" stroke-width="2"/></pattern><marker id="mk${u}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L9 5L1 9z" fill="${bcol}"/></marker><clipPath id="plot${u}"><rect x="${x0}" y="${top}" width="${x1-x0}" height="${bot-top}"/></clipPath></defs>`;
  s+=`<rect width="${W}" height="${H}" fill="#141518"/><g font-family="${FONT}">`;
  // tiêu đề
  const sub=String(M.loc||""); const subMax = panel?150:100;
  s+=`<text x="24" y="32" fill="#ffffff" font-size="20" font-weight="700">PLAN ${esc(M.date||"")}</text><text x="24" y="58" fill="#c9cdd3" font-size="13">${esc(sub.length>subMax?sub.slice(0,subMax-2)+"…":sub)}</text>`;
  const pills=[[`Bias: ${M.word||"—"} · ${M.conf||""}`, dir>0?"#123a27":dir<0?"#401617":"#2a2c31", dir>0?"#c8f2da":dir<0?"#ffd0cf":"#e6e8eb", bcol],[`Setup: ${M.setup||"—"}`,"#2a2c31","#e6e8eb","#5f636b"]];
  let px0=W-24; pills.forEach(([t,bg,fg,st])=>{ const w=t.length*7.4+22; px0-=w; s+=`<rect x="${px0}" y="12" width="${w}" height="28" rx="6" fill="${bg}" stroke="${st}"/><text x="${px0+w/2}" y="31" fill="${fg}" font-size="13" font-weight="700" text-anchor="middle">${esc(t)}</text>`; px0-=10; });
  // lưới giá
  const span=hi-lo, ts= span>2500?500:span>1200?200:span>600?100:50;
  s+=`<g font-family="${MONO}">`;
  for(let t=Math.ceil(lo/ts)*ts;t<=hi;t+=ts) s+=`<line x1="${x0}" x2="${x1}" y1="${y(t)}" y2="${y(t)}" stroke="#24272c"/><text x="${x0-8}" y="${y(t)+4}" fill="#7d828a" font-size="11" text-anchor="end">${fmt(t)}</text>`;
  s+=`</g><g clip-path="url(#plot${u})">`;
  for(let i=1;i<D.zones.length;i++){ const a=D.zones[i-1].hi,b=D.zones[i].lo; if(b<=lo||a>=hi) continue; s+=`<rect x="${x0}" y="${cl(b)}" width="${x1-x0}" height="${Math.max(0,cl(a)-cl(b))}" fill="url(#hatch${u})" opacity=".55"/>`; }
  D.zones.forEach(z=>{ if(z.hi<lo||z.lo>hi) return; s+=`<rect x="${x0}" y="${cl(z.hi)}" width="${x1-x0}" height="${Math.max(2,cl(z.lo)-cl(z.hi))}" fill="rgba(38,166,154,0.16)" stroke="${COL.hvn}" stroke-dasharray="6 4"/>`; });
  (M.entries||[]).forEach(e=>{ s+=`<rect x="${x0}" y="${y(e.hi)}" width="${x1-x0}" height="${Math.max(3,y(e.lo)-y(e.hi))}" fill="rgba(239,159,39,0.22)" stroke="#EF9F27" stroke-width="1"/>`; });
  if(D.comp){ ["vah","val","poc"].forEach(k=>{ const v=D.comp[k]; if(v!=null && v>lo && v<hi) s+=`<line x1="${x0}" x2="${x1}" y1="${y(v)}" y2="${y(v)}" stroke="#ffffff" stroke-opacity="${k==="poc"?.7:.35}" stroke-dasharray="1 4" stroke-width="${k==="poc"?2:1.5}"/>`; }); }
  s+=`</g>`;
  D.zones.forEach(z=>{ if(z.hi<lo||z.lo>hi) return; const yt=Math.max(top+14, cl(z.hi)+16); s+=`<text x="${x0+8}" y="${yt}" fill="#bff0e8" font-size="12" font-weight="700">HVN ${fmt(z.lo)}–${fmt(z.hi)}</text>`; });
  for(let i=1;i<D.zones.length;i++){ const a=D.zones[i-1].hi,b=D.zones[i].lo; if(b<=lo||a>=hi) continue; const ym=(cl(a)+cl(b))/2; if(cl(a)-cl(b)>18) s+=`<text x="${x0+8}" y="${ym+4}" fill="#c9cdd3" font-size="12">LVN ${fmt(a)}–${fmt(b)}</text>`; }
  const above=D.zones.filter(z=>z.lo>hi), below=D.zones.filter(z=>z.hi<lo);
  if(above.length){ const z=above[0]; s+=`<text x="${x0+8}" y="${top-8}" fill="#9fd8cf" font-size="11">↑ HVN kế trên ${fmt(z.lo)}–${fmt(z.hi)}</text>`; }
  if(below.length){ const z=below[below.length-1]; s+=`<text x="${x0+8}" y="${bot+15}" fill="#9fd8cf" font-size="11">↓ HVN kế dưới ${fmt(z.lo)}–${fmt(z.hi)}</text>`; }
  // pRTH và OVN đặt sát nhau, cùng độ rộng ô
  const steps=[1,2,2.5,5,10,20,25,50,100]; const dr=steps.find(v=>(hi-lo)/v<=120)||100; const rh=(bot-top)/((hi-lo)/dr);
  const prof = per => { if(!per||!per.length) return null; const i0=Math.floor(Math.min(...per.map(p=>p[1]))/dr), i1=Math.floor(Math.max(...per.map(p=>p[0]))/dr); const rows=[]; let mx=1;
    for(let i=i0;i<=i1;i++){ let c=0; per.forEach(([h,l])=>{ if(Math.floor(l/dr)<=i && Math.floor(h/dr)>=i) c++; }); rows.push([i,c]); mx=Math.max(mx,c); }
    const tail=new Set(); for(let k=rows.length-1;k>=0 && rows[k][1]===1;k--) tail.add(rows[k][0]); for(let k=0;k<rows.length && rows[k][1]===1;k++) tail.add(rows[k][0]);
    if(tail.size<2 || tail.size>=rows.length) tail.clear(); return {rows,mx,i1,tail}; };
  const useTpo = M.view!=="box";
  const PR = useTpo ? prof(D.rper) : null, OV = useTpo ? prof(D.oper) : null;
  const startX = x0+175, labW = 58, gap = 22, avail = (x1-40) - startX - 2*labW - gap;
  const bw = Math.max(3, Math.min(10, avail/((PR?PR.mx:12)+(OV?OV.mx:14))));
  const drawTpo=(x,P,lab,vah,val,poc,col,pcol)=>{ let t=""; const hh=Math.max(1,rh-(rh>3?1:0));
    P.rows.forEach(([i,c])=>{ const v=i*dr, m=v+dr/2, inVA=m>=val&&m<=vah, yy=y(v+dr), tl=P.tail.has(i);
      for(let k=0;k<c;k++) t+=`<rect x="${x+k*bw}" y="${yy}" width="${Math.max(1,bw-1)}" height="${hh}" fill="${tl?"#EF5350":col}" fill-opacity="${tl?0.85:inVA?0.92:0.4}"/>`; });
    const w=P.mx*bw;
    t+=`<line x1="${x-5}" x2="${x-5}" y1="${y(vah)}" y2="${y(val)}" stroke="${col}" stroke-width="2"/>`;
    if(poc!=null) t+=`<line x1="${x-8}" x2="${x+w+4}" y1="${y(poc)}" y2="${y(poc)}" stroke="${pcol}" stroke-width="2.5"/>`;
    t+=`<text x="${x+w/2}" y="${Math.max(top+12,y(P.i1*dr+dr)-8)}" fill="#ffffff" font-size="13" font-weight="700" text-anchor="middle">${lab}</text>`;
    t+=`<g font-family="${MONO}"><text x="${x+w+6}" y="${y(vah)+4}" fill="${col}" font-size="11">${fmt(vah)}</text><text x="${x+w+6}" y="${y(val)+4}" fill="${col}" font-size="11">${fmt(val)}</text></g>`;
    return {t, w}; };
  const drawBox=(x,lab,vah,val,poc,h,l,col,pcol)=>{ if(vah==null||val==null) return {t:"",w:0}; let t="", w=80;
    if(h!=null&&l!=null) t+=`<line x1="${x+w/2}" x2="${x+w/2}" y1="${cl(h)}" y2="${cl(l)}" stroke="${col}" stroke-width="2" opacity=".75"/><line x1="${x+w/2-10}" x2="${x+w/2+10}" y1="${cl(h)}" y2="${cl(h)}" stroke="${col}" stroke-width="2"/><line x1="${x+w/2-10}" x2="${x+w/2+10}" y1="${cl(l)}" y2="${cl(l)}" stroke="${col}" stroke-width="2"/>`;
    t+=`<rect x="${x}" y="${y(vah)}" width="${w}" height="${Math.max(3,y(val)-y(vah))}" rx="3" fill="${col}" fill-opacity=".34" stroke="${col}" stroke-width="1.5"/>`;
    if(poc!=null) t+=`<line x1="${x-6}" x2="${x+w+6}" y1="${y(poc)}" y2="${y(poc)}" stroke="${pcol}" stroke-width="3"/>`;
    t+=`<text x="${x+w/2}" y="${Math.max(top+12,cl(Math.max(vah,h!=null?h:vah))-8)}" fill="#ffffff" font-size="13" font-weight="700" text-anchor="middle">${lab}</text>`;
    t+=`<g font-family="${MONO}"><text x="${x+w+6}" y="${y(vah)+4}" fill="${col}" font-size="11">${fmt(vah)}</text><text x="${x+w+6}" y="${y(val)+4}" fill="${col}" font-size="11">${fmt(val)}</text></g>`;
    return {t, w}; };
  const a = PR ? drawTpo(startX,PR,"pRTH",D.rvah,D.rval,D.rpoc,COL.rth,COL.rpoc) : drawBox(startX,"pRTH",D.rvah,D.rval,D.rpoc,D.rhi,D.rlo,COL.rth,COL.rpoc);
  const ox = startX + Math.max(a.w,40) + labW + gap;
  const b = OV ? drawTpo(ox,OV,"OVN",D.ovah,D.oval,D.opoc,COL.ovn,COL.opoc) : drawBox(ox,"OVN",D.ovah,D.oval,D.opoc,D.onh,D.onl,COL.ovn,COL.opoc);
  s+=a.t+b.t;
  if(M.edge!=null) s+=`<line x1="${x0}" x2="${x1}" y1="${y(M.edge)}" y2="${y(M.edge)}" stroke="#EF9F27" stroke-width="2" stroke-dasharray="8 5"/>`;
  if(D.px!=null) s+=`<line x1="${x0}" x2="${x1}" y1="${y(D.px)}" y2="${y(D.px)}" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="2 4"/>`;
  if(D.px!=null && D.target!=null){ const ax=x1-24; s+=`<line x1="${ax}" x2="${ax}" y1="${y(D.px)}" y2="${y(D.target)}" stroke="${bcol}" stroke-width="4" marker-end="url(#mk${u})"/><text x="${ax-8}" y="${(y(D.px)+y(D.target))/2+4}" fill="${bcol}" font-size="12" font-weight="700" text-anchor="end">${fmt(Math.abs(D.target-D.px))} điểm</text>`; }
  // nhãn giá bên phải, không chồng nhau
  const L=[]; const add=(v,t,c,bo)=>{ if(v!=null && !isNaN(v) && v>lo && v<hi) L.push({y:y(v),t,c,b:bo}); };
  add(D.px,`Giá ${fmt(D.px)}`,"#ffffff",true); add(D.target,`Target ${fmt(D.target)}`,bcol,true); add(M.edge,`Đổi bias ${fmt(M.edge)}`,"#EF9F27",true);
  add(D.onh,`ONH ${fmt(D.onh)}`,"#a9c4ea"); add(D.onl,`ONL ${fmt(D.onl)}`,"#a9c4ea");
  add(D.rpoc,`POC pRTH ${fmt(D.rpoc)}`,COL.rpoc); add(D.opoc,`POC OVN ${fmt(D.opoc)}`,COL.opoc);
  add(D.rhi,`pRTH H ${fmt(D.rhi)}`,"#e3c393"); add(D.rlo,`pRTH L ${fmt(D.rlo)}`,"#e3c393");
  if(D.comp){ add(D.comp.poc,`cPOC ${fmt(D.comp.poc)}`,"#d3d1c7"); add(D.comp.vah,`cVAH ${fmt(D.comp.vah)}`,"#b4b2a9"); add(D.comp.val,`cVAL ${fmt(D.comp.val)}`,"#b4b2a9"); }
  spread(L, top+6, bot, 16).forEach(l=>{ s+=`<line x1="${x1}" x2="${x1+10}" y1="${l.y}" y2="${l.ly}" stroke="${l.c}" stroke-opacity=".6"/><text x="${x1+14}" y="${l.ly+4}" fill="${l.c}" font-size="12" font-family="${MONO}" ${l.b?'font-weight="700"':""}>${esc(l.t)}</text>`; });
  // chú thích
  const lg=[["rect","rgba(38,166,154,0.35)",COL.hvn,"HVN (balance)"],["rect",`url(#hatch${u})`,"#555","LVN"],["rect",COL.rth,COL.rth,"pRTH"],["rect",COL.ovn,COL.ovn,"OVN"],["rect","rgba(239,159,39,0.35)","#EF9F27","Vùng vào lệnh"],["line","#EF9F27",null,"Đổi bias (TPO 30')"],["line","#ffffff",null,"Giá 9:29"]];
  if(PR||OV) lg.splice(4,0,["rect","#EF5350","#EF5350","Tail"]);
  let lx=x0, ly=H-26; lg.forEach(([k,f,st,t])=>{ if(k==="rect") s+=`<rect x="${lx}" y="${ly-10}" width="14" height="12" rx="2" fill="${f}" ${st?`stroke="${st}"`:""} ${f===COL.rth||f===COL.ovn?'fill-opacity=".5"':""}/>`; else s+=`<line x1="${lx}" x2="${lx+14}" y1="${ly-4}" y2="${ly-4}" stroke="${f}" stroke-width="2" stroke-dasharray="4 3"/>`; s+=`<text x="${lx+20}" y="${ly}" fill="#c9cdd3" font-size="12">${t}</text>`; lx+=32+t.length*6.4; });
  // khối chữ plan bên phải
  if(panel){
    s+=`<rect x="${PX}" y="${top-6}" width="${PW}" height="${H-top-30}" rx="10" fill="#1a1c20" stroke="#2c2f35"/>`;
    let ty=top+20;
    blocks.forEach(bk=>{ s+=`<text x="${PX+16}" y="${ty}" fill="${bk.c||"#9aa0a8"}" font-size="12" font-weight="700" letter-spacing=".05em">${esc(String(bk.k).toUpperCase())}</text>`; ty+=20;
      bk.lines.forEach(line=>{ s+=`<text x="${PX+16}" y="${ty}" fill="#e6e8eb" font-size="14">${esc(line)}</text>`; ty+=20; }); ty+=12; });
  }
  return s+`</g></svg>`;
}

/* ---------- gợi ý pRTH build từ số liệu ---------- */
function suggestBFrom(p){
  p = p || {};
  const vah=p.vah, val=p.val, poc=p.poc, hi=p.high, lo=p.low, cl=p.close;
  const bad = v => v==null || isNaN(v);
  if([vah,val,cl].some(bad)) return null;
  if(cl>vah) return "accU"; if(cl<val) return "accD";
  const w=vah-val, pc = bad(poc)?(vah+val)/2:poc;
  if(!bad(hi) && hi-vah > 0.5*w && cl<pc) return "rejU";
  if(!bad(lo) && val-lo > 0.5*w && cl>pc) return "rejD";
  return "bal";
}

/* ---------- chọn N HVN gần giá nhất ---------- */
const HVN_DEFAULT = { n:16, k:3, merge:40, minw:100, mode:"both" };
function nearestZones(res, px, n){
  if(!res) return [];
  const big = res.zones.filter(z=>!z.small);
  const dist = z => px<z.lo ? z.lo-px : px>z.hi ? px-z.hi : 0;
  return [...big].sort((a,b)=>dist(a)-dist(b)).slice(0, n||4).sort((a,b)=>a.lo-b.lo).map(z=>({lo:z.lo, hi:z.hi, mid:(z.lo+z.hi)/2}));
}

/* ---------- lập plan đầy đủ từ số liệu ----------
 * inp: { date, zones:[{lo,hi}], tol, prth:{vah,val,poc,high,low,close}, ovn:{vah,val,poc,onh,onl},
 *        px, bk (tuỳ chọn), comp:{vah,val,poc}, rper:[[h,l]], oper:[[h,l]], view:"tpo"|"box" }
 */
const lc1 = t => t ? t.charAt(0).toLowerCase()+t.slice(1) : t;
function makePlan(inp){
  inp = inp || {};
  const nz = v => (v==null || v==="" || isNaN(v)) ? null : +v;
  const zs = (inp.zones||[]).map(z=>{ const a=nz(z.lo), b=nz(z.hi); return a==null||b==null?null:{lo:Math.min(a,b), hi:Math.max(a,b), mid:(a+b)/2}; }).filter(Boolean).sort((a,b)=>a.lo-b.lo);
  const pr = inp.prth||{}, ov = inp.ovn||{};
  const r={vah:nz(pr.vah), val:nz(pr.val)}, o={vah:nz(ov.vah), val:nz(ov.val)}, px=nz(inp.px), tol=nz(inp.tol)||30;
  if(!zs.length || [r.vah,r.val,o.vah,o.val,px].some(v=>v==null)) return { error:"Cần ít nhất 1 HVN, VAH/VAL pRTH, VAH/VAL OVN và giá lúc 9:29." };
  const bk = byK(B_OPTS, inp.bk) ? inp.bk : (suggestBFrom(pr) || "bal");
  const loc=locate(px,zs,tol), ok=ovnKey(r,o);
  const B=biasOf(bk,ok);
  const ctx={numeric:true, z:loc.z, side:loc.side};
  if(loc.pk==="lvn"){ ctx.up=loc.up; ctx.dn=loc.dn; }
  else if(loc.z){ ctx.up=zs.find(z=>z.lo>loc.z.hi)||null; ctx.dn=[...zs].reverse().find(z=>z.hi<loc.z.lo)||null; }
  const S=setupOf(loc.pk,B.dir,ctx);
  const okPer = a => Array.isArray(a) && a.length && a.every(p=>Array.isArray(p)&&p.length>=2&&!isNaN(p[0])&&!isNaN(p[1]));
  const D={zones:zs,px,rvah:r.vah,rval:r.val,rpoc:nz(pr.poc),rhi:nz(pr.high),rlo:nz(pr.low),ovah:o.vah,oval:o.val,opoc:nz(ov.poc),onh:nz(ov.onh),onl:nz(ov.onl),
    target:S.target, comp:inp.comp||null, rper:okPer(inp.rper)?inp.rper:null, oper:okPer(inp.oper)?inp.oper:null};
  const P=byK(P_OPTS,loc.pk), Bo=byK(B_OPTS,bk), Oo=byK(O_OPTS,ok);
  const G=geomOf(loc.pk,B.dir,ctx);
  const date = inp.date||"";
  const locTxt = P.n + (loc.z?` · HVN ${fmt(loc.z.lo)}–${fmt(loc.z.hi)}`:"") + (loc.pk==="lvn"?` · giữa ${loc.dn?fmt(loc.dn.hi):"—"} và ${loc.up?fmt(loc.up.lo):"—"}`:"") + ` · pRTH ${lc1(Bo.n)} · OVN ${lc1(Oo.n)}`;
  const dist = S.target!=null ? Math.abs(S.target-px) : null;
  const vg = vwapGate(S.type,B.dir);
  const biasWord = B.dir>0?"Lên":B.dir<0?"Xuống":(B.conf==="Xung đột"?"Xung đột":"Balance");
  const text =
`PLAN ${date} · Composite × pRTH × OVN
VỊ TRÍ: ${P.n}${loc.z?` (HVN ${fmt(loc.z.lo)}–${fmt(loc.z.hi)})`:""}${loc.pk==="lvn"?` (giữa ${loc.dn?fmt(loc.dn.hi):"—"} và ${loc.up?fmt(loc.up.lo):"—"})`:""}
pRTH: ${Bo.n} · VA ${fmt(r.val)}–${fmt(r.vah)} · POC ${fmt(D.rpoc)}
OVN: ${Oo.n} · VA ${fmt(o.val)}–${fmt(o.vah)} · POC ${fmt(D.opoc)} · ONH ${fmt(D.onh)} / ONL ${fmt(D.onl)}
BIAS: ${B.word} · ${B.conf}
  ${B.need}

SETUP ƯU TIÊN: ${S.type}
  ${S.text}
TARGET: ${S.target!=null?fmt(S.target)+` (cách giá 9:29 ${fmt(dist)} điểm)`:"theo mô tả"}
ĐỔI BIAS (TPO 30'): ${S.flip}
VWAP RTH: ${vg}
VÀO LỆNH: trên M1 + footprint, stop theo cấu trúc M1. Không vào giữa LVN. Dừng 11:30 ET.
LÚC 10:00: open type + EMA 9/34 (5') + VWAP RTH chốt hướng; open type ngược bias thì đi theo open type.`;
  const panel=[
    {k:"Bias", v:`${B.word} · ${B.conf}. ${B.need}`, c: B.dir>0?"#5DCAA5":B.dir<0?"#F09595":"#c9cdd3"},
    {k:"Setup ưu tiên · "+S.type, v:S.text, c:"#FAC775"},
    {k:"Target", v: S.target!=null?`${fmt(S.target)} (cách giá 9:29 ${fmt(dist)} điểm)`:"Theo mô tả setup"},
    {k:"Đổi bias (TPO 30')", v:S.flip, c:"#EF9F27"},
    {k:"VWAP RTH", v:vg, c:"#26C6DA"},
    {k:"Prev RTH", v:`${Bo.n} · VA ${fmt(r.val)}–${fmt(r.vah)} · POC ${fmt(D.rpoc)}`, c:"#E3C393"},
    {k:"OVN", v:`${Oo.n} · VA ${fmt(o.val)}–${fmt(o.vah)} · POC ${fmt(D.opoc)} · ONH ${fmt(D.onh)} / ONL ${fmt(D.onl)}`, c:"#A9C4EA"},
    {k:"Vào lệnh", v:"Trên M1 + footprint, stop theo cấu trúc M1. Không vào giữa LVN. Lúc 10:00 open type + EMA 9/34 (5') + VWAP RTH chốt hướng. Dừng 11:30 ET."}
  ];
  const M={date, loc:locTxt, dir:B.dir, word:B.word, conf:B.conf, setup:S.type, edge:G.edge, entries:G.entries, view:inp.view||"tpo", panel};
  const svg = drawPlan(D, M);
  const summary = { date, location:P.n, prth:Bo.n, ovn:Oo.n, bias:biasWord, conf:B.conf, setup:S.type, target:S.target, distance:dist, flip:S.flip, price:px,
    zone: loc.z?{lo:loc.z.lo, hi:loc.z.hi}:null };
  return { loc, ok, bk, B, S, G, D, M, panel, text, svg, summary, logB:{p:loc.pk, b:bk, o:ok, bias:biasWord} };
}

/* ---------- lập plan từ JSON của indicator Plan Sender ---------- */
function planFromJson(J, hopt, view){
  if(!J || !J.prth || !J.ovn || J.price==null) return { error:"JSON thiếu prth, ovn hoặc price." };
  let zones = [];
  if(Array.isArray(J.sessions) && J.sessions.length){
    const txt = J.sessions.map(s=>`${s.date} ${s.type} ${s.val} ${s.vah}`).join("\n");
    zones = nearestZones(findZones(parseVA(txt), Object.assign({}, HVN_DEFAULT, hopt||{})), J.price, 4);
  }
  const comp = J.composite && J.composite.poc!=null ? {vah:J.composite.vah, val:J.composite.val, poc:J.composite.poc} : null;
  const out = makePlan({ date:J.date, zones, tol:30, prth:J.prth, ovn:J.ovn, px:J.price, comp, rper:J.prth.periods_hl, oper:J.ovn.periods_hl, view:view||"tpo" });
  out.zones = zones;
  return out;
}

return { fmt, esc, COL, FONT, MONO, P_OPTS, B_OPTS, O_OPTS, byK, biasOf, setupOf, vwapGate, parseVA, findZones, locate, ovnKey,
  geomOf, spread, wrapText, drawPlan, suggestBFrom, HVN_DEFAULT, nearestZones, makePlan, planFromJson, lc1 };
});


/* ---------- UI artifact ---------- */
(function(){
"use strict";
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
/* Engine plan (HVN, bias, setup, ảnh plan) lấy từ plan-core.js, dán phía trên file này lúc build:
   cùng một code với web (plan.html) và server (/api/plan). Không sửa engine ở đây. */
const { fmt, esc, COL, FONT, MONO, P_OPTS, B_OPTS, O_OPTS, byK, biasOf, setupOf, vwapGate, parseVA, findZones, locate, ovnKey,
  geomOf, spread, wrapText, drawPlan, suggestBFrom, makePlan } = window.PlanCore;
const num = id => { const v = parseFloat($("#"+id).value); return isNaN(v) ? null : v; };
const store = { get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v);}catch(e){return d;} }, set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };

/* ---------- tabs ---------- */
const TABS = ["khung","hvn","bias","vwap","builder","quy-trinh","log","mau","quiz","backtest"];
function route(){
  let h = (location.hash||"").slice(1); if(!TABS.includes(h)) h = "khung";
  $$("section.tab").forEach(s=>s.classList.toggle("active", s.id==="t-"+h));
  $$("nav.tabs a").forEach(a=>{ if(a.getAttribute("href")==="#"+h) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
}
window.addEventListener("hashchange", ()=>{ route(); window.scrollTo(0,0); });

/* ---------- định nghĩa ---------- */
const fillSel = (sel, arr) => { sel.innerHTML = arr.map(o=>`<option value="${o.k}">${esc(o.n)}</option>`).join(""); };

/* ---------- 01 · Tìm HVN bằng chồng VA ---------- */
const SAMPLE = "2026-10-21 RTH 29916 30111\n2026-10-22 OVN 29418 29751\n2026-10-22 RTH 29093 29366\n2026-10-23 OVN 29088 29197\n2026-10-23 RTH 29128 29273\n2026-10-26 OVN 29062 29215\n2026-10-26 RTH 29361 29572\n2026-10-27 OVN 29378 29565\n2026-10-27 RTH 29659 29882\n2026-10-28 OVN 29871 29976\n2026-10-28 RTH 29801 29940\n2026-10-29 OVN 29605 29734\n2026-10-29 RTH 29448 29617\n2026-10-30 OVN 28835 29044\n2026-10-30 RTH 28462 28859\n2026-11-02 OVN 28712 28805\n2026-11-02 RTH 28332 28891\n2026-11-03 OVN 28120 28263\n2026-11-03 RTH 28284 28391\n2026-11-04 OVN 27951 28602\n2026-11-04 RTH 28564 28785\n2026-11-05 OVN 28253 28444\n2026-11-05 RTH 26815 27358\n2026-11-06 OVN 26898 27191\n2026-11-06 RTH 27082 27269\n2026-11-09 OVN 26925 27238\n2026-11-09 RTH 27796 28129\n2026-11-10 OVN 27897 28044\n2026-11-10 RTH 27647 27916\n2026-11-11 OVN 28118 28407\n2026-11-11 RTH 28416 28697\n2026-11-12 OVN 28176 28307";
const SAMPLE_PLAN = {"v":1,"source":"mo phong tu data M1 (Deren.PlanSender v1)","symbol":"NQZ6","date":"2026-11-12","ts_et":"2026-11-12T09:29:00-05:00","price":28064.25,"prth":{"date":"2026-11-11","vah":28697.0,"val":28416.0,"poc":28548.5,"high":28697.0,"low":28199.0,"close":28457.25,"periods_hl":[[28426.0,28199.0],[28388.5,28256.5],[28550.25,28336.5],[28573.0,28462.0],[28619.25,28520.5],[28660.0,28575.0],[28666.25,28622.0],[28690.5,28601.25],[28697.0,28660.5],[28666.0,28535.0],[28588.25,28548.75],[28572.25,28499.5],[28534.25,28443.5],[28510.5,28452.25]]},"ovn":{"vah":28307.0,"val":28176.0,"poc":28204.5,"onh":28368.75,"onl":28013.75,"periods_hl":[[28319.75,28131.75],[28296.75,28193.75],[28270.0,28166.0],[28249.0,28194.0],[28274.0,28187.75],[28311.25,28248.5],[28368.75,28278.0],[28358.5,28280.5],[28334.25,28233.5],[28277.25,28204.5],[28275.25,28234.25],[28238.5,28201.5],[28223.25,28142.5],[28176.25,28134.25],[28231.0,28141.75],[28212.25,28162.25],[28236.5,28182.5],[28237.0,28168.0],[28249.75,28191.0],[28252.5,28195.25],[28267.75,28198.25],[28312.75,28265.0],[28307.25,28268.75],[28301.5,28239.0],[28270.75,28223.75],[28255.5,28214.25],[28308.75,28195.0],[28219.25,28173.0],[28242.5,28013.75],[28169.0,28055.0],[28145.0,28050.25]]},"sessions":[{"date":"2026-10-02","type":"OVN","val":30798.0,"vah":30989.0,"poc":30884.5},{"date":"2026-10-02","type":"RTH","val":31001.0,"vah":31148.0,"poc":31057.5},{"date":"2026-10-05","type":"OVN","val":30976.0,"vah":31119.0,"poc":31042.5},{"date":"2026-10-05","type":"RTH","val":31191.0,"vah":31348.0,"poc":31235.5},{"date":"2026-10-06","type":"OVN","val":31328.0,"vah":31419.0,"poc":31358.5},{"date":"2026-10-06","type":"RTH","val":31484.0,"vah":31557.0,"poc":31526.5},{"date":"2026-10-07","type":"OVN","val":31326.0,"vah":31521.0,"poc":31480.5},{"date":"2026-10-07","type":"RTH","val":31258.0,"vah":31423.0,"poc":31344.5},{"date":"2026-10-08","type":"OVN","val":31131.0,"vah":31392.0,"poc":31219.5},{"date":"2026-10-08","type":"RTH","val":30955.0,"vah":31370.0,"poc":31243.5},{"date":"2026-10-09","type":"OVN","val":31054.0,"vah":31267.0,"poc":31216.5},{"date":"2026-10-09","type":"RTH","val":31037.0,"vah":31122.0,"poc":31087.5},{"date":"2026-10-12","type":"OVN","val":31104.0,"vah":31289.0,"poc":31232.5},{"date":"2026-10-12","type":"RTH","val":30870.0,"vah":30953.0,"poc":30886.5},{"date":"2026-10-13","type":"OVN","val":30636.0,"vah":30749.0,"poc":30666.5},{"date":"2026-10-13","type":"RTH","val":30701.0,"vah":30794.0,"poc":30763.5},{"date":"2026-10-14","type":"OVN","val":30745.0,"vah":30848.0,"poc":30789.5},{"date":"2026-10-14","type":"RTH","val":30103.0,"vah":30434.0,"poc":30199.5},{"date":"2026-10-15","type":"OVN","val":29787.0,"vah":29952.0,"poc":29843.5},{"date":"2026-10-15","type":"RTH","val":29862.0,"vah":30197.0,"poc":29958.5},{"date":"2026-10-16","type":"OVN","val":30043.0,"vah":30174.0,"poc":30091.5},{"date":"2026-10-16","type":"RTH","val":29302.0,"vah":29807.0,"poc":29390.5},{"date":"2026-10-19","type":"OVN","val":29638.0,"vah":29813.0,"poc":29766.5},{"date":"2026-10-19","type":"RTH","val":29709.0,"vah":29852.0,"poc":29785.5},{"date":"2026-10-20","type":"OVN","val":29576.0,"vah":29741.0,"poc":29646.5},{"date":"2026-10-20","type":"RTH","val":29656.0,"vah":29833.0,"poc":29700.5},{"date":"2026-10-21","type":"OVN","val":29824.0,"vah":29965.0,"poc":29868.5},{"date":"2026-10-21","type":"RTH","val":29916.0,"vah":30111.0,"poc":29990.5},{"date":"2026-10-22","type":"OVN","val":29418.0,"vah":29751.0,"poc":29508.5},{"date":"2026-10-22","type":"RTH","val":29093.0,"vah":29366.0,"poc":29155.5},{"date":"2026-10-23","type":"OVN","val":29088.0,"vah":29197.0,"poc":29128.5},{"date":"2026-10-23","type":"RTH","val":29128.0,"vah":29273.0,"poc":29150.5},{"date":"2026-10-26","type":"OVN","val":29062.0,"vah":29215.0,"poc":29138.5},{"date":"2026-10-26","type":"RTH","val":29361.0,"vah":29572.0,"poc":29483.5},{"date":"2026-10-27","type":"OVN","val":29378.0,"vah":29565.0,"poc":29432.5},{"date":"2026-10-27","type":"RTH","val":29659.0,"vah":29882.0,"poc":29805.5},{"date":"2026-10-28","type":"OVN","val":29871.0,"vah":29976.0,"poc":29913.5},{"date":"2026-10-28","type":"RTH","val":29797.0,"vah":29934.0,"poc":29861.5},{"date":"2026-10-29","type":"OVN","val":29605.0,"vah":29734.0,"poc":29653.5},{"date":"2026-10-29","type":"RTH","val":29448.0,"vah":29617.0,"poc":29538.5},{"date":"2026-10-30","type":"OVN","val":28835.0,"vah":29044.0,"poc":28923.5},{"date":"2026-10-30","type":"RTH","val":28462.0,"vah":28859.0,"poc":28668.5},{"date":"2026-11-02","type":"OVN","val":28712.0,"vah":28805.0,"poc":28764.5},{"date":"2026-11-02","type":"RTH","val":28330.0,"vah":28891.0,"poc":28664.5},{"date":"2026-11-03","type":"OVN","val":28120.0,"vah":28263.0,"poc":28232.5},{"date":"2026-11-03","type":"RTH","val":28288.0,"vah":28395.0,"poc":28330.5},{"date":"2026-11-04","type":"OVN","val":27951.0,"vah":28602.0,"poc":28409.5},{"date":"2026-11-04","type":"RTH","val":28564.0,"vah":28783.0,"poc":28646.5},{"date":"2026-11-05","type":"OVN","val":28253.0,"vah":28444.0,"poc":28375.5},{"date":"2026-11-05","type":"RTH","val":26797.0,"vah":27358.0,"poc":26955.5},{"date":"2026-11-06","type":"OVN","val":26898.0,"vah":27191.0,"poc":26978.5},{"date":"2026-11-06","type":"RTH","val":27082.0,"vah":27269.0,"poc":27206.5},{"date":"2026-11-09","type":"OVN","val":26925.0,"vah":27238.0,"poc":27113.5},{"date":"2026-11-09","type":"RTH","val":27796.0,"vah":28129.0,"poc":27928.5},{"date":"2026-11-10","type":"OVN","val":27897.0,"vah":28044.0,"poc":27989.5},{"date":"2026-11-10","type":"RTH","val":27647.0,"vah":27916.0,"poc":27789.5},{"date":"2026-11-11","type":"OVN","val":28118.0,"vah":28407.0,"poc":28226.5},{"date":"2026-11-11","type":"RTH","val":28416.0,"vah":28697.0,"poc":28548.5},{"date":"2026-11-12","type":"OVN","val":28176.0,"vah":28307.0,"poc":28204.5}],"composite":{"days":30,"row":10,"vah":30310.0,"val":27160.0,"poc":29845.0},"warnings":[]};
function drawZones(res){
  const W=820, H=520, x0=110, x1=760, top=16, bot=H-24;
  const y = v => top + (res.hi - v)/(res.hi-res.lo)*(bot-top);
  const mx = Math.max(1,...res.cnt), sc = (x1-x0-140)/mx;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Profile đếm số VA chồng nhau, vùng HVN tô xanh"><g font-family="${MONO}">`;
  const tickStep = (res.hi-res.lo)>2500?500:(res.hi-res.lo)>1200?200:100;
  for(let t=Math.ceil(res.lo/tickStep)*tickStep; t<=res.hi; t+=tickStep){ s+=`<line x1="${x0}" x2="${x1}" y1="${y(t)}" y2="${y(t)}" stroke="${COL.grid}"/><text x="${x0-8}" y="${y(t)+4}" fill="${COL.mut}" font-size="11" text-anchor="end">${fmt(t)}</text>`; }
  res.zones.forEach(z=>{ const fill = z.small ? "rgba(136,135,128,0.18)" : "rgba(38,166,154,0.16)"; const st = z.small ? "#888780" : COL.hvn;
    s+=`<rect x="${x0}" y="${y(z.hi)}" width="${x1-x0}" height="${Math.max(2,y(z.lo)-y(z.hi))}" fill="${fill}" stroke="${st}" stroke-dasharray="4 3"/>`;
    if(!z.small || y(z.lo)-y(z.hi)>14) s+=`<text x="${x1-6}" y="${y(z.hi)+14}" fill="${z.small?"#d3d1c7":"#bff0e8"}" font-size="12" text-anchor="end">${z.small?"node nhỏ":"HVN"} ${fmt(z.lo)}–${fmt(z.hi)}</text>`; });
  res.gaps.forEach(g=>{ const ym=(y(g.lo)+y(g.hi))/2; if(y(g.lo)-y(g.hi)>14) s+=`<text x="${x1-6}" y="${ym+4}" fill="${COL.mut}" font-size="12" text-anchor="end">LVN ${g.clear?"rõ":"mờ"} ${fmt(g.lo)}–${fmt(g.hi)}</text>`;
    if(g.clear && g.core) s+=`<rect x="${x0}" y="${y(g.core.hi)}" width="6" height="${Math.max(2,y(g.core.lo)-y(g.core.hi))}" fill="#ef5350" opacity=".8"/>`; });
  const rh = Math.max(1,(bot-top)/res.n);
  res.cnt.forEach((c,i)=>{ if(!c) return; const v=res.g0+i*res.step; s+=`<rect x="${x0}" y="${y(v+res.step)}" width="${c*sc}" height="${rh}" fill="${res.isH[i]?COL.hvn:"#5f5e5a"}" opacity="${res.isH[i]?0.85:0.6}"/>`; });
  s+=`<text x="${x0}" y="${H-6}" fill="${COL.mut}" font-size="11">Độ dài thanh = số VA chồng nhau ở mức giá đó (tối đa ${mx}) · ${res.days} ngày · ${res.rows} VA</text>`;
  return s+`</g></svg>`;
}
let lastZones = null;
function runHVN(){
  const rows = parseVA($("#h-text").value);
  const opt = { n:+$("#h-n").value||16, k:+$("#h-k").value||3, merge:+$("#h-merge").value||0, minw:+$("#h-minw").value||0, mode:$("#h-mode").value };
  store.set("cb-hvn", {text:$("#h-text").value, ...opt});
  const res = findZones(rows, opt);
  if(!res){ $("#h-svg").innerHTML=""; $("#h-rows").innerHTML=""; $("#h-msg").textContent="Không đọc được dòng nào. Mỗi dòng: ngày RTH|OVN VAL VAH."; return; }
  lastZones = res;
  $("#h-svg").innerHTML = drawZones(res);
  const items = [];
  res.zones.forEach((z,i)=>{ items.push({t:z.lo, html:`<tr><td><span class="chip ${z.small?"lvn":"hvn"}">${z.small?"Node nhỏ":"HVN"}</span></td><td class="mono">${fmt(z.lo)}</td><td class="mono">${fmt(z.hi)}</td><td class="num mono">${fmt(z.w)}</td><td class="small">${z.small?"Hẹp hơn ngưỡng: coi là level, không phải vùng balance.":"Chồng nhiều nhất quanh "+fmt(z.peak)+" (dùng như POC của vùng)."}</td></tr>`}); });
  res.gaps.forEach(g=>items.push({t:g.lo+0.1, html:`<tr><td><span class="chip lvn">LVN</span></td><td class="mono">${fmt(g.lo)}</td><td class="mono">${fmt(g.hi)}</td><td class="num mono">${fmt(g.w)}</td><td class="small">${g.clear?`Lõi trống (không VA nào phủ) ${g.core?fmt(g.core.lo)+"–"+fmt(g.core.hi):""}: giá thường đi nhanh qua.`:`Mỏng nhất ${g.core?fmt(g.core.lo)+"–"+fmt(g.core.hi):""} (${g.min} VA): đường đi nhưng chậm hơn.`}</td></tr>`}));
  $("#h-rows").innerHTML = items.sort((a,b)=>b.t-a.t).map(x=>x.html).join("");
  const big = res.zones.filter(z=>!z.small).length;
  $("#h-msg").textContent = `${big} HVN, ${res.zones.length-big} node nhỏ, ${res.gaps.length} khoảng LVN. Đổi "Số VA tối thiểu" để vùng chặt hơn (tăng) hoặc rộng hơn (giảm).`;
}
function initHVN(){
  const sv = store.get("cb-hvn", null);
  $("#h-text").value = sv && sv.text ? sv.text : SAMPLE;
  if(sv){ ["n","k","merge","minw","mode"].forEach(k=>{ if(sv[k]!=null) $("#h-"+k).value = sv[k]; }); }
  $("#h-run").addEventListener("click", runHVN);
  ["h-n","h-k","h-merge","h-minw","h-mode"].forEach(id=>$("#"+id).addEventListener("change", runHVN));
  $("#h-reset").addEventListener("click", ()=>{ $("#h-text").value = SAMPLE; $("#h-n").value=16; $("#h-k").value=3; $("#h-merge").value=40; $("#h-minw").value=100; $("#h-mode").value="both"; runHVN(); });
  $("#h-to-builder").addEventListener("click", ()=>{
    if(!lastZones) runHVN(); if(!lastZones) return;
    const zs = lastZones.zones.filter(z=>!z.small).slice(-4);
    setZones(zs.map(z=>[z.lo,z.hi]));
    $("#b-msg").textContent = `Đã nhận ${zs.length} HVN từ công cụ chồng VA.`;
    location.hash = "builder";
  });
  runHVN();
}

/* ---------- 02 · Đọc bias ---------- */
function renderX(){
  const pk=$("#x-p").value, bk=$("#x-b").value, ok=$("#x-o").value;
  const B = biasOf(bk, ok), S = setupOf(pk, B.dir, {});
  $("#x-out").innerHTML = `
    <div class="row"><span class="pill ${B.cls}">${B.conf}</span><span class="pill ${B.dir>0?"up":B.dir<0?"dn":"nt"}">Hướng: ${B.word}</span><span class="pill nt">Setup: ${esc(S.type)}</span></div>
    <div class="ab">
      <div class="card a"><span class="k">Cách trade</span><p class="small">${esc(S.text)}</p></div>
      <div class="card b"><span class="k">Đổi bias khi</span><p class="small">${esc(S.flip)}</p><span class="k">Cần lúc 10:00</span><p class="small">${esc(B.need)}</p><span class="k">Cổng VWAP RTH</span><p class="small">${esc(vwapGate(S.type,B.dir))}</p></div>
    </div>`;
}
function initX(){
  fillSel($("#x-p"),P_OPTS); fillSel($("#x-b"),B_OPTS); fillSel($("#x-o"),O_OPTS);
  $("#x-p").value="edgeD"; $("#x-b").value="accD"; $("#x-o").value="down";
  ["x-p","x-b","x-o"].forEach(id=>$("#"+id).addEventListener("change", renderX));
  $("#d-p").innerHTML = P_OPTS.map(o=>`<dt>${esc(o.n)}</dt><dd class="small">${esc(o.d)}</dd>`).join("");
  $("#d-b").innerHTML = B_OPTS.map(o=>`<dt>${esc(o.n)}</dt><dd class="small">${esc(o.d)} <span class="muted">(${o.dir>0?"lên":o.dir<0?"xuống":"trung tính"})</span></dd>`).join("");
  $("#d-o").innerHTML = O_OPTS.map(o=>`<dt>${esc(o.n)}</dt><dd class="small">${esc(o.d)}</dd>`).join("");
  renderX();
}

/* ---------- 03 · Plan Builder ---------- */
const ZN = 4;
function setZones(list){ for(let i=0;i<ZN;i++){ const z=list[i]; $("#b-z"+i+"lo").value = z?z[0]:""; $("#b-z"+i+"hi").value = z?z[1]:""; } }
function getZones(){ const zs=[]; for(let i=0;i<ZN;i++){ let a=num("b-z"+i+"lo"), b=num("b-z"+i+"hi"); if(a!=null && b!=null){ if(a>b){const x=a;a=b;b=x;} zs.push({lo:a,hi:b,mid:(a+b)/2}); } } return zs.sort((a,b)=>a.lo-b.lo); }
function suggestB(){ return suggestBFrom({vah:num("b-rvah"), val:num("b-rval"), poc:num("b-rpoc"), high:num("b-rhi"), low:num("b-rlo"), close:num("b-rcl")}); }
let bTouched=false, lastPlan="", lastB=null, lastSvg="", importedComp=null, importedPer=null;
/* Vùng vào lệnh + level đổi bias theo vị trí và hướng */
function build(){
  const sug=suggestB();
  if(sug && !bTouched) $("#b-b").value = sug;
  const R = makePlan({ date:$("#b-date").value, zones:getZones(), tol:num("b-tol")||30,
    prth:{vah:num("b-rvah"), val:num("b-rval"), poc:num("b-rpoc"), high:num("b-rhi"), low:num("b-rlo"), close:num("b-rcl")},
    ovn:{vah:num("b-ovah"), val:num("b-oval"), poc:num("b-opoc"), onh:num("b-onh"), onl:num("b-onl")},
    px:num("b-px"), bk:$("#b-b").value, comp:importedComp, rper:importedPer&&importedPer.r, oper:importedPer&&importedPer.o, view:$("#b-view").value });
  if(R.error){ $("#b-out").textContent=R.error; $("#b-svg").innerHTML=""; return; }
  lastB = Object.assign({date:$("#b-date").value}, R.logB);
  lastPlan = R.text;
  $("#b-out").textContent = lastPlan;
  lastSvg = R.svg;
  $("#b-svg").innerHTML = lastSvg;
  store.set("cb-builder", collectB());
}
const B_IDS=["b-tol","b-rvah","b-rval","b-rpoc","b-rhi","b-rlo","b-rcl","b-ovah","b-oval","b-opoc","b-onh","b-onl","b-px","b-date"];
function collectB(){ const o={}; B_IDS.forEach(id=>o[id]=$("#"+id).value); for(let i=0;i<ZN;i++){ o["z"+i+"lo"]=$("#b-z"+i+"lo").value; o["z"+i+"hi"]=$("#b-z"+i+"hi").value; } o.b=$("#b-b").value; o.touched=bTouched; o.manual=!importedPer; return o; }
function initB(){
  $("#b-zones").innerHTML = Array.from({length:ZN},(_,i)=>`<div class="field"><label for="b-z${i}lo">HVN ${i+1} · từ</label><input id="b-z${i}lo" type="number" step="0.25"></div><div class="field"><label for="b-z${i}hi">HVN ${i+1} · đến</label><input id="b-z${i}hi" type="number" step="0.25"></div>`).join("");
  fillSel($("#b-b"),B_OPTS);
  const sv=store.get("cb-builder",null);
  const sj=store.get("cb-builder-json",null);
  if(sj){ $("#b-json").value=sj; importAtas(sj); }
  else if(sv && sv.manual){ B_IDS.forEach(id=>{ if(sv[id]!=null) $("#"+id).value=sv[id]; }); for(let i=0;i<ZN;i++){ $("#b-z"+i+"lo").value=sv["z"+i+"lo"]||""; $("#b-z"+i+"hi").value=sv["z"+i+"hi"]||""; } if(sv.b) $("#b-b").value=sv.b; bTouched=!!sv.touched; build(); }
  else { const t=JSON.stringify(SAMPLE_PLAN); $("#b-json").value=t; importAtas(t); }
  $("#b-b").addEventListener("change", ()=>{ bTouched=true; build(); });
  $("#b-build").addEventListener("click", build);
  $("#b-clear").addEventListener("click", ()=>{ B_IDS.forEach(id=>{ if(id!=="b-tol") $("#"+id).value=""; }); setZones([]); bTouched=false; importedComp=null; importedPer=null; store.set("cb-builder-json",null); $("#b-out").textContent="Nhập số rồi bấm \"Lập plan\"."; $("#b-svg").innerHTML=""; });
  $("#b-copy").addEventListener("click", async()=>{ if(!lastPlan) build(); try{ await navigator.clipboard.writeText(lastPlan); $("#b-msg").textContent="Đã copy plan."; }catch(e){ $("#b-msg").textContent="Trình duyệt chặn copy, bôi đen khung plan để copy."; } });
  $("#b-tolog").addEventListener("click", ()=>{ if(!lastB) build(); if(!lastB) return; $("#l-date").value=lastB.date||""; $("#l-p").value=lastB.p; $("#l-b").value=lastB.b; $("#l-o").value=lastB.o; $("#l-bias").value=lastB.bias; location.hash="log"; $("#l-msg").textContent="Đã điền sẵn từ Plan Builder. Bổ sung kết quả sau phiên rồi bấm Thêm phiên."; });
  ["b-rvah","b-rval","b-rpoc","b-rhi","b-rlo","b-rcl"].forEach(id=>$("#"+id).addEventListener("change", ()=>{ bTouched=false; }));
  $("#b-import").addEventListener("click", ()=>importAtas($("#b-json").value));
  $("#b-view").addEventListener("change", build);
  $("#b-example2").addEventListener("click", ()=>{ const t=JSON.stringify(SAMPLE_PLAN); $("#b-json").value=t; importAtas(t); });
  $("#b-paste").addEventListener("click", async()=>{ try{ const t=await navigator.clipboard.readText(); $("#b-json").value=t; importAtas(t); }catch(e){ $("#b-imsg").textContent="Trình duyệt không cho đọc clipboard. Bấm vào ô JSON và dán bằng Ctrl+V."; } });
  $("#b-file").addEventListener("change", e=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; const rd=new FileReader(); rd.onload=()=>{ $("#b-json").value=rd.result; importAtas(rd.result); }; rd.readAsText(f); });
  $("#b-copyimg").addEventListener("click", copyPlanImage);
}
function svgToPng(svg){ return new Promise((res,rej)=>{ const m=svg.match(/viewBox="0 0 (\d+) (\d+)"/); const w=+m[1], h=+m[2]; const img=new Image(); const url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"}));
  img.onload=()=>{ const c=document.createElement("canvas"); c.width=w*2; c.height=h*2; c.getContext("2d").drawImage(img,0,0,w*2,h*2); URL.revokeObjectURL(url); c.toBlob(b=>b?res(b):rej(new Error("png")),"image/png"); };
  img.onerror=()=>rej(new Error("svg")); img.src=url; }); }
async function copyPlanImage(){
  if(!lastSvg) build(); if(!lastSvg) return;
  const msg=t=>{ $("#b-msg").textContent=t; };
  const p=svgToPng(lastSvg);
  try{
    if(!navigator.clipboard || typeof ClipboardItem==="undefined") throw new Error("no clipboard");
    await navigator.clipboard.write([new ClipboardItem({"image/png": p})]);
    msg("Đã copy ảnh plan vào clipboard. Dán (Ctrl+V) vào Discord, Notion hoặc journal.");
  }catch(e){
    try{ download(await p, `plan_${$("#b-date").value||"nq"}.png`); msg("Trình duyệt chặn copy ảnh nên ảnh PNG đã được tải về."); }catch(e2){ msg("Không tạo được ảnh plan."); }
  }
}
function download(blob, name){ const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); }
function hvnOpt(){ return { n:+$("#h-n").value||16, k:+$("#h-k").value||3, merge:+$("#h-merge").value||0, minw:+$("#h-minw").value||0, mode:$("#h-mode").value }; }
function importAtas(text){
  const msg=t=>{ $("#b-imsg").textContent=t; };
  let J; try{ J=JSON.parse(String(text||"").trim()); }catch(e){ msg("JSON không hợp lệ. Kiểm tra lại nội dung đã dán."); return; }
  if(!J || !J.prth || !J.ovn || J.price==null){ msg("JSON thiếu prth, ovn hoặc price."); return; }
  store.set("cb-builder-json", String(text));
  const set=(id,v)=>{ $("#"+id).value = (v==null||isNaN(v))?"":v; };
  $("#b-date").value = J.date||""; set("b-px",J.price);
  set("b-rvah",J.prth.vah); set("b-rval",J.prth.val); set("b-rpoc",J.prth.poc); set("b-rhi",J.prth.high); set("b-rlo",J.prth.low); set("b-rcl",J.prth.close);
  set("b-ovah",J.ovn.vah); set("b-oval",J.ovn.val); set("b-opoc",J.ovn.poc); set("b-onh",J.ovn.onh); set("b-onl",J.ovn.onl);
  importedComp = J.composite && J.composite.poc!=null ? {vah:J.composite.vah, val:J.composite.val, poc:J.composite.poc} : null;
  const okPer = a => Array.isArray(a) && a.length && a.every(p=>Array.isArray(p)&&p.length>=2&&!isNaN(p[0])&&!isNaN(p[1]));
  importedPer = { r: okPer(J.prth.periods_hl)?J.prth.periods_hl:null, o: okPer(J.ovn.periods_hl)?J.ovn.periods_hl:null };
  let zinfo="Không có danh sách phiên: giữ vùng HVN đang nhập.";
  if(Array.isArray(J.sessions) && J.sessions.length){
    const txt=J.sessions.map(s=>`${s.date} ${s.type} ${s.val} ${s.vah}`).join("\n");
    $("#h-text").value=txt;
    const res=findZones(parseVA(txt), hvnOpt());
    if(res){ const big=res.zones.filter(z=>!z.small); const dist=z=> J.price<z.lo?z.lo-J.price: J.price>z.hi?J.price-z.hi:0;
      const pick=[...big].sort((a,b)=>dist(a)-dist(b)).slice(0,4).sort((a,b)=>a.lo-b.lo);
      setZones(pick.map(z=>[z.lo,z.hi])); zinfo=`${pick.length} HVN gần giá nhất (từ ${J.sessions.length} VA phiên).`; }
    runHVN();
  }
  bTouched=false; build();
  const warn = Array.isArray(J.warnings)&&J.warnings.length ? " Cảnh báo: "+J.warnings.join("; ") : "";
  msg(`Đã nhập ${J.symbol||""} ${J.date||""} (${J.ts_et||"không có giờ"}). ${zinfo}${warn}`);
}


/* ---------- 06 · Log ---------- */
function wil(k,n){ if(!n) return ""; const z=1.96,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d; return `${Math.round(Math.max(0,c-h)*100)}–${Math.round(Math.min(1,c+h)*100)}%`; }
const pct=(a,b)=> b?Math.round(a/b*100)+"%":"—";
const ci=(k,n)=> n?`<div class="small muted">khoảng tin cậy ${wil(k,n)}${n<30?" · mẫu nhỏ":""}</div>`:"";
function initLog(){
  fillSel($("#l-p"),P_OPTS); fillSel($("#l-b"),B_OPTS); fillSel($("#l-o"),O_OPTS);
  let rows=store.get("cb-log",[]);
  const save=()=>store.set("cb-log",rows);
  const nm=(arr,k)=>{ const o=byK(arr,k); return o?o.n:k; };
  const draw=()=>{
    const n=rows.length;
    const bOk=rows.filter(r=>r.biasok==="Đúng").length, bKnown=rows.filter(r=>r.biasok!=="Không rõ").length;
    const acc=rows.filter(r=>r.edge==="Chấp nhận ra ngoài"), reach=acc.filter(r=>r.reach==="Có").length;
    const touched=rows.filter(r=>r.edge!=="Không chạm mép"), held=touched.filter(r=>r.edge==="Giữ (fade đúng)").length;
    const traded=rows.filter(r=>r.setup!=="Không trade" && r.r!==""&&r.r!=null);
    const sumR=traded.reduce((a,r)=>a+(+r.r||0),0);
    const bySetup=["F · Fade","C · Continuation","V · VWAP"].map(sname=>{ const t=traded.filter(r=>r.setup===sname); const w=t.filter(r=>+r.r>0).length; const avg=t.length?t.reduce((a,r)=>a+(+r.r||0),0)/t.length:null; return `<div class="tile"><div class="k">${sname}</div><div class="v">${t.length?(avg>=0?"+":"")+avg.toFixed(2)+"R":"—"}</div><div class="small muted">${t.length} lệnh · thắng ${pct(w,t.length)}</div>${ci(w,t.length)}</div>`; }).join("");
    $("#l-stats").innerHTML =
      `<div class="tile"><div class="k">Số phiên</div><div class="v">${n}</div><div class="small muted">${n<30?"đang tập xếp loại (mốc 30)":n<100?"xem xu hướng, chưa đủ kết luận":"đủ để so tỉ lệ"}</div></div>`+
      `<div class="tile"><div class="k">Bias đúng</div><div class="v">${pct(bOk,bKnown)}</div>${ci(bOk,bKnown)}</div>`+
      `<div class="tile"><div class="k">Mép HVN giữ được</div><div class="v">${pct(held,touched.length)}</div>${ci(held,touched.length)}</div>`+
      `<div class="tile"><div class="k">Ra ngoài mép → tới HVN kế</div><div class="v">${pct(reach,acc.length)}</div>${ci(reach,acc.length)}</div>`+
      `<div class="tile"><div class="k">Tổng R</div><div class="v">${(sumR>=0?"+":"")+sumR.toFixed(1)}</div><div class="small muted">${traded.length} lệnh</div></div>`+ bySetup;
    $("#l-rows").innerHTML = rows.map((r,i)=>`<tr><td class="mono">${esc(r.date)}</td><td class="small">${esc(nm(P_OPTS,r.p))}</td><td class="small">${esc(nm(B_OPTS,r.b))}</td><td class="small">${esc(nm(O_OPTS,r.o))}</td><td>${esc(r.bias)}</td><td>${esc(r.ot)}</td><td>${esc(r.ib)}</td><td class="small">${esc(r.edge)}</td><td>${esc(r.reach)}</td><td class="small">${esc(r.setup)}</td><td class="num mono">${esc(r.r)}</td><td>${esc(r.biasok)}</td><td class="small">${esc(r.note)}</td><td><button class="mx" data-del="${i}" aria-label="Xoá dòng">Xoá</button></td></tr>`).join("") || `<tr><td colspan="14" class="muted small">Chưa có phiên nào.</td></tr>`;
  };
  $("#l-rows").addEventListener("click",e=>{ const b=e.target.closest("[data-del]"); if(!b) return; rows.splice(+b.dataset.del,1); save(); draw(); });
  $("#l-add").addEventListener("click",()=>{
    if(!$("#l-date").value){ $("#l-msg").textContent="Chọn ngày trước."; return; }
    rows.push({date:$("#l-date").value,p:$("#l-p").value,b:$("#l-b").value,o:$("#l-o").value,bias:$("#l-bias").value,ot:$("#l-ot").value,ib:$("#l-ib").value,edge:$("#l-edge").value,reach:$("#l-reach").value,setup:$("#l-setup").value,r:$("#l-r").value,biasok:$("#l-bias-ok").value,note:$("#l-note").value});
    rows.sort((a,b)=>a.date<b.date?-1:1); save(); draw(); $("#l-msg").textContent="Đã thêm phiên."; $("#l-note").value=""; $("#l-r").value="";
  });
  const toCSV=(head,list)=>[head.join(",")].concat(list.map(r=>head.map(k=>`"${String(r[k]==null?"":r[k]).replace(/"/g,'""')}"`).join(","))).join("\n");
  $("#l-csv").addEventListener("click",async()=>{ const head=["date","p","b","o","bias","ot","ib","edge","reach","setup","r","biasok","note"]; const csv=toCSV(head,rows.map(r=>({...r,p:nm(P_OPTS,r.p),b:nm(B_OPTS,r.b),o:nm(O_OPTS,r.o)}))); try{ await navigator.clipboard.writeText(csv); $("#l-msg").textContent="Đã copy CSV."; }catch(e){ $("#l-msg").textContent="Trình duyệt chặn copy."; } });
  $("#l-clear").addEventListener("click",()=>{ if(!rows.length) return; if(!confirm("Xoá toàn bộ log?")) return; rows=[]; save(); draw(); });
  const old=store.get("ov-log",[]);
  if(old.length){ const b=$("#l-old"); b.hidden=false; b.textContent=`Copy log khung cũ (${old.length} phiên)`; b.addEventListener("click",async()=>{ const head=Object.keys(old[0]); try{ await navigator.clipboard.writeText(toCSV(head,old)); $("#l-msg").textContent="Đã copy log khung cũ."; }catch(e){ $("#l-msg").textContent="Trình duyệt chặn copy."; } }); }
  draw();
}

/* ---------- 07 · Màu ---------- */
const COLORS = [
 ["RTH TPO · trong VA","#FFE0A458","Vàng cát, đặc. Giữ quy ước RTH = vàng."],
 ["RTH TPO · ngoài VA","#73E0A458","Cùng màu, 45%. Phần ngoài value nhạt đi."],
 ["RTH POC","#FFFF9F1A","Cam đậm, nét 2px."],
 ["RTH VAH / VAL (kéo dài)","#CCE0A458","Nét đứt."],
 ["OVN TPO · trong VA","#FF6F9BD9","Xanh dương, đặc."],
 ["OVN TPO · ngoài VA","#736F9BD9","Cùng màu, 45%."],
 ["OVN POC","#FFE87BA4","Hồng, khác hẳn POC RTH để không nhầm."],
 ["OVN VAH / VAL (kéo dài)","#CC6F9BD9","Nét đứt."],
 ["Single print / tail","#FFEF5350","Đánh dấu đỏ."],
 ["Composite · trong VA","#6626A69A","Teal 40%."],
 ["Composite · ngoài VA","#40888780","Xám 25%."],
 ["Composite POC","#FFFFFFFF","Trắng, nét mảnh."],
 ["Vùng HVN (rectangle fill)","#1F26A69A","Teal 12%, không che TPO."],
 ["Viền vùng HVN","#9926A69A","Nét đứt 1px."],
 ["Vùng LVN (tuỳ chọn)","#14FFFFFF","Trắng 8%, hoặc để trống."],
 ["VWAP RTH","#FF26C6DA","Cyan."],
 ["Nhãn chữ","#FFE6E8EB","Chữ sáng, đọc được trên nền tối."]
];
function argbToCss(a){ const h=a.replace("#",""); const al=parseInt(h.slice(0,2),16)/255; const r=parseInt(h.slice(2,4),16),g=parseInt(h.slice(4,6),16),b=parseInt(h.slice(6,8),16); return `rgba(${r},${g},${b},${al.toFixed(2)})`; }
function initMau(){
  $("#c-rows").innerHTML = COLORS.map(([n,c,d])=>`<tr><td>${esc(n)}</td><td><span class="swatch"><i style="background:${argbToCss(c)}"></i></span></td><td><button class="mx mono" data-c="${c}" aria-label="Copy ${c}">${c}</button></td><td class="small">${esc(d)}</td></tr>`).join("");
  $("#c-rows").addEventListener("click", async e=>{ const b=e.target.closest("[data-c]"); if(!b) return; try{ await navigator.clipboard.writeText(b.dataset.c); const t=b.textContent; b.textContent="Đã copy"; setTimeout(()=>b.textContent=t,900); }catch(err){} });
}

/* ---------- 08 · Quiz ---------- */
const QZ = [
 {q:"Trong khung này, HVN của composite đại diện cho gì?",o:["Vùng giá đi nhanh","Vùng balance: giá đã ở lâu qua nhiều phiên","Vùng có nhiều stop","Mức giá có volume lớn trong 1 phút"],a:1,e:"HVN = nơi hai phe đã đồng ý giá qua nhiều phiên, tức là vùng balance."},
 {q:"Giá đang ở giữa LVN, bias lên. Nên làm gì?",o:["Long ngay vì bias lên","Short vì giá ở vùng ít giao dịch","Không vào giữa LVN; vào ở retest mép HVN dưới hoặc pullback VWAP, target mép dưới HVN trên","Chờ tới ngày mai"],a:2,e:"LVN là đường đi. Vào lệnh ở mép có trigger, không ở giữa đường."},
 {q:"Một period 30' vừa đóng dưới mép dưới HVN. Ý nghĩa?",o:["Vào short ngay lúc period đóng","Bias đổi sang continuation xuống; vào short ở lần retest mép trên M1","Phải chờ thêm 2 period mới làm gì","Long vì giá rẻ"],a:1,e:"TPO 30' đổi bias. Điểm vào lấy trên M1 ở lần retest, vì lúc period đóng giá thường đã chạy xa."},
 {q:"pRTH chấp nhận xuống, OVN lệch lên so với VA pRTH. Bias?",o:["A củng cố xuống","A củng cố lên","Xung đột: chờ IB, đi theo phía IB được chấp nhận","Balance, fade hai mép"],a:2,e:"Hai lớp ngược nhau thì không có bias trước phiên."},
 {q:"Cách 2 xác định HVN (chồng VA) làm gì?",o:["Lấy VA của ngày gần nhất","Đếm ở mỗi mức giá có bao nhiêu VA RTH và OVN chứa nó; chỗ từ 3 VA trở lên là HVN","Vẽ đường nối các POC","Lấy high/low của 30 ngày"],a:1,e:"Chỗ nhiều VA chồng nhau là nơi giá được chấp nhận nhiều phiên."},
 {q:"Bạn fade mép trên HVN, giá phá lên trên M1 và lệnh chạm stop. Sau đó period đóng trên mép. Làm gì?",o:["Vào lại short","Lệnh đã ra ở stop M1; bias đổi sang continuation lên, chờ retest để long","Dời stop","Đứng ngoài cả ngày"],a:1,e:"Stop nằm trên M1. Period đóng ngoài mép là tín hiệu đổi bias, không phải điểm thoát."},
 {q:"Composite 30 ngày có range 5000 điểm, HVN rất rộng và nhiều. Nên làm gì?",o:["Giữ nguyên 30 ngày","Thử composite ngắn hơn (10–20 ngày) để vùng sát với quy mô intraday","Bỏ composite","Chỉ dùng POC composite"],a:1,e:"Khi thị trường chạy mạnh, vùng cũ dễ hết tác dụng và quá rộng so với biên độ một phiên."},
 {q:"Target của lệnh continuation là gì?",o:["2R cố định","Mép gần của HVN kế tiếp theo hướng lệnh (bỏ nếu dưới 1.5R)","POC composite","High/low tuần"],a:1,e:"Giá đi qua LVN tới vùng balance kế tiếp; mép gần của vùng đó là nơi dễ gặp phản ứng."},
 {q:"Giá ở mép trên HVN, bias fade. Sau 10:00 VWAP RTH dốc lên mạnh, giá chạy dọc +1σ. Làm gì?",o:["Fade mạnh hơn vì giá đã giãn","Bỏ fade; VWAP dốc ra phía mép là ngày trend, chờ continuation hoặc pullback VWAP","Short ở +2σ","Bỏ qua VWAP vì bias đã chốt"],a:1,e:"VWAP là cổng lọc trong phiên: VWAP dốc ra phía mép thì không fade."},
 {q:"Khi nào mép HVN là chỗ fade tốt nhất?",o:["Khi VWAP dốc theo hướng phá","Khi VWAP phẳng và band ±2σ trùng mép HVN","Trước 10:00 khi band còn hẹp","Khi giá chạm mép lần thứ 3"],a:1,e:"VWAP phẳng = balance trong phiên; ±2σ trùng mép HVN cộng thêm một lớp location."}
];
function initQuiz(){
  const st={ans:{}};
  const draw=()=>{
    $("#q-list").innerHTML = QZ.map((q,i)=>{ const a=st.ans[i]; return `<div class="q"><b>${i+1}. ${esc(q.q)}</b><div class="opts">${q.o.map((o,j)=>`<button data-q="${i}" data-o="${j}" class="${a!=null?(j===q.a?"right":(j===a?"wrong":"")):""}" ${a!=null?"disabled":""}>${esc(o)}</button>`).join("")}</div>${a!=null?`<div class="expl">${esc(q.e)}</div>`:""}</div>`; }).join("");
    const done=Object.keys(st.ans).length, ok=Object.entries(st.ans).filter(([i,a])=>QZ[i].a===a).length;
    $("#q-score").textContent = `${ok}/${done} đúng · ${QZ.length-done} câu còn lại`;
  };
  $("#q-list").addEventListener("click",e=>{ const b=e.target.closest("[data-q]"); if(!b) return; st.ans[+b.dataset.q]=+b.dataset.o; draw(); });
  $("#q-reset").addEventListener("click",()=>{ st.ans={}; draw(); });
  draw();
}

/* ---------- boot ---------- */
route();
initHVN(); initX(); initB(); initLog(); initMau(); initQuiz();
})();
