/* Render các widget khoá TPO Level Playbook (từ artifact gốc, bỏ router tab & quiz cũ). */
(function(){
"use strict";
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const fmt = n => (n==null||isNaN(n)) ? "—" : Number(n).toLocaleString("en-US",{maximumFractionDigits:2});
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v==null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const C = { text:"#e6e8eb", muted:"#9aa0a8", line:"#2c2f35", va:"#c2185b", vaFill:"#6d1838", vaTxt:"#ffd6e4",
  poc:"#f5a623", pocFill:"#8a5a0c", pocTxt:"#ffe7b8", gray:"#3a3e45", grayTxt:"#d5d8dc", ib:"#c9a96e",
  lvl:"#8f80ff", vwap:"#26c6da", good:"#3fbf7f", bad:"#ef5350", warn:"#e3a33a", panel:"#16171a" };
const MONO = "JetBrains Mono, ui-monospace, monospace";


/* ---------- TPO profile renderer ---------- */
function computeProfile(periods){
  let lo = Infinity, hi = -Infinity;
  periods.forEach(([a,b]) => { lo = Math.min(lo,a); hi = Math.max(hi,b); });
  const rows = {};
  for(let p=lo; p<=hi; p++){ rows[p] = []; periods.forEach(([a,b],i) => { if(p>=a && p<=b) rows[p].push(i); }); }
  const mid = (hi+lo)/2;
  let poc = lo;
  for(let p=lo; p<=hi; p++){
    const c = rows[p].length, cb = rows[poc].length;
    if(c > cb || (c === cb && Math.abs(p-mid) < Math.abs(poc-mid))) poc = p;
  }
  const total = Object.values(rows).reduce((s,r)=>s+r.length,0);
  const target = Math.ceil(total*0.7);
  let acc = rows[poc].length, vah = poc, val = poc, up = poc+1, dn = poc-1;
  while(acc < target && (up<=hi || dn>=lo)){
    const cu = up<=hi ? rows[up].length : -1, cd = dn>=lo ? rows[dn].length : -1;
    if(cu >= cd){ acc += cu; vah = up; up++; } else { acc += cd; val = dn; dn--; }
  }
  const ibLo = Math.min(periods[0][0], periods[1][0]), ibHi = Math.max(periods[0][1], periods[1][1]);
  return { lo, hi, rows, poc, vah, val, ibLo, ibHi };
}
function tpoSVG(periods, o={}){
  const L = "ABCDEFGHIJKLM";
  const P = computeProfile(periods);
  const cw = 13, ch = o.ch || 10, left = 42, top = 10;
  const maxC = Math.max(...Object.values(P.rows).map(r=>r.length));
  const profW = maxC*cw;
  const lblX = left + profW + 14;
  const noteX = lblX + 58;
  const W = (o.notes && o.notes.length) ? noteX + 150 : lblX + 70;
  const nRows = P.hi - P.lo + 1;
  const H = top*2 + nRows*ch + 4;
  const Y = p => top + (P.hi - p)*ch;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${o.label||"TPO profile"}" font-family="${MONO}">`;
  for(let p=P.hi; p>=P.lo; p--){
    const y = Y(p);
    P.rows[p].forEach((idx, j) => {
      const isPoc = p===P.poc, inVa = p<=P.vah && p>=P.val;
      const f = isPoc ? C.pocFill : inVa ? C.vaFill : C.gray;
      const t = isPoc ? C.pocTxt : inVa ? C.vaTxt : C.grayTxt;
      const x = left + j*cw;
      s += `<rect x="${x}" y="${y}" width="${cw-1.5}" height="${ch-1.5}" rx="1.5" fill="${f}"/>`;
      if(ch >= 9) s += `<text x="${x+(cw-1.5)/2}" y="${y+ch-2.6}" font-size="${Math.min(8.5,ch-1.5)}" text-anchor="middle" fill="${t}">${L[idx]}</text>`;
    });
  }
  // IB bar
  s += `<rect x="${left-9}" y="${Y(P.ibHi)}" width="3.5" height="${(P.ibHi-P.ibLo+1)*ch-1.5}" fill="${C.ib}" rx="1"/>`;
  s += `<text x="${left-12}" y="${Y(P.ibHi)+8}" font-size="8.5" fill="${C.ib}" text-anchor="end">IB</text>`;
  // open / close
  if(o.open!=null){ const y = Y(o.open)+ch/2-0.7; s += `<path d="M${left-24},${y-4} L${left-17},${y} L${left-24},${y+4} Z" fill="#ff6b9a"/><text x="${left-26}" y="${y+3}" font-size="8" fill="#ffb3cb" text-anchor="end">O</text>`; }
  if(o.close!=null){ const y = Y(o.close)+ch/2-0.7, x = left+profW+3; s += `<path d="M${x+7},${y-4} L${x},${y} L${x+7},${y+4} Z" fill="#ff6b9a"/>`; }
  // VA lines + labels
  const lab = (p, txt, col) => { const y = Y(p)+ch/2; return `<line x1="${left+profW+12}" x2="${lblX+2}" y1="${y}" y2="${y}" stroke="${col}" stroke-dasharray="2 2"/><text x="${lblX+5}" y="${y+3}" font-size="9" fill="${col}">${txt}</text>`; };
  s += `<line x1="${left}" x2="${left+profW+10}" y1="${Y(P.vah)-0.5}" y2="${Y(P.vah)-0.5}" stroke="#d9d9d9" stroke-dasharray="3 3" opacity=".6"/>`;
  s += `<line x1="${left}" x2="${left+profW+10}" y1="${Y(P.val)+ch-1}" y2="${Y(P.val)+ch-1}" stroke="#d9d9d9" stroke-dasharray="3 3" opacity=".6"/>`;
  s += lab(P.vah, "VAH", "#ff9cbf") + lab(P.poc, "POC", C.poc) + lab(P.val, "VAL", "#ff9cbf");
  (o.notes||[]).forEach(n => {
    const y1 = Y(n.p1), y2 = Y(n.p2)+ch-1.5, ym = (y1+y2)/2;
    s += `<path d="M${noteX-6},${y1} h4 V${y2} h-4" fill="none" stroke="${n.c||C.muted}"/>`;
    s += `<text x="${noteX+2}" y="${ym+3}" font-size="9.5" fill="${n.c||C.text}">${n.t}</text>`;
  });
  s += `</svg>`;
  return { svg:s, P };
}

/* ---------- Mini chart ---------- */
function mini(o){
  const W = o.w || 460, padL = 8, padR = o.padR==null ? 96 : o.padR, gap = 12;
  const X = x => padL + x/100*(W-padL-padR);
  let y0 = 6, s = "";
  o.panels.forEach(pn => {
    const H = pn.h || 170;
    const Y = v => y0 + 6 + (1 - v/100)*(H-12);
    s += `<rect x="${padL}" y="${y0}" width="${W-padL-padR}" height="${H}" fill="${C.panel}" stroke="#2a2d33" rx="4"/>`;
    if(pn.title) s += `<text x="${padL+8}" y="${y0+14}" font-size="10" fill="${C.muted}">${pn.title}</text>`;
    (pn.bands||[]).forEach(b => {
      const x1 = X(b.x1==null?0:b.x1), x2 = X(b.x2==null?100:b.x2);
      s += `<rect x="${x1}" y="${Y(b.y2)}" width="${x2-x1}" height="${Y(b.y1)-Y(b.y2)}" fill="${b.fill}" opacity="${b.op==null?.35:b.op}" ${b.dash?`stroke="${b.stroke||b.fill}" stroke-dasharray="4 3"`:""}/>`;
      if(b.label) s += `<text x="${b.lx==null?W-padR+6:X(b.lx)}" y="${(Y(b.y1)+Y(b.y2))/2+3}" font-size="9.5" fill="${b.tc||C.text}">${b.label}</text>`;
    });
    (pn.hlines||[]).forEach(l => {
      s += `<line x1="${X(l.x1||0)}" x2="${X(l.x2==null?100:l.x2)}" y1="${Y(l.y)}" y2="${Y(l.y)}" stroke="${l.c}" stroke-width="${l.w||1.2}" ${l.dash?`stroke-dasharray="${l.dash}"`:""}/>`;
      if(l.label) s += `<text x="${W-padR+6}" y="${Y(l.y)+3}" font-size="9.5" fill="${l.tc||l.c}">${l.label}</text>`;
    });
    (pn.paths||[]).forEach(p => {
      const d = p.pts.map(([x,y],i)=>`${i?"L":"M"}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(" ");
      s += `<path d="${d}" fill="none" stroke="${p.c}" stroke-width="${p.w||2}" ${p.dash?`stroke-dasharray="${p.dash}"`:""} stroke-linejoin="round" stroke-linecap="round" opacity="${p.op||1}"/>`;
      if(p.label){ const [lx,ly] = p.pts[p.pts.length-1]; s += `<text x="${W-padR+6}" y="${Y(ly)+3}" font-size="9.5" fill="${p.tc||p.c}">${p.label}</text>`; }
    });
    (pn.dots||[]).forEach(d => {
      s += `<circle cx="${X(d.x)}" cy="${Y(d.y)}" r="${d.r||3.5}" fill="${d.c}"/>`;
      if(d.t) s += `<text x="${X(d.x)+(d.dx||6)}" y="${Y(d.y)+(d.dy==null?-6:d.dy)}" font-size="9.5" fill="${d.tc||C.text}" ${d.anchor?`text-anchor="${d.anchor}"`:""}>${d.t}</text>`;
    });
    y0 += H + gap;
  });
  const Ht = y0 - gap + 6;
  return `<svg viewBox="0 0 ${W} ${Ht}" width="${W}" height="${Ht}" xmlns="http://www.w3.org/2000/svg" font-family="${MONO}" role="img" aria-label="${o.label||"Biểu đồ minh hoạ"}">${s}</svg>`;
}

/* ---------- 00 Roadmap ---------- */
function checklist(container, items, keyPrefix, onChange){
  container.innerHTML = items.map((t,i) => {
    const id = `${keyPrefix}-${i}`;
    return `<div class="check"><input type="checkbox" id="${id}" ${store.get(id,false)?"checked":""}><label for="${id}">${t}</label></div>`;
  }).join("");
  $$("input", container).forEach(cb => cb.addEventListener("change", () => { store.set(cb.id, cb.checked); onChange && onChange(); }));
}
function renderRoadmap(){
  const box = $("#roadmap");
  box.innerHTML = PB.roadmap.map(ph => `
    <div class="panel phase">
      <div class="when">${ph.when}</div>
      <div class="stack"><div class="qhead"><h3 style="margin:0">${ph.title}</h3><span class="score" id="sc-${ph.id}"></span></div><div id="cl-${ph.id}"></div></div>
    </div>`).join("");
  const update = () => {
    let done = 0, all = 0;
    PB.roadmap.forEach(ph => {
      const n = ph.items.length; let d = 0;
      ph.items.forEach((_,i) => { if(store.get(`rm-${ph.id}-${i}`,false)) d++; });
      $("#sc-"+ph.id).textContent = `${d}/${n}`; done += d; all += n;
    });
    $("#rm-score").textContent = `${done}/${all}`;
    $("#rm-bar").style.width = (all? done/all*100 : 0) + "%";
  };
  PB.roadmap.forEach(ph => checklist($("#cl-"+ph.id), ph.items, `rm-${ph.id}`, update));
  update();
}

/* ---------- 01 Nền tảng ---------- */
function renderAnatomy(){
  const periods = [[22,34],[24,30],[10,21],[8,16],[8,14],[9,15],[8,13],[10,16],[11,17],[12,17],[10,16],[9,15],[11,14]];
  const r = tpoSVG(periods, { open:26, close:13, ch:10.5, label:"Profile mẫu có selling tail, single prints và poor low",
    notes:[ {p1:34,p2:31,t:"Selling tail (A)",c:"#ff9cbf"}, {p1:21,p2:18,t:"Single prints (C)",c:"#e3e6ea"}, {p1:8,p2:8,t:"Poor low (D,E,G)",c:C.warn} ] });
  $("#anatomy").innerHTML = r.svg;

  // RF table
  const L = "ABCDEFGHIJKLM"; let cum = 0, rows = "";
  periods.forEach(([lo,hi],i) => {
    if(i===0){ rows += `<tr><td>A</td><td class="num mono">${hi}</td><td class="num mono">${lo}</td><td class="num mono">—</td><td class="num mono">—</td><td class="num mono">0</td></tr>`; return; }
    const [plo,phi] = periods[i-1];
    const sh = Math.sign(hi-phi), sl = Math.sign(lo-plo); cum += sh + sl;
    const f = v => v>0?`<span style="color:${C.good}">+1</span>`:v<0?`<span style="color:${C.bad}">−1</span>`:"0";
    rows += `<tr><td>${L[i]}</td><td class="num mono">${hi}</td><td class="num mono">${lo}</td><td class="num mono">${f(sh)}</td><td class="num mono">${f(sl)}</td><td class="num mono">${cum>0?"+":""}${cum}</td></tr>`;
  });
  $("#rf-table").innerHTML = rows + `<tr><td colspan="5"><b>RF của profile mẫu</b> (giá tính theo dòng)</td><td class="num mono"><b>${cum>0?"+":""}${cum}</b></td></tr>`;

  $("#glossary").innerHTML = PB.glossary.map(g => `
    <details class="term"><summary><span>${g.n}</span>${g.c?`<span class="chip ${g.c}">${g.c.toUpperCase()}</span>`:""}</summary>
      <div class="body"><dl class="dl"><dt>Định nghĩa</dt><dd>${g.def}</dd><dt>Cách đọc</dt><dd>${g.read}</dd><dt>Cách dùng</dt><dd>${g.use}</dd></dl></div>
    </details>`).join("");
}

/* ---------- 02 Cấu trúc ---------- */
function getDayPeriods(key){
  const d = PB.dayTypes[key];
  if(d.periods) return d.periods;
  const src = PB.dayTypes[d.flipOf].periods, M = 29;
  return src.map(([a,b]) => [M-b, M-a]);
}
function renderDayTypes(){
  const btns = $("#dt-buttons");
  btns.innerHTML = PB.dayOrder.map(k => `<button data-k="${k}">${PB.dayTypes[k].name}</button>`).join("");
  const show = k => {
    const d = PB.dayTypes[k];
    $$("button", btns).forEach(b => b.classList.toggle("on", b.dataset.k===k));
    const r = tpoSVG(getDayPeriods(k), { open:d.open, close:d.close, ch:9.5, label:"Profile "+d.name });
    $("#dt-svg").innerHTML = r.svg;
    $("#dt-info").innerHTML = `<h3 style="margin:0">${d.name}</h3>
      <div class="card"><span class="k">Nhận diện</span><p>${d.sig}</p></div>
      <div class="card"><span class="k">Ý nghĩa</span><p>${d.mean}</p></div>
      <div class="card"><span class="k">Hành động</span><p>${d.act}</p></div>`;
    store.set("dt-last", k);
  };
  btns.addEventListener("click", e => { const b = e.target.closest("button"); if(b) show(b.dataset.k); });
  show(store.get("dt-last","nvar"));
}
function renderOpenTypes(){
  $("#opentypes").innerHTML = PB.openTypes.map(t => {
    const hl = [{y:50,c:"#bfc4ca",dash:"4 3",label:"Open 9:30"}];
    if(t.level) hl.push({y:t.level,c:C.lvl,dash:"2 2",label:"Level test"});
    const svg = mini({ w:420, padR:84, panels:[{ h:150, hlines:hl, paths:[{pts:t.pts,c:C.vaTxt,w:2.2}], dots:[{x:0,y:50,c:"#ff6b9a"}] }], label:t.name });
    return `<div class="card"><h4>${t.name} <span class="chip ${t.chip}">Tự tin: ${t.conf}</span></h4><div class="svgwrap">${svg}</div><p class="small">${t.def}</p><p class="small"><b>Hành động:</b> ${t.act}</p></div>`;
  }).join("");
}
function renderOpenLoc(){
  // vertical diagram: prior range + VA, 5 clickable zones
  const W = 360, H = 330, x0 = 120, bw = 60;
  const zones = [ ["or-up",20,70], ["va-up",70,120], ["in-va",120,210], ["va-dn",210,260], ["or-dn",260,310] ];
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" font-family="${MONO}" role="img" aria-label="Năm vùng open location">`;
  s += `<rect x="${x0+bw/2-2}" y="70" width="4" height="190" fill="#8c9096"/>`;
  s += `<rect x="${x0}" y="120" width="${bw}" height="90" fill="${C.vaFill}" stroke="${C.va}"/>`;
  s += `<line x1="${x0-8}" x2="${x0+bw+8}" y1="160" y2="160" stroke="${C.poc}" stroke-width="2"/>`;
  [["PD High",70],["VAH",120],["POC",160],["VAL",210],["PD Low",260]].forEach(([t,y]) => s += `<text x="${x0-14}" y="${y+3}" font-size="10" fill="${t==="POC"?C.poc:"#d5d8dc"}" text-anchor="end">${t}</text>`);
  zones.forEach(([id,y1,y2]) => {
    const z = PB.openLoc.find(z=>z.id===id);
    s += `<g class="ozone" data-id="${id}" tabindex="0" role="button" aria-label="${z.label}" style="cursor:pointer">
      <rect x="${x0+bw+16}" y="${y1+3}" width="150" height="${y2-y1-6}" rx="5" fill="#25282d" stroke="#3a3f47"/>
      <text x="${x0+bw+26}" y="${(y1+y2)/2+4}" font-size="10" fill="#e6e8eb">${z.label}</text></g>`;
  });
  s += `</svg>`;
  $("#openloc-svg").innerHTML = s;
  const show = id => {
    const z = PB.openLoc.find(z=>z.id===id);
    $$(".ozone rect").forEach(r => { const on = r.parentNode.dataset.id===id; r.setAttribute("fill", on?"#4a1028":"#25282d"); r.setAttribute("stroke", on?"#c2185b":"#3a3f47"); });
    $("#openloc-info").innerHTML = `<h3 style="margin:0">${z.label} <span class="chip ${z.chip}">${z.conf}</span></h3>
      <div class="card"><span class="k">Ý nghĩa</span><p>${z.txt}</p></div>
      <div class="card"><span class="k">Theo dõi gì</span><p>${z.watch}</p></div>
      <div class="card"><span class="k">Nối với model của bạn</span><p>${z.model}</p></div>`;
  };
  $$(".ozone").forEach(g => { g.addEventListener("click", () => show(g.dataset.id)); g.addEventListener("keydown", e => { if(e.key==="Enter"||e.key===" "){ e.preventDefault(); show(g.dataset.id);} }); });
  show("in-va");
}
function renderValRel(){
  $("#valrel").innerHTML = PB.valRel.map(v => {
    const svg = mini({ w:240, padR:8, panels:[{ h:120, bands:[
      {x1:8,x2:44,y1:v.p[0],y2:v.p[1],fill:"#5b6068",op:.55},
      {x1:56,x2:92,y1:v.t[0],y2:v.t[1],fill:C.va,op:.55} ],
      dots:[{x:26,y:4,c:"transparent",t:"Hôm qua",dx:0,dy:0,anchor:"middle",tc:C.muted},{x:74,y:4,c:"transparent",t:"Hôm nay",dx:0,dy:0,anchor:"middle",tc:"#ff9cbf"}] }], label:v.n });
    return `<div class="card"><h4>${v.n}</h4><div class="svgwrap">${svg}</div><p class="small">${v.m}</p><p class="small"><b>→</b> ${v.b}</p></div>`;
  }).join("");
}

/* ---------- 03 Levels ---------- */
function renderTiers(){
  const tb = $("#tier-table tbody");
  const chipFor = t => t==="1"?"lvl":t==="2"?"va":t==="3"?"ib":"vw";
  const draw = () => {
    const on = $("#tog-scalp").checked;
    tb.innerHTML = PB.tiers.filter(r => on || !r[5]).map(r => `<tr><td><span class="chip ${chipFor(r[0])}">Tier ${r[0]}</span></td><td><b>${r[1]}</b></td><td class="small">${r[2]}</td><td class="small">${r[3]}</td><td class="small">${r[4]}</td></tr>`).join("");
    store.set("tog-scalp", on);
  };
  $("#tog-scalp").checked = store.get("tog-scalp", false);
  $("#tog-scalp").addEventListener("change", draw);
  draw();

  $("#rule80").innerHTML = mini({ w:460, panels:[{ h:210,
    bands:[{y1:28,y2:72,fill:C.va,op:.22,label:"VA hôm qua",tc:"#ff9cbf"},{x1:22,x2:46,y1:4,y2:96,fill:"#26c6da",op:.08,label:""}],
    hlines:[{y:72,c:"#ff9cbf",dash:"3 3",label:"VAH"},{y:50,c:C.poc,label:"POC"},{y:28,c:"#ff9cbf",dash:"3 3",label:"VAL"}],
    paths:[{pts:[[0,84],[8,80],[14,76],[20,68],[26,64],[32,67],[38,62],[44,65],[52,58],[60,50],[70,42],[80,36],[90,30],[100,28]],c:"#e6e8eb",w:2.2}],
    dots:[{x:0,y:84,c:"#ff6b9a",t:"Open ngoài VA",dy:-8},{x:34,y:90,c:"transparent",t:"2 period trong VA",dx:0,anchor:"middle",tc:C.vwap},{x:100,y:28,c:C.good,t:"Chạm VAL",dx:-6,dy:14,anchor:"end",tc:"#bdf0d4"}] }], label:"Minh hoạ 80% rule" });
}

/* ---------- 03 Initial Balance ---------- */
function renderIB(){
  // anatomy: x 0..100 = 9:30–11:30, IB = x 0..50; IBL 30, IBH 60 → width 30
  $("#ib-anatomy").innerHTML = mini({ w:480, panels:[{ h:250,
    bands:[{x1:0,x2:25,y1:2,y2:98,fill:C.ib,op:.10},{x1:25,x2:50,y1:2,y2:98,fill:C.ib,op:.17}],
    hlines:[{y:90,c:"#b388ff",dash:"2 3",label:"2x"},{y:75,c:"#b388ff",dash:"4 3",label:"1.5x"},
      {y:60,c:C.ib,w:1.8,label:"IBH"},{y:45,c:C.poc,dash:"4 3",label:"IB mid"},{y:30,c:C.ib,w:1.8,label:"IBL"},
      {y:15,c:"#b388ff",dash:"4 3",label:"1.5x ↓"}],
    paths:[{pts:[[0,46],[6,55],[12,58],[18,40],[25,50],[30,60],[36,44],[42,30],[50,48],[56,58],[62,66],[68,72],[74,62],[80,68],[88,76],[94,80],[100,78]],c:"#e6e8eb",w:2.2}],
    dots:[{x:12.5,y:96,c:"transparent",t:"A",dx:0,anchor:"middle",tc:"#f1e3c4"},{x:37.5,y:96,c:"transparent",t:"B",dx:0,anchor:"middle",tc:"#f1e3c4"},
      {x:62.5,y:96,c:"transparent",t:"C",dx:0,anchor:"middle",tc:C.muted},{x:87.5,y:96,c:"transparent",t:"D",dx:0,anchor:"middle",tc:C.muted},
      {x:62,y:66,c:C.good,t:"RE lên",dx:-4,dy:-8,anchor:"end",tc:"#bdf0d4"},{x:74,y:62,c:C.good,t:"Retest IBH",dy:14,tc:"#bdf0d4"}] }], label:"Giải phẫu Initial Balance" });

  // calculator
  const calc = () => {
    const H = parseFloat($("#ib-h").value), Lw = parseFloat($("#ib-l").value), A = parseFloat($("#ib-avg").value), px = parseFloat($("#ib-px").value);
    if(isNaN(H)||isNaN(Lw)||H<=Lw){ $("#ib-out").textContent = "Nhập IB High lớn hơn IB Low."; return; }
    const w = H-Lw, r = A>0 ? w/A : NaN, mid = (H+Lw)/2;
    const cls = isNaN(r) ? "chưa có trung bình" : r<0.7 ? "HẸP → ưu tiên breakout go-with (IB-1), cần acceptance" : r>1.3 ? "RỘNG → ưu tiên fade cạnh / failed break (IB-2)" : "BÌNH THƯỜNG → chờ RE một phía + VWAP dốc, hoặc rotation (IB-3)";
    let pos = "—";
    if(!isNaN(px)){
      if(px > H){ const m = (px-Lw)/w; pos = `TRÊN IB · range hiện tại ≈ ${m.toFixed(2)}x · ${m>=2?"đã qua 2x":m>=1.5?"đã qua 1.5x, kế tiếp 2x "+fmt(H+w):"kế tiếp 1.5x "+fmt(H+0.5*w)}`; }
      else if(px < Lw){ const m = (H-px)/w; pos = `DƯỚI IB · range hiện tại ≈ ${m.toFixed(2)}x · ${m>=2?"đã qua 2x":m>=1.5?"đã qua 1.5x, kế tiếp 2x "+fmt(Lw-w):"kế tiếp 1.5x "+fmt(Lw-0.5*w)}`; }
      else { const q = (px-Lw)/w*100; pos = `TRONG IB · ${q.toFixed(0)}% từ IBL · ${px>=mid?"trên":"dưới"} IB mid (${(px-mid>0?"+":"")+fmt(px-mid)})`; }
    }
    $("#ib-out").textContent =
`IB width   : ${fmt(w)} điểm (${isNaN(r)?"—":(r*100).toFixed(0)+"%"} so với TB)
Đánh giá   : ${cls}
IB mid     : ${fmt(mid)}
Giá        : ${pos}

           1.5x        2x          3x
Lên    ${fmt(H+0.5*w).padStart(10)}  ${fmt(H+w).padStart(10)}  ${fmt(H+2*w).padStart(10)}
Xuống  ${fmt(Lw-0.5*w).padStart(10)}  ${fmt(Lw-w).padStart(10)}  ${fmt(Lw-2*w).padStart(10)}

Quy ước: N× = tổng range bằng N lần IB width, đo từ cạnh IB đối diện.`;
    store.set("ib-in2", ["#ib-h","#ib-l","#ib-avg","#ib-px"].map(s=>$(s).value));
  };
  const saved = store.get("ib-in2", null);
  if(saved && saved.length===4){ ["#ib-h","#ib-l","#ib-avg","#ib-px"].forEach((s,i)=>{ if(saved[i]!=null) $(s).value = saved[i]; }); }
  ["#ib-h","#ib-l","#ib-avg","#ib-px"].forEach(s => $(s).addEventListener("input", calc));
  calc();

  // scenarios
  $("#ib-scen").innerHTML = PB.ibScen.map(sc => {
    const dots = sc.dot ? [{x:sc.dot[0],y:sc.dot[1],c:sc.chip==="bad"?C.bad:C.good,t:sc.dot[2],dy:-8,tc:"#e6e8eb"}] : [];
    const svg = mini({ w:420, padR:58, panels:[{ h:150,
      bands:[{x1:0,x2:35,y1:35,y2:60,fill:C.ib,op:.16}],
      hlines:[{y:60,c:C.ib,w:1.6,label:"IBH"},{y:47.5,c:C.poc,dash:"4 3",label:"mid"},{y:35,c:C.ib,w:1.6,label:"IBL"}],
      paths:[{pts:sc.pts,c:"#e6e8eb",w:2}], dots }], label:sc.n });
    return `<div class="card"><h4>${sc.n} <span class="chip ${sc.chip}">${sc.dt}</span></h4><div class="svgwrap">${svg}</div>
      <p class="small"><b>Nhận diện:</b> ${sc.sig}</p><p class="small"><b>Hành động:</b> ${sc.act}</p></div>`;
  }).join("");

  // setups
  $("#ib-setups").innerHTML = PB.ibSetups.map(su => `<div class="card">
    <h4><span class="chip ${su.chip}">${su.id}</span> ${su.n} <span class="chip">${su.pb}</span></h4>
    <dl class="dl"><dt>Điều kiện</dt><dd class="small">${su.cond}</dd><dt>Entry</dt><dd class="small">${su.entry}</dd><dt>Stop</dt><dd class="small">${su.stop}</dd><dt>Target</dt><dd class="small">${su.tgt}</dd><dt>Invalidation</dt><dd class="small">${su.inv}</dd></dl></div>`).join("");

  checklist($("#ib-check"), PB.ibCheck, "ibc");
  $("#ib-check-reset").addEventListener("click", () => { PB.ibCheck.forEach((_,i)=>store.set(`ibc-${i}`,false)); checklist($("#ib-check"), PB.ibCheck, "ibc"); });

  initIBJournal();
}

function initIBJournal(){
  let rows = store.get("ibj-rows", null);
  let sample = false;
  if(!rows || !rows.length){ rows = PB.ibSample.map(r=>({...r})); sample = true; }
  const save = () => { if(!sample) store.set("ibj-rows", rows); };
  const msg = t => { $("#ibj-msg").textContent = t; setTimeout(()=>{ $("#ibj-msg").textContent = ""; }, 3000); };
  const median = a => { if(!a.length) return NaN; const b = a.slice().sort((x,y)=>x-y), m = Math.floor(b.length/2); return b.length%2 ? b[m] : (b[m-1]+b[m])/2; };
  const pct = (n,d) => d ? Math.round(n/d*100)+"%" : "—";

  const draw = () => {
    $("#ibj-banner").innerHTML = sample ? `<div class="callout red"><p class="small"><b>Đang hiển thị dữ liệu mẫu minh hoạ, không phải dữ liệu thật.</b> Thêm phiên đầu tiên của bạn hoặc bấm nút để xoá mẫu.</p><div class="row"><button id="ibj-clear-sample">Xoá mẫu, bắt đầu log thật</button></div></div>` : "";
    if(sample) $("#ibj-clear-sample").addEventListener("click", () => { rows = []; sample = false; save(); draw(); });
    const ws = rows.map(r => r.h - r.l);
    const avg = ws.length ? ws.reduce((a,b)=>a+b,0)/ws.length : NaN;
    const calc = r => { const w = r.h-r.l; return { w, up: r.dh > r.h, dn: r.dl < r.l, eu: (r.dh - r.l)/w, ed: (r.h - r.dl)/w, rel: avg ? w/avg : NaN }; };
    const cs = rows.map(calc);
    const n = rows.length;
    const anyB = cs.filter(c=>c.up||c.dn).length, both = cs.filter(c=>c.up&&c.dn).length;
    const r15 = cs.filter(c=>c.eu>=1.5||c.ed>=1.5).length, r2 = cs.filter(c=>c.eu>=2||c.ed>=2).length;
    const nar = cs.filter(c=>c.rel<0.7), wid = cs.filter(c=>c.rel>1.3);
    const tile = (k,v,sub) => `<div class="card"><span class="k">${k}</span><span class="num" style="font-size:1.35rem;font-weight:700">${v}</span><span class="small muted">${sub}</span></div>`;
    $("#ibj-stats").innerHTML =
      tile("Số phiên", n, sample?"mẫu":"đã log") +
      tile("IB width TB / trung vị", `${fmt(Math.round(avg))} / ${fmt(Math.round(median(ws)))}`, "điểm") +
      tile("Phá ít nhất 1 phía", pct(anyB,n), `cả hai phía: ${pct(both,n)}`) +
      tile("Đạt 1.5x / 2x", `${pct(r15,n)} / ${pct(r2,n)}`, "một phía bất kỳ") +
      tile("IB hẹp (<70% TB)", `${nar.length} phiên`, `đạt 1.5x: ${pct(nar.filter(c=>c.eu>=1.5||c.ed>=1.5).length, nar.length)}`) +
      tile("IB rộng (>130% TB)", `${wid.length} phiên`, `phá ít nhất 1 phía: ${pct(wid.filter(c=>c.up||c.dn).length, wid.length)}`);
    $("#ibj-rows").innerHTML = rows.map((r,i) => { const c = cs[i];
      const br = c.up&&c.dn ? '<span class="chip warn">2 phía</span>' : c.up ? '<span class="chip good">lên</span>' : c.dn ? '<span class="chip bad">xuống</span>' : '<span class="chip">không</span>';
      return `<tr><td class="mono">${r.d}</td><td class="num mono">${fmt(r.h)}</td><td class="num mono">${fmt(r.l)}</td><td class="num mono">${fmt(c.w)}</td><td class="num mono">${isNaN(c.rel)?"—":Math.round(c.rel*100)+"%"}</td><td>${br}</td><td class="num mono">${c.up?c.eu.toFixed(2)+"x":"—"}</td><td class="num mono">${c.dn?c.ed.toFixed(2)+"x":"—"}</td><td class="small">${r.n||""}</td><td><button data-del="${i}" aria-label="Xoá phiên ${r.d}">Xoá</button></td></tr>`; }).join("") || `<tr><td colspan="10" class="muted small">Chưa có phiên nào. Nhập 4 số sau khi RTH đóng cửa.</td></tr>`;
  };
  $("#ibj-rows").addEventListener("click", e => { const b = e.target.closest("button[data-del]"); if(!b) return; if(sample){ sample=false; } rows.splice(+b.dataset.del,1); save(); draw(); });
  $("#ibj-add").addEventListener("click", () => {
    const g = id => parseFloat($(id).value);
    const r = { d: $("#ibj-date").value.trim() || new Date().toLocaleDateString("vi-VN"), h:g("#ibj-h"), l:g("#ibj-l"), dh:g("#ibj-dh"), dl:g("#ibj-dl"), n:$("#ibj-note").value.trim() };
    if([r.h,r.l,r.dh,r.dl].some(isNaN)){ msg("Cần đủ IB High, IB Low, RTH High, RTH Low."); return; }
    if(!(r.h>r.l && r.dh>=r.h && r.dl<=r.l)){ msg("Kiểm tra lại: RTH High ≥ IB High > IB Low ≥ RTH Low."); return; }
    if(sample){ rows = []; sample = false; }
    rows.push(r); save(); draw();
    ["#ibj-date","#ibj-h","#ibj-l","#ibj-dh","#ibj-dl","#ibj-note"].forEach(s=>$(s).value="");
    msg("Đã thêm phiên.");
  });
  $("#ibj-csv").addEventListener("click", async () => {
    const csv = "date,ibh,ibl,rth_high,rth_low,note\n" + rows.map(r => [r.d,r.h,r.l,r.dh,r.dl,(r.n||"").replace(/,/g,";")].join(",")).join("\n");
    try{ await navigator.clipboard.writeText(csv); msg("Đã copy CSV."); }catch(e){ msg("Trình duyệt chặn copy."); }
  });
  $("#ibj-import-toggle").addEventListener("click", () => { $("#ibj-import").hidden = !$("#ibj-import").hidden; });
  $("#ibj-import-go").addEventListener("click", () => {
    const lines = $("#ibj-import-text").value.split("\n").map(l=>l.trim()).filter(l=>l && !/^date/i.test(l));
    const add = [];
    lines.forEach(l => { const p = l.split(","); const r = { d:p[0], h:+p[1], l:+p[2], dh:+p[3], dl:+p[4], n:p[5]||"" };
      if(![r.h,r.l,r.dh,r.dl].some(isNaN) && r.h>r.l) add.push(r); });
    if(!add.length){ msg("Không đọc được dòng nào. Định dạng: date,ibh,ibl,rth_high,rth_low,note"); return; }
    if(sample){ rows = []; sample = false; }
    rows = rows.concat(add); save(); draw(); $("#ibj-import-text").value = ""; msg(`Đã nhập ${add.length} phiên.`);
  });
  draw();
}

/* ---------- 04 VWAP ---------- */
function renderVWAP(){
  const xs = [...Array(21)].map((_,i)=>i*5);
  const vw = xs.map(x => [x, 50 + Math.sin(x/14)*1.5]);
  const off = k => vw.map(([x,y]) => [x, y + k*Math.min(10, 4 + x/9)]);
  $("#vw-bal").innerHTML = mini({ w:460, panels:[{ h:220,
    hlines:[{y:28,c:C.lvl,dash:"2 3",label:"PD VAL",tc:"#cfc7ff"},{y:72,c:C.lvl,dash:"2 3",label:"PD VAH",tc:"#cfc7ff"}],
    paths:[
      {pts:off(2),c:"#b388ff",w:1.2,dash:"4 3",label:"+2 SD"},{pts:off(1),c:C.vwap,w:1,dash:"3 3",op:.7,label:"+1 SD"},
      {pts:vw,c:C.vwap,w:2.4,label:"VWAP"},
      {pts:off(-1),c:C.vwap,w:1,dash:"3 3",op:.7,label:"−1 SD"},{pts:off(-2),c:"#b388ff",w:1.2,dash:"4 3",label:"−2 SD"},
      {pts:[[0,50],[6,56],[12,47],[18,42],[24,36],[30,31],[35,38],[40,46],[46,52],[52,57],[58,63],[64,69],[69,64],[75,56],[82,50],[88,54],[94,48],[100,51]],c:"#e6e8eb",w:2}],
    dots:[{x:30,y:31,c:C.good,t:"Zone A long",dy:16,dx:-4,tc:"#bdf0d4"},{x:64,y:69,c:C.bad,t:"Zone A short",dy:-8,tc:"#ffc4c3"}] }], label:"VWAP balance day" });

  const vt = xs.map(x => [x, 18 + x*0.5]);
  const offT = k => vt.map(([x,y]) => [x, y + k*Math.min(8, 3 + x/12)]);
  const price = [[0,20],[6,27],[12,30],[18,28],[24,35],[30,40],[36,38],[42,45],[48,50],[54,48],[60,56],[66,61],[72,59],[78,66],[84,72],[90,70],[96,78],[100,82]];
  $("#vw-trend").innerHTML = mini({ w:460, panels:[{ h:220,
    paths:[{pts:offT(2),c:"#b388ff",w:1.2,dash:"4 3",label:"+2 SD"},{pts:offT(1),c:C.vwap,w:1,dash:"3 3",op:.7,label:"+1 SD"},{pts:vt,c:C.vwap,w:2.4,label:"VWAP"},{pts:price,c:"#e6e8eb",w:2}],
    dots:[{x:18,y:28,c:C.good},{x:36,y:38,c:C.good},{x:54,y:48,c:C.good,t:"Buy pullback",dy:16,tc:"#bdf0d4"},{x:72,y:59,c:C.good},{x:48,y:50,c:C.bad,t:"Fade +2 SD = bị cuốn",dy:-10,dx:-40,tc:"#ffc4c3"}] }], label:"VWAP trend day" });
}

/* ---------- 05 CVD ---------- */
function renderCVD(){
  $("#cvd-matrix").innerHTML = PB.cvd.map(d => {
    const bear = d.n.includes("bearish");
    const col = bear ? C.bad : C.good;
    const svg = mini({ w:440, panels:[
      { h:140, title:"Giá", hlines:[{y:d.lvl,c:C.lvl,dash:"3 3",label:d.where.split(" / ")[0].replace("Tại ",""),tc:"#cfc7ff"}], paths:[{pts:d.price,c:"#e6e8eb",w:2},{pts:d.ph,c:col,w:1.6,dash:"4 3"}], dots:d.ph.map(([x,y])=>({x,y,c:col})) },
      { h:100, title:"CVD (reset 9:30 ET)", paths:[{pts:d.cvd,c:C.vwap,w:2},{pts:d.ch,c:col,w:1.6,dash:"4 3"}], dots:d.ch.map(([x,y])=>({x,y,c:col})) }
    ], label:d.n });
    return `<div class="card"><h4>${d.n} <span class="chip ${bear?"bad":"good"}">${d.where}</span></h4><div class="svgwrap">${svg}</div>
      <p class="small"><b>Nhận diện:</b> ${d.rule}</p><p class="small"><b>Ý nghĩa:</b> ${d.mean}</p><p class="small"><b>Hành động:</b> ${d.act}</p></div>`;
  }).join("");
  checklist($("#cvd-check"), PB.cvdCheck, "cvdc");
}

/* ---------- 06 Plan ---------- */
function renderPlanStatic(){
  $("#timeline").innerHTML = `<div class="tablewrap"><table><thead><tr><th>ET</th><th>VN (EST, Nov–Mar)</th><th>VN (EDT, Mar–Nov)</th><th>Việc cần làm</th></tr></thead><tbody>${
    PB.timeline.map(r => `<tr><td class="mono">${r[0]}</td><td class="mono">${r[1]}</td><td class="mono muted">${r[2]}</td><td>${r[3]}</td></tr>`).join("")}</tbody></table></div>`;
  checklist($("#pre-check"), PB.preCheck, "pre");
  checklist($("#post-check"), PB.postCheck, "post");
  const reset = (pref, n, sel, items) => () => { for(let i=0;i<n;i++) store.set(`${pref}-${i}`, false); checklist($(sel), items, pref); };
  $("#pre-reset").addEventListener("click", reset("pre", PB.preCheck.length, "#pre-check", PB.preCheck));
  $("#post-reset").addEventListener("click", reset("post", PB.postCheck.length, "#post-check", PB.postCheck));
  $("#decision").innerHTML = PB.decision.map((d,i) => `<div class="flowstep"><span class="dot">${i+1}</span><div><b>${d[0]}</b><p class="small">${d[1]}</p></div></div>`).join("");
}

const PLAN_IDS = ["p-date","p-pdh","p-pdl","p-vah","p-poc","p-val","p-close","p-dtype","p-shape","p-ph","p-pl","p-onh","p-onl","p-inv","p-px","p-news","p-levels"];
function readPlan(){
  const v = id => $("#"+id).value;
  const n = id => { const x = parseFloat(String(v(id)).replace(/,/g,"")); return isNaN(x) ? null : x; };
  const custom = v("p-levels").split("\n").map(line => {
    const i = line.lastIndexOf(":"); if(i<0) return null;
    const p = parseFloat(line.slice(i+1).replace(/,/g,"").trim());
    const name = line.slice(0,i).trim();
    return (name && !isNaN(p)) ? { n:name, p, t:"custom" } : null;
  }).filter(Boolean);
  return { date:v("p-date"), pdh:n("p-pdh"), pdl:n("p-pdl"), vah:n("p-vah"), poc:n("p-poc"), val:n("p-val"), close:n("p-close"),
    dtype:v("p-dtype"), shape:v("p-shape"), ph:v("p-ph")==="1", pl:v("p-pl")==="1", onh:n("p-onh"), onl:n("p-onl"), inv:v("p-inv"),
    px:n("p-px"), news:v("p-news"), custom };
}
let lastPlanText = "";
function buildPlan(){
  const d = readPlan();
  store.set("plan-in", PLAN_IDS.map(id => $("#"+id).value));
  const need = ["pdh","pdl","vah","poc","val","px"].filter(k => d[k]==null);
  if(need.length){ $("#p-out").textContent = "Thiếu số: " + need.join(", ") + ". Cần tối thiểu PD High/Low, VAH/POC/VAL và giá lúc 9:15."; return; }
  if(!(d.pdh>=d.vah && d.vah>=d.poc && d.poc>=d.val && d.val>=d.pdl)){ $("#p-out").textContent = "Thứ tự chưa hợp lệ: cần PD High ≥ VAH ≥ POC ≥ VAL ≥ PD Low."; return; }

  const lv = [
    {n:"PD High",p:d.pdh,t:"T2"},{n:"PD VAH",p:d.vah,t:"T2"},{n:"PD POC",p:d.poc,t:"T2"},{n:"PD VAL",p:d.val,t:"T2"},{n:"PD Low",p:d.pdl,t:"T2"}
  ];
  if(d.onh!=null) lv.push({n:"ON High",p:d.onh,t:"T3"});
  if(d.onl!=null) lv.push({n:"ON Low",p:d.onl,t:"T3"});
  d.custom.forEach(c => lv.push(c));
  lv.sort((a,b) => b.p - a.p);
  const above = x => lv.filter(l => l.p > x + 0.01).sort((a,b)=>a.p-b.p);
  const below = x => lv.filter(l => l.p < x - 0.01).sort((a,b)=>b.p-a.p);
  const nm = l => l ? `${l.n} ${fmt(l.p)}` : "không có level vẽ sẵn → dùng IB extension làm target";
  const nextUp = x => nm(above(x)[0]);
  const nextDn = x => nm(below(x)[0]);

  // ladder with clusters (≤ 15 điểm)
  const CL = 15;
  const rows = [...lv, {n:"▶ Giá lúc 9:15",p:d.px,t:"now"}].sort((a,b)=>b.p-a.p);
  const clIdx = new Set();
  for(let i=0;i<lv.length-1;i++) if(Math.abs(lv[i].p - lv[i+1].p) <= CL){ clIdx.add(lv[i]); clIdx.add(lv[i+1]); }
  $("#p-ladder").innerHTML = rows.map(r => {
    const dist = r.t==="now" ? "" : (r.p-d.px>0?"+":"") + fmt(r.p-d.px);
    return `<tr class="${r.t==="now"?"now":""} ${clIdx.has(r)?"cl":""}"><td>${r.n}${r.t==="T2"?' <span class="chip va">T2</span>':r.t==="T3"?' <span class="chip ib">T3</span>':""}</td><td class="num">${fmt(r.p)}</td><td class="num">${dist}</td></tr>`;
  }).join("");

  // open location
  const loc = d.px > d.pdh ? "or-up" : d.px > d.vah ? "va-up" : d.px >= d.val ? "in-va" : d.px >= d.pdl ? "va-dn" : "or-dn";
  const L = PB.openLoc.find(z => z.id===loc);
  $("#p-loc").innerHTML = `<div class="callout ${loc.startsWith("or")?"red":loc==="in-va"?"cyan":""}"><h4>Open location dự kiến: ${L.label} <span class="chip ${L.chip}">${L.conf}</span></h4><p class="small">${L.txt}</p></div>`;

  let A = "", B = "", inv = "";
  if(loc==="in-va"){
    A = `Rotation trong value. Short ${fmt(d.vah)} (VAH) khi có CVD exhaustion/absorption + trigger, target POC ${fmt(d.poc)}. Long ${fmt(d.val)} (VAL) tương tự, target POC.`;
    B = `Breakout: 1 period đóng ngoài VA + VWAP dốc theo hướng phá. Trên VAH → go-with, target ${nextUp(d.vah)}. Dưới VAL → target ${nextDn(d.val)}.`;
    inv = `A sai khi giá accept ngoài cạnh đang fade. B sai khi breakout quay lại trong VA trong cùng period.`;
  } else if(loc==="va-up"){
    A = `Giữ trên VAH ${fmt(d.vah)} → long retest VAH (kiểu OTD), target PD High ${fmt(d.pdh)} rồi ${nextUp(d.pdh)}.`;
    B = `Quay vào VA và accept (2 period, hoặc 1 period + VWAP lật xuống) → 80% rule: short, target POC ${fmt(d.poc)} rồi VAL ${fmt(d.val)}.`;
    inv = `A sai khi accept dưới VAH. B sai khi giá reclaim lại VAH sau khi vào VA.`;
  } else if(loc==="or-up"){
    A = `Open Drive, hoặc Open Test Drive xuống PD High ${fmt(d.pdh)} rồi giữ → go-with long, target ${nextUp(d.px)}. Không fade trong 30 phút đầu.`;
    B = `Quay lại dưới PD High và giữ 1 period → trapped longs / ORR: short, target VAH ${fmt(d.vah)} rồi POC ${fmt(d.poc)}.`;
    inv = `A sai khi giá đóng period dưới PD High. B sai khi giá reclaim PD High.`;
  } else if(loc==="va-dn"){
    A = `Giữ dưới VAL ${fmt(d.val)} → short retest VAL (kiểu OTD), target PD Low ${fmt(d.pdl)} rồi ${nextDn(d.pdl)}.`;
    B = `Quay vào VA và accept (2 period, hoặc 1 period + VWAP lật lên) → 80% rule: long, target POC ${fmt(d.poc)} rồi VAH ${fmt(d.vah)}.`;
    inv = `A sai khi accept trên VAL. B sai khi giá mất lại VAL sau khi vào VA.`;
  } else {
    A = `Open Drive, hoặc Open Test Drive lên PD Low ${fmt(d.pdl)} rồi bị reject → go-with short, target ${nextDn(d.px)}. Không fade trong 30 phút đầu.`;
    B = `Quay lại trên PD Low và giữ 1 period → trapped shorts / ORR: long, target VAL ${fmt(d.val)} rồi POC ${fmt(d.poc)}.`;
    inv = `A sai khi giá đóng period trên PD Low. B sai khi giá mất lại PD Low.`;
  }

  const notes = [];
  const up = loc==="or-up"||loc==="va-up", dn = loc==="or-dn"||loc==="va-dn";
  if(d.inv==="long" && up) notes.push("Overnight net long + open cao: dễ có inventory correction xuống 30–60 phút đầu. Ưu tiên chờ OTD/OSR thay vì long ngay open.");
  if(d.inv==="short" && dn) notes.push("Overnight net short + open thấp: dễ có inventory correction lên đầu phiên. Ưu tiên chờ OTD/OSR thay vì short ngay open.");
  if(d.inv==="long" && dn) notes.push("Overnight net long nhưng open thấp: longs ETH đang kẹt, áp lực bán có thể tăng khi mất ON Low.");
  if(d.inv==="short" && up) notes.push("Overnight net short nhưng open cao: shorts ETH đang kẹt, ON High là nhiên liệu nếu bị phá.");
  if(d.ph) notes.push(`Poor high ${fmt(d.pdh)} là magnet: kỳ vọng bị quét. Không short ngay dưới nó với stop sát.`);
  if(d.pl) notes.push(`Poor low ${fmt(d.pdl)} là magnet: kỳ vọng bị quét. Không long ngay trên nó với stop sát.`);
  const shapeNote = { "P":"Shape P hôm qua = short covering. Cần thấy new buying (giữ trên VA) mới tin tiếp diễn.", "b":"Shape b hôm qua = long liquidation. Cần thấy new selling (giữ dưới VA) mới tin tiếp diễn.", "D":"Shape D hôm qua = balance. Mặc định kỳ vọng balance tiếp.", "B":"Shape B hôm qua = double distribution. Single prints giữa hai vùng là level quan trọng.", "Thin / elongated":"Hôm qua trend. Ngày sau trend thường có balance hoặc tiếp diễn chậm hơn; không đoán đảo chiều." }[d.shape];
  if(shapeNote) notes.push(shapeNote);
  if(d.dtype==="Neutral") notes.push("Hôm qua Neutral: xem close ở giữa (center → balance) hay cực trị (extreme → ưu tiên hướng close).");
  if(d.dtype==="Non-Trend") notes.push("Hôm qua Non-Trend: năng lượng tích luỹ, chú ý breakout khỏi range hôm qua.");
  if(d.close!=null){ const pos = (d.close-d.pdl)/(d.pdh-d.pdl); notes.push(`Close hôm qua ở ${(pos*100).toFixed(0)}% range (${pos>0.75?"gần high, mạnh":pos<0.25?"gần low, yếu":"giữa range, balance"}).`); }
  const clusters = []; for(let i=0;i<lv.length-1;i++) if(Math.abs(lv[i].p-lv[i+1].p)<=CL) clusters.push(`${lv[i+1].n} ${fmt(lv[i+1].p)} + ${lv[i].n} ${fmt(lv[i].p)}`);

  const ua = above(d.px)[0], ub = below(d.px)[0];
  lastPlanText =
`PLAN NQ · ${d.date}
──────────────────────────────
CONTEXT
• Hôm qua: ${d.dtype}, shape ${d.shape}. Value ${fmt(d.val)} – ${fmt(d.vah)}, POC ${fmt(d.poc)}. Range ${fmt(d.pdl)} – ${fmt(d.pdh)}.
• Overnight: ${d.onl!=null?fmt(d.onl):"?"} – ${d.onh!=null?fmt(d.onh):"?"}, inventory ${d.inv==="long"?"net long":d.inv==="short"?"net short":"trung tính"}.
• Tin: ${d.news||"—"}
• Giá 9:15 ET: ${fmt(d.px)} → ${L.label.toUpperCase()} (${L.conf})
• Level gần nhất: trên ${nm(ua)}${ua?` (+${fmt(ua.p-d.px)})`:""} · dưới ${nm(ub)}${ub?` (−${fmt(d.px-ub.p)})`:""}
${clusters.length?`• Cụm level (≤ ${CL} điểm): ${clusters.join(" | ")}\n`:""}
KỊCH BẢN A (chính)
${A}

KỊCH BẢN B (thay thế)
${B}

INVALIDATION
${inv}

GHI CHÚ CONTEXT
${notes.map(n=>"• "+n).join("\n")}

QUY TẮC CỐ ĐỊNH
• Open type phải khớp kịch bản trước khi vào lệnh (phân loại xong lúc 10:00 ET).
• Chỉ trade zone điểm ≥ 6, grade A+ trở lên (VWAP RTH và/hoặc CVD xác nhận).
• Tối đa 2–3 lệnh. Dừng 11:30 ET (23:30 VN) hoặc khi chạm daily loss limit.
• No-trade: giữa POC và cạnh VA khi chưa có open type rõ.`;
  $("#p-out").textContent = lastPlanText;
}
function initPlan(){
  const saved = store.get("plan-in", null);
  if(saved && saved.length===PLAN_IDS.length) PLAN_IDS.forEach((id,i) => { if(saved[i]!=null) $("#"+id).value = saved[i]; });
  $("#p-build").addEventListener("click", buildPlan);
  $("#p-copy").addEventListener("click", async () => {
    if(!lastPlanText) buildPlan();
    try{ await navigator.clipboard.writeText(lastPlanText); $("#p-msg").textContent = "Đã copy plan."; }
    catch(e){ $("#p-msg").textContent = "Trình duyệt chặn copy. Bôi đen khung plan để copy tay."; }
    setTimeout(()=>{ $("#p-msg").textContent = ""; }, 3000);
  });
  buildPlan();
}

/* ---------- 07 Template case study ---------- */
function renderMigration(){
  const W = 780, H = 440, top = 20, bot = 50, left = 64, right = 150;
  const pMin = 28050, pMax = 29750;
  const Y = p => top + (pMax - p)/(pMax-pMin)*(H-top-bot);
  const n = PB.days.length, colW = (W-left-right)/n;
  const X = i => left + colW*i + colW/2;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" font-family="${MONO}" role="img" aria-label="Value migration 29/10 đến 04/11">`;
  s += `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#8c9096" stroke-width="1.4" opacity=".55"/></pattern></defs>`;
  for(let p=28100; p<=29700; p+=200){ s += `<line x1="${left}" x2="${W-right}" y1="${Y(p)}" y2="${Y(p)}" stroke="#23262b"/><text x="${left-8}" y="${Y(p)+3}" font-size="9.5" fill="${C.muted}" text-anchor="end">${fmt(p)}</text>`; }
  // gap + single prints
  s += `<rect x="${X(1)-colW/2}" y="${Y(29105)}" width="${W-right-(X(1)-colW/2)}" height="${Y(28860)-Y(29105)}" fill="#5b6068" opacity=".18" stroke="#8c9096" stroke-dasharray="4 3"/>`;
  s += `<text x="${W-right+8}" y="${(Y(29105)+Y(28860))/2+3}" font-size="9.5" fill="#d5d8dc">RTH gap chưa lấp</text>`;
  s += `<rect x="${X(0)-colW/2+8}" y="${Y(29350)}" width="${W-right-(X(0)-colW/2+8)}" height="${Y(29105)-Y(29350)}" fill="url(#hatch)"/>`;
  s += `<text x="${W-right+8}" y="${(Y(29350)+Y(29105))/2+3}" font-size="9.5" fill="#d5d8dc">Single prints 29/10</text>`;
  // purple level
  s += `<line x1="${left}" x2="${W-right}" y1="${Y(28176)}" y2="${Y(28176)}" stroke="${C.lvl}" stroke-width="1.6"/><text x="${W-right+8}" y="${Y(28176)+3}" font-size="9.5" fill="#cfc7ff">Level tím 28,176</text>`;
  // POC cluster
  s += `<rect x="${X(2)-30}" y="${Y(28690)}" width="${W-right-(X(2)-30)}" height="${Y(28640)-Y(28690)}" fill="${C.poc}" opacity=".12"/>`;
  s += `<text x="${W-right+8}" y="${Y(28665)+3}" font-size="9.5" fill="${C.pocTxt}">Cụm POC 02/11 + 04/11</text>`;
  PB.days.forEach((d,i) => {
    const x = X(i);
    s += `<line x1="${x}" x2="${x}" y1="${Y(d.h)}" y2="${Y(d.l)}" stroke="#8c9096" stroke-width="2"/>`;
    s += `<rect x="${x-22}" y="${Y(d.vah)}" width="44" height="${Y(d.val)-Y(d.vah)}" fill="${C.vaFill}" stroke="${C.va}" ${d.dev?'stroke-dasharray="4 3"':""} opacity=".95"/>`;
    s += `<line x1="${x-32}" x2="${x+32}" y1="${Y(d.poc)}" y2="${Y(d.poc)}" stroke="${C.poc}" stroke-width="2.4"/>`;
    s += `<line x1="${x-40}" x2="${x-26}" y1="${Y(d.o)}" y2="${Y(d.o)}" stroke="#ff6b9a" stroke-width="2.4"/>`;
    s += `<line x1="${x+26}" x2="${x+40}" y1="${Y(d.c)}" y2="${Y(d.c)}" stroke="#ff6b9a" stroke-width="2.4"/>`;
    s += `<text x="${x}" y="${H-28}" font-size="11" fill="${C.text}" text-anchor="middle" font-weight="700">${d.d}</text>`;
    s += `<text x="${x}" y="${H-13}" font-size="9" fill="${C.muted}" text-anchor="middle">${d.dev?"developing":"POC "+fmt(d.poc)}</text>`;
  });
  s += `</svg>`;
  $("#migration").innerHTML = s;

  $("#days").innerHTML = PB.days.map(d => `
    <div class="panel stack">
      <div class="qhead"><h3 style="margin:0">${d.d}${d.dev?" · developing":""}</h3><span class="chip ${d.chip}">${d.tag}</span></div>
      <div class="row small mono" style="gap:14px">
        <span>O ${fmt(d.o)}</span><span>H ${fmt(d.h)}</span><span>L ${fmt(d.l)}</span><span>${d.dev?"Giá":"C"} ${fmt(d.c)}</span>
        <span style="color:#ff9cbf">VAH ${fmt(d.vah)}</span><span style="color:${C.poc}">POC ${fmt(d.poc)}</span><span style="color:#ff9cbf">VAL ${fmt(d.val)}</span>
      </div>
      <p><b>Đọc profile:</b> ${d.read}</p>
      <p class="muted"><b style="color:var(--text)">Bài học:</b> ${d.lesson}</p>
    </div>`).join("") + `
    <div class="panel stack">
      <h3>Bản đồ level cho 05/11 (minh hoạ, cập nhật sau khi 04/11 đóng phiên)</h3>
      <div class="tablewrap"><table><thead><tr><th>Giá</th><th>Nguồn</th><th>Vai trò</th></tr></thead><tbody>${
        PB.caseLevels.map(r => `<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td class="small">${r[2]}</td></tr>`).join("")}</tbody></table></div>
      <div class="grid g3">
        <div class="card"><h4><span class="chip">A</span> Open trong VA 04/11</h4><p class="small">Rotation 28,505–28,795. Short cụm 28,795–28,890 khi CVD exhaustion, long 28,505–28,445 khi absorption. Target cụm POC 28,650–28,680.</p></div>
        <div class="card"><h4><span class="chip good">B</span> Accept trên 28,890</h4><p class="small">Breakout tiếp diễn từ balance 03/11. Go-with, target lấp gap đến 29,105. Single prints 29,105–29,350 là kháng cự lần test đầu.</p></div>
        <div class="card"><h4><span class="chip bad">C</span> Accept dưới 28,445</h4><p class="small">Breakout 04/11 thất bại, quay lại balance 03/11. Target POC 03/11 28,330, sau đó level tím 28,176.</p></div>
      </div>
      <p class="small muted">Thử ngay: mở tab 07, Plan Builder đã điền sẵn các số này. Đổi "Giá lúc 9:15" để xem open location và kịch bản thay đổi thế nào.</p>
    </div>`;
}

/* ---------- init ---------- */
renderRoadmap();
renderAnatomy();
renderDayTypes();
renderOpenTypes();
renderOpenLoc();
renderValRel();
renderTiers();
renderIB();
renderVWAP();
renderCVD();
renderPlanStatic();
initPlan();
renderMigration();
})();
