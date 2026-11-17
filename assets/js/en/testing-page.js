
(function(){
if(!document.getElementById("b-build"))return;
"use strict";
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const fmt = n => (n==null||isNaN(n)) ? "—" : Number(n).toLocaleString("en-US",{maximumFractionDigits:2});
const num = id => { const v = parseFloat($("#"+id).value); return isNaN(v) ? null : v; };
const store = { get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v);}catch(e){return d;} }, set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };
const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const COL = { hvn:"#26A69A", rth:"#E0A458", ovn:"#6F9BD9", rpoc:"#FF9F1A", opoc:"#E87BA4", up:"#3fbf7f", dn:"#ef5350", txt:"#e6e8eb", mut:"#9aa0a8", grid:"#2c2f35" };
const FONT = "Be Vietnam Pro, sans-serif", MONO = "JetBrains Mono, monospace";


const P_OPTS = [
 {k:"in",    n:"Trong HVN",          d:"Price is inside a balance area, farther from both edges than the near-edge threshold."},
 {k:"edgeU", n:"Near the upper HVN edge",   d:"Price is at the upper edge of an HVN (just inside or just outside). Decision point: rejected → fade down; accepted → continuation up."},
 {k:"edgeD", n:"Near the lower HVN edge",   d:"Price is at the lower edge of an HVN. Rejected → fade up; accepted → continuation down."},
 {k:"lvn",   n:"Trong LVN",          d:"Price sits between two HVNs. Few agree on price here; it usually moves fast to one of the two edges."},
 {k:"out",   n:"Outside the composite",    d:"Price is above or below every HVN: price discovery. Prefer going with it, do not fade."}
];
const B_OPTS = [
 {k:"accU", n:"Accepted up",        dir:1,  d:"Closed above VAH, or value higher than the day before, no upper tail."},
 {k:"accD", n:"Accepted down",      dir:-1, d:"Closed below VAL, or value lower than the day before, no lower tail."},
 {k:"bal",  n:"Balance",              dir:0,  d:"Closed inside the VA, balanced profile (D / Normal), no side accepted."},
 {k:"rejU", n:"Tried up, rejected",   dir:-1, d:"Went above VAH or an HVN edge but left a tail / poor high and closed back below."},
 {k:"rejD", n:"Tried down, rejected", dir:1,  d:"Went below VAL or an HVN edge but left a lower tail and closed back above."}
];
const O_OPTS = [
 {k:"up",   n:"Skewed up / above the pRTH VA",   dir:1,  d:"OVN VA higher than the pRTH VA: overlap skewed up or entirely above."},
 {k:"down", n:"Skewed down / below the pRTH VA", dir:-1, d:"OVN VA lower than the pRTH VA: overlap skewed down or entirely below."},
 {k:"in",   n:"Trong VA pRTH",             dir:0,  d:"Overnight accepted yesterday’s value and has not picked a direction."},
 {k:"wide", n:"Engulfs the pRTH VA",          dir:0,  d:"Overnight was two-sided and swept both sides of yesterday’s value. Wait for the IB."}
];
const byK = (arr,k) => arr.find(x=>x.k===k);
const fillSel = (sel, arr) => { sel.innerHTML = arr.map(o=>`<option value="${o.k}">${esc(o.n)}</option>`).join(""); };

function biasOf(bk, ok){
  const dB = byK(B_OPTS,bk).dir, dO = byK(O_OPTS,ok).dir;
  let dir=0, conf, cls, need;
  if(dB!==0 && dO===dB){ dir=dB; conf="A reinforced"; cls=dB>0?"up":"dn"; need="An open type not against the direction is enough."; }
  else if(dB!==0 && dO===0){ dir=dB; conf="A needs confirmation"; cls="nt"; need=`Needs OD/OTD ${dB>0?"up":"down"} and EMA 9/34 aligned at 10:00.`; }
  else if(dB===0 && dO!==0){ dir=dO; conf="A needs confirmation"; cls="nt"; need=`Needs OD/OTD ${dO>0?"up":"down"} in the OVN direction.`; }
  else if(dB!==0 && dO===-dB){ dir=0; conf="Conflict"; cls="dn"; need="pRTH and OVN disagree. Wait for the IB, follow the side the IB accepts."; }
  else { dir=0; conf="Balance"; cls="nt"; need="No direction. Fade inside the HVN, wait for the edges."; }
  if(ok==="wide") need += " OVN engulfs: no A-period trades.";
  const word = dir>0?"Up ":dir<0?"Down ":"Neutral";
  return {dir, conf, cls, need, word};
}


function setupOf(pk, dir, ctx){
  ctx = ctx || {};
  const z = ctx.z, up = ctx.up, dn = ctx.dn, side = ctx.side;
  const L = (v, t) => v!=null ? fmt(v) : t;
  const zHi = L(z&&z.hi,"upper HVN edge"), zLo = L(z&&z.lo,"lower HVN edge"), zMid = L(z&&z.mid,"HVN middle");
  const upLo = up ? fmt(up.lo) : null, dnHi = dn ? fmt(dn.hi) : null;
  const R = (type, text, target, flip) => ({type, text, target, flip});
  if(pk==="in"){
    if(dir===0) return R("Fade", `Fade both HVN edges ${z?zLo+"–"+zHi:""}: short the upper edge, long the lower edge on an M1 trigger. Target ${zMid}.`, z?z.mid:null, `Period 30' close beyond one edge → switch to continuation on that side.`);
    if(dir>0) return R("With the bias inside the HVN", `Buy pullbacks inside the HVN (to POC / VWAP) with the up bias, target the upper edge ${zHi}. No shorts at the lower edge. At the upper edge, handle it as "Near the upper edge".`, z?z.hi:null, `A period closes below ${zLo} → bias broken.`);
    return R("With the bias inside the HVN", `Sell bounces inside the HVN (to POC / VWAP) with the down bias, target the lower edge ${zLo}. No longs at the upper edge. At the lower edge, handle it as "Near the lower edge".`, z?z.lo:null, `Period closes above ${zHi} → bias broken.`);
  }
  if(pk==="edgeU"){
    const tgt = upLo ? `lower edge of the next HVN up ${upLo}` : (ctx.numeric ? "IB extension (no HVN above in the composite)" : "lower edge of the next HVN up");
    if(dir>0) return R("Continuation up", `Wait for one 30' close above ${zHi}. Long on the retest of ${zHi} on M1 (candle holds above, positive delta, EMA 9 > 34). Target ${tgt}.`, up?up.lo:null, `Next period closes back below ${zHi} → failed breakout, stand aside or fade to ${zMid}.`);
    if(dir<0) return R("Fade the upper edge", `Short when price is rejected at ${zHi} (candle closes back inside, negative delta or absorption). Target ${zMid}, then ${zLo}.`, z?z.mid:null, `Period 30' close above ${zHi} → stop fading, consider continuation up.`);
    return R("Wait for the edge reaction", `${zHi} is the decision point. Rejected → fade to ${zMid}. Period closes above → continuation to ${tgt}.`, null, "Follow whichever reaction comes first.");
  }
  if(pk==="edgeD"){
    const tgt = dnHi ? `upper edge of the next HVN down ${dnHi}` : (ctx.numeric ? "IB extension (no HVN below in the composite)" : "upper edge of the next HVN down");
    if(dir<0) return R("Continuation down", `Wait for one 30' close below ${zLo}. Short on the retest of ${zLo} on M1 (candle holds below, negative delta, EMA 9 < 34). Target ${tgt}.`, dn?dn.hi:null, `Next period closes back above ${zLo} → failed breakdown, stand aside or fade to ${zMid}.`);
    if(dir>0) return R("Fade the lower edge", `Long when price is rejected at ${zLo} (candle closes back inside, positive delta or absorption). Target ${zMid}, then ${zHi}.`, z?z.mid:null, `Period 30' close below ${zLo} → stop fading, consider continuation down.`);
    return R("Wait for the edge reaction", `${zLo} is the decision point. Rejected → fade to ${zMid}. Period closes below → continuation to ${tgt}.`, null, "Follow whichever reaction comes first.");
  }
  if(pk==="lvn"){
    const a = upLo || "lower edge of the HVN above", b = dnHi || "upper edge of the HVN below";
    if(dir>0) return R("Continuation up through the LVN", `Go with it up to ${a}. Enter on the retest of ${b} or a VWAP pullback with a trigger. Do not buy mid-LVN.`, up?up.lo:null, `A period closes below ${b} → upside idea broken.`);
    if(dir<0) return R("Continuation down through the LVN", `Go with it down to ${b}. Enter on the retest of ${a} or a bounce to VWAP with a trigger. Do not sell mid-LVN.`, dn?dn.hi:null, `Period closes above ${a} → downside idea broken.`);
    return R("Wait for IB", `Price is floating in the LVN (${b} – ${a}). Wait for the IB. Follow whichever side is accepted first, to that HVN edge.`, null, "LVNs rarely hold price for long.");
  }
  // out
  const sideTxt = side>0 ? "above" : side<0 ? "below" : "outside";
  const nearEdge = z ? (side>0 ? z.hi : z.lo) : null;
  if(dir!==0 && (side===0 || side===undefined || dir===side)) return R("Go with it (price discovery)", `Price is ${sideTxt} the composite with the bias on the same side: only go with it via VWAP pullbacks or IB retests, no fading. Target IB 1.5x–2x.`, null, "A period closes back inside the composite → stop going with it.");
  if(dir!==0) return R("Back into the composite", `The bias is against the side price is exploring. Only trade once a period closes back inside the HVN${nearEdge!=null?" (through "+fmt(nearEdge)+")":""}, target ${z?fmt(z.mid):"middle of the nearest HVN"}.`, z?z.mid:null, "No period closing back inside → stand aside.");
  return R("Wait for IB", "Price is exploring outside the composite with no clear direction. Wait for the IB, do not fade.", null, "—");
}


const SAMPLE = "2026-10-21 RTH 29916 30111\n2026-10-22 OVN 29418 29751\n2026-10-22 RTH 29093 29366\n2026-10-23 OVN 29088 29197\n2026-10-23 RTH 29128 29273\n2026-10-26 OVN 29062 29215\n2026-10-26 RTH 29361 29572\n2026-10-27 OVN 29378 29565\n2026-10-27 RTH 29659 29882\n2026-10-28 OVN 29871 29976\n2026-10-28 RTH 29801 29940\n2026-10-29 OVN 29605 29734\n2026-10-29 RTH 29448 29617\n2026-10-30 OVN 28835 29044\n2026-10-30 RTH 28462 28859\n2026-11-02 OVN 28712 28805\n2026-11-02 RTH 28332 28891\n2026-11-03 OVN 28120 28263\n2026-11-03 RTH 28284 28391\n2026-11-04 OVN 27951 28602\n2026-11-04 RTH 28564 28785\n2026-11-05 OVN 28253 28444\n2026-11-05 RTH 26815 27358\n2026-11-06 OVN 26898 27191\n2026-11-06 RTH 27082 27269\n2026-11-09 OVN 26925 27238\n2026-11-09 RTH 27796 28129\n2026-11-10 OVN 27897 28044\n2026-11-10 RTH 27647 27916\n2026-11-11 OVN 28118 28407\n2026-11-11 RTH 28416 28697\n2026-11-12 OVN 28176 28307";
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
  // merge small gaps
  const merged=[]; zones.forEach(z=>{ const p=merged[merged.length-1]; if(p && z.lo-p.hi <= opt.merge) p.hi=z.hi; else merged.push({...z}); });
  merged.forEach(z=>{ z.w=z.hi-z.lo; z.small = z.w < opt.minw;
    let best=-1, bi=0; for(let i=Math.round((z.lo-g0)/step); i<=Math.round((z.hi-g0)/step) && i<n; i++){ if(cnt[i]>best){best=cnt[i]; bi=i;} } z.peak=g0+bi*step+step/2; });
  const gaps=[]; for(let i=1;i<merged.length;i++){ const a=merged[i-1].hi, b=merged[i].lo; const ja=Math.round((a-g0)/step), jb=Math.round((b-g0)/step); let mn=Infinity; for(let j=ja; j<jb; j++) mn=Math.min(mn,cnt[j]||0);
    let best=null, cs=-1; for(let j=ja;j<=jb;j++){ const inCore = j<jb && (cnt[j]||0)===mn; if(inCore){ if(cs<0) cs=j; } else if(cs>=0){ if(!best || (j-cs)>(best[1]-best[0])) best=[cs,j]; cs=-1; } }
    gaps.push({lo:a, hi:b, w:b-a, clear: mn===0, min:mn, core: best?{lo:g0+best[0]*step, hi:g0+best[1]*step}:null}); }
  return {zones:merged, gaps, cnt, isH, g0, step, n, lo:g0, hi:g0+n*step, days:keep.size, rows:rows.length};
}
function drawZones(res){
  const W=820, H=520, x0=110, x1=760, top=16, bot=H-24;
  const y = v => top + (res.hi - v)/(res.hi-res.lo)*(bot-top);
  const mx = Math.max(1,...res.cnt), sc = (x1-x0-140)/mx;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Profile counting stacked VAs, HVN zones in teal"><g font-family="${MONO}">`;
  const tickStep = (res.hi-res.lo)>2500?500:(res.hi-res.lo)>1200?200:100;
  for(let t=Math.ceil(res.lo/tickStep)*tickStep; t<=res.hi; t+=tickStep){ s+=`<line x1="${x0}" x2="${x1}" y1="${y(t)}" y2="${y(t)}" stroke="${COL.grid}"/><text x="${x0-8}" y="${y(t)+4}" fill="${COL.mut}" font-size="11" text-anchor="end">${fmt(t)}</text>`; }
  res.zones.forEach(z=>{ const fill = z.small ? "rgba(136,135,128,0.18)" : "rgba(38,166,154,0.16)"; const st = z.small ? "#888780" : COL.hvn;
    s+=`<rect x="${x0}" y="${y(z.hi)}" width="${x1-x0}" height="${Math.max(2,y(z.lo)-y(z.hi))}" fill="${fill}" stroke="${st}" stroke-dasharray="4 3"/>`;
    if(!z.small || y(z.lo)-y(z.hi)>14) s+=`<text x="${x1-6}" y="${y(z.hi)+14}" fill="${z.small?"#d3d1c7":"#bff0e8"}" font-size="12" text-anchor="end">${z.small?"small node":"HVN"} ${fmt(z.lo)}–${fmt(z.hi)}</text>`; });
  res.gaps.forEach(g=>{ const ym=(y(g.lo)+y(g.hi))/2; if(y(g.lo)-y(g.hi)>14) s+=`<text x="${x1-6}" y="${ym+4}" fill="${COL.mut}" font-size="12" text-anchor="end">LVN ${g.clear?"clear":"faint"} ${fmt(g.lo)}–${fmt(g.hi)}</text>`;
    if(g.clear && g.core) s+=`<rect x="${x0}" y="${y(g.core.hi)}" width="6" height="${Math.max(2,y(g.core.lo)-y(g.core.hi))}" fill="#ef5350" opacity=".8"/>`; });
  const rh = Math.max(1,(bot-top)/res.n);
  res.cnt.forEach((c,i)=>{ if(!c) return; const v=res.g0+i*res.step; s+=`<rect x="${x0}" y="${y(v+res.step)}" width="${c*sc}" height="${rh}" fill="${res.isH[i]?COL.hvn:"#5f5e5a"}" opacity="${res.isH[i]?0.85:0.6}"/>`; });
  s+=`<text x="${x0}" y="${H-6}" fill="${COL.mut}" font-size="11">Bar length = number of stacked VAs at that price (max ${mx}) · ${res.days} days · ${res.rows} VA</text>`;
  return s+`</g></svg>`;
}
let lastZones = null;
function runHVN(){
  const rows = parseVA($("#h-text").value);
  const opt = { n:+$("#h-n").value||16, k:+$("#h-k").value||3, merge:+$("#h-merge").value||0, minw:+$("#h-minw").value||0, mode:$("#h-mode").value };
  store.set("ofs.tp.hvn", {text:$("#h-text").value, ...opt});
  const res = findZones(rows, opt);
  if(!res){ $("#h-svg").innerHTML=""; $("#h-rows").innerHTML=""; $("#h-msg").textContent="No lines could be read. Each line: date RTH|OVN VAL VAH."; return; }
  lastZones = res;
  $("#h-svg").innerHTML = drawZones(res);
  const items = [];
  res.zones.forEach((z,i)=>{ items.push({t:z.lo, html:`<tr><td><span class="chip ${z.small?"lvn":"hvn"}">${z.small?"Small node":"HVN"}</span></td><td class="mono">${fmt(z.lo)}</td><td class="mono">${fmt(z.hi)}</td><td class="num mono">${fmt(z.w)}</td><td class="small">${z.small?"Narrower than the threshold: treat it as a level, not a balance area.":"Most stacked around "+fmt(z.peak)+" (use it as the zone POC)."}</td></tr>`}); });
  res.gaps.forEach(g=>items.push({t:g.lo+0.1, html:`<tr><td><span class="chip lvn">LVN</span></td><td class="mono">${fmt(g.lo)}</td><td class="mono">${fmt(g.hi)}</td><td class="num mono">${fmt(g.w)}</td><td class="small">${g.clear?`Empty core (no VA covers it) ${g.core?fmt(g.core.lo)+"–"+fmt(g.core.hi):""}: price usually moves through fast.`:`Thinnest ${g.core?fmt(g.core.lo)+"–"+fmt(g.core.hi):""} (${g.min} VA): a path, but slower.`}</td></tr>`}));
  $("#h-rows").innerHTML = items.sort((a,b)=>b.t-a.t).map(x=>x.html).join("");
  const big = res.zones.filter(z=>!z.small).length;
  $("#h-msg").textContent = `${big} HVN, ${res.zones.length-big} small nodes, ${res.gaps.length} LVN gaps. Change "Min VA count" to make zones tighter (raise) or wider (lower).`;
}
function initHVN(){
  const sv = store.get("ofs.tp.hvn", null);
  $("#h-text").value = sv && sv.text ? sv.text : SAMPLE;
  if(sv){ ["n","k","merge","minw","mode"].forEach(k=>{ if(sv[k]!=null) $("#h-"+k).value = sv[k]; }); }
  $("#h-run").addEventListener("click", runHVN);
  ["h-n","h-k","h-merge","h-minw","h-mode"].forEach(id=>$("#"+id).addEventListener("change", runHVN));
  $("#h-reset").addEventListener("click", ()=>{ $("#h-text").value = SAMPLE; $("#h-n").value=16; $("#h-k").value=3; $("#h-merge").value=40; $("#h-minw").value=100; $("#h-mode").value="both"; runHVN(); });
  $("#h-to-builder").addEventListener("click", ()=>{
    if(!lastZones) runHVN(); if(!lastZones) return;
    const zs = lastZones.zones.filter(z=>!z.small).slice(-4);
    setZones(zs.map(z=>[z.lo,z.hi]));
    $("#b-msg").textContent = `Received ${zs.length} HVNs from the VA-stacking tool.`;
    location.hash = "builder";
  });
  runHVN();
}


function renderX(){
  const pk=$("#x-p").value, bk=$("#x-b").value, ok=$("#x-o").value;
  const B = biasOf(bk, ok), S = setupOf(pk, B.dir, {});
  $("#x-out").innerHTML = `
    <div class="row"><span class="pill ${B.cls}">${B.conf}</span><span class="pill ${B.dir>0?"up":B.dir<0?"dn":"nt"}">Direction: ${B.word}</span><span class="pill nt">Setup: ${esc(S.type)}</span></div>
    <div class="ab">
      <div class="card a"><span class="k">How to trade</span><p class="small">${esc(S.text)}</p></div>
      <div class="card b"><span class="k">Bias flips when</span><p class="small">${esc(S.flip)}</p><span class="k">Needed at 10:00</span><p class="small">${esc(B.need)}</p></div>
    </div>`;
}
function initX(){
  fillSel($("#x-p"),P_OPTS); fillSel($("#x-b"),B_OPTS); fillSel($("#x-o"),O_OPTS);
  $("#x-p").value="edgeD"; $("#x-b").value="accD"; $("#x-o").value="down";
  ["x-p","x-b","x-o"].forEach(id=>$("#"+id).addEventListener("change", renderX));
  $("#d-p").innerHTML = P_OPTS.map(o=>`<dt>${esc(o.n)}</dt><dd class="small">${esc(o.d)}</dd>`).join("");
  $("#d-b").innerHTML = B_OPTS.map(o=>`<dt>${esc(o.n)}</dt><dd class="small">${esc(o.d)} <span class="muted">(${o.dir>0?"up":o.dir<0?"down":"neutral"})</span></dd>`).join("");
  $("#d-o").innerHTML = O_OPTS.map(o=>`<dt>${esc(o.n)}</dt><dd class="small">${esc(o.d)}</dd>`).join("");
  renderX();
}

/* ---------- 03 · Plan Builder ---------- */
const ZN = 4;
function setZones(list){ for(let i=0;i<ZN;i++){ const z=list[i]; $("#b-z"+i+"lo").value = z?z[0]:""; $("#b-z"+i+"hi").value = z?z[1]:""; } }
function getZones(){ const zs=[]; for(let i=0;i<ZN;i++){ let a=num("b-z"+i+"lo"), b=num("b-z"+i+"hi"); if(a!=null && b!=null){ if(a>b){const x=a;a=b;b=x;} zs.push({lo:a,hi:b,mid:(a+b)/2}); } } return zs.sort((a,b)=>a.lo-b.lo); }
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
function suggestB(){
  const vah=num("b-rvah"), val=num("b-rval"), poc=num("b-rpoc"), hi=num("b-rhi"), lo=num("b-rlo"), cl=num("b-rcl");
  if([vah,val,cl].some(v=>v==null)) return null;
  if(cl>vah) return "accU"; if(cl<val) return "accD";
  const w=vah-val, p = poc!=null?poc:(vah+val)/2;
  if(hi!=null && hi-vah > 0.5*w && cl<p) return "rejU";
  if(lo!=null && val-lo > 0.5*w && cl>p) return "rejD";
  return "bal";
}
let bTouched=false, lastPlan="", lastB=null;
function drawMap(D){
  const vals=[D.px,D.rvah,D.rval,D.rhi,D.rlo,D.ovah,D.oval,D.onh,D.onl].filter(v=>v!=null);
  D.zones.forEach(z=>{ vals.push(z.lo,z.hi); });
  if(D.target!=null) vals.push(D.target);
  let lo=Math.min(...vals), hi=Math.max(...vals); const pad=(hi-lo)*0.06||50; lo-=pad; hi+=pad;
  const W=820,H=520,x0=96,x1=800,top=14,bot=H-14; const y=v=>top+(hi-v)/(hi-lo)*(bot-top);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Plan map: HVN, pRTH VA, OVN VA, price and target"><g font-family="${MONO}">`;
  const span=hi-lo, ts= span>2500?500:span>1200?200:span>500?100:50;
  for(let t=Math.ceil(lo/ts)*ts;t<=hi;t+=ts) s+=`<line x1="${x0}" x2="${x1}" y1="${y(t)}" y2="${y(t)}" stroke="${COL.grid}"/><text x="${x0-8}" y="${y(t)+4}" fill="${COL.mut}" font-size="11" text-anchor="end">${fmt(t)}</text>`;
  D.zones.forEach(z=>{ s+=`<rect x="${x0}" y="${y(z.hi)}" width="${x1-x0}" height="${y(z.lo)-y(z.hi)}" fill="rgba(38,166,154,0.15)" stroke="${COL.hvn}" stroke-dasharray="5 4"/><text x="${x0+8}" y="${y(z.hi)+15}" fill="#bff0e8" font-size="12">HVN ${fmt(z.lo)}–${fmt(z.hi)}</text>`; });
  for(let i=1;i<D.zones.length;i++){ const a=D.zones[i-1].hi,b=D.zones[i].lo; if(y(a)-y(b)>16) s+=`<text x="${x0+8}" y="${(y(a)+y(b))/2+4}" fill="${COL.mut}" font-size="12">LVN ${fmt(a)}–${fmt(b)}</text>`; }
  const box=(x,lab,vah,val,poc,h,l,col,pcol)=>{ if(vah==null||val==null) return ""; let t="";
    if(h!=null&&l!=null) t+=`<line x1="${x+55}" x2="${x+55}" y1="${y(h)}" y2="${y(l)}" stroke="${col}" stroke-width="2" opacity=".7"/>`;
    t+=`<rect x="${x}" y="${y(vah)}" width="110" height="${Math.max(2,y(val)-y(vah))}" fill="${col}" fill-opacity=".32" stroke="${col}"/>`;
    if(poc!=null) t+=`<line x1="${x-6}" x2="${x+116}" y1="${y(poc)}" y2="${y(poc)}" stroke="${pcol}" stroke-width="2.5"/>`;
    t+=`<text x="${x+55}" y="${y(Math.max(vah,h||vah))-8}" fill="#ffffff" font-size="12" font-weight="700" text-anchor="middle" font-family="${FONT}">${lab}</text>`;
    t+=`<text x="${x+118}" y="${y(vah)+4}" fill="${col}" font-size="11">${fmt(vah)}</text><text x="${x+118}" y="${y(val)+4}" fill="${col}" font-size="11">${fmt(val)}</text>`;
    return t; };
  s+=box(290,"pRTH",D.rvah,D.rval,D.rpoc,D.rhi,D.rlo,COL.rth,COL.rpoc);
  s+=box(470,"OVN",D.ovah,D.oval,D.opoc,D.onh,D.onl,COL.ovn,COL.opoc);
  if(D.px!=null){ s+=`<line x1="${x0}" x2="${x1}" y1="${y(D.px)}" y2="${y(D.px)}" stroke="#ffffff" stroke-dasharray="2 4" stroke-width="1.5"/><text x="${x1-4}" y="${y(D.px)-6}" fill="#ffffff" font-size="12" text-anchor="end">Price 9:25 ${fmt(D.px)}</text>`; }
  if(D.px!=null && D.target!=null){ const c=D.target>D.px?COL.up:COL.dn; s+=`<defs><marker id="mk" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L9 5L1 9z" fill="${c}"/></marker></defs><line x1="700" x2="700" y1="${y(D.px)}" y2="${y(D.target)}" stroke="${c}" stroke-width="3" marker-end="url(#mk)"/><text x="690" y="${y(D.target)+(D.target>D.px?-6:14)}" fill="${c}" font-size="12" text-anchor="end" font-weight="700">Target ${fmt(D.target)}</text>`; }
  return s+`</g></svg>`;
}
function build(){
  const zs=getZones(), tol=num("b-tol")||30;
  const r={vah:num("b-rvah"), val:num("b-rval")}, o={vah:num("b-ovah"), val:num("b-oval")};
  const px=num("b-px");
  const sug=suggestB();
  if(sug && !bTouched) $("#b-b").value = sug;
  if(!zs.length || [r.vah,r.val,o.vah,o.val,px].some(v=>v==null)){ $("#b-out").textContent="Needs at least 1 HVN, pRTH VAH/VAL, OVN VAH/VAL and the 9:25 price."; $("#b-svg").innerHTML=""; return; }
  const loc=locate(px,zs,tol), ok=ovnKey(r,o), bk=$("#b-b").value;
  const B=biasOf(bk,ok);
  let ctx={numeric:true, z:loc.z, side:loc.side};
  if(loc.pk==="lvn"){ ctx.up=loc.up; ctx.dn=loc.dn; }
  else if(loc.z){ ctx.up=zs.find(z=>z.lo>loc.z.hi)||null; ctx.dn=[...zs].reverse().find(z=>z.hi<loc.z.lo)||null; }
  const S=setupOf(loc.pk,B.dir,ctx);
  const D={zones:zs,px,rvah:r.vah,rval:r.val,rpoc:num("b-rpoc"),rhi:num("b-rhi"),rlo:num("b-rlo"),ovah:o.vah,oval:o.val,opoc:num("b-opoc"),onh:num("b-onh"),onl:num("b-onl"),target:S.target};
  $("#b-svg").innerHTML=drawMap(D);
  const P=byK(P_OPTS,loc.pk), Bo=byK(B_OPTS,bk), Oo=byK(O_OPTS,ok);
  const dist = S.target!=null ? Math.abs(S.target-px) : null;
  lastB={date:$("#b-date").value, p:loc.pk, b:bk, o:ok, bias:B.dir>0?"Up ":B.dir<0?"Down ":(B.conf==="Conflict"?"Conflict":"Balance")};
  lastPlan =
`PLAN ${$("#b-date").value||""} · Composite × pRTH × OVN
LOCATION: ${P.n}${loc.z?` (HVN ${fmt(loc.z.lo)}–${fmt(loc.z.hi)})`:""}${loc.pk==="lvn"?` (between ${loc.dn?fmt(loc.dn.hi):"—"} and ${loc.up?fmt(loc.up.lo):"—"})`:""}
pRTH: ${Bo.n} · VA ${fmt(r.val)}–${fmt(r.vah)} · POC ${fmt(D.rpoc)}
OVN: ${Oo.n} · VA ${fmt(o.val)}–${fmt(o.vah)} · POC ${fmt(D.opoc)} · ONH ${fmt(D.onh)} / ONL ${fmt(D.onl)}
BIAS: ${B.word} · ${B.conf}
  ${B.need}

PRIORITY SETUP: ${S.type}
  ${S.text}
TARGET: ${S.target!=null?fmt(S.target)+` (from the 9:25 price ${fmt(dist)} pts)`:"as described"}
BIAS FLIP (TPO 30'): ${S.flip}
ENTRY: on M1 + footprint, stop by M1 structure. Never mid-LVN. Stop at 11:30 ET.
AT 10:00: open type + EMA 9/34 (5') sets the direction; if the open type is against the bias, follow the open type.`;
  $("#b-out").textContent = lastPlan;
  store.set("ofs.tp.builder", collectB());
}
const B_IDS=["b-tol","b-rvah","b-rval","b-rpoc","b-rhi","b-rlo","b-rcl","b-ovah","b-oval","b-opoc","b-onh","b-onl","b-px","b-date"];
function collectB(){ const o={}; B_IDS.forEach(id=>o[id]=$("#"+id).value); for(let i=0;i<ZN;i++){ o["z"+i+"lo"]=$("#b-z"+i+"lo").value; o["z"+i+"hi"]=$("#b-z"+i+"hi").value; } o.b=$("#b-b").value; o.touched=bTouched; return o; }
const EX = {"b-tol":30,"b-rvah":28010,"b-rval":27770,"b-rpoc":27965,"b-rhi":28420,"b-rlo":27700,"b-rcl":27760,"b-ovah":27880,"b-oval":27660,"b-opoc":27790,"b-onh":28290,"b-onl":27570,"b-px":27600,"b-date":"2026-11-16", zones:[[26840,27370],[27620,28040],[28200,28440]]};
function loadEx(){ B_IDS.forEach(id=>$("#"+id).value = EX[id]!=null?EX[id]:""); setZones(EX.zones); bTouched=false; build(); }
function initB(){
  $("#b-zones").innerHTML = Array.from({length:ZN},(_,i)=>`<div class="field"><label for="b-z${i}lo">HVN ${i+1} · from</label><input id="b-z${i}lo" type="number" step="0.25"></div><div class="field"><label for="b-z${i}hi">HVN ${i+1} · to</label><input id="b-z${i}hi" type="number" step="0.25"></div>`).join("");
  fillSel($("#b-b"),B_OPTS);
  const sv=store.get("ofs.tp.builder",null);
  if(sv){ B_IDS.forEach(id=>{ if(sv[id]!=null) $("#"+id).value=sv[id]; }); for(let i=0;i<ZN;i++){ $("#b-z"+i+"lo").value=sv["z"+i+"lo"]||""; $("#b-z"+i+"hi").value=sv["z"+i+"hi"]||""; } if(sv.b) $("#b-b").value=sv.b; bTouched=!!sv.touched; build(); }
  else loadEx();
  $("#b-b").addEventListener("change", ()=>{ bTouched=true; build(); });
  $("#b-build").addEventListener("click", build);
  $("#b-example").addEventListener("click", ()=>{ loadEx(); $("#b-msg").textContent="Loaded the 16/11 example (numbers read approximately from the chart)."; });
  $("#b-clear").addEventListener("click", ()=>{ B_IDS.forEach(id=>{ if(id!=="b-tol") $("#"+id).value=""; }); setZones([]); bTouched=false; $("#b-out").textContent="Enter numbers then press \"Build plan\"."; $("#b-svg").innerHTML=""; });
  $("#b-copy").addEventListener("click", async()=>{ if(!lastPlan) build(); try{ await navigator.clipboard.writeText(lastPlan); $("#b-msg").textContent="Plan copied."; }catch(e){ $("#b-msg").textContent="The browser blocked copying; select the plan box to copy."; } });
  ["b-rvah","b-rval","b-rpoc","b-rhi","b-rlo","b-rcl"].forEach(id=>$("#"+id).addEventListener("change", ()=>{ bTouched=false; }));
}


function initVD(){
  const zs=EX.zones.map(z=>({lo:z[0],hi:z[1],mid:(z[0]+z[1])/2}));
  $("#v-svg").innerHTML = drawMap({zones:zs,px:EX["b-px"],rvah:EX["b-rvah"],rval:EX["b-rval"],rpoc:EX["b-rpoc"],rhi:EX["b-rhi"],rlo:EX["b-rlo"],ovah:EX["b-ovah"],oval:EX["b-oval"],opoc:EX["b-opoc"],onh:EX["b-onh"],onl:EX["b-onl"],target:27370});
}

/* ---------- 06 · Quiz ---------- */
const QZ = [
 {q:"In this frame, what does a composite HVN represent?",o:["A fast-move area","A balance area: price stayed there across many sessions","An area with many stops","A price with big volume in 1 minute"],a:1,e:"HVN = where both sides agreed on price across many sessions, i.e. a balance area."},
 {q:"Price is mid-LVN, bias up. What should you do?",o:["Long right away because the bias is up","Short because price is in a low-volume area","Do not enter mid-LVN; enter on the retest of the lower HVN edge or a VWAP pullback, target the lower edge of the upper HVN","Wait until tomorrow"],a:2,e:"An LVN is a path. Enter at an edge with a trigger, not in the middle."},
 {q:"One 30' period just closed below the lower HVN edge. Meaning?",o:["Short right at the period close","The bias flips to continuation down; short the retest of the edge on M1","Must wait 2 more periods before doing anything","Long because price is cheap"],a:1,e:"TPO 30' flips the bias. The entry comes from the M1 retest, because by the period close price has usually run far."},
 {q:"pRTH accepted lower, OVN skewed up vs the pRTH VA. Bias?",o:["A reinforced down","A reinforced up","Conflict: wait for the IB, follow the side the IB accepts","Balance, fade both edges"],a:2,e:"When the two layers disagree there is no pre-session bias."},
 {q:"What does method 2 for finding HVNs (stacking VAs) do?",o:["Take the most recent day’s VA","Count how many RTH and OVN VAs contain each price; 3 or more VAs is an HVN","Draw a line through the POCs","Take the 30-day high/low"],a:1,e:"Where many VAs stack is where price was accepted across many sessions."},
 {q:"You fade the upper HVN edge, price breaks up on M1 and the trade hits its stop. Then a period closes above the edge. What now?",o:["Re-enter short","The trade is out at the M1 stop; the bias flips to continuation up, wait for the retest to go long","Move the stop","Stand aside all day"],a:1,e:"The stop lives on M1. A period closing beyond the edge is a bias-flip signal, not an exit point."},
 {q:"The 30-day composite spans 5000 points, with many very wide HVNs. What should you do?",o:["Keep 30 days","Try a shorter composite (10–20 days) so zones fit the intraday scale","Drop the composite","Use only the composite POC"],a:1,e:"When the market runs hard, old zones lose relevance and are too wide for a single session’s range."},
 {q:"What is the target of a continuation trade?",o:["Fixed 2R","The near edge of the next HVN in the trade direction (skip if under 1.5R)","POC composite","Weekly high/low"],a:1,e:"Price crosses the LVN to the next balance area; the near edge of that area is where a reaction is likely."}
];
function initQuiz(){
  const st={ans:{}};
  const draw=()=>{
    $("#q-list").innerHTML = QZ.map((q,i)=>{ const a=st.ans[i]; return `<div class="q"><b>${i+1}. ${esc(q.q)}</b><div class="opts">${q.o.map((o,j)=>`<button data-q="${i}" data-o="${j}" class="${a!=null?(j===q.a?"right":(j===a?"wrong":"")):""}" ${a!=null?"disabled":""}>${esc(o)}</button>`).join("")}</div>${a!=null?`<div class="expl">${esc(q.e)}</div>`:""}</div>`; }).join("");
    const done=Object.keys(st.ans).length, ok=Object.entries(st.ans).filter(([i,a])=>QZ[i].a===a).length;
    $("#q-score").textContent = `${ok}/${done} correct · ${QZ.length-done} questions left`;
  };
  $("#q-list").addEventListener("click",e=>{ const b=e.target.closest("[data-q]"); if(!b) return; st.ans[+b.dataset.q]=+b.dataset.o; draw(); });
  $("#q-reset").addEventListener("click",()=>{ st.ans={}; draw(); });
  draw();
}

/* ---------- boot ---------- */
initHVN(); initX(); initB(); initVD(); initQuiz();
})();
