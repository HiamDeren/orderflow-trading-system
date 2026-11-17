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
const SAMPLE = "__VA_LINES__";
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
