/* plan-core.js · Composite × pRTH × OVN
 * Hàm thuần dùng chung cho trang Testing plan (trình duyệt) và API /api/plan (server, Node):
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
