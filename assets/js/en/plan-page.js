
(function(){
if(!document.getElementById("b-build"))return;
"use strict";
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const { fmt, esc, COL, FONT, MONO, P_OPTS, B_OPTS, O_OPTS, byK, biasOf, setupOf, vwapGate, parseVA, findZones, locate, ovnKey,
  geomOf, spread, wrapText, drawPlan, suggestBFrom, makePlan } = window.PlanCore;
const num = id => { const v = parseFloat($("#"+id).value); return isNaN(v) ? null : v; };
const store = { get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v);}catch(e){return d;} }, set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };


const fillSel = (sel, arr) => { sel.innerHTML = arr.map(o=>`<option value="${o.k}">${esc(o.n)}</option>`).join(""); };







const SAMPLE = "2026-10-21 RTH 29916 30111\n2026-10-22 OVN 29418 29751\n2026-10-22 RTH 29093 29366\n2026-10-23 OVN 29088 29197\n2026-10-23 RTH 29128 29273\n2026-10-26 OVN 29062 29215\n2026-10-26 RTH 29361 29572\n2026-10-27 OVN 29378 29565\n2026-10-27 RTH 29659 29882\n2026-10-28 OVN 29871 29976\n2026-10-28 RTH 29801 29940\n2026-10-29 OVN 29605 29734\n2026-10-29 RTH 29448 29617\n2026-10-30 OVN 28835 29044\n2026-10-30 RTH 28462 28859\n2026-11-02 OVN 28712 28805\n2026-11-02 RTH 28332 28891\n2026-11-03 OVN 28120 28263\n2026-11-03 RTH 28284 28391\n2026-11-04 OVN 27951 28602\n2026-11-04 RTH 28564 28785\n2026-11-05 OVN 28253 28444\n2026-11-05 RTH 26815 27358\n2026-11-06 OVN 26898 27191\n2026-11-06 RTH 27082 27269\n2026-11-09 OVN 26925 27238\n2026-11-09 RTH 27796 28129\n2026-11-10 OVN 27897 28044\n2026-11-10 RTH 27647 27916\n2026-11-11 OVN 28118 28407\n2026-11-11 RTH 28416 28697\n2026-11-12 OVN 28176 28307";
const SAMPLE_PLAN = {"v":1,"source":"mo phong tu data M1 (Deren.PlanSender v1)","symbol":"NQZ6","date":"2026-11-12","ts_et":"2026-11-12T09:29:00-05:00","price":28064.25,"prth":{"date":"2026-11-11","vah":28697.0,"val":28416.0,"poc":28548.5,"high":28697.0,"low":28199.0,"close":28457.25,"periods_hl":[[28426.0,28199.0],[28388.5,28256.5],[28550.25,28336.5],[28573.0,28462.0],[28619.25,28520.5],[28660.0,28575.0],[28666.25,28622.0],[28690.5,28601.25],[28697.0,28660.5],[28666.0,28535.0],[28588.25,28548.75],[28572.25,28499.5],[28534.25,28443.5],[28510.5,28452.25]]},"ovn":{"vah":28307.0,"val":28176.0,"poc":28204.5,"onh":28368.75,"onl":28013.75,"periods_hl":[[28319.75,28131.75],[28296.75,28193.75],[28270.0,28166.0],[28249.0,28194.0],[28274.0,28187.75],[28311.25,28248.5],[28368.75,28278.0],[28358.5,28280.5],[28334.25,28233.5],[28277.25,28204.5],[28275.25,28234.25],[28238.5,28201.5],[28223.25,28142.5],[28176.25,28134.25],[28231.0,28141.75],[28212.25,28162.25],[28236.5,28182.5],[28237.0,28168.0],[28249.75,28191.0],[28252.5,28195.25],[28267.75,28198.25],[28312.75,28265.0],[28307.25,28268.75],[28301.5,28239.0],[28270.75,28223.75],[28255.5,28214.25],[28308.75,28195.0],[28219.25,28173.0],[28242.5,28013.75],[28169.0,28055.0],[28145.0,28050.25]]},"sessions":[{"date":"2026-10-02","type":"OVN","val":30798.0,"vah":30989.0,"poc":30884.5},{"date":"2026-10-02","type":"RTH","val":31001.0,"vah":31148.0,"poc":31057.5},{"date":"2026-10-05","type":"OVN","val":30976.0,"vah":31119.0,"poc":31042.5},{"date":"2026-10-05","type":"RTH","val":31191.0,"vah":31348.0,"poc":31235.5},{"date":"2026-10-06","type":"OVN","val":31328.0,"vah":31419.0,"poc":31358.5},{"date":"2026-10-06","type":"RTH","val":31484.0,"vah":31557.0,"poc":31526.5},{"date":"2026-10-07","type":"OVN","val":31326.0,"vah":31521.0,"poc":31480.5},{"date":"2026-10-07","type":"RTH","val":31258.0,"vah":31423.0,"poc":31344.5},{"date":"2026-10-08","type":"OVN","val":31131.0,"vah":31392.0,"poc":31219.5},{"date":"2026-10-08","type":"RTH","val":30955.0,"vah":31370.0,"poc":31243.5},{"date":"2026-10-09","type":"OVN","val":31054.0,"vah":31267.0,"poc":31216.5},{"date":"2026-10-09","type":"RTH","val":31037.0,"vah":31122.0,"poc":31087.5},{"date":"2026-10-12","type":"OVN","val":31104.0,"vah":31289.0,"poc":31232.5},{"date":"2026-10-12","type":"RTH","val":30870.0,"vah":30953.0,"poc":30886.5},{"date":"2026-10-13","type":"OVN","val":30636.0,"vah":30749.0,"poc":30666.5},{"date":"2026-10-13","type":"RTH","val":30701.0,"vah":30794.0,"poc":30763.5},{"date":"2026-10-14","type":"OVN","val":30745.0,"vah":30848.0,"poc":30789.5},{"date":"2026-10-14","type":"RTH","val":30103.0,"vah":30434.0,"poc":30199.5},{"date":"2026-10-15","type":"OVN","val":29787.0,"vah":29952.0,"poc":29843.5},{"date":"2026-10-15","type":"RTH","val":29862.0,"vah":30197.0,"poc":29958.5},{"date":"2026-10-16","type":"OVN","val":30043.0,"vah":30174.0,"poc":30091.5},{"date":"2026-10-16","type":"RTH","val":29302.0,"vah":29807.0,"poc":29390.5},{"date":"2026-10-19","type":"OVN","val":29638.0,"vah":29813.0,"poc":29766.5},{"date":"2026-10-19","type":"RTH","val":29709.0,"vah":29852.0,"poc":29785.5},{"date":"2026-10-20","type":"OVN","val":29576.0,"vah":29741.0,"poc":29646.5},{"date":"2026-10-20","type":"RTH","val":29656.0,"vah":29833.0,"poc":29700.5},{"date":"2026-10-21","type":"OVN","val":29824.0,"vah":29965.0,"poc":29868.5},{"date":"2026-10-21","type":"RTH","val":29916.0,"vah":30111.0,"poc":29990.5},{"date":"2026-10-22","type":"OVN","val":29418.0,"vah":29751.0,"poc":29508.5},{"date":"2026-10-22","type":"RTH","val":29093.0,"vah":29366.0,"poc":29155.5},{"date":"2026-10-23","type":"OVN","val":29088.0,"vah":29197.0,"poc":29128.5},{"date":"2026-10-23","type":"RTH","val":29128.0,"vah":29273.0,"poc":29150.5},{"date":"2026-10-26","type":"OVN","val":29062.0,"vah":29215.0,"poc":29138.5},{"date":"2026-10-26","type":"RTH","val":29361.0,"vah":29572.0,"poc":29483.5},{"date":"2026-10-27","type":"OVN","val":29378.0,"vah":29565.0,"poc":29432.5},{"date":"2026-10-27","type":"RTH","val":29659.0,"vah":29882.0,"poc":29805.5},{"date":"2026-10-28","type":"OVN","val":29871.0,"vah":29976.0,"poc":29913.5},{"date":"2026-10-28","type":"RTH","val":29797.0,"vah":29934.0,"poc":29861.5},{"date":"2026-10-29","type":"OVN","val":29605.0,"vah":29734.0,"poc":29653.5},{"date":"2026-10-29","type":"RTH","val":29448.0,"vah":29617.0,"poc":29538.5},{"date":"2026-10-30","type":"OVN","val":28835.0,"vah":29044.0,"poc":28923.5},{"date":"2026-10-30","type":"RTH","val":28462.0,"vah":28859.0,"poc":28668.5},{"date":"2026-11-02","type":"OVN","val":28712.0,"vah":28805.0,"poc":28764.5},{"date":"2026-11-02","type":"RTH","val":28330.0,"vah":28891.0,"poc":28664.5},{"date":"2026-11-03","type":"OVN","val":28120.0,"vah":28263.0,"poc":28232.5},{"date":"2026-11-03","type":"RTH","val":28288.0,"vah":28395.0,"poc":28330.5},{"date":"2026-11-04","type":"OVN","val":27951.0,"vah":28602.0,"poc":28409.5},{"date":"2026-11-04","type":"RTH","val":28564.0,"vah":28783.0,"poc":28646.5},{"date":"2026-11-05","type":"OVN","val":28253.0,"vah":28444.0,"poc":28375.5},{"date":"2026-11-05","type":"RTH","val":26797.0,"vah":27358.0,"poc":26955.5},{"date":"2026-11-06","type":"OVN","val":26898.0,"vah":27191.0,"poc":26978.5},{"date":"2026-11-06","type":"RTH","val":27082.0,"vah":27269.0,"poc":27206.5},{"date":"2026-11-09","type":"OVN","val":26925.0,"vah":27238.0,"poc":27113.5},{"date":"2026-11-09","type":"RTH","val":27796.0,"vah":28129.0,"poc":27928.5},{"date":"2026-11-10","type":"OVN","val":27897.0,"vah":28044.0,"poc":27989.5},{"date":"2026-11-10","type":"RTH","val":27647.0,"vah":27916.0,"poc":27789.5},{"date":"2026-11-11","type":"OVN","val":28118.0,"vah":28407.0,"poc":28226.5},{"date":"2026-11-11","type":"RTH","val":28416.0,"vah":28697.0,"poc":28548.5},{"date":"2026-11-12","type":"OVN","val":28176.0,"vah":28307.0,"poc":28204.5}],"composite":{"days":30,"row":10,"vah":30310.0,"val":27160.0,"poc":29845.0},"warnings":[]};
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
      <div class="card b"><span class="k">Bias flips when</span><p class="small">${esc(S.flip)}</p><span class="k">Needed at 10:00</span><p class="small">${esc(B.need)}</p><span class="k">VWAP RTH gate</span><p class="small">${esc(vwapGate(S.type,B.dir))}</p></div>
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
function suggestB(){ return suggestBFrom({vah:num("b-rvah"), val:num("b-rval"), poc:num("b-rpoc"), high:num("b-rhi"), low:num("b-rlo"), close:num("b-rcl")}); }
let bTouched=false, lastPlan="", lastB=null, lastSvg="", importedComp=null, importedPer=null;


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
  store.set("ofs.tp.builder", collectB());
}
const B_IDS=["b-tol","b-rvah","b-rval","b-rpoc","b-rhi","b-rlo","b-rcl","b-ovah","b-oval","b-opoc","b-onh","b-onl","b-px","b-date"];
function collectB(){ const o={}; B_IDS.forEach(id=>o[id]=$("#"+id).value); for(let i=0;i<ZN;i++){ o["z"+i+"lo"]=$("#b-z"+i+"lo").value; o["z"+i+"hi"]=$("#b-z"+i+"hi").value; } o.b=$("#b-b").value; o.touched=bTouched; o.manual=!importedPer; return o; }
function initB(){
  $("#b-zones").innerHTML = Array.from({length:ZN},(_,i)=>`<div class="field"><label for="b-z${i}lo">HVN ${i+1} · from</label><input id="b-z${i}lo" type="number" step="0.25"></div><div class="field"><label for="b-z${i}hi">HVN ${i+1} · to</label><input id="b-z${i}hi" type="number" step="0.25"></div>`).join("");
  fillSel($("#b-b"),B_OPTS);
  const sv=store.get("ofs.tp.builder",null);
  const sj=store.get("ofs.tp.builder.json",null);
  if(sj){ $("#b-json").value=sj; importAtas(sj); }
  else if(sv && sv.manual){ B_IDS.forEach(id=>{ if(sv[id]!=null) $("#"+id).value=sv[id]; }); for(let i=0;i<ZN;i++){ $("#b-z"+i+"lo").value=sv["z"+i+"lo"]||""; $("#b-z"+i+"hi").value=sv["z"+i+"hi"]||""; } if(sv.b) $("#b-b").value=sv.b; bTouched=!!sv.touched; build(); }
  else { const t=JSON.stringify(SAMPLE_PLAN); $("#b-json").value=t; importAtas(t); }
  $("#b-b").addEventListener("change", ()=>{ bTouched=true; build(); });
  $("#b-build").addEventListener("click", build);
  $("#b-clear").addEventListener("click", ()=>{ B_IDS.forEach(id=>{ if(id!=="b-tol") $("#"+id).value=""; }); setZones([]); bTouched=false; importedComp=null; importedPer=null; store.set("ofs.tp.builder.json",null); $("#b-out").textContent="Enter numbers then press \"Build plan\"."; $("#b-svg").innerHTML=""; });
  $("#b-copy").addEventListener("click", async()=>{ if(!lastPlan) build(); try{ await navigator.clipboard.writeText(lastPlan); $("#b-msg").textContent="Plan copied."; }catch(e){ $("#b-msg").textContent="The browser blocked copying; select the plan box to copy."; } });
  ["b-rvah","b-rval","b-rpoc","b-rhi","b-rlo","b-rcl"].forEach(id=>$("#"+id).addEventListener("change", ()=>{ bTouched=false; }));
  $("#b-import").addEventListener("click", ()=>importAtas($("#b-json").value));
  $("#b-fetch").addEventListener("click", fetchLatest);
  $("#b-token").addEventListener("click", ()=>{ const t=prompt("Paste PLAN_TOKEN (stored in this browser only, leave empty to clear)"); if(t===null) return; store.set("ofs.api.token", t.trim()||null); $("#b-imsg").textContent = t.trim()?"Token saved.":"Token cleared."; });
  $("#b-view").addEventListener("change", build);
  $("#b-example2").addEventListener("click", ()=>{ const t=JSON.stringify(SAMPLE_PLAN); $("#b-json").value=t; importAtas(t); });
  $("#b-paste").addEventListener("click", async()=>{ try{ const t=await navigator.clipboard.readText(); $("#b-json").value=t; importAtas(t); }catch(e){ $("#b-imsg").textContent="The browser blocked clipboard access. Click the JSON box and paste with Ctrl+V."; } });
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
    msg("Plan image copied to the clipboard. Paste (Ctrl+V) into Discord, Notion or your journal.");
  }catch(e){
    try{ download(await p, `plan_${$("#b-date").value||"nq"}.png`); msg("The browser blocked image copy, so the PNG was downloaded instead."); }catch(e2){ msg("Could not create the plan image."); }
  }
}
async function fetchLatest(){
  const msg=t=>{ $("#b-imsg").innerHTML=t; };
  let t=store.get("ofs.api.token",null);
  if(!t){ t=(prompt("Paste PLAN_TOKEN (stored in this browser only)")||"").trim(); if(!t) return; store.set("ofs.api.token",t); }
  msg("Loading plan…");
  try{
    const r=await fetch("/api/plan",{headers:{Authorization:"Bearer "+t}});
    const j=await r.json().catch(()=>({}));
    if(r.status===401){ store.set("ofs.api.token",null); msg("Wrong or changed token. Press again and paste the new token."); return; }
    if(r.status===404){ msg("No plan on the web yet. Press send in the indicator first."); return; }
    if(!r.ok || !j.payload){ msg("Could not load the plan: "+esc(j.error||r.status)); return; }
    const txt=JSON.stringify(j.payload); $("#b-json").value=txt; importAtas(txt);
    // updated_at is a timestamp (no tz) stored in UTC: append "Z" so the browser does not read it as local time.
    const ts=String(j.updated_at||""), when=ts?new Date(/(Z|[+-]\d\d:?\d\d)$/i.test(ts)?ts:ts+"Z").toLocaleString("en-GB"):"";
    msg(`Loaded plan ${esc(j.trade_date)} · ${esc(j.symbol)} (sent at ${esc(when)}).`+(j.image_url?` <a href="${esc(j.image_url)}" target="_blank" rel="noopener">Open the saved plan image</a> (link expires in 1 hour).`:""));
  }catch(e){ msg("Network error calling /api/plan. This page must be opened on the site, not from a downloaded file."); }
}
function download(blob, name){ const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); }
function hvnOpt(){ return { n:+$("#h-n").value||16, k:+$("#h-k").value||3, merge:+$("#h-merge").value||0, minw:+$("#h-minw").value||0, mode:$("#h-mode").value }; }
function importAtas(text){
  const msg=t=>{ $("#b-imsg").textContent=t; };
  let J; try{ J=JSON.parse(String(text||"").trim()); }catch(e){ msg("Invalid JSON. Check what you pasted."); return; }
  if(!J || !J.prth || !J.ovn || J.price==null){ msg("JSON is missing prth, ovn or price."); return; }
  store.set("ofs.tp.builder.json", String(text));
  const set=(id,v)=>{ $("#"+id).value = (v==null||isNaN(v))?"":v; };
  $("#b-date").value = J.date||""; set("b-px",J.price);
  set("b-rvah",J.prth.vah); set("b-rval",J.prth.val); set("b-rpoc",J.prth.poc); set("b-rhi",J.prth.high); set("b-rlo",J.prth.low); set("b-rcl",J.prth.close);
  set("b-ovah",J.ovn.vah); set("b-oval",J.ovn.val); set("b-opoc",J.ovn.poc); set("b-onh",J.ovn.onh); set("b-onl",J.ovn.onl);
  importedComp = J.composite && J.composite.poc!=null ? {vah:J.composite.vah, val:J.composite.val, poc:J.composite.poc} : null;
  const okPer = a => Array.isArray(a) && a.length && a.every(p=>Array.isArray(p)&&p.length>=2&&!isNaN(p[0])&&!isNaN(p[1]));
  importedPer = { r: okPer(J.prth.periods_hl)?J.prth.periods_hl:null, o: okPer(J.ovn.periods_hl)?J.ovn.periods_hl:null };
  let zinfo="No session list: keeping the HVN zones already entered.";
  if(Array.isArray(J.sessions) && J.sessions.length){
    const txt=J.sessions.map(s=>`${s.date} ${s.type} ${s.val} ${s.vah}`).join("\n");
    $("#h-text").value=txt;
    const res=findZones(parseVA(txt), hvnOpt());
    if(res){ const big=res.zones.filter(z=>!z.small); const dist=z=> J.price<z.lo?z.lo-J.price: J.price>z.hi?J.price-z.hi:0;
      const pick=[...big].sort((a,b)=>dist(a)-dist(b)).slice(0,4).sort((a,b)=>a.lo-b.lo);
      setZones(pick.map(z=>[z.lo,z.hi])); zinfo=`${pick.length} HVNs nearest to price (from ${J.sessions.length} session VAs).`; }
    runHVN();
  }
  bTouched=false; build();
  const warn = Array.isArray(J.warnings)&&J.warnings.length ? " Warnings: "+J.warnings.join("; ") : "";
  msg(`Imported ${J.symbol||""} ${J.date||""} (${J.ts_et||"no time"}). ${zinfo}${warn}`);
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
 {q:"What is the target of a continuation trade?",o:["Fixed 2R","The near edge of the next HVN in the trade direction (skip if under 1.5R)","POC composite","Weekly high/low"],a:1,e:"Price crosses the LVN to the next balance area; the near edge of that area is where a reaction is likely."},
 {q:"Price at the upper HVN edge, fade bias. After 10:00 VWAP RTH slopes up hard and price rides +1σ. What now?",o:["Fade harder because price is stretched","Drop the fade; VWAP sloping out past the edge means a trend day, wait for continuation or a VWAP pullback","Short at +2σ","Ignore VWAP because the bias is set"],a:1,e:"VWAP is the in-session filter: when it slopes out toward the edge, do not fade."},
 {q:"When is an HVN edge the best place to fade?",o:["When VWAP slopes in the break direction","When VWAP is flat and the ±2σ band sits on the HVN edge","Before 10:00 while the bands are tight","On the third touch of the edge"],a:1,e:"Flat VWAP = in-session balance; ±2σ on the HVN edge adds another location layer."}
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
initHVN(); initX(); initB(); initQuiz();
})();
