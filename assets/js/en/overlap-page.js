
(function(){
if(!document.getElementById("b-build"))return;
"use strict";
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const fmt = n => (n==null||isNaN(n)) ? "—" : Number(n).toLocaleString("en-US",{maximumFractionDigits:2});
const store = { get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v);}catch(e){return d;} }, set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };
const MONO = "JetBrains Mono, ui-monospace, monospace";
const COL = { rth:"#D4537E", ovn:"#7F77DD", poc:"#EF9F27", liq:"#B39DDB", pd:"#9aa0a8", good:"#3fbf7f", bad:"#ef5350" };

/* ---------- core logic ---------- */
function derive(L){
  const D = Object.assign({}, L);
  D.ovLo = Math.max(L.rVal, L.oVal); D.ovHi = Math.min(L.rVah, L.oVah);
  D.has = D.ovHi > D.ovLo;
  D.pct = D.has ? Math.round((D.ovHi-D.ovLo)/(L.rVah-L.rVal)*100) : 0;
  if(!D.has){ D.gapLo = Math.min(L.rVah, L.oVah); D.gapHi = Math.max(L.rVal, L.oVal); }
  let id;
  if(L.oVal >= L.rVal && L.oVah <= L.rVah) id = 1;
  else if(L.oVal <= L.rVal && L.oVah >= L.rVah) id = 6;
  else if(D.has) id = ((L.oVah+L.oVal)/2 > (L.rVah+L.rVal)/2) ? 2 : 3;
  else id = L.oVal >= L.rVah ? 4 : 5;
  D.id = id;
  return D;
}
function openLoc(D, o){
  if(o==null || isNaN(o)) return "—";
  if(D.has && o>=D.ovLo && o<=D.ovHi) return "Trong overlap";
  const inR = o>=D.rVal && o<=D.rVah, inO = o>=D.oVal && o<=D.oVah;
  if(inR) return "Trong VA RTH";
  if(inO) return "Trong VA OVN";
  const hi = Math.max(D.rVah,D.oVah), lo = Math.min(D.rVal,D.oVal);
  if(o>hi) return "Above both";
  if(o<lo) return "Below both";
  return "Value gap";
}


const R = { loc:["Location","rth"], tgt:["Target","good"], liq:["Liquidity","liq"], piv:["Pivot","ov"] };
const SC = [
 { id:1, n:"OVN inside RTH VA", short:"Balance · fade both edges",
   ex:{rVah:28800,rVal:28700,rPoc:28750,pdh:28860,pdl:28640,oVah:28775,oVal:28725,oPoc:28745,onh:28800,onl:28700},
   read:D=>`Overnight accepted yesterday’s value: the OVN VA (${fmt(D.oVal)}–${fmt(D.oVah)}) sits entirely inside the RTH VA. Overlap = the whole OVN VA, covering ${D.pct}% VA RTH.`,
   expect:["Balance. Both sessions agree, little drive to travel far.","The IB is usually wide and inside the RTH VA.","Price rotates between the two overlap edges in A–C; any range extension is usually weak.","Common day types: Normal / small-range Normal Variation."],
   keys:D=>[["Upper overlap edge (VAH OVN)",D.ovHi,"loc","Fade short on CVD divergence"],["Lower overlap edge (VAL OVN)",D.ovLo,"loc","Fade long on absorption"],["POC RTH / POC OVN",null,"tgt",`Fade target (${fmt(D.rPoc)} / ${fmt(D.oPoc)})`],["VAH / VAL RTH",null,"tgt",`Target if the overlap breaks (${fmt(D.rVah)} / ${fmt(D.rVal)})`],["ONH / ONL",null,"liq",`OSR edges (${fmt(D.onh)} / ${fmt(D.onl)})`]],
   A:D=>({t:`Fade the overlap edges. Short ${fmt(D.ovHi)} or long ${fmt(D.ovLo)} on CVD divergence + delta flip with a flat VWAP RTH. Stop a few ticks beyond the edge (beyond ONH/ONL if close). Target POC ${fmt(D.rPoc)}.`, p:[D.ovHi, D.rPoc]}),
   B:D=>({t:`One edge breaks, C and D hold outside the overlap, VWAP slopes with the break → go with it. Down: target VAL RTH ${fmt(D.rVal)} then PDL ${fmt(D.pdl)}. Up: VAH RTH ${fmt(D.rVah)} then PDH ${fmt(D.pdh)}.`, p:[D.ovLo, D.rVal]}),
   inv:D=>`The fade is wrong when 1 period closes beyond the edge being faded and VWAP RTH slopes in the break direction.`,
   no:"Entering between the two POCs before the open type is clear.", ib:"Prefer IB-3 (rotation). IB-1 only with an unusually narrow IB.",
   open:D=>(D.ovLo+D.ovHi)/2 },
 { id:2, n:"Overlap skewed up", short:"Value migrating up · buy the lower edge",
   ex:{rVah:28780,rVal:28680,rPoc:28720,pdh:28820,pdl:28620,oVah:28830,oVal:28750,oPoc:28795,onh:28860,onl:28730},
   read:D=>`Value is migrating up. Overnight only accepted the upper part of yesterday’s VA (${fmt(D.ovLo)}–${fmt(D.ovHi)}) and builds value higher up to ${fmt(D.oVah)}.`,
   expect:["Leaning up.","The first test after the open is usually the lower overlap edge (VAL OVN).","Lower edge holds → Normal Variation up, IB-1 to the upside.","Lower edge lost → failed migration, price returns to yesterday’s value."],
   keys:D=>[["Lower overlap edge (VAL OVN)",D.ovLo,"loc","Main long zone"],["Upper overlap edge (VAH RTH)",D.ovHi,"piv","Pivot: holding above = strong"],["POC OVN",D.oPoc,"piv","Overnight balance price"],["VAH OVN → ONH",null,"tgt",`Target A (${fmt(D.oVah)} → ${fmt(D.onh)})`],["POC RTH / VAL RTH",null,"tgt",`Target B (${fmt(D.rPoc)} / ${fmt(D.rVal)})`]],
   A:D=>({t:`Pullback to the lower overlap edge ${fmt(D.ovLo)} holds (absorption, CVD makes no new low, EMA 9 > 34) → long. Stop below ${fmt(D.ovLo)} by a small margin. Target VAH OVN ${fmt(D.oVah)} then ONH ${fmt(D.onh)}.`, p:[D.ovLo, D.onh]}),
   B:D=>({t:`Lose ${fmt(D.ovLo)} and is accepted below (1 period + VWAP turns down) → failed upward migration → short to POC RTH ${fmt(D.rPoc)} then VAL RTH ${fmt(D.rVal)}.`, p:[D.ovLo, D.rPoc]}),
   inv:D=>`A is wrong when 1 period closes below ${fmt(D.ovLo)}. B is wrong when price reclaims ${fmt(D.ovLo)}.`,
   no:"Shorting right below ONH while price still holds above the overlap.", ib:"IB above the overlap and narrow → IB-1 up.",
   open:D=>D.oPoc },
 { id:3, n:"Overlap skewed down", short:"Value migrating down · sell the upper edge",
   ex:{rVah:28820,rVal:28720,rPoc:28780,pdh:28860,pdl:28680,oVah:28750,oVal:28670,oPoc:28705,onh:28770,onl:28640},
   read:D=>`Value is migrating down. Overnight only accepted the lower part of yesterday’s VA (${fmt(D.ovLo)}–${fmt(D.ovHi)}) and builds value lower down to ${fmt(D.oVal)}.`,
   expect:["Leaning down.","The first test after the open is usually the upper overlap edge (VAH OVN).","Rejected at the upper edge → Normal Variation down, IB-1 to the downside.","Upper edge reclaimed → failed migration, price returns to yesterday’s value."],
   keys:D=>[["Upper overlap edge (VAH OVN)",D.ovHi,"loc","Main short zone"],["Lower overlap edge (VAL RTH)",D.ovLo,"piv","Pivot: below = weak"],["POC OVN",D.oPoc,"piv","Overnight balance price"],["VAL OVN → ONL",null,"tgt",`Target A (${fmt(D.oVal)} → ${fmt(D.onl)})`],["POC RTH / VAH RTH",null,"tgt",`Target B (${fmt(D.rPoc)} / ${fmt(D.rVah)})`]],
   A:D=>({t:`Bounce up to the upper overlap edge ${fmt(D.ovHi)} is rejected (CVD divergence, negative delta flip, EMA 9 < 34) → short. Stop above ${fmt(D.ovHi)} by a small margin. Target VAL OVN ${fmt(D.oVal)} then ONL ${fmt(D.onl)}.`, p:[D.ovHi, D.onl]}),
   B:D=>({t:`Reclaim ${fmt(D.ovHi)} and is accepted above (1 period + VWAP turns up) → failed downward migration → long to POC RTH ${fmt(D.rPoc)} then VAH RTH ${fmt(D.rVah)}.`, p:[D.ovHi, D.rPoc]}),
   inv:D=>`A is wrong when 1 period closes above ${fmt(D.ovHi)}. B is wrong when price loses ${fmt(D.ovHi)}.`,
   no:"Going long right above ONL while price still holds below the overlap.", ib:"IB below the overlap and narrow → IB-1 down.",
   open:D=>D.oPoc },
 { id:4, n:"OVN above RTH", short:"Imbalance up · RTH must confirm",
   ex:{rVah:28720,rVal:28640,rPoc:28680,pdh:28760,pdl:28600,oVah:28830,oVal:28760,oPoc:28800,onh:28860,onl:28735},
   read:D=>`Overnight rejected yesterday’s value and built value entirely above. The zone ${fmt(D.gapLo)}–${fmt(D.gapHi)} has no value from either session.`,
   expect:["Imbalance up, RTH must confirm in A–B.","Holds above VAL OVN → Open Drive / uptrend, do not fade.","Falls into the gap and back to the RTH VA → strong reversal as overnight buyers are trapped.","A gap is usually crossed fast once it is entered."],
   keys:D=>[["VAL OVN",D.oVal,"loc","Main support, long zone"],["Value gap",null,"piv",`${fmt(D.gapLo)}–${fmt(D.gapHi)}: price moves fast if it gets in`],["POC OVN",D.oPoc,"piv","Shallow pullback"],["ONH",D.onh,"tgt","Target A, then IB extension"],["VAH RTH → POC RTH",null,"tgt",`Target B (${fmt(D.rVah)} → ${fmt(D.rPoc)})`]],
   A:D=>({t:`Holds above VAL OVN ${fmt(D.oVal)} in A–B (Open Drive / Open Test Drive) → buy the pullback to ${fmt(D.oVal)} or POC OVN ${fmt(D.oPoc)}. Target ONH ${fmt(D.onh)} then IB 1.5x.`, p:[D.oVal, D.onh]}),
   B:D=>({t:`A period closes below ${fmt(D.oVal)}, price enters the gap and is accepted below VAH RTH ${fmt(D.rVah)} → short, target POC RTH ${fmt(D.rPoc)}.`, p:[D.oVal, D.rPoc]}),
   inv:D=>`A is wrong when a period closes below ${fmt(D.oVal)} and VWAP RTH turns down. B is wrong when price gets back above ${fmt(D.oVal)}.`,
   no:"Fading ONH in the first 30 minutes during an Open Drive.", ib:"IB-1 up is the default; IB-2 only if the IB breaks below VAL OVN.",
   open:D=>D.oPoc },
 { id:5, n:"OVN below RTH", short:"Imbalance down · RTH must confirm",
   ex:{rVah:28850,rVal:28770,rPoc:28810,pdh:28880,pdl:28720,oVah:28730,oVal:28660,oPoc:28695,onh:28745,onl:28620},
   read:D=>`Overnight rejected yesterday’s value and built value entirely below. The zone ${fmt(D.gapLo)}–${fmt(D.gapHi)} has no value from either session.`,
   expect:["Imbalance down, RTH must confirm in A–B.","Holds below VAH OVN → downtrend, do not fade.","Sweep ONL then reclaim, price re-enters the RTH VA → strong reversal (overnight sellers trapped).","A gap is usually crossed fast once it is entered."],
   keys:D=>[["VAH OVN",D.oVah,"loc","Main resistance, short zone"],["Value gap",null,"piv",`${fmt(D.gapLo)}–${fmt(D.gapHi)}: price moves fast if it gets in`],["POC OVN",D.oPoc,"piv","Shallow bounce"],["ONL",D.onl,"tgt","Target A and the sweep point for OSR"],["VAL RTH → POC RTH",null,"tgt",`Target B (${fmt(D.rVal)} → ${fmt(D.rPoc)})`]],
   A:D=>({t:`Holds below VAH OVN ${fmt(D.oVah)} → sell the pullback to ${fmt(D.oVah)} or POC OVN ${fmt(D.oPoc)}. Target ONL ${fmt(D.onl)} then IB 1.5x.`, p:[D.oVah, D.onl]}),
   B:D=>({t:`Sweep ONL ${fmt(D.onl)} then reclaim, a period closes above ${fmt(D.oVah)} and re-enters the RTH VA → long, target POC RTH ${fmt(D.rPoc)}.`, p:[D.oVah, D.rPoc]}),
   inv:D=>`A is wrong when a period closes above ${fmt(D.oVah)} and VWAP RTH turns up. B is wrong when price loses ${fmt(D.oVah)}.`,
   no:"Buying the low at ONL before any reclaim.", ib:"IB-1 down is the default; OSR long only after a clear sweep + reclaim.",
   open:D=>D.oPoc },
 { id:6, n:"OVN engulfs RTH", short:"Wide OVN · wait for IB",
   ex:{rVah:28775,rVal:28735,rPoc:28755,pdh:28800,pdl:28700,oVah:28830,oVal:28680,oPoc:28750,onh:28860,onl:28640},
   read:D=>`Overnight was two-sided and swept both sides of yesterday’s value. The RTH VA (${fmt(D.rVal)}–${fmt(D.rVah)}) sits entirely inside the OVN VA, overlap = the whole RTH VA.`,
   expect:["The market has not picked a direction.","Prone to Neutral or a wide balance.","The best window is after 10:30 once the IB has picked a side.","The wide OVN edges are far targets, not early entry zones."],
   keys:D=>[["VAH RTH (upper overlap edge)",D.rVah,"loc","Break + accept → long"],["VAL RTH (lower overlap edge)",D.rVal,"loc","Break + accept → short"],["POC RTH / OVN",null,"tgt",`Fade target inside the VA (${fmt(D.rPoc)} / ${fmt(D.oPoc)})`],["VAH / VAL OVN",null,"tgt",`Target breakout (${fmt(D.oVah)} / ${fmt(D.oVal)})`],["ONH / ONL",null,"liq",`Liquidity xa (${fmt(D.onh)} / ${fmt(D.onl)})`]],
   A:D=>({t:`Do not trade A period. After 10:30, the IB breaks out above VAH RTH ${fmt(D.rVah)} (or VAL ${fmt(D.rVal)}) and C, D hold outside → go with it. Target VAH OVN ${fmt(D.oVah)} (or VAL OVN ${fmt(D.oVal)}).`, p:[D.rVah, D.oVah]}),
   B:D=>({t:`IB inside the RTH VA, VWAP flat → fade ${fmt(D.rVah)} / ${fmt(D.rVal)} to POC ${fmt(D.rPoc)} on CVD divergence.`, p:[D.rVah, D.rPoc]}),
   inv:D=>`The breakout is wrong when the next period returns into the RTH VA. The fade is wrong when the IB breaks and is accepted.`,
   no:"Chasing the first break in A period.", ib:"Wait for IB. IB-1 with the break side; IB-3 if the IB sits inside the RTH VA.",
   open:D=>D.rPoc }
];
const SC_BY = id => SC.find(s=>s.id===id);



const OPENS = [
  {k:"od1",n:"OD ↑",t:"od",d:1},{k:"od-1",n:"OD ↓",t:"od",d:-1},
  {k:"otd1",n:"OTD ↑",t:"otd",d:1},{k:"otd-1",n:"OTD ↓",t:"otd",d:-1},
  {k:"orr1",n:"ORR ↑",t:"orr",d:1},{k:"orr-1",n:"ORR ↓",t:"orr",d:-1},
  {k:"oa",n:"OA",t:"oa",d:0}
];
const OPEN_BY = k => OPENS.find(o=>o.k===k);
const BIAS = {1:0,2:1,3:-1,4:1,5:-1,6:0};
const DAYS = {1:["Normal","Normal Variation (small range)","Non-Trend"],2:["Normal Variation ↑","Trend ↑ (on OD/OTD ↑)"],3:["Normal Variation ↓","Trend ↓ (on OD/OTD ↓)"],4:["Trend ↑","Double Distribution ↑","Strong reversal if the imbalance fails"],5:["Trend ↓","Double Distribution ↓","Strong reversal if the imbalance fails"],6:["Neutral","Normal","Normal Variation sau IB"]};
const VCLS = {"A":"good","B":"bad","Wait for IB":"ov"};
function judge(id, ok, D){
  const sc = SC_BY(id), o = OPEN_BY(ok), b = BIAS[id], ar = o.d>0?"↑":o.d<0?"↓":"";
  const A = sc.A(D), B = sc.B(D);
  const zA = fmt(A.p[0]), tA = fmt(A.p[1]), zB = fmt(B.p[0]), tB = fmt(B.p[1]);
  if(b !== 0){
    const same = o.d === b, w = b>0 ? "up" : "down";
    if(o.t==="od") return same
      ? {v:"A", read:`RTH immediately agrees with the overnight direction (${w}).`, act:`Do not fade. Enter the first pullback to ${zA}; target ${tA} then IB extension.`, days:[`Trend ${ar}`,`Normal Variation ${ar}`]}
      : {v:"B", read:`RTH opens hard against the overnight direction: overnight traders are trapped and the move is usually strong.`, act:`Plan B, go with the drive. Target ${tB}. Do not pick tops/bottoms against the drive.`, days:[`Trend ${ar}`,`Normal Variation ${ar}`]};
    if(o.t==="otd") return same
      ? {v:"A", read:`Tests the opposite way (usually into zone ${zA}) then drives in the overnight direction. This is the best setup for A, same logic as OSR.`, act:`Enter on the retest of the tested level once price reclaims the open. Stop beyond the test point. Target ${tA}.`, days:[`Normal Variation ${ar}`,`Trend ${ar}`]}
      : {v:"B", read:`A test in the overnight direction (usually ONH/ONL) fails, then drives the other way.`, act:`Plan B, enter on the retest of the open or the level just reclaimed. Target ${tB}.`, days:[`Normal Variation ${ar}`]};
    if(o.t==="orr") return same
      ? {v:"A", read:`Price probes against the overnight direction, is rejected, and crosses back through the open with the overnight direction.`, act:`A once price crosses the open. Stop beyond the rejected extreme. Target ${tA}.`, days:[`Normal Variation ${ar}`]}
      : {v:"B", read:`Price goes with the overnight direction, is rejected (usually at ONH/ONL or an OVN VA edge), and crosses back through the open.`, act:`B once price crosses the open. Stop beyond the rejected extreme. Target ${tB}.`, days:[`Normal Variation ${ar}`,"Neutral"]};
    return {v:"Wait for IB", read:`Overnight had a direction but no side is aggressive in RTH yet: the migration has no follow-through.`, act:`Do not trade A period. Only react at zone ${zA} on a trigger; decide again at 10:30 with the IB.`, days:["Normal","Neutral"]};
  }
  const up = o.d>0;
  if(id===1){
    if(o.t==="od"||o.t==="otd") return {v:"B", read:`${o.t==="od"?"Open Drive":"Open Test Drive"} breaks the balance both sessions just agreed on.`, act:`Cancel the fade. Follow ${o.t==="otd"?"once price reclaims the open, enter on the overlap-edge retest":"the first pullback"}; target ${up?fmt(D.rVah)+" then PDH "+fmt(D.pdh):fmt(D.rVal)+" then PDL "+fmt(D.pdl)}.`, days:[`Normal Variation ${ar}`,`Trend ${ar}`]};
    if(o.t==="orr") return {v:"A", read:`Goes out to one overlap edge, is rejected, crosses back through the open: exactly the balance idea.`, act:`Fade in the ORR direction, target the opposite overlap edge (${up?fmt(D.ovHi):fmt(D.ovLo)}) and TPOC.`, days:["Normal","Normal Variation (small)"]};
    return {v:"A", read:`Best fit for scenario 1: both sessions agree and RTH has not picked a direction either.`, act:`Fade both overlap edges ${fmt(D.ovLo)} / ${fmt(D.ovHi)} to TPOC on a trigger.`, days:["Normal","Non-Trend"]};
  }
  // id === 6
  if(o.t==="od"||o.t==="otd") return {v:"A", read:`RTH picks a side early, no need to wait for the full IB.`, act:`Go with it once price is accepted beyond ${up?"VAH RTH "+fmt(D.rVah):"VAL RTH "+fmt(D.rVal)}; target ${up?"VAH OVN "+fmt(D.oVah)+" then ONH "+fmt(D.onh):"VAL OVN "+fmt(D.oVal)+" then ONL "+fmt(D.onl)}.`, days:[`Normal Variation ${ar}`,`Trend ${ar}`]};
  if(o.t==="orr") return {v:"B", read:`Tried to break the RTH VA and was rejected: the wide balance still holds.`, act:`Fade to TPOC ${fmt(D.rPoc)} once price crosses the open; stop beyond the rejected extreme.`, days:["Normal","Neutral"]};
  return {v:"Wait for IB", read:`Overnight was two-sided and nobody is aggressive in RTH either.`, act:`No trading until 10:30. IB breaks out of the RTH VA and is accepted → A; IB inside the RTH VA → B.`, days:["Neutral","Normal"]};
}
function renderMatrix(){
  const head = `<table><thead><tr><th>Scenario (9:25)</th>${OPENS.map(o=>`<th>${o.n}</th>`).join("")}</tr></thead><tbody>`;
  const body = SC.map(sc => { const D = derive(sc.ex);
    return `<tr><td><b>${sc.id}</b> · ${sc.n}</td>${OPENS.map(o=>{ const j = judge(sc.id,o.k,D); return `<td><button class="mx" data-s="${sc.id}" data-o="${o.k}" aria-label="Scenario ${sc.id} with ${o.n}"><span class="chip ${VCLS[j.v]}">${j.v}</span></button></td>`; }).join("")}</tr>`; }).join("");
  $("#mx-table").innerHTML = head + body + "</tbody></table>";
  const show = (s,k) => {
    const sc = SC_BY(+s), D = derive(sc.ex), o = OPEN_BY(k), j = judge(sc.id,k,D);
    $$("#mx-table button.mx").forEach(b=>b.classList.toggle("on", b.dataset.s===String(s) && b.dataset.o===k));
    $("#mx-detail").innerHTML = `<div class="grid g3" style="margin-top:6px">
      <div class="card"><span class="k">Scenario ${sc.id} × ${o.n}</span><p><span class="chip ${VCLS[j.v]}">${j.v}</span></p><p class="small">${j.read}</p></div>
      <div class="card"><span class="k">Action (illustrative numbers)</span><p class="small">${j.act}</p></div>
      <div class="card"><span class="k">Day type leans toward</span><p class="small">${j.days.join(" · ")}</p><p class="small muted">Re-confirm with the IB at 10:30.</p></div></div>`;
  };
  $("#mx-table").addEventListener("click", e=>{ const b = e.target.closest("button.mx"); if(b) show(b.dataset.s, b.dataset.o); });
  show(2,"otd1");
}



const DT = [
 {k:"normal",n:"Normal",dir:0,flip:false,p:[[12,30],[13,29],[16,26],[15,24],[17,25],[18,24],[16,23],[17,25],[19,24],[18,23],[17,23],[19,25],[20,23]],o:20,c:21,
  sig:"Very wide IB, almost the whole range; no range extension.", mean:"The large timeframe sets the edges early; the rest is rotation.", key:"Prior IB ≈ range: PDH/PDL are strong edges."},
 {k:"nvar",n:"Normal Variation",dir:1,flip:true,p:[[16,26],[15,24],[18,25],[22,31],[25,33],[26,32],[24,30],[25,31],[26,30],[25,31],[24,29],[25,30],[26,29]],o:19,c:28,
  sig:"Medium IB, one-sided range extension of about 1.2–2x IB.", mean:"Initiative activity shows up after the IB and moves value in the RE direction.", key:"Range-extension high/low and the prior IB edges."},
 {k:"trend",n:"Trend",dir:1,flip:true,p:[[2,7],[5,10],[8,13],[11,16],[14,19],[17,22],[19,24],[22,27],[24,29],[26,31],[29,34],[31,36],[33,38]],o:3,c:37,
  sig:"Narrow IB, thin elongated profile, close at the extreme.", mean:"One side is fully in control. The VA means little because value was not built.", key:"Close at the extreme and the thin TPO stretches in the profile body."},
 {k:"dd",n:"Double Distribution",dir:1,flip:true,p:[[4,10],[5,11],[6,10],[5,9],[7,11],[10,23],[20,27],[21,28],[22,27],[20,26],[21,27],[22,28],[23,27]],o:6,c:25,
  sig:"Two value areas separated by a single-print band.", mean:"Morning balance, then new information pushes price into a second balance area.", key:"The single-print band between the two distributions is the key level."},
 {k:"neutral",n:"Neutral",dir:0,flip:false,p:[[14,24],[15,25],[17,29],[18,26],[15,23],[9,17],[11,19],[13,20],[15,21],[16,22],[17,23],[16,22],[17,21]],o:19,c:19,
  sig:"Range extension on both sides of the IB, close mid-range (neutral center).", mean:"Both sides balanced, nobody won. If the close is at an extreme (neutral extreme), prefer the close direction.", key:"Prior IB edges and both ends of the range extension."},
 {k:"nontrend",n:"Non-Trend",dir:0,flip:false,p:[[17,22],[18,22],[17,21],[18,22],[17,21],[18,21],[17,22],[18,21],[17,21],[18,22],[17,21],[18,21],[18,21]],o:19,c:20,
  sig:"Narrow IB, price barely leaves it all day.", mean:"Lack of information, energy is building.", key:"Yesterday’s narrow range edges = breakout levels."},
 {k:"pshape",n:"P-shape",dir:1,weak:true,flip:false,p:[[2,9],[7,15],[13,22],[18,26],[21,27],[20,26],[21,27],[22,26],[21,26],[22,27],[21,26],[22,26],[22,25]],o:3,c:24,
  sig:"Thin body below, value bulging above.", mean:"Usually short covering, not necessarily new buying.", key:"The thin body of the P: price moves fast if it returns there."},
 {k:"bshape",n:"b-shape",dir:-1,weak:true,flip:false,p:null,o:26,c:5,
  sig:"Thin body above, value bulging below.", mean:"Usually long liquidation, not necessarily new selling.", key:"The thin body of the b: price moves fast if it returns there."}
];
DT.find(d=>d.k==="bshape").p = DT.find(d=>d.k==="pshape").p.map(([a,b])=>[29-b,29-a]);
const DT_BASE = 28600, DT_STEP = 5;
function dtPeriods(k, down){
  const d = DT.find(x=>x.k===k);
  const flip = down && d.flip;
  const ps = flip ? d.p.map(([a,b])=>[40-b,40-a]) : d.p;
  return { ps, o: flip?40-d.o:d.o, c: flip?40-d.c:d.c, dir: flip ? -d.dir : d.dir, name: d.n + (d.flip ? (flip?" ↓":" ↑") : "") };
}
function tpoVA(ps){
  let lo=1e9, hi=-1e9; ps.forEach(([a,b])=>{ lo=Math.min(lo,a); hi=Math.max(hi,b); });
  const cnt = {}; for(let p=lo;p<=hi;p++) cnt[p] = ps.filter(([a,b])=>p>=a&&p<=b).length;
  const mid=(lo+hi)/2; let poc=lo; for(let p=lo;p<=hi;p++){ if(cnt[p]>cnt[poc] || (cnt[p]===cnt[poc] && Math.abs(p-mid)<Math.abs(poc-mid))) poc=p; }
  const tot = Object.values(cnt).reduce((s,v)=>s+v,0); let acc=cnt[poc], vah=poc, val=poc, up=poc+1, dn=poc-1;
  while(acc < Math.ceil(tot*0.7) && (up<=hi||dn>=lo)){ const cu = up<=hi?cnt[up]:-1, cd = dn>=lo?cnt[dn]:-1; if(cu>=cd){acc+=cu;vah=up++;} else {acc+=cd;val=dn--;} }
  // longest thin zone (≤ 1 TPO) inside the range
  let best=null, run=null;
  for(let p=lo;p<=hi;p++){ if(cnt[p]<=1){ run = run ? [run[0],p] : [p,p]; if(!best || run[1]-run[0] > best[1]-best[0]) best = run.slice(); } else run = null; }
  return { lo, hi, poc, vah, val, thin: best && best[1]-best[0]>=2 ? best : null };
}
const SC_REL = {
  1:w=>({oVal:.25*w, oVah:-.25*w, ref:"in"}),
  2:w=>({oVal:.6*w, oVah:.5*w, ref:"up"}),
  3:w=>({oVal:-.5*w, oVah:-.6*w, ref:"dn"}),
  4:w=>({gap:.35*w, h:.8*w, ref:"above"}),
  5:w=>({gap:.35*w, h:.8*w, ref:"below"}),
  6:w=>({oVal:-.5*w, oVah:.5*w, ref:"wrap"})
};
const r5 = x => Math.round(x/DT_STEP)*DT_STEP;
function buildCombo(dtk, down, id){
  const t = dtPeriods(dtk, down), V = tpoVA(t.ps), P = r => DT_BASE + r*DT_STEP;
  const rVah = P(V.vah), rVal = P(V.val), rPoc = P(V.poc), pdh = P(V.hi), pdl = P(V.lo), w = Math.max(20, rVah - rVal);
  let oVal, oVah;
  const rel = SC_REL[id](w);
  if(rel.ref==="in"||rel.ref==="wrap"){ oVal = r5(rVal + rel.oVal); oVah = r5(rVah + rel.oVah); }
  else if(rel.ref==="up"){ oVal = r5(rVal + rel.oVal); oVah = r5(rVah + rel.oVah); }
  else if(rel.ref==="dn"){ oVal = r5(rVal + rel.oVal); oVah = r5(rVah + rel.oVah); }
  else if(rel.ref==="above"){ oVal = r5(rVah + rel.gap); oVah = r5(oVal + rel.h); }
  else { oVah = r5(rVal - rel.gap); oVal = r5(oVah - rel.h); }
  if(id===1){ if(oVah - oVal < 5) oVah = oVal + 5; } else if(oVah - oVal < 15) oVah = oVal + 15;
  const ow = oVah - oVal;
  const oPoc = r5(oVal + ow*(id===2||id===4?0.6:id===3||id===5?0.4:0.5));
  const onh = r5(oVah + Math.max(10, ow*0.3)), onl = r5(oVal - Math.max(10, ow*0.3));
  const L = { rVah, rVal, rPoc, pdh, pdl, oVah, oVal, oPoc, onh, onl };
  const D = derive(L);
  D.rPeriods = t.ps.map(([a,b])=>[P(a),P(b)]); D.rStep = DT_STEP; D.rDtName = t.name;
  D.rClose = P(t.c); D.rIB = [P(Math.min(t.ps[0][0],t.ps[1][0])), P(Math.max(t.ps[0][1],t.ps[1][1]))];
  D.thin = V.thin ? [P(V.thin[0]), P(V.thin[1])] : null;
  D.dt = { k:dtk, dir:t.dir, name:t.name };
  return D;
}

function combo(dtk, dir, id){
  const d = DT.find(x=>x.k===dtk), b = BIAS[id], wk = !!d.weak;
  const W = b>0?"up":"down";
  if(dir!==0 && b!==0){
    const same = dir===b;
    if(wk) return same
      ? {tone:"A needs confirmation", cls:"ov", t:`${d.n} yesterday was ${dir>0?"short covering":"long liquidation"}, and overnight continued ${W}. You need to see real new ${dir>0?"buying":"selling"} (OD/OTD, holding outside the overlap) before trusting A. If RTH returns into the thin body of ${d.n}, price moves very fast toward B.`}
      : {tone:"Reinforces A", cls:"good", t:`The ${dir>0?"rally":"drop"} of ${d.n} yesterday was mostly ${dir>0?"short covering":"long liquidation"} and is exhausted; overnight turning ${W} confirms a real aggressive side. A is reinforced, and the target can extend to the thin body of ${d.n}.`};
    if(dtk==="trend") return same
      ? {tone:"Reinforces A", cls:"good", t:`Yesterday’s Trend and overnight in the same direction: ${W}: multi-session imbalance. Do not fade; only follow pullbacks. Careful: the day after a trend usually has a smaller range.`}
      : {tone:"A needs confirmation", cls:"ov", t:`Overnight reversed right after a Trend day. A trend day is more often followed by balance than a real reversal, so A (against the trend) needs OD/OTD confirmation. If RTH returns to the trend direction → strong B.`};
    if(dtk==="dd") return same
      ? {tone:"Reinforces A", cls:"good", t:`Yesterday’s Double Distribution and overnight point the same way: the second distribution is accepted. Yesterday’s single-print band is far support/resistance for B.`}
      : {tone:"A needs confirmation", cls:"ov", t:`Overnight turned back toward the first distribution. Yesterday’s single-print band is where the market tends to move fast: if it is pierced, A runs fast; if it holds, B.`};
    return same
      ? {tone:"Reinforces A", cls:"good", t:`${d.n} yesterday (range extension ${W}) and overnight in the same direction: value is migrating across sessions. Prefer go-with.`}
      : {tone:"A needs confirmation", cls:"ov", t:`Overnight went against yesterday’s range extension. A needs open-type confirmation; if RTH returns to yesterday’s RE side → B.`};
  }
  if(dir!==0 && b===0){
    const dw = dir>0?"up":"down";
    if(wk) return {tone:"Balance", cls:"", t:`Sau ${d.n} (${dir>0?"short covering":"long liquidation"}), overnight balanced inside yesterday’s value: the push ${dw} has no follow-through. Fade the overlap edges; on a breakout prefer the direction opposite to ${d.n}.`};
    return {tone:"Balance · leaning with yesterday", cls:"", t:`After a ${d.n} ${dw}, overnight digested it inside yesterday’s value. Expect balance in A–C; on a breakout with acceptance prefer the ${dw} direction from yesterday.`};
  }
  if(dir===0 && b!==0){
    if(dtk==="nontrend") return {tone:"Reinforces A", cls:"good", t:`Yesterday’s Non-Trend is stored energy; overnight leaving the range ${W} is a breakout of the compression. A is strong if RTH does not return to yesterday’s narrow range.`};
    if(dtk==="neutral") return {tone:"A needs confirmation", cls:"ov", t:`Neutral center yesterday: both sides balanced. Overnight picking ${W} is new information that needs RTH confirmation by OD/OTD. If yesterday was a neutral extreme in the same direction ${W} then upgrade to "Reinforces A".`};
    return {tone:"A needs confirmation", cls:"ov", t:`Yesterday ${d.n} (balance), and overnight picked a direction: ${W}. This is new information; A has good odds when RTH confirms with OD/OTD and holds outside the overlap.`};
  }
  if(dtk==="nontrend") return {tone:"Balance · breakout pending", cls:"ov", t:`Non-Trend followed by overnight balance: energy compressed across sessions. Do not fade deep; get ready to follow a breakout with acceptance.`};
  return {tone:"Balance", cls:"", t:`${d.n} yesterday + overnight balance inside value: rotation is the default. If several days in a row look like this, build a composite.`};
}
const DT_OPTS = [["normal",false],["nvar",false],["nvar",true],["trend",false],["trend",true],["dd",false],["dd",true],["neutral",false],["nontrend",false],["pshape",false],["bshape",false]];
const dtLabel = (k,down) => { const d = DT.find(x=>x.k===k); return d.n + (d.flip ? (down?" ↓":" ↑") : ""); };

/* ---------- chart ---------- */

const FA=[.6,.9,.4,1,.7,.8,.5,.3,.9,.6,.2], FB=[.8,.5,1,.6,.9,.4,.7,1,.5,.3,.6];
function synthPeriods(lo, hi, val, vah, poc, n, step){
  const r = p => Math.round(p/step);
  const L = r(lo), H = r(hi), VL = r(val), VH = r(vah), PC = r(poc);
  const up = Math.max(1, VH-PC), dn = Math.max(1, PC-VL);
  const ps = [[L, PC], [Math.round((L+VL)/2), VH], [VL, H]];
  for(let i=3;i<n;i++){
    const k = (i-3) % FA.length, j = (i*7) % FB.length;
    let a = PC - Math.max(1, Math.round(dn*FA[k])), b = PC + Math.max(1, Math.round(up*FB[j]));
    if(i===n-1){ a = PC - 1; b = PC + 1; }
    ps.push([Math.max(L, Math.min(a, b-1)), Math.min(H, b)]);
  }
  return ps;
}
function tpoRows(ps){
  let lo=1e12, hi=-1e12; ps.forEach(([a,b])=>{ lo=Math.min(lo,a); hi=Math.max(hi,b); });
  const rows = []; for(let p=hi; p>=lo; p--){ const idx=[]; ps.forEach(([a,b],i)=>{ if(p>=a&&p<=b) idx.push(i); }); rows.push({r:p, idx}); }
  return rows;
}
function drawPlan(D, sc, open){
  const lo0 = Math.min(D.pdl, D.onl, D.rVal, D.oVal), hi0 = Math.max(D.pdh, D.onh, D.rVah, D.oVah);
  const W = 760, top = 36, bot = 26, x0 = 74;
  const H = D.rPeriods ? Math.round(Math.min(860, Math.max(480, (hi0-lo0)*1.16/D.rStep*10.5 + top + bot))) : 480;
  const pad = (hi0-lo0)*0.08, pmin = lo0-pad, pmax = hi0+pad;
  const Y = p => top + (pmax-p)/(pmax-pmin)*(H-top-bot);
    const xEnd = 548, xLab = 556;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="${MONO}" role="img" aria-label="Plan chart, scenario ${sc.id}">
  <defs>
    <marker id="ag" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="${COL.good}" stroke-width="1.6"/></marker>
    <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="${COL.bad}" stroke-width="1.6"/></marker>
  </defs>`;
  // axis
  const tick = Math.max(5, Math.round((pmax-pmin)/7/5)*5);
  for(let p = Math.ceil(pmin/tick)*tick; p <= pmax; p += tick){
    s += `<line x1="${x0-6}" x2="${xEnd}" y1="${Y(p)}" y2="${Y(p)}" stroke="#202328"/><text x="${x0-10}" y="${Y(p)+4}" font-size="11" text-anchor="end" fill="#9aa0a8">${fmt(p)}</text>`;
  }
  s += `<text x="${x0+70}" y="20" font-size="12" text-anchor="middle" fill="#cfd3d8">Prior RTH TPO${D.rPeriods?" · "+D.rDtName:" (A–N)"}</text><text x="${x0+250}" y="20" font-size="12" text-anchor="middle" fill="#cfd3d8">TPO OVN (31 period)</text><text x="${x0+400}" y="20" font-size="12" text-anchor="middle" fill="#cfd3d8">9:30 → 11:30</text>`;
  // overlap / gap band
  if(D.has) s += `<rect x="${x0-4}" y="${Y(D.ovHi)}" width="${xEnd-x0+4}" height="${Y(D.ovLo)-Y(D.ovHi)}" fill="#EF9F27" fill-opacity="0.16" stroke="#BA7517" stroke-dasharray="5 4"/>`;
  else s += `<rect x="${x0-4}" y="${Y(D.gapHi)}" width="${xEnd-x0+4}" height="${Y(D.gapLo)-Y(D.gapHi)}" fill="#888780" fill-opacity="0.14" stroke="#888780" stroke-dasharray="5 4"/>`;
  // lines
  const hl = (p,c,d,w) => `<line x1="${x0}" x2="${xEnd}" y1="${Y(p)}" y2="${Y(p)}" stroke="${c}" stroke-width="${w||1.2}" ${d?`stroke-dasharray="${d}"`:""}/>`;
  s += hl(D.pdh,COL.pd,"1 3") + hl(D.pdl,COL.pd,"1 3") + hl(D.onh,COL.liq,"6 3") + hl(D.onl,COL.liq,"6 3");
  s += hl(D.rVah,COL.rth,"4 3") + hl(D.rVal,COL.rth,"4 3") + hl(D.oVah,COL.ovn,"4 3") + hl(D.oVal,COL.ovn,"4 3");
  s += hl(D.rPoc,COL.poc,"",1.8) + hl(D.oPoc,COL.poc,"2 3",1.8);
  // profiles (TPO)
  const LET = "ABCDEFGHIJKLMN";
  const tstep = D.rPeriods ? D.rStep : Math.max(0.25, Math.round(((hi0-lo0)/30)*4)/4);
  const rowH = Math.max(4, (Y(lo0)-Y(lo0+tstep)));
  const drawTPO = (lo,hi,val,vah,poc,n,x,isR,maxW,explicit) => {
    const rows = tpoRows(explicit ? explicit.map(([a,b])=>[Math.round(a/tstep),Math.round(b/tstep)]) : synthPeriods(lo,hi,val,vah,poc,n,tstep));
    const maxC = Math.max(...rows.map(r=>r.idx.length));
    const cw = Math.min(isR?11:9, maxW/maxC);
    const pocR = Math.round(poc/tstep);
    let o = "";
    rows.forEach(rw => {
      const p = rw.r*tstep, y = Y(p) - rowH/2 + 0.6, h = Math.max(3, rowH-1.2);
      const isP = rw.r===pocR, inVA = p>=val-1e-9 && p<=vah+1e-9;
      const f = isP ? "#854F0B" : inVA ? (isR?"#72243E":"#3C3489") : "#444441";
      const t = isP ? "#FAC775" : inVA ? (isR?"#F4C0D1":"#CECBF6") : "#D3D1C7";
      rw.idx.forEach((pi,j) => {
        const xx = x + j*cw;
        o += `<rect x="${xx.toFixed(1)}" y="${y.toFixed(1)}" width="${(cw-1.2).toFixed(1)}" height="${h.toFixed(1)}" rx="1" fill="${f}"/>`;
        if(isR && cw>=9 && h>=8) o += `<text x="${(xx+(cw-1.2)/2).toFixed(1)}" y="${(y+h-1.5).toFixed(1)}" font-size="${Math.min(10,h-0.5).toFixed(1)}" text-anchor="middle" fill="${t}">${LET[pi]}</text>`;
      });
    });
    return o;
  };
  s += drawTPO(D.pdl, D.pdh, D.rVal, D.rVah, D.rPoc, 14, x0+4, true, 150, D.rPeriods);
  if(D.rPeriods && D.rClose!=null){ const yc = Y(D.rClose); s += `<path d="M${x0+160},${yc-4} L${x0+153},${yc} L${x0+160},${yc+4} Z" fill="#ff6b9a"/><text x="${x0+163}" y="${yc+4}" font-size="10" fill="#ffb3cb">C</text>`; }
  if(D.rPeriods && D.rIB){ s += `<rect x="${x0-3}" y="${Y(D.rIB[1])-rowH/2}" width="3" height="${Y(D.rIB[0])-Y(D.rIB[1])+rowH}" fill="#C9A96E"/>`; }
  s += drawTPO(D.onl, D.onh, D.oVal, D.oVah, D.oPoc, 31, x0+174, false, 156);
  // arrows A / B
  const o = open!=null && !isNaN(open) ? open : sc.open(D);
  const a = sc.A(D).p, b = sc.B(D).p;
  const xo = x0+352, xz = x0+410, xt = x0+466;
  const path = (pts) => pts.map(([x,p],i)=>`${i?"L":"M"}${x},${Y(p).toFixed(1)}`).join(" ");
  s += `<path d="${path([[xo,o],[xz,a[0]],[xt,a[1]]])}" fill="none" stroke="${COL.good}" stroke-width="2.2" marker-end="url(#ag)"/>`;
  s += `<path d="${path([[xo,o],[xz-14,b[0]],[xt-14,b[1]]])}" fill="none" stroke="${COL.bad}" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#ar)"/>`;
  s += `<circle cx="${xz}" cy="${Y(a[0])}" r="4" fill="${COL.good}"/><circle cx="${xz-14}" cy="${Y(b[0])}" r="4" fill="${COL.bad}"/>`;
  s += `<path d="M${xo-14},${Y(o)-6} L${xo-2},${Y(o)} L${xo-14},${Y(o)+6} Z" fill="#ff6b9a"/><text x="${xo-18}" y="${Y(o)+4}" font-size="11" text-anchor="end" fill="#ffb3cb">Open</text>`;
  s += `<text x="${xt+4}" y="${Y(a[1])+4}" font-size="11" fill="${COL.good}">A</text><text x="${xt-10}" y="${Y(b[1])+4}" font-size="11" fill="${COL.bad}">B</text>`;
  // labels
  const labs = [[D.rVah,"VAH RTH",COL.rth],[D.rPoc,"POC RTH",COL.poc],[D.rVal,"VAL RTH",COL.rth],[D.oVah,"VAH OVN",COL.ovn],[D.oPoc,"POC OVN",COL.poc],[D.oVal,"VAL OVN",COL.ovn],[D.onh,"ONH",COL.liq],[D.onl,"ONL",COL.liq],[D.pdh,"PDH",COL.pd],[D.pdl,"PDL",COL.pd]]
    .map(([p,t,c])=>({y:Y(p),t:`${t} ${fmt(p)}`,c})).sort((a,b)=>a.y-b.y);
  for(let i=1;i<labs.length;i++) if(labs[i].y < labs[i-1].y+13) labs[i].y = labs[i-1].y+13;
  const over = labs[labs.length-1].y - (H-8); if(over>0) labs.forEach(l=>l.y-=over);
  labs.forEach(l => s += `<text x="${xLab}" y="${(l.y+4).toFixed(1)}" font-size="11" fill="${l.c}">${l.t}</text>`);
  s += `<text x="${xLab}" y="${H-4}" font-size="10.5" fill="#9aa0a8">${D.has?"Orange band = overlap":"Grey band = value gap"}</text>`;
  s += `</svg>`;
  return s;
}

/* ---------- 00 overview ---------- */
const DRAW = [
 ["1","VAH RTH","16:14","Upper edge of yesterday’s value: fade on rejection, retest once accepted","Dashed line · #FFD4537E"],
 ["2","VAL RTH","16:14","Lower edge of yesterday’s value, mirror of VAH","Dashed line · #FFD4537E"],
 ["3","TPOC RTH","16:14","Where the market spent the most time yesterday: fade target, bias pivot","Solid 2px line · #FFEF9F27"],
 ["4","PDH / PDL","16:14","Yesterday’s range edges where stops cluster: open classification, sweep points","Thin line · #FFE6E8EB"],
 ["5","Tail / poor H-L / single prints","16:14","Tail = strong edge; poor = target; single prints = fast-move area","Small box · #66E3A33A"],
 ["6","VAH OVN","9:29","Upper edge of overnight value; compare with the RTH VA to see which way value migrates","Dashed line · #FF7F77DD"],
 ["7","VAL OVN","9:29","Lower edge of overnight value","Dashed line · #FF7F77DD"],
 ["8","TPOC OVN","9:29","Where overnight spent the most time; nearest target after the open","Dotted line · #FFEF9F27"],
 ["9","ONH / ONL","9:29","OVN edges for the OSR setup (sweep → reclaim → retest)","Thin line · #FFB39DDB"],
 ["10","Overlap box (or gap)","9:29","Main zone; its shape decides scenarios 1–6","Box · fill #29EF9F27, border #FFBA7517"],
 ["11","RTH Open","9:30","Classify the open type","Line · #FFFF6B9A"],
 ["12","IB High / Low / Mid","10:30","IB-1 / IB-2 / IB-3 setups; IB mid to trail the stop","Line · #FFC9A96E"],
 ["13","Zone orderflow","In session","Absorption / stacked imbalance right at the level: trigger and stop placement","Short box · #66FF5252 / #6669F0AE"]
];
function renderOverview(){
  $("#draw-list").innerHTML = DRAW.map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td class="mono">${r[2]}</td><td class="small">${r[3]}</td><td class="small mono">${r[4]}</td></tr>`).join("");
  const steps = [
    ["Compute the overlap (TPO VA)","Lo = max(VAL RTH, VAL OVN), Hi = min(VAH RTH, VAH OVN), both TPO VAs. Hi > Lo → overlap exists."],
    ["OVN VA entirely inside the RTH VA?","Yes → Scenario 1 (balance)."],
    ["OVN VA engulfs the RTH VA?","Yes → Scenario 6 (wait for IB)."],
    ["Overlap but skewed?","OVN VA midpoint above the RTH VA midpoint → Scenario 2 (migrating up). Below → Scenario 3 (migrating down)."],
    ["No overlap?","VAL OVN ≥ VAH RTH → Scenario 4 (OVN above). Otherwise → Scenario 5 (OVN below)."],
    ["Ghi % overlap","= overlap height / RTH VA height. ≥ 60% wide, 25–60% medium, < 25% narrow (near rejection)."]
  ];
  $("#classify-flow").innerHTML = steps.map((s,i)=>`<div class="step"><span class="dot">${i+1}</span><div><b>${s[0]}</b><p class="small">${s[1]}</p></div></div>`).join("");
}

/* ---------- 01 scenarios ---------- */
function scenarioHtml(D, sc, open){
  const A = sc.A(D), B = sc.B(D);
  const keys = sc.keys(D);
  return `
    <div class="row" style="justify-content:space-between"><h3>Scenario ${sc.id} · ${sc.n}</h3><span class="chip ${D.has?"ov":""}">${D.has?`Overlap ${fmt(D.ovLo)}–${fmt(D.ovHi)} · ${D.pct}% VA RTH`:`Value gap ${fmt(D.gapLo)}–${fmt(D.gapHi)}`}</span></div>
    <div class="svgwrap">${drawPlan(D, sc, open)}</div>
    <div class="grid g2">
      <div class="card"><span class="k">Context read</span><p>${sc.read(D)}</p></div>
      <div class="card"><span class="k">Expectations</span><ul class="clean small">${sc.expect.map(e=>`<li>${e}</li>`).join("")}</ul></div>
    </div>
    ${D.dt ? (()=>{ const d = DT.find(x=>x.k===D.dt.k), cb = combo(D.dt.k, D.dt.dir, sc.id), pos = Math.round((D.rClose-D.pdl)/(D.pdh-D.pdl)*100);
      return `<div class="grid g2">
        <div class="card"><span class="k">Prior RTH · ${D.dt.name}</span><p class="small">${d.sig} ${d.mean}</p><p class="small muted">Close at ${pos}% range · ${d.key}</p></div>
        <div class="card"><span class="k">Combined with scenario ${sc.id}</span><p><span class="chip ${cb.cls}">${cb.tone}</span></p><p class="small">${cb.t}</p></div></div>`; })() : ""}
    <div class="tablewrap"><table><thead><tr><th>Key level</th><th class="num">Price</th><th>Role</th><th>Action</th></tr></thead><tbody>
      ${keys.map(k=>`<tr><td><b>${k[0]}</b></td><td class="num mono">${k[1]==null?"—":fmt(k[1])}</td><td><span class="chip ${R[k[2]][1]}">${R[k[2]][0]}</span></td><td class="small">${k[3]}</td></tr>`).join("")}
      ${D.dt ? `<tr><td><b>Prior close</b></td><td class="num mono">${fmt(D.rClose)}</td><td><span class="chip ov">Pivot</span></td><td class="small">The close location decides how to read ${D.dt.name}: near an extreme = strong, middle = balance</td></tr>
      <tr><td><b>Prior IB</b></td><td class="num mono">${fmt(D.rIB[0])}–${fmt(D.rIB[1])}</td><td><span class="chip">Context</span></td><td class="small">Prior IB wide/narrow; IB edges are secondary levels</td></tr>
      ${D.thin ? `<tr><td><b>Prior thin TPO zone</b></td><td class="num mono">${fmt(D.thin[0])}–${fmt(D.thin[1])}</td><td><span class="chip rth">Location</span></td><td class="small">Single prints / thin body: price moves fast inside, the first test often reacts</td></tr>` : ""}` : ""}
    </tbody></table></div>
    <div class="ab">
      <div class="card a"><span class="k">Plan A · primary</span><p class="small">${A.t}</p></div>
      <div class="card b"><span class="k">Plan B · alternative</span><p class="small">${B.t}</p></div>
    </div>
    <div class="card"><span class="k">Common day types for this scenario</span><p class="small">${DAYS[sc.id].map(x=>`<span class="chip">${x}</span>`).join(" ")}</p></div>
    <div class="tablewrap"><table><thead><tr><th>Open type at 10:00</th><th>Conclusion</th><th>Reading</th><th>Action</th><th>Day type leans toward</th></tr></thead><tbody>
      ${OPENS.map(o=>{ const j = judge(sc.id,o.k,D); return `<tr><td><b>${o.n}</b></td><td><span class="chip ${VCLS[j.v]}">${j.v}</span></td><td class="small">${j.read}</td><td class="small">${j.act}</td><td class="small">${j.days.join(" · ")}</td></tr>`; }).join("")}
    </tbody></table></div>
    <div class="grid g3">
      <div class="card"><span class="k">Invalidation</span><p class="small">${sc.inv(D)}</p></div>
      <div class="card"><span class="k">Initial Balance</span><p class="small">${sc.ib}</p></div>
      <div class="card"><span class="k">Do not</span><p class="small">${sc.no}</p></div>
    </div>`;
}
function renderScenarios(){
  const dbox = $("#dt-buttons"), box = $("#sc-buttons");
  dbox.innerHTML = DT_OPTS.map(([k,dn],i)=>`<button data-i="${i}">${dtLabel(k,dn)}</button>`).join("");
  box.innerHTML = SC.map(s=>`<button data-id="${s.id}">${s.id} · ${s.n}</button>`).join("");
  let di = store.get("ofs.ov.dt", 0), si = store.get("ofs.ov.sc", 1);
  if(!(di>=0 && di<DT_OPTS.length)) di = 0;
  const show = () => {
    const [k,dn] = DT_OPTS[di], sc = SC_BY(si), D = buildCombo(k, dn, si);
    $$("button",dbox).forEach(b=>b.classList.toggle("on", +b.dataset.i===di));
    $$("button",box).forEach(b=>b.classList.toggle("on", +b.dataset.id===si));
    let html = scenarioHtml(D, sc);
    if(D.id !== si) html = `<p class="small muted">With this day type the illustrative numbers fall into scenario ${D.id}; showing the rules of scenario ${si}.</p>` + html;
    $("#sc-panel").innerHTML = html;
    store.set("ofs.ov.dt", di); store.set("ofs.ov.sc", si);
  };
  dbox.addEventListener("click", e=>{ const b = e.target.closest("button"); if(b){ di = +b.dataset.i; show(); } });
  box.addEventListener("click", e=>{ const b = e.target.closest("button"); if(b){ si = +b.dataset.id; show(); } });
  show();
  scApi.set = (d,s) => { di = d; si = s; show(); };
}
const scApi = { set(){} };
function renderComboMatrix(){
  const head = `<table><thead><tr><th>Prior RTH</th>${SC.map(s=>`<th>${s.id} · ${s.n}</th>`).join("")}</tr></thead><tbody>`;
  const body = DT_OPTS.map(([k,dn],i) => { const t = dtPeriods(k,dn);
    return `<tr><td><b>${dtLabel(k,dn)}</b></td>${SC.map(s=>{ const c = combo(k, t.dir, s.id); return `<td><button class="mx" data-i="${i}" data-s="${s.id}" aria-label="${dtLabel(k,dn)} with scenario ${s.id}"><span class="chip ${c.cls}">${c.tone}</span></button></td>`; }).join("")}</tr>`; }).join("");
  $("#cx-table").innerHTML = head + body + "</tbody></table>";
  const show = (i,s) => {
    const [k,dn] = DT_OPTS[i], t = dtPeriods(k,dn), c = combo(k, t.dir, +s), d = DT.find(x=>x.k===k), sc = SC_BY(+s);
    $$("#cx-table button.mx").forEach(b=>b.classList.toggle("on", b.dataset.i===String(i) && b.dataset.s===String(s)));
    $("#cx-detail").innerHTML = `<div class="grid g3" style="margin-top:6px">
      <div class="card"><span class="k">Prior RTH · ${dtLabel(k,dn)}</span><p class="small">${d.sig}</p><p class="small muted">${d.mean}</p></div>
      <div class="card"><span class="k">OVN · scenario ${sc.id}</span><p class="small">${sc.n}: ${sc.short}</p></div>
      <div class="card"><span class="k">Combining</span><p><span class="chip ${c.cls}">${c.tone}</span></p><p class="small">${c.t}</p><p class="small"><a href="#kich-ban" data-go="${i},${s}">See the plan chart for this case</a></p></div></div>`;
    const go = $("#cx-detail a[data-go]"); if(go) go.addEventListener("click", ()=>{ scApi.set(+i, +s); });
  };
  $("#cx-table").addEventListener("click", e=>{ const b = e.target.closest("button.mx"); if(b) show(b.dataset.i, b.dataset.s); });
  show(9, 5);
}

/* ---------- 02 builder ---------- */
const BF = { rVah:"b-rvah", rPoc:"b-rpoc", rVal:"b-rval", pdh:"b-pdh", pdl:"b-pdl", oVah:"b-ovah", oPoc:"b-opoc", oVal:"b-oval", onh:"b-onh", onl:"b-onl" };
let lastPlan = "", lastD = null, lastOpen = null;
function initBuilder(){
  const saved = store.get("ofs.ov.builder", null);
  const ex = SC_BY(3).ex;
  Object.entries(BF).forEach(([k,id]) => $("#"+id).value = saved && saved[k]!=null ? saved[k] : ex[k]);
  $("#b-date").value = saved && saved.date ? saved.date : new Date().toLocaleDateString("en-GB");
  $("#b-open").value = saved && saved.open!=null ? saved.open : 28740;
  $("#b-news").value = saved && saved.news ? saved.news : "";
  $("#b-ot").innerHTML = `<option value="">Not set</option>` + OPENS.map(o=>`<option value="${o.k}">${o.n}</option>`).join("");
  $("#b-dt").innerHTML = `<option value="">Not selected</option>` + DT_OPTS.map(([k,dn],i)=>`<option value="${i}">${dtLabel(k,dn)}</option>`).join("");
  if(saved && saved.dt!=null && saved.dt!=="") $("#b-dt").value = saved.dt;
  $("#b-dt").addEventListener("change", build);
  if(saved && saved.ot) $("#b-ot").value = saved.ot;
  if(saved && saved.ib!=null) $("#b-ib").value = saved.ib;
  if(saved && saved.ibpos) $("#b-ibpos").value = saved.ibpos;
  ["b-ot","b-ib","b-ibpos"].forEach(id=>$("#"+id).addEventListener("change", build));
  $("#b-build").addEventListener("click", build);
  $("#b-copy").addEventListener("click", async () => { if(!lastPlan) build(); try{ await navigator.clipboard.writeText(lastPlan); msg("Plan copied."); }catch(e){ msg("The browser blocked copying; select the plan box to copy."); } });
  $("#b-tolog").addEventListener("click", () => {
    if(!lastD) build(); if(!lastD) return;
    $("#l-date").value = $("#b-date").value; $("#l-sc").value = String(lastD.id); $("#l-pct").value = lastD.pct;
    const loc = openLoc(lastD, lastOpen), lo = [...$("#l-open").options].find(o=>o.text===loc); if(lo) $("#l-open").value = lo.value;
    if($("#b-ot").value) $("#l-ot").value = $("#b-ot").value;
    if($("#b-dt").value!=="") $("#l-dt").value = $("#b-dt").value;
    const ibv = parseFloat($("#b-ib").value); if(!isNaN(ibv)) $("#l-ibw").value = ibv<70?"narrow":ibv>130?"wide":"normal";
    location.hash = "log";
  });
  build();
}
function msg(t){ $("#b-msg").textContent = t; setTimeout(()=>{ $("#b-msg").textContent=""; }, 3000); }
function build(){
  const L = {}; let bad = [];
  Object.entries(BF).forEach(([k,id]) => { const v = parseFloat($("#"+id).value); if(isNaN(v)) bad.push(k); L[k] = v; });
  const open = parseFloat($("#b-open").value);
  store.set("ofs.ov.builder", Object.assign({}, L, { date:$("#b-date").value, open: isNaN(open)?null:open, news:$("#b-news").value, ot:$("#b-ot").value, dt:$("#b-dt").value, ib:$("#b-ib").value===""?null:$("#b-ib").value, ibpos:$("#b-ibpos").value }));
  if(bad.length){ $("#b-out").textContent = "Missing numbers: " + bad.join(", "); return; }
  const errs = [];
  if(!(L.rVah > L.rPoc && L.rPoc > L.rVal)) errs.push("RTH needs VAH > POC > VAL");
  if(!(L.oVah > L.oPoc && L.oPoc > L.oVal)) errs.push("OVN needs VAH > POC > VAL");
  if(!(L.pdh >= L.rVah && L.pdl <= L.rVal)) errs.push("PDH ≥ VAH RTH and PDL ≤ VAL RTH");
  if(!(L.onh >= L.oVah && L.onl <= L.oVal)) errs.push("ONH ≥ VAH OVN and ONL ≤ VAL OVN");
  if(errs.length){ $("#b-out").textContent = "Check again: " + errs.join("; ") + "."; return; }
  const D = derive(L), sc = SC_BY(D.id);
  lastD = D; lastOpen = isNaN(open) ? null : open;
  const loc = openLoc(D, lastOpen);
  const width = !D.has ? "no overlap" : D.pct>=60 ? "wide overlap" : D.pct>=25 ? "medium overlap" : "narrow overlap, near rejection of old value";
  const ot = $("#b-ot").value, jj = ot ? judge(D.id, ot, D) : null;
  const ibw = parseFloat($("#b-ib").value), ibpos = $("#b-ibpos").value, ibposT = ibpos ? $("#b-ibpos").selectedOptions[0].text : "";
  const ibCls = isNaN(ibw) ? null : ibw<70 ? "Narrow" : ibw>130 ? "Wide" : "Normal";
  const ibRead = !ibCls ? "" : (ibCls==="Narrow" && ibpos==="out") ? "Trend / Double Distribution → IB-1 go-with, target 1.5x–2x"
    : (ibCls==="Narrow" && ibpos==="in") ? "Normal Variation or Non-Trend → wait for range extension with acceptance"
    : ibCls==="Wide" ? "Normal / Neutral → IB-3 fade the IB edges to TPOC, no breakout"
    : ibpos==="cut" ? "Normal Variation → the overlap edge is the referee: accepted outside → IB-1, back inside → IB-2"
    : `IB ${ibCls.toLowerCase()}${ibpos?", "+ibposT.toLowerCase():""} → wait for one-sided range extension + sloping VWAP`;
  const dti = $("#b-dt").value, dtSel = dti!=="" ? DT_OPTS[+dti] : null, dtT = dtSel ? dtPeriods(dtSel[0], dtSel[1]) : null, cb = dtSel ? combo(dtSel[0], dtT.dir, D.id) : null;
  $("#b-class").innerHTML = `<div class="callout ${D.id>=4&&D.id<=5?"red":D.id===1||D.id===6?"purple":""}"><h4>Scenario ${sc.id} · ${sc.n}</h4><p class="small">${sc.read(D)}</p></div>`
    + (cb ? `<div class="callout purple"><h4>Yesterday ${dtT.name} × scenario ${sc.id} → <span class="chip ${cb.cls}">${cb.tone}</span></h4><p class="small">${cb.t}</p></div>` : `<p class="small muted">Pick the prior RTH day type to add the structure layer.</p>`)
    + (jj ? `<div class="callout"><h4>10:00 · ${OPEN_BY(ot).n} → <span class="chip ${VCLS[jj.v]}">${jj.v}</span></h4><p class="small">${jj.read} ${jj.act}</p><p class="small muted">Day type leans toward: ${jj.days.join(" · ")}</p></div>` : `<p class="small muted">At 10:00 pick the open type to update the plan.</p>`)
    + (ibCls ? `<div class="callout purple"><h4>10:30 · IB ${ibCls} (${ibw}%)</h4><p class="small">${ibRead}</p></div>` : "");
  $("#b-tiles").innerHTML = [
    ["Overlap", D.has?`${fmt(D.ovLo)} – ${fmt(D.ovHi)}`:"There is none"],
    ["% VA RTH", D.has?`${D.pct}% · ${D.pct>=60?"wide":D.pct>=25?"medium":"narrow"}`:"0%"],
    ["Open", loc],
    [D.has?"Overlap height":"Value gap", D.has?`${fmt(D.ovHi-D.ovLo)} pts`:`${fmt(D.gapLo)} – ${fmt(D.gapHi)}`]
  ].map(t=>`<div class="tile"><div class="k">${t[0]}</div><div class="v">${t[1]}</div></div>`).join("");
  $("#b-svg").innerHTML = drawPlan(D, sc, lastOpen);
  const A = sc.A(D), B = sc.B(D);
  const near = [...[["VAH RTH",D.rVah],["POC RTH",D.rPoc],["VAL RTH",D.rVal],["VAH OVN",D.oVah],["POC OVN",D.oPoc],["VAL OVN",D.oVal],["ONH",D.onh],["ONL",D.onl],["PDH",D.pdh],["PDL",D.pdl]]];
  const up = lastOpen==null?null:near.filter(n=>n[1]>lastOpen).sort((a,b)=>a[1]-b[1])[0];
  const dn = lastOpen==null?null:near.filter(n=>n[1]<lastOpen).sort((a,b)=>b[1]-a[1])[0];
  lastPlan =
`PLAN NQ · ${$("#b-date").value}  ·  RTH × OVN Overlap
────────────────────────────────────
SCENARIO ${sc.id}: ${sc.n.toUpperCase()} (${width}${D.has?`, ${D.pct}%`:""})
${sc.read(D)}
${$("#b-news").value?`News: ${$("#b-news").value}\n`:""}
LEVEL
  Prior RTH   : VAH ${fmt(D.rVah)} · POC ${fmt(D.rPoc)} · VAL ${fmt(D.rVal)} · PDH ${fmt(D.pdh)} · PDL ${fmt(D.pdl)}
  OVN         : VAH ${fmt(D.oVah)} · POC ${fmt(D.oPoc)} · VAL ${fmt(D.oVal)} · ONH ${fmt(D.onh)} · ONL ${fmt(D.onl)}
  ${D.has?`Overlap     : ${fmt(D.ovLo)} – ${fmt(D.ovHi)}`:`Value gap   : ${fmt(D.gapLo)} – ${fmt(D.gapHi)}`}

OPEN ${lastOpen==null?"—":fmt(lastOpen)} → ${loc}
  Nearest level: above ${up?`${up[0]} ${fmt(up[1])} (+${fmt(up[1]-lastOpen)})`:"—"} · below ${dn?`${dn[0]} ${fmt(dn[1])} (−${fmt(lastOpen-dn[1])})`:"—"}

EXPECTATIONS
${sc.expect.map(e=>"  • "+e).join("\n")}

SCENARIO A (primary)
  ${A.t}

SCENARIO B (alternative)
  ${B.t}

INVALIDATION
  ${sc.inv(D)}

IB: ${sc.ib}
DO NOT: ${sc.no}
COMMON DAY TYPES: ${DAYS[sc.id].join(" · ")}

PRIOR RTH
${cb ? `  ${dtT.name} → ${cb.tone}
  ${cb.t}
  ${DT.find(x=>x.k===dtSel[0]).key}` : "  (no day type selected)"}

10:00 UPDATE · OPEN TYPE
${jj ? `  ${OPEN_BY(ot).n} → ${jj.v}. ${jj.read}
  ${jj.act}
  Day type leans toward: ${jj.days.join(" · ")}` : "  (not set)"}

10:30 UPDATE · IB
${ibCls ? `  IB ${ibCls} (${ibw}% avg)${ibpos?", "+ibposT:""} → ${ibRead}` : "  (not yet)"}

RULES: orderflow trigger (CVD / delta flip / footprint) + EMA 9/34 not against the trade · no fading a sloping VWAP RTH · max 2–3 trades · stop at 11:30 ET.`;
  $("#b-out").textContent = lastPlan;
}

/* ---------- 03 log ---------- */
function initLog(){
  $("#l-sc").innerHTML = SC.map(s=>`<option value="${s.id}">${s.id} · ${s.n}</option>`).join("");
  $("#l-ot").innerHTML = OPENS.map(o=>`<option value="${o.k}">${o.n}</option>`).join("");
  $("#l-dt").innerHTML = DT_OPTS.map(([k,dn],i)=>`<option value="${i}">${dtLabel(k,dn)}</option>`).join("");
  $("#l-date").value = new Date().toLocaleDateString("en-GB");
  let rows = store.get("ofs.ov.log", []);
  const lmsg = t => { $("#l-msg").textContent = t; setTimeout(()=>{ $("#l-msg").textContent=""; }, 3000); };
  const pct = (a,b) => b ? Math.round(a/b*100)+"%" : "—";
  const lab = (id,v) => { const o = [...$("#"+id).options].find(o=>o.value===v); return o ? o.text : (v||""); };
  const draw = () => {
    store.set("ofs.ov.log", rows);
    const n = rows.length, touched = rows.filter(r=>r.touch==="y"), bounced = touched.filter(r=>r.react==="b1r");
    const aOk = rows.filter(r=>r.ab==="A").length, bOk = rows.filter(r=>r.ab==="B").length;
    const byS = SC.map(s=>{ const rs = rows.filter(r=>+r.sc===s.id); return [s.id, rs.length, rs.filter(r=>r.ab!=="none").length]; });
    $("#l-stats").innerHTML =
      `<div class="tile"><div class="k">Sessions</div><div class="v">${n}/30</div></div>
       <div class="tile"><div class="k">60' edge touched</div><div class="v">${pct(touched.length,n)}</div></div>
       <div class="tile"><div class="k">Bounce on touch</div><div class="v">${pct(bounced.length,touched.length)}</div></div>
       <div class="tile"><div class="k">Plan A / B right</div><div class="v">${pct(aOk,n)} / ${pct(bOk,n)}</div></div>
       <div class="tile"><div class="k">Matrix called it</div><div class="v">${(()=>{ const ev = rows.filter(r=>r.ot); const hit = ev.filter(r=>{ try{ const j = judge(+r.sc, r.ot, derive(SC_BY(+r.sc).ex)); return j.v===r.ab || (j.v==="Wait for IB" && r.ab!=="none"); }catch(e){ return false; } }); return pct(hit.length, ev.length); })()}</div><div class="small muted">matrix verdict matched the correct plan</div></div>` +
      byS.map(([id,c,ok])=>`<div class="tile"><div class="k">Scenario ${id}</div><div class="v">${c}</div><div class="small muted">plan right ${pct(ok,c)}</div></div>`).join("");
    $("#l-rows").innerHTML = rows.map((r,i)=>`<tr><td class="mono">${r.date}</td><td class="small">${r.dt!=null&&r.dt!==""&&DT_OPTS[+r.dt]?dtLabel(...DT_OPTS[+r.dt]):"—"}</td><td>${r.sc}</td><td class="num mono">${r.pct}</td><td class="small">${lab("l-open",r.open)}</td><td>${r.ot?(OPEN_BY(r.ot)||{n:r.ot}).n:"—"}</td><td class="small">${r.ibw?lab("l-ibw",r.ibw):"—"}</td><td>${lab("l-touch",r.touch)}</td><td class="small">${lab("l-react",r.react)}</td><td class="small">${lab("l-day",r.day)}</td><td>${lab("l-ab",r.ab)}</td><td class="small">${r.note||""}</td><td><button data-del="${i}" aria-label="Delete session ${r.date}">Delete</button></td></tr>`).join("") || `<tr><td colspan="13" class="muted small">No sessions yet. Use the "Send to Log" button in Plan Builder or enter one by hand.</td></tr>`;
  };
  $("#l-rows").addEventListener("click", e=>{ const b = e.target.closest("button[data-del]"); if(!b) return; rows.splice(+b.dataset.del,1); draw(); });
  $("#l-add").addEventListener("click", ()=>{
    const r = { date:$("#l-date").value.trim(), sc:$("#l-sc").value, pct:$("#l-pct").value||"", open:$("#l-open").value, dt:$("#l-dt").value, ot:$("#l-ot").value, ibw:$("#l-ibw").value, touch:$("#l-touch").value, react:$("#l-react").value, day:$("#l-day").value, ab:$("#l-ab").value, note:$("#l-note").value.trim() };
    if(!r.date){ lmsg("Enter the date first."); return; }
    rows.push(r); draw(); $("#l-note").value = ""; lmsg("Session added.");
  });
  $("#l-csv").addEventListener("click", async ()=>{
    const csv = "date,prev_day_type,scenario,overlap_pct,open,open_type,ib,touch_60m,reaction,day_type,plan,note\n" + rows.map(r=>[r.date,(r.dt!=null&&r.dt!==""&&DT_OPTS[+r.dt])?dtLabel(...DT_OPTS[+r.dt]):"",r.sc,r.pct,lab("l-open",r.open),r.ot?(OPEN_BY(r.ot)||{n:r.ot}).n:"",r.ibw?lab("l-ibw",r.ibw):"",lab("l-touch",r.touch),lab("l-react",r.react),lab("l-day",r.day),lab("l-ab",r.ab),(r.note||"").replace(/,/g,";")].join(",")).join("\n");
    try{ await navigator.clipboard.writeText(csv); lmsg("CSV copied."); }catch(e){ lmsg("The browser blocked copying."); }
  });
  let armed = false;
  $("#l-clear").addEventListener("click", ()=>{
    if(!armed){ armed = true; $("#l-clear").textContent = "Click again to clear all"; setTimeout(()=>{ armed=false; $("#l-clear").textContent="Clear the whole log"; }, 3000); return; }
    rows = []; draw(); armed = false; $("#l-clear").textContent = "Clear the whole log"; lmsg("Log cleared.");
  });
  draw();
}

/* ---------- 04 quiz ---------- */
const QZ = [
 {q:"RTH VA 28,700–28,800, OVN VA 28,725–28,775. Which scenario?",o:["1 · OVN inside RTH VA","2 · Overlap skewed up","6 · OVN engulfs RTH","4 · OVN above RTH"],a:0,e:"OVN VA entirely inside the RTH VA → balance."},
 {q:"RTH VA 28,680–28,780, OVN VA 28,750–28,830. What is the overlap and which scenario?",o:["28,680–28,830 · scenario 6","28,750–28,780 · scenario 2","28,780–28,830 · scenario 4","No overlap · scenario 4"],a:1,e:"Overlap = [max VAL, min VAH] = [28,750, 28,780]; OVN VA midpoint higher → migrating up."},
 {q:"RTH VA 28,640–28,720, OVN VA 28,760–28,830. How do you read it?",o:["Balance","Overnight rejected old value, imbalance up; gap 28,720–28,760","Value migrating down","Cannot conclude"],a:1,e:"Scenario 4: no overlap, OVN sits above."},
 {q:"Scenario 2 (skewed up). Where is the main long zone?",o:["ONH","Lower overlap edge (VAL OVN)","PDL","POC RTH"],a:1,e:"The first test after the open is usually the lower overlap edge; if it holds, value keeps migrating up."},
 {q:"Scenario 4, RTH opens then a period closes below VAL OVN and enters the gap. Expectation?",o:["Buy more","Failed imbalance; price can run fast back to the RTH VA, short per plan B","Do nothing","Only fade ONH"],a:1,e:"Overnight buyers are trapped, the gap gets crossed fast."},
 {q:"Scenario 6 (OVN engulfs). How to handle A period?",o:["Chase the first break","Do not trade A period, wait for the IB to pick a side","Fade ONH ngay","Short POC"],a:1,e:"The market has not picked a direction; the best window is after 10:30."},
 {q:"The overlap covers 18% of the RTH VA. Meaning?",o:["Strong balance","Narrow overlap: overnight nearly rejected old value, leaning imbalance","Meaningless","Must fade both edges"],a:1,e:"< 25% = narrow."},
 {q:"Why not use the full-session ETH TPO VA to compute the overlap?",o:["ATAS does not have it","ETH TPO is skewed toward overnight (31 OVN periods vs ~14 RTH periods)","Because ETH has no POC","No reason"],a:1,e:"Overlap compares yesterday’s RTH with OVN on the same yardstick."},
 {q:"Scenario 1: you fade the upper overlap edge, but a period closes above it and VWAP RTH starts sloping up. What now?",o:["Hold the trade, wait for it to come back","The fade is wrong; exit and consider plan B (go with the break)","Add to the short","Move the stop further away"],a:1,e:"Exactly the invalidation rule of scenario 1."},
 {q:"Scenario 2 (value migrating up), at 10:00 you see an Open Test Drive ↑: price tests the lower overlap edge then drives up through the open. Verdict?",o:["Switch to B","Keep A, enter on the retest of the lower overlap edge; this is the best setup","Wait for IB","Stand aside all day"],a:1,e:"OTD in the migration direction = A, same logic as OSR."},
 {q:"Scenario 4 (OVN above RTH), RTH Open Drive ↓ through VAL OVN. Verdict?",o:["Keep A, buy the pullback","Switch to B: overnight buyers are trapped, follow the drive down to RTH value","Wait for IB","Fade ONH"],a:1,e:"OD against the overnight direction = B, usually strong."},
 {q:"Scenario 1 (balance), 10:00 is an Open Auction, wide IB at 10:30. Which day type is likely?",o:["Trend","Normal / Non-Trend: fade the overlap edges to TPOC","Double Distribution","Neutral extreme"],a:1,e:"Two-session balance + OA + wide IB = rotation."},
 {q:"Scenario 6 (OVN engulfs), 10:00 is an ORR ↓ after a failed break of VAH RTH. Action?",o:["Long breakout","Fade to TPOC once price crosses the open (B of scenario 6)","Short to ONL right away","Meaningless"],a:1,e:"A failed break of the RTH VA → the wide balance still holds."},
 {q:"Yesterday was a P-shape (short covering), overnight value migrating down (scenario 3). How do you read it?",o:["A needs confirmation","Reinforces A: yesterday’s rally was mostly short covering and is exhausted","Balance","Ignore the day type"],a:1,e:"Weak P + overnight going against it = real aggressive sellers."},
 {q:"Yesterday Trend ↑, overnight OVN below RTH (scenario 5). How to handle it?",o:["Short ngay open","A needs confirmation: a trend day is usually followed by balance, wait for OD/OTD down","Long breakout","Meaningless"],a:1,e:"A reversal right after a trend needs strong confirmation."},
 {q:"Yesterday Non-Trend, overnight value migrating up (scenario 2). Read?",o:["Balance","Reinforces A: a breakout of stored energy","Prefer B","Wait all day"],a:1,e:"Yesterday’s compression + overnight leaving the range = breakout."},
 {q:"The overlap zone looks great but there is no CVD divergence or delta flip yet. Do you enter?",o:["Yes, the zone is strong enough","No; the zone is location, it needs an orderflow trigger","Yes if EMA 9 > 34","Yes if it is Monday"],a:1,e:"The playbook’s general rule."}
];
function shuffle(a){ const b = a.slice(); for(let i=b.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } return b; }
function renderQuiz(){
  const box = $("#quiz"); let right = 0, done = 0;
  box.innerHTML = `<div class="row" style="justify-content:space-between"><h3>${QZ.length} questions</h3><div class="row"><span class="mono small" id="qs" aria-live="polite">0 / ${QZ.length}</span><button id="qr">Reset</button></div></div>` +
    QZ.map((q,i)=>`<div class="q" data-a="${q.a}"><span class="k">Q ${i+1}</span><p><b>${q.q}</b></p><div class="opts">${shuffle(q.o.map((_,k)=>k)).map(k=>`<button data-i="${k}">${q.o[k]}</button>`).join("")}</div><p class="expl" hidden>${q.e}</p></div>`).join("");
  $$(".q", box).forEach(el => el.addEventListener("click", e=>{
    const b = e.target.closest(".opts button"); if(!b || el.dataset.done) return;
    el.dataset.done = "1"; done++; const ok = b.dataset.i===el.dataset.a; if(ok) right++;
    $$(".opts button", el).forEach(x=>{ x.disabled = true; if(x.dataset.i===el.dataset.a) x.classList.add("right"); });
    if(!ok) b.classList.add("wrong");
    $(".expl", el).hidden = false;
    $("#qs").textContent = `${right} / ${QZ.length}` + (done===QZ.length ? (right>=Math.ceil(QZ.length*0.8)?" · Passed":" · Not passed") : "");
  }));
  $("#qr").addEventListener("click", renderQuiz);
}

renderOverview();
renderScenarios();
renderMatrix();
renderComboMatrix();
initBuilder();
initLog();
renderQuiz();
})();
