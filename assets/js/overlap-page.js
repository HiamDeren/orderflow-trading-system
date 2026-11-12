/* Trang RTH × OVN Overlap (testing plan): logic gốc của artifact, bỏ router tab (dùng router chương của core.js) */
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
  if(o>hi) return "Trên cả hai";
  if(o<lo) return "Dưới cả hai";
  return "Khoảng trống";
}

/* ---------- 6 kịch bản ---------- */
const R = { loc:["Location","rth"], tgt:["Target","good"], liq:["Liquidity","liq"], piv:["Pivot","ov"] };
const SC = [
 { id:1, n:"OVN trong VA RTH", short:"Balance · fade 2 mép",
   ex:{rVah:28800,rVal:28700,rPoc:28750,pdh:28860,pdl:28640,oVah:28775,oVal:28725,oPoc:28745,onh:28800,onl:28700},
   read:D=>`Qua đêm chấp nhận value hôm qua: VA OVN (${fmt(D.oVal)}–${fmt(D.oVah)}) nằm gọn trong VA RTH. Overlap = toàn bộ VA OVN, chiếm ${D.pct}% VA RTH.`,
   expect:["Balance. Hai phiên đồng thuận, ít động lực đi xa.","IB thường rộng và nằm trong VA RTH.","Giá xoay giữa hai mép overlap trong A–C; range extension nếu có thường yếu.","Day type hay gặp: Normal / Normal Variation biên độ nhỏ."],
   keys:D=>[["Mép trên overlap (VAH OVN)",D.ovHi,"loc","Fade short khi có CVD divergence"],["Mép dưới overlap (VAL OVN)",D.ovLo,"loc","Fade long khi có absorption"],["POC RTH / POC OVN",null,"tgt",`Target của fade (${fmt(D.rPoc)} / ${fmt(D.oPoc)})`],["VAH / VAL RTH",null,"tgt",`Target nếu phá overlap (${fmt(D.rVah)} / ${fmt(D.rVal)})`],["ONH / ONL",null,"liq",`Biên OSR (${fmt(D.onh)} / ${fmt(D.onl)})`]],
   A:D=>({t:`Fade mép overlap. Short ${fmt(D.ovHi)} hoặc long ${fmt(D.ovLo)} khi CVD divergence + delta flip và VWAP RTH phẳng. Stop ngoài mép vài tick (ngoài ONH/ONL nếu sát). Target POC ${fmt(D.rPoc)}.`, p:[D.ovHi, D.rPoc]}),
   B:D=>({t:`Phá một mép, C và D giữ ngoài overlap, VWAP dốc theo hướng phá → đi theo. Xuống: target VAL RTH ${fmt(D.rVal)} rồi PDL ${fmt(D.pdl)}. Lên: VAH RTH ${fmt(D.rVah)} rồi PDH ${fmt(D.pdh)}.`, p:[D.ovLo, D.rVal]}),
   inv:D=>`Fade sai khi 1 period đóng ngoài mép đang fade và VWAP RTH dốc theo hướng phá.`,
   no:"Vào lệnh giữa hai POC khi chưa có open type rõ.", ib:"Ưu tiên IB-3 (rotation). IB-1 chỉ khi IB hẹp bất thường.",
   open:D=>(D.ovLo+D.ovHi)/2 },
 { id:2, n:"Overlap lệch lên", short:"Value trôi lên · mua mép dưới",
   ex:{rVah:28780,rVal:28680,rPoc:28720,pdh:28820,pdl:28620,oVah:28830,oVal:28750,oPoc:28795,onh:28860,onl:28730},
   read:D=>`Value đang trôi lên. Qua đêm chỉ chấp nhận phần trên của VA hôm qua (${fmt(D.ovLo)}–${fmt(D.ovHi)}) và xây value cao hơn tới ${fmt(D.oVah)}.`,
   expect:["Thiên lên.","Lần test đầu sau open thường là mép dưới overlap (VAL OVN).","Giữ được mép dưới → Normal Variation lên, IB-1 theo hướng lên.","Mất mép dưới → value trôi thất bại, giá về lại value hôm qua."],
   keys:D=>[["Mép dưới overlap (VAL OVN)",D.ovLo,"loc","Zone long chính"],["Mép trên overlap (VAH RTH)",D.ovHi,"piv","Pivot: giữ trên = mạnh"],["POC OVN",D.oPoc,"piv","Giá cân bằng qua đêm"],["VAH OVN → ONH",null,"tgt",`Target A (${fmt(D.oVah)} → ${fmt(D.onh)})`],["POC RTH / VAL RTH",null,"tgt",`Target B (${fmt(D.rPoc)} / ${fmt(D.rVal)})`]],
   A:D=>({t:`Pullback về mép dưới overlap ${fmt(D.ovLo)} giữ được (absorption, CVD không tạo đáy mới, EMA 9 > 34) → long. Stop dưới ${fmt(D.ovLo)} một khoảng nhỏ. Target VAH OVN ${fmt(D.oVah)} rồi ONH ${fmt(D.onh)}.`, p:[D.ovLo, D.onh]}),
   B:D=>({t:`Mất ${fmt(D.ovLo)} và được chấp nhận bên dưới (1 period + VWAP lật xuống) → value trôi lên thất bại → short về POC RTH ${fmt(D.rPoc)} rồi VAL RTH ${fmt(D.rVal)}.`, p:[D.ovLo, D.rPoc]}),
   inv:D=>`A sai khi 1 period đóng dưới ${fmt(D.ovLo)}. B sai khi giá reclaim lại ${fmt(D.ovLo)}.`,
   no:"Short ngay dưới ONH khi giá còn giữ trên overlap.", ib:"IB nằm trên overlap và hẹp → IB-1 lên.",
   open:D=>D.oPoc },
 { id:3, n:"Overlap lệch xuống", short:"Value trôi xuống · bán mép trên",
   ex:{rVah:28820,rVal:28720,rPoc:28780,pdh:28860,pdl:28680,oVah:28750,oVal:28670,oPoc:28705,onh:28770,onl:28640},
   read:D=>`Value đang trôi xuống. Qua đêm chỉ chấp nhận phần dưới của VA hôm qua (${fmt(D.ovLo)}–${fmt(D.ovHi)}) và xây value thấp hơn tới ${fmt(D.oVal)}.`,
   expect:["Thiên xuống.","Lần test đầu sau open thường là mép trên overlap (VAH OVN).","Bị từ chối ở mép trên → Normal Variation xuống, IB-1 hướng xuống.","Reclaim mép trên → value trôi thất bại, giá về lại value hôm qua."],
   keys:D=>[["Mép trên overlap (VAH OVN)",D.ovHi,"loc","Zone short chính"],["Mép dưới overlap (VAL RTH)",D.ovLo,"piv","Pivot: dưới = yếu"],["POC OVN",D.oPoc,"piv","Giá cân bằng qua đêm"],["VAL OVN → ONL",null,"tgt",`Target A (${fmt(D.oVal)} → ${fmt(D.onl)})`],["POC RTH / VAH RTH",null,"tgt",`Target B (${fmt(D.rPoc)} / ${fmt(D.rVah)})`]],
   A:D=>({t:`Hồi lên mép trên overlap ${fmt(D.ovHi)} bị từ chối (CVD divergence, delta flip âm, EMA 9 < 34) → short. Stop trên ${fmt(D.ovHi)} một khoảng nhỏ. Target VAL OVN ${fmt(D.oVal)} rồi ONL ${fmt(D.onl)}.`, p:[D.ovHi, D.onl]}),
   B:D=>({t:`Reclaim ${fmt(D.ovHi)} và được chấp nhận bên trên (1 period + VWAP lật lên) → value trôi xuống thất bại → long về POC RTH ${fmt(D.rPoc)} rồi VAH RTH ${fmt(D.rVah)}.`, p:[D.ovHi, D.rPoc]}),
   inv:D=>`A sai khi 1 period đóng trên ${fmt(D.ovHi)}. B sai khi giá mất lại ${fmt(D.ovHi)}.`,
   no:"Long ngay trên ONL khi giá còn giữ dưới overlap.", ib:"IB nằm dưới overlap và hẹp → IB-1 xuống.",
   open:D=>D.oPoc },
 { id:4, n:"OVN trên RTH", short:"Imbalance lên · RTH phải xác nhận",
   ex:{rVah:28720,rVal:28640,rPoc:28680,pdh:28760,pdl:28600,oVah:28830,oVal:28760,oPoc:28800,onh:28860,onl:28735},
   read:D=>`Qua đêm từ chối value hôm qua và xây value hoàn toàn phía trên. Khoảng ${fmt(D.gapLo)}–${fmt(D.gapHi)} là vùng chưa có value của cả hai phiên.`,
   expect:["Imbalance lên, RTH phải xác nhận trong A–B.","Giữ trên VAL OVN → Open Drive / trend lên, không fade.","Rơi vào khoảng trống và về VA RTH → đảo chiều mạnh vì phe mua qua đêm bị kẹt.","Khoảng trống thường được đi qua nhanh nếu bị xuyên."],
   keys:D=>[["VAL OVN",D.oVal,"loc","Support chính, zone long"],["Khoảng trống",null,"piv",`${fmt(D.gapLo)}–${fmt(D.gapHi)}: giá đi nhanh nếu vào`],["POC OVN",D.oPoc,"piv","Pullback nông"],["ONH",D.onh,"tgt","Target A, sau đó IB extension"],["VAH RTH → POC RTH",null,"tgt",`Target B (${fmt(D.rVah)} → ${fmt(D.rPoc)})`]],
   A:D=>({t:`Giữ trên VAL OVN ${fmt(D.oVal)} trong A–B (Open Drive / Open Test Drive) → mua pullback về ${fmt(D.oVal)} hoặc POC OVN ${fmt(D.oPoc)}. Target ONH ${fmt(D.onh)} rồi IB 1.5x.`, p:[D.oVal, D.onh]}),
   B:D=>({t:`Period đóng dưới ${fmt(D.oVal)}, giá đi vào khoảng trống và được chấp nhận dưới VAH RTH ${fmt(D.rVah)} → short, target POC RTH ${fmt(D.rPoc)}.`, p:[D.oVal, D.rPoc]}),
   inv:D=>`A sai khi period đóng dưới ${fmt(D.oVal)} và VWAP RTH lật xuống. B sai khi giá quay lại trên ${fmt(D.oVal)}.`,
   no:"Fade ONH trong 30 phút đầu khi đang Open Drive.", ib:"IB-1 lên là mặc định; IB-2 chỉ khi IB phá xuống dưới VAL OVN.",
   open:D=>D.oPoc },
 { id:5, n:"OVN dưới RTH", short:"Imbalance xuống · RTH phải xác nhận",
   ex:{rVah:28850,rVal:28770,rPoc:28810,pdh:28880,pdl:28720,oVah:28730,oVal:28660,oPoc:28695,onh:28745,onl:28620},
   read:D=>`Qua đêm từ chối value hôm qua và xây value hoàn toàn phía dưới. Khoảng ${fmt(D.gapLo)}–${fmt(D.gapHi)} là vùng chưa có value của cả hai phiên.`,
   expect:["Imbalance xuống, RTH phải xác nhận trong A–B.","Giữ dưới VAH OVN → trend xuống, không fade.","Sweep ONL rồi reclaim, giá vào lại VA RTH → đảo chiều mạnh (phe bán qua đêm bị kẹt).","Khoảng trống thường được đi qua nhanh nếu bị xuyên."],
   keys:D=>[["VAH OVN",D.oVah,"loc","Resistance chính, zone short"],["Khoảng trống",null,"piv",`${fmt(D.gapLo)}–${fmt(D.gapHi)}: giá đi nhanh nếu vào`],["POC OVN",D.oPoc,"piv","Hồi nông"],["ONL",D.onl,"tgt","Target A và điểm sweep cho OSR"],["VAL RTH → POC RTH",null,"tgt",`Target B (${fmt(D.rVal)} → ${fmt(D.rPoc)})`]],
   A:D=>({t:`Giữ dưới VAH OVN ${fmt(D.oVah)} → bán pullback về ${fmt(D.oVah)} hoặc POC OVN ${fmt(D.oPoc)}. Target ONL ${fmt(D.onl)} rồi IB 1.5x.`, p:[D.oVah, D.onl]}),
   B:D=>({t:`Sweep ONL ${fmt(D.onl)} rồi reclaim, period đóng trên ${fmt(D.oVah)} và vào lại VA RTH → long, target POC RTH ${fmt(D.rPoc)}.`, p:[D.oVah, D.rPoc]}),
   inv:D=>`A sai khi period đóng trên ${fmt(D.oVah)} và VWAP RTH lật lên. B sai khi giá mất lại ${fmt(D.oVah)}.`,
   no:"Bắt đáy ở ONL khi chưa có reclaim.", ib:"IB-1 xuống là mặc định; OSR long chỉ sau sweep + reclaim rõ.",
   open:D=>D.oPoc },
 { id:6, n:"OVN bao trùm RTH", short:"OVN rộng · chờ IB",
   ex:{rVah:28775,rVal:28735,rPoc:28755,pdh:28800,pdl:28700,oVah:28830,oVal:28680,oPoc:28750,onh:28860,onl:28640},
   read:D=>`Qua đêm biến động hai chiều, quét cả hai phía value hôm qua. VA RTH (${fmt(D.rVal)}–${fmt(D.rVah)}) nằm gọn trong VA OVN, overlap = toàn bộ VA RTH.`,
   expect:["Thị trường chưa chọn hướng.","Dễ ra Neutral hoặc balance rộng.","Cửa sổ đẹp nhất là sau 10:30 khi IB đã chọn phía.","Biên OVN rộng là target xa, không phải zone vào sớm."],
   keys:D=>[["VAH RTH (mép trên overlap)",D.rVah,"loc","Phá + accept → long"],["VAL RTH (mép dưới overlap)",D.rVal,"loc","Phá + accept → short"],["POC RTH / OVN",null,"tgt",`Target của fade trong VA (${fmt(D.rPoc)} / ${fmt(D.oPoc)})`],["VAH / VAL OVN",null,"tgt",`Target breakout (${fmt(D.oVah)} / ${fmt(D.oVal)})`],["ONH / ONL",null,"liq",`Liquidity xa (${fmt(D.onh)} / ${fmt(D.onl)})`]],
   A:D=>({t:`Không trade A period. Sau 10:30, IB phá ra ngoài VAH RTH ${fmt(D.rVah)} (hoặc VAL ${fmt(D.rVal)}) và C, D giữ ngoài → đi theo. Target VAH OVN ${fmt(D.oVah)} (hoặc VAL OVN ${fmt(D.oVal)}).`, p:[D.rVah, D.oVah]}),
   B:D=>({t:`IB nằm trong VA RTH, VWAP phẳng → fade ${fmt(D.rVah)} / ${fmt(D.rVal)} về POC ${fmt(D.rPoc)} khi có CVD divergence.`, p:[D.rVah, D.rPoc]}),
   inv:D=>`Breakout sai khi period kế tiếp quay lại vào VA RTH. Fade sai khi IB phá và được chấp nhận.`,
   no:"Đuổi theo cú phá đầu tiên trong A period.", ib:"Chờ IB. IB-1 theo phía phá; IB-3 nếu IB nằm trong VA RTH.",
   open:D=>D.rPoc }
];
const SC_BY = id => SC.find(s=>s.id===id);


/* ---------- Open type × kịch bản ---------- */
const OPENS = [
  {k:"od1",n:"OD ↑",t:"od",d:1},{k:"od-1",n:"OD ↓",t:"od",d:-1},
  {k:"otd1",n:"OTD ↑",t:"otd",d:1},{k:"otd-1",n:"OTD ↓",t:"otd",d:-1},
  {k:"orr1",n:"ORR ↑",t:"orr",d:1},{k:"orr-1",n:"ORR ↓",t:"orr",d:-1},
  {k:"oa",n:"OA",t:"oa",d:0}
];
const OPEN_BY = k => OPENS.find(o=>o.k===k);
const BIAS = {1:0,2:1,3:-1,4:1,5:-1,6:0};
const DAYS = {1:["Normal","Normal Variation (biên độ nhỏ)","Non-Trend"],2:["Normal Variation ↑","Trend ↑ (khi OD/OTD ↑)"],3:["Normal Variation ↓","Trend ↓ (khi OD/OTD ↓)"],4:["Trend ↑","Double Distribution ↑","Đảo chiều mạnh nếu imbalance thất bại"],5:["Trend ↓","Double Distribution ↓","Đảo chiều mạnh nếu imbalance thất bại"],6:["Neutral","Normal","Normal Variation sau IB"]};
const VCLS = {"A":"good","B":"bad","Chờ IB":"ov"};
function judge(id, ok, D){
  const sc = SC_BY(id), o = OPEN_BY(ok), b = BIAS[id], ar = o.d>0?"↑":o.d<0?"↓":"";
  const A = sc.A(D), B = sc.B(D);
  const zA = fmt(A.p[0]), tA = fmt(A.p[1]), zB = fmt(B.p[0]), tB = fmt(B.p[1]);
  if(b !== 0){
    const same = o.d === b, w = b>0 ? "lên" : "xuống";
    if(o.t==="od") return same
      ? {v:"A", read:`RTH đồng ý ngay với hướng qua đêm (${w}).`, act:`Không fade. Vào pullback đầu tiên về ${zA}; target ${tA} rồi IB extension.`, days:[`Trend ${ar}`,`Normal Variation ${ar}`]}
      : {v:"B", read:`RTH mở ngược hẳn hướng qua đêm: phe qua đêm bị kẹt, cú đi thường mạnh.`, act:`Kịch bản B, đi theo drive. Target ${tB}. Không bắt đỉnh/đáy ngược drive.`, days:[`Trend ${ar}`,`Normal Variation ${ar}`]};
    if(o.t==="otd") return same
      ? {v:"A", read:`Test ngược hướng (thường vào zone ${zA}) rồi drive theo hướng qua đêm. Đây là setup đẹp nhất của A, cùng logic OSR.`, act:`Vào ở retest level vừa test sau khi giá reclaim open. Stop sau điểm test. Target ${tA}.`, days:[`Normal Variation ${ar}`,`Trend ${ar}`]}
      : {v:"B", read:`Test theo hướng qua đêm (thường ONH/ONL) thất bại rồi drive ngược lại.`, act:`Kịch bản B, vào ở retest open hoặc level vừa reclaim. Target ${tB}.`, days:[`Normal Variation ${ar}`]};
    if(o.t==="orr") return same
      ? {v:"A", read:`Giá thử ngược hướng qua đêm, bị từ chối, quay lại xuyên open theo hướng qua đêm.`, act:`A sau khi giá xuyên open. Stop ngoài cực trị bị từ chối. Target ${tA}.`, days:[`Normal Variation ${ar}`]}
      : {v:"B", read:`Giá đi theo hướng qua đêm, bị từ chối (thường ở ONH/ONL hoặc cạnh VA OVN), quay xuyên open.`, act:`B sau khi giá xuyên open. Stop ngoài cực trị bị từ chối. Target ${tB}.`, days:[`Normal Variation ${ar}`,"Neutral"]};
    return {v:"Chờ IB", read:`Qua đêm có hướng nhưng RTH chưa phe nào chủ động: value trôi chưa có người theo.`, act:`Không trade A period. Chỉ phản ứng ở zone ${zA} khi có trigger; quyết định lại lúc 10:30 bằng IB.`, days:["Normal","Neutral"]};
  }
  const up = o.d>0;
  if(id===1){
    if(o.t==="od"||o.t==="otd") return {v:"B", read:`${o.t==="od"?"Open Drive":"Open Test Drive"} phá balance mà hai phiên vừa đồng thuận.`, act:`Huỷ fade. Đi theo ${o.t==="otd"?"sau khi giá reclaim open, vào ở retest mép overlap":"pullback đầu tiên"}; target ${up?fmt(D.rVah)+" rồi PDH "+fmt(D.pdh):fmt(D.rVal)+" rồi PDL "+fmt(D.pdl)}.`, days:[`Normal Variation ${ar}`,`Trend ${ar}`]};
    if(o.t==="orr") return {v:"A", read:`Đi ra một mép overlap rồi bị từ chối, quay xuyên open: đúng tinh thần balance.`, act:`Fade theo hướng ORR, target mép overlap đối diện (${up?fmt(D.ovHi):fmt(D.ovLo)}) và TPOC.`, days:["Normal","Normal Variation (nhỏ)"]};
    return {v:"A", read:`Khớp nhất với kịch bản 1: hai phiên đồng thuận, RTH cũng chưa chọn hướng.`, act:`Fade hai mép overlap ${fmt(D.ovLo)} / ${fmt(D.ovHi)} về TPOC khi có trigger.`, days:["Normal","Non-Trend"]};
  }
  // id === 6
  if(o.t==="od"||o.t==="otd") return {v:"A", read:`RTH chọn phía sớm, không cần chờ hết IB.`, act:`Đi theo khi giá được chấp nhận ngoài ${up?"VAH RTH "+fmt(D.rVah):"VAL RTH "+fmt(D.rVal)}; target ${up?"VAH OVN "+fmt(D.oVah)+" rồi ONH "+fmt(D.onh):"VAL OVN "+fmt(D.oVal)+" rồi ONL "+fmt(D.onl)}.`, days:[`Normal Variation ${ar}`,`Trend ${ar}`]};
  if(o.t==="orr") return {v:"B", read:`Thử phá VA RTH rồi bị từ chối: balance rộng vẫn giữ.`, act:`Fade về TPOC ${fmt(D.rPoc)} sau khi giá xuyên open; stop ngoài cực trị bị từ chối.`, days:["Normal","Neutral"]};
  return {v:"Chờ IB", read:`Qua đêm hai chiều, RTH cũng chưa ai chủ động.`, act:`Không trade đến 10:30. IB phá ra ngoài VA RTH và được chấp nhận → A; IB nằm trong VA RTH → B.`, days:["Neutral","Normal"]};
}
function renderMatrix(){
  const head = `<table><thead><tr><th>Kịch bản (9:25)</th>${OPENS.map(o=>`<th>${o.n}</th>`).join("")}</tr></thead><tbody>`;
  const body = SC.map(sc => { const D = derive(sc.ex);
    return `<tr><td><b>${sc.id}</b> · ${sc.n}</td>${OPENS.map(o=>{ const j = judge(sc.id,o.k,D); return `<td><button class="mx" data-s="${sc.id}" data-o="${o.k}" aria-label="Kịch bản ${sc.id} với ${o.n}"><span class="chip ${VCLS[j.v]}">${j.v}</span></button></td>`; }).join("")}</tr>`; }).join("");
  $("#mx-table").innerHTML = head + body + "</tbody></table>";
  const show = (s,k) => {
    const sc = SC_BY(+s), D = derive(sc.ex), o = OPEN_BY(k), j = judge(sc.id,k,D);
    $$("#mx-table button.mx").forEach(b=>b.classList.toggle("on", b.dataset.s===String(s) && b.dataset.o===k));
    $("#mx-detail").innerHTML = `<div class="grid g3" style="margin-top:6px">
      <div class="card"><span class="k">Kịch bản ${sc.id} × ${o.n}</span><p><span class="chip ${VCLS[j.v]}">${j.v}</span></p><p class="small">${j.read}</p></div>
      <div class="card"><span class="k">Hành động (số minh hoạ)</span><p class="small">${j.act}</p></div>
      <div class="card"><span class="k">Day type nghiêng về</span><p class="small">${j.days.join(" · ")}</p><p class="small muted">Xác nhận lại bằng IB lúc 10:30.</p></div></div>`;
  };
  $("#mx-table").addEventListener("click", e=>{ const b = e.target.closest("button.mx"); if(b) show(b.dataset.s, b.dataset.o); });
  show(2,"otd1");
}


/* ---------- Day type của RTH hôm qua ---------- */
const DT = [
 {k:"normal",n:"Normal",dir:0,flip:false,p:[[12,30],[13,29],[16,26],[15,24],[17,25],[18,24],[16,23],[17,25],[19,24],[18,23],[17,23],[19,25],[20,23]],o:20,c:21,
  sig:"IB rất rộng, gần như cả range; không có range extension.", mean:"Large timeframe đặt biên ngay từ sớm, phần còn lại là rotation.", key:"IB hôm qua ≈ range: PDH/PDL là biên mạnh."},
 {k:"nvar",n:"Normal Variation",dir:1,flip:true,p:[[16,26],[15,24],[18,25],[22,31],[25,33],[26,32],[24,30],[25,31],[26,30],[25,31],[24,29],[25,30],[26,29]],o:19,c:28,
  sig:"IB trung bình, range extension một phía khoảng 1.2–2x IB.", mean:"Initiative activity xuất hiện sau IB và dời value theo hướng RE.", key:"Đỉnh/đáy range extension và cạnh IB hôm qua."},
 {k:"trend",n:"Trend",dir:1,flip:true,p:[[2,7],[5,10],[8,13],[11,16],[14,19],[17,22],[19,24],[22,27],[24,29],[26,31],[29,34],[31,36],[33,38]],o:3,c:37,
  sig:"IB hẹp, profile mỏng và dài, close ở cực trị.", mean:"Một phe kiểm soát hoàn toàn. VA ít ý nghĩa vì value không được xây đủ.", key:"Close ở cực trị và các đoạn TPO mỏng trong thân profile."},
 {k:"dd",n:"Double Distribution",dir:1,flip:true,p:[[4,10],[5,11],[6,10],[5,9],[7,11],[10,23],[20,27],[21,28],[22,27],[20,26],[21,27],[22,28],[23,27]],o:6,c:25,
  sig:"Hai vùng value tách bởi dải single prints.", mean:"Balance sáng, thông tin mới đẩy giá sang vùng balance thứ hai.", key:"Dải single prints giữa hai distribution là level quan trọng nhất."},
 {k:"neutral",n:"Neutral",dir:0,flip:false,p:[[14,24],[15,25],[17,29],[18,26],[15,23],[9,17],[11,19],[13,20],[15,21],[16,22],[17,23],[16,22],[17,21]],o:19,c:19,
  sig:"Range extension cả hai phía IB, close giữa range (neutral center).", mean:"Hai phe cân bằng, chưa ai thắng. Nếu close ở cực trị (neutral extreme) thì ưu tiên hướng close.", key:"Cạnh IB hôm qua và hai đầu range extension."},
 {k:"nontrend",n:"Non-Trend",dir:0,flip:false,p:[[17,22],[18,22],[17,21],[18,22],[17,21],[18,21],[17,22],[18,21],[17,21],[18,22],[17,21],[18,21],[18,21]],o:19,c:20,
  sig:"IB hẹp, cả ngày gần như không rời IB.", mean:"Thiếu thông tin, năng lượng đang tích luỹ.", key:"Biên range hẹp hôm qua = level breakout."},
 {k:"pshape",n:"P-shape",dir:1,weak:true,flip:false,p:[[2,9],[7,15],[13,22],[18,26],[21,27],[20,26],[21,27],[22,26],[21,26],[22,27],[21,26],[22,26],[22,25]],o:3,c:24,
  sig:"Thân mỏng phía dưới, value phình ở trên.", mean:"Thường là short covering, không hẳn là new buying.", key:"Phần thân mỏng của P: vùng giá đi nhanh nếu quay lại."},
 {k:"bshape",n:"b-shape",dir:-1,weak:true,flip:false,p:null,o:26,c:5,
  sig:"Thân mỏng phía trên, value phình ở dưới.", mean:"Thường là long liquidation, không hẳn là new selling.", key:"Phần thân mỏng của b: vùng giá đi nhanh nếu quay lại."}
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
  // vùng mỏng dài nhất (≤ 1 TPO) bên trong range
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
/* Kết hợp day type hôm qua × kịch bản OVN */
function combo(dtk, dir, id){
  const d = DT.find(x=>x.k===dtk), b = BIAS[id], wk = !!d.weak;
  const W = b>0?"lên":"xuống";
  if(dir!==0 && b!==0){
    const same = dir===b;
    if(wk) return same
      ? {tone:"A cần xác nhận", cls:"ov", t:`${d.n} hôm qua là ${dir>0?"short covering":"long liquidation"}, qua đêm tiếp tục ${W}. Cần thấy new ${dir>0?"buying":"selling"} thật (OD/OTD, giữ ngoài overlap) mới tin A. Nếu RTH quay về phần thân mỏng của ${d.n}, giá đi rất nhanh theo hướng B.`}
      : {tone:"Củng cố A", cls:"good", t:`Cú ${dir>0?"tăng":"giảm"} của ${d.n} hôm qua chủ yếu là ${dir>0?"short covering":"long liquidation"} và đã hết lực; qua đêm quay ${W} xác nhận phe chủ động thật. A được củng cố, target có thể kéo về thân mỏng của ${d.n}.`};
    if(dtk==="trend") return same
      ? {tone:"Củng cố A", cls:"good", t:`Trend hôm qua và qua đêm cùng hướng ${W}: imbalance nhiều phiên. Không fade; chỉ đi theo pullback. Cẩn thận ngày sau trend thường biên độ nhỏ hơn.`}
      : {tone:"A cần xác nhận", cls:"ov", t:`Qua đêm đảo ngược ngay sau ngày Trend. Trend day hay được theo sau bởi balance hơn là đảo chiều thật, nên A (ngược trend) cần OD/OTD xác nhận. Nếu RTH quay lại hướng trend → B mạnh.`};
    if(dtk==="dd") return same
      ? {tone:"Củng cố A", cls:"good", t:`Double Distribution hôm qua cùng hướng qua đêm: distribution thứ hai được chấp nhận. Dải single prints hôm qua là support/resistance xa cho B.`}
      : {tone:"A cần xác nhận", cls:"ov", t:`Qua đêm quay ngược về phía distribution đầu tiên. Dải single prints hôm qua là chỗ thị trường hay đi nhanh qua: nếu bị xuyên thì A chạy nhanh; nếu giữ thì B.`};
    return same
      ? {tone:"Củng cố A", cls:"good", t:`${d.n} hôm qua (range extension ${W}) và qua đêm cùng hướng: value đang migrate nhiều phiên. Ưu tiên go-with.`}
      : {tone:"A cần xác nhận", cls:"ov", t:`Qua đêm đi ngược hướng range extension hôm qua. A cần open type xác nhận; nếu RTH quay lại phía RE hôm qua → B.`};
  }
  if(dir!==0 && b===0){
    const dw = dir>0?"lên":"xuống";
    if(wk) return {tone:"Balance", cls:"", t:`Sau ${d.n} (${dir>0?"short covering":"long liquidation"}), qua đêm balance trong value hôm qua: lực ${dw} chưa có người theo. Fade mép overlap; nếu breakout thì ưu tiên hướng ngược ${d.n}.`};
    return {tone:"Balance · nghiêng theo hôm qua", cls:"", t:`Sau ngày ${d.n} ${dw}, qua đêm tiêu hoá trong value hôm qua. Kỳ vọng balance trong A–C; nếu breakout có acceptance thì ưu tiên hướng ${dw} của hôm qua.`};
  }
  if(dir===0 && b!==0){
    if(dtk==="nontrend") return {tone:"Củng cố A", cls:"good", t:`Non-Trend hôm qua là năng lượng tích luỹ; qua đêm rời range đi ${W} là breakout của compression. A mạnh nếu RTH không quay lại range hẹp hôm qua.`};
    if(dtk==="neutral") return {tone:"A cần xác nhận", cls:"ov", t:`Neutral center hôm qua: hai phe cân bằng. Qua đêm chọn hướng ${W} là thông tin mới, cần RTH xác nhận bằng OD/OTD. Nếu hôm qua là neutral extreme cùng hướng ${W} thì nâng lên "Củng cố A".`};
    return {tone:"A cần xác nhận", cls:"ov", t:`Hôm qua ${d.n} (balance), qua đêm chọn hướng ${W}. Đây là thông tin mới; A có xác suất tốt khi RTH xác nhận bằng OD/OTD và giữ ngoài overlap.`};
  }
  if(dtk==="nontrend") return {tone:"Balance · sắp breakout", cls:"ov", t:`Non-Trend nối tiếp balance qua đêm: năng lượng nén nhiều phiên. Không fade sâu; chuẩn bị đi theo breakout có acceptance.`};
  return {tone:"Balance", cls:"", t:`${d.n} hôm qua + qua đêm balance trong value: rotation là mặc định. Nếu nhiều ngày liên tiếp như vậy, dựng composite.`};
}
const DT_OPTS = [["normal",false],["nvar",false],["nvar",true],["trend",false],["trend",true],["dd",false],["dd",true],["neutral",false],["nontrend",false],["pshape",false],["bshape",false]];
const dtLabel = (k,down) => { const d = DT.find(x=>x.k===k); return d.n + (d.flip ? (down?" ↓":" ↑") : ""); };

/* ---------- chart ---------- */
/* Dựng các period TPO minh hoạ quanh đúng VA / TPOC đã nhập (hình dạng là minh hoạ, mức giá là của bạn) */
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
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="${MONO}" role="img" aria-label="Chart plan kịch bản ${sc.id}">
  <defs>
    <marker id="ag" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="${COL.good}" stroke-width="1.6"/></marker>
    <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="${COL.bad}" stroke-width="1.6"/></marker>
  </defs>`;
  // axis
  const tick = Math.max(5, Math.round((pmax-pmin)/7/5)*5);
  for(let p = Math.ceil(pmin/tick)*tick; p <= pmax; p += tick){
    s += `<line x1="${x0-6}" x2="${xEnd}" y1="${Y(p)}" y2="${Y(p)}" stroke="#202328"/><text x="${x0-10}" y="${Y(p)+4}" font-size="11" text-anchor="end" fill="#9aa0a8">${fmt(p)}</text>`;
  }
  s += `<text x="${x0+70}" y="20" font-size="12" text-anchor="middle" fill="#cfd3d8">TPO RTH hôm qua${D.rPeriods?" · "+D.rDtName:" (A–N)"}</text><text x="${x0+250}" y="20" font-size="12" text-anchor="middle" fill="#cfd3d8">TPO OVN (31 period)</text><text x="${x0+400}" y="20" font-size="12" text-anchor="middle" fill="#cfd3d8">9:30 → 11:30</text>`;
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
  s += `<text x="${xLab}" y="${H-4}" font-size="10.5" fill="#9aa0a8">${D.has?"Dải cam = overlap":"Dải xám = khoảng trống value"}</text>`;
  s += `</svg>`;
  return s;
}

/* ---------- 00 overview ---------- */
const DRAW = [
 ["1","VAH RTH","16:14","Cạnh trên value hôm qua: fade khi bị từ chối, retest khi đã được chấp nhận","Line đứt · #FFD4537E"],
 ["2","VAL RTH","16:14","Cạnh dưới value hôm qua, đối xứng VAH","Line đứt · #FFD4537E"],
 ["3","TPOC RTH","16:14","Giá thị trường dành nhiều thời gian nhất hôm qua: target của fade, pivot bias","Line liền 2px · #FFEF9F27"],
 ["4","PDH / PDL","16:14","Biên range hôm qua, nơi stop tập trung: xếp loại open, điểm sweep","Line mảnh · #FFE6E8EB"],
 ["5","Tail / poor H-L / single prints","16:14","Tail = cạnh mạnh; poor = target; single prints = vùng giá đi nhanh","Box nhỏ · #66E3A33A"],
 ["6","VAH OVN","9:29","Cạnh trên value qua đêm; so với VA RTH để biết value trôi hướng nào","Line đứt · #FF7F77DD"],
 ["7","VAL OVN","9:29","Cạnh dưới value qua đêm","Line đứt · #FF7F77DD"],
 ["8","TPOC OVN","9:29","Giá qua đêm dành nhiều thời gian nhất; target gần nhất sau open","Line chấm · #FFEF9F27"],
 ["9","ONH / ONL","9:29","Biên OVN cho setup OSR (sweep → reclaim → retest)","Line mảnh · #FFB39DDB"],
 ["10","Box overlap (hoặc khoảng trống)","9:29","Zone chính; hình dạng của nó quyết định kịch bản 1–6","Box · fill #29EF9F27, viền #FFBA7517"],
 ["11","RTH Open","9:30","Phân loại open type","Line · #FFFF6B9A"],
 ["12","IB High / Low / Mid","10:30","Setup IB-1 / IB-2 / IB-3; IB mid để dời stop","Line · #FFC9A96E"],
 ["13","Zone orderflow","Trong phiên","Absorption / stacked imbalance ngay tại level: trigger và chỗ đặt stop","Box ngắn · #66FF5252 / #6669F0AE"]
];
function renderOverview(){
  $("#draw-list").innerHTML = DRAW.map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td class="mono">${r[2]}</td><td class="small">${r[3]}</td><td class="small mono">${r[4]}</td></tr>`).join("");
  const steps = [
    ["Tính overlap (VA TPO)","Lo = max(VAL RTH, VAL OVN), Hi = min(VAH RTH, VAH OVN), đều là VA của TPO. Hi > Lo → có overlap."],
    ["VA OVN nằm gọn trong VA RTH?","Có → Kịch bản 1 (balance)."],
    ["VA OVN bao trùm VA RTH?","Có → Kịch bản 6 (chờ IB)."],
    ["Có overlap nhưng lệch?","Giữa VA OVN cao hơn giữa VA RTH → Kịch bản 2 (trôi lên). Thấp hơn → Kịch bản 3 (trôi xuống)."],
    ["Không có overlap?","VAL OVN ≥ VAH RTH → Kịch bản 4 (OVN trên). Ngược lại → Kịch bản 5 (OVN dưới)."],
    ["Ghi % overlap","= độ dày overlap / độ dày VA RTH. ≥ 60% rộng, 25–60% vừa, < 25% hẹp (gần như từ chối)."]
  ];
  $("#classify-flow").innerHTML = steps.map((s,i)=>`<div class="step"><span class="dot">${i+1}</span><div><b>${s[0]}</b><p class="small">${s[1]}</p></div></div>`).join("");
}

/* ---------- 01 scenarios ---------- */
function scenarioHtml(D, sc, open){
  const A = sc.A(D), B = sc.B(D);
  const keys = sc.keys(D);
  return `
    <div class="row" style="justify-content:space-between"><h3>Kịch bản ${sc.id} · ${sc.n}</h3><span class="chip ${D.has?"ov":""}">${D.has?`Overlap ${fmt(D.ovLo)}–${fmt(D.ovHi)} · ${D.pct}% VA RTH`:`Khoảng trống ${fmt(D.gapLo)}–${fmt(D.gapHi)}`}</span></div>
    <div class="svgwrap">${drawPlan(D, sc, open)}</div>
    <div class="grid g2">
      <div class="card"><span class="k">Đọc context</span><p>${sc.read(D)}</p></div>
      <div class="card"><span class="k">Kỳ vọng</span><ul class="clean small">${sc.expect.map(e=>`<li>${e}</li>`).join("")}</ul></div>
    </div>
    ${D.dt ? (()=>{ const d = DT.find(x=>x.k===D.dt.k), cb = combo(D.dt.k, D.dt.dir, sc.id), pos = Math.round((D.rClose-D.pdl)/(D.pdh-D.pdl)*100);
      return `<div class="grid g2">
        <div class="card"><span class="k">RTH hôm qua · ${D.dt.name}</span><p class="small">${d.sig} ${d.mean}</p><p class="small muted">Close ở ${pos}% range · ${d.key}</p></div>
        <div class="card"><span class="k">Kết hợp với kịch bản ${sc.id}</span><p><span class="chip ${cb.cls}">${cb.tone}</span></p><p class="small">${cb.t}</p></div></div>`; })() : ""}
    <div class="tablewrap"><table><thead><tr><th>Key level</th><th class="num">Giá</th><th>Vai trò</th><th>Hành động</th></tr></thead><tbody>
      ${keys.map(k=>`<tr><td><b>${k[0]}</b></td><td class="num mono">${k[1]==null?"—":fmt(k[1])}</td><td><span class="chip ${R[k[2]][1]}">${R[k[2]][0]}</span></td><td class="small">${k[3]}</td></tr>`).join("")}
      ${D.dt ? `<tr><td><b>Close hôm qua</b></td><td class="num mono">${fmt(D.rClose)}</td><td><span class="chip ov">Pivot</span></td><td class="small">Vị trí close quyết định đọc ${D.dt.name}: gần cực trị = mạnh, giữa = balance</td></tr>
      <tr><td><b>IB hôm qua</b></td><td class="num mono">${fmt(D.rIB[0])}–${fmt(D.rIB[1])}</td><td><span class="chip">Context</span></td><td class="small">IB rộng/hẹp hôm qua; cạnh IB là level phụ</td></tr>
      ${D.thin ? `<tr><td><b>Vùng TPO mỏng hôm qua</b></td><td class="num mono">${fmt(D.thin[0])}–${fmt(D.thin[1])}</td><td><span class="chip rth">Location</span></td><td class="small">Single prints / thân mỏng: giá đi nhanh nếu vào, test lần đầu hay phản ứng</td></tr>` : ""}` : ""}
    </tbody></table></div>
    <div class="ab">
      <div class="card a"><span class="k">Kịch bản A · chính</span><p class="small">${A.t}</p></div>
      <div class="card b"><span class="k">Kịch bản B · thay thế</span><p class="small">${B.t}</p></div>
    </div>
    <div class="card"><span class="k">Day type hay gặp với kịch bản này</span><p class="small">${DAYS[sc.id].map(x=>`<span class="chip">${x}</span>`).join(" ")}</p></div>
    <div class="tablewrap"><table><thead><tr><th>Open type lúc 10:00</th><th>Kết luận</th><th>Đọc</th><th>Hành động</th><th>Day type nghiêng về</th></tr></thead><tbody>
      ${OPENS.map(o=>{ const j = judge(sc.id,o.k,D); return `<tr><td><b>${o.n}</b></td><td><span class="chip ${VCLS[j.v]}">${j.v}</span></td><td class="small">${j.read}</td><td class="small">${j.act}</td><td class="small">${j.days.join(" · ")}</td></tr>`; }).join("")}
    </tbody></table></div>
    <div class="grid g3">
      <div class="card"><span class="k">Invalidation</span><p class="small">${sc.inv(D)}</p></div>
      <div class="card"><span class="k">Initial Balance</span><p class="small">${sc.ib}</p></div>
      <div class="card"><span class="k">Không làm</span><p class="small">${sc.no}</p></div>
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
    if(D.id !== si) html = `<p class="small muted">Với day type này, số minh hoạ rơi vào kịch bản ${D.id}; đang hiển thị theo quy tắc của kịch bản ${si}.</p>` + html;
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
  const head = `<table><thead><tr><th>RTH hôm qua</th>${SC.map(s=>`<th>${s.id} · ${s.n}</th>`).join("")}</tr></thead><tbody>`;
  const body = DT_OPTS.map(([k,dn],i) => { const t = dtPeriods(k,dn);
    return `<tr><td><b>${dtLabel(k,dn)}</b></td>${SC.map(s=>{ const c = combo(k, t.dir, s.id); return `<td><button class="mx" data-i="${i}" data-s="${s.id}" aria-label="${dtLabel(k,dn)} với kịch bản ${s.id}"><span class="chip ${c.cls}">${c.tone}</span></button></td>`; }).join("")}</tr>`; }).join("");
  $("#cx-table").innerHTML = head + body + "</tbody></table>";
  const show = (i,s) => {
    const [k,dn] = DT_OPTS[i], t = dtPeriods(k,dn), c = combo(k, t.dir, +s), d = DT.find(x=>x.k===k), sc = SC_BY(+s);
    $$("#cx-table button.mx").forEach(b=>b.classList.toggle("on", b.dataset.i===String(i) && b.dataset.s===String(s)));
    $("#cx-detail").innerHTML = `<div class="grid g3" style="margin-top:6px">
      <div class="card"><span class="k">RTH hôm qua · ${dtLabel(k,dn)}</span><p class="small">${d.sig}</p><p class="small muted">${d.mean}</p></div>
      <div class="card"><span class="k">OVN · kịch bản ${sc.id}</span><p class="small">${sc.n}: ${sc.short}</p></div>
      <div class="card"><span class="k">Kết hợp</span><p><span class="chip ${c.cls}">${c.tone}</span></p><p class="small">${c.t}</p><p class="small"><a href="#kich-ban" data-go="${i},${s}">Xem chart plan của trường hợp này</a></p></div></div>`;
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
  $("#b-date").value = saved && saved.date ? saved.date : new Date().toLocaleDateString("vi-VN");
  $("#b-open").value = saved && saved.open!=null ? saved.open : 28740;
  $("#b-news").value = saved && saved.news ? saved.news : "";
  $("#b-ot").innerHTML = `<option value="">Chưa xác định</option>` + OPENS.map(o=>`<option value="${o.k}">${o.n}</option>`).join("");
  $("#b-dt").innerHTML = `<option value="">Chưa chọn</option>` + DT_OPTS.map(([k,dn],i)=>`<option value="${i}">${dtLabel(k,dn)}</option>`).join("");
  if(saved && saved.dt!=null && saved.dt!=="") $("#b-dt").value = saved.dt;
  $("#b-dt").addEventListener("change", build);
  if(saved && saved.ot) $("#b-ot").value = saved.ot;
  if(saved && saved.ib!=null) $("#b-ib").value = saved.ib;
  if(saved && saved.ibpos) $("#b-ibpos").value = saved.ibpos;
  ["b-ot","b-ib","b-ibpos"].forEach(id=>$("#"+id).addEventListener("change", build));
  $("#b-build").addEventListener("click", build);
  $("#b-copy").addEventListener("click", async () => { if(!lastPlan) build(); try{ await navigator.clipboard.writeText(lastPlan); msg("Đã copy plan."); }catch(e){ msg("Trình duyệt chặn copy, bôi đen khung plan để copy."); } });
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
  if(bad.length){ $("#b-out").textContent = "Thiếu số: " + bad.join(", "); return; }
  const errs = [];
  if(!(L.rVah > L.rPoc && L.rPoc > L.rVal)) errs.push("RTH cần VAH > POC > VAL");
  if(!(L.oVah > L.oPoc && L.oPoc > L.oVal)) errs.push("OVN cần VAH > POC > VAL");
  if(!(L.pdh >= L.rVah && L.pdl <= L.rVal)) errs.push("PDH ≥ VAH RTH và PDL ≤ VAL RTH");
  if(!(L.onh >= L.oVah && L.onl <= L.oVal)) errs.push("ONH ≥ VAH OVN và ONL ≤ VAL OVN");
  if(errs.length){ $("#b-out").textContent = "Kiểm tra lại: " + errs.join("; ") + "."; return; }
  const D = derive(L), sc = SC_BY(D.id);
  lastD = D; lastOpen = isNaN(open) ? null : open;
  const loc = openLoc(D, lastOpen);
  const width = !D.has ? "không có overlap" : D.pct>=60 ? "overlap rộng" : D.pct>=25 ? "overlap vừa" : "overlap hẹp, gần như từ chối value cũ";
  const ot = $("#b-ot").value, jj = ot ? judge(D.id, ot, D) : null;
  const ibw = parseFloat($("#b-ib").value), ibpos = $("#b-ibpos").value, ibposT = ibpos ? $("#b-ibpos").selectedOptions[0].text : "";
  const ibCls = isNaN(ibw) ? null : ibw<70 ? "Hẹp" : ibw>130 ? "Rộng" : "Bình thường";
  const ibRead = !ibCls ? "" : (ibCls==="Hẹp" && ibpos==="out") ? "Trend / Double Distribution → IB-1 đi theo, target 1.5x–2x"
    : (ibCls==="Hẹp" && ibpos==="in") ? "Normal Variation hoặc Non-Trend → chờ range extension có acceptance"
    : ibCls==="Rộng" ? "Normal / Neutral → IB-3 fade cạnh IB về TPOC, không breakout"
    : ibpos==="cut" ? "Normal Variation → mép overlap là trọng tài: accept ngoài → IB-1, quay vào → IB-2"
    : `IB ${ibCls.toLowerCase()}${ibpos?", "+ibposT.toLowerCase():""} → chờ range extension một phía + VWAP dốc`;
  const dti = $("#b-dt").value, dtSel = dti!=="" ? DT_OPTS[+dti] : null, dtT = dtSel ? dtPeriods(dtSel[0], dtSel[1]) : null, cb = dtSel ? combo(dtSel[0], dtT.dir, D.id) : null;
  $("#b-class").innerHTML = `<div class="callout ${D.id>=4&&D.id<=5?"red":D.id===1||D.id===6?"purple":""}"><h4>Kịch bản ${sc.id} · ${sc.n}</h4><p class="small">${sc.read(D)}</p></div>`
    + (cb ? `<div class="callout purple"><h4>Hôm qua ${dtT.name} × kịch bản ${sc.id} → <span class="chip ${cb.cls}">${cb.tone}</span></h4><p class="small">${cb.t}</p></div>` : `<p class="small muted">Chọn day type RTH hôm qua để thêm lớp đọc cấu trúc.</p>`)
    + (jj ? `<div class="callout"><h4>10:00 · ${OPEN_BY(ot).n} → <span class="chip ${VCLS[jj.v]}">${jj.v}</span></h4><p class="small">${jj.read} ${jj.act}</p><p class="small muted">Day type nghiêng về: ${jj.days.join(" · ")}</p></div>` : `<p class="small muted">Lúc 10:00 chọn open type để cập nhật plan.</p>`)
    + (ibCls ? `<div class="callout purple"><h4>10:30 · IB ${ibCls} (${ibw}%)</h4><p class="small">${ibRead}</p></div>` : "");
  $("#b-tiles").innerHTML = [
    ["Overlap", D.has?`${fmt(D.ovLo)} – ${fmt(D.ovHi)}`:"Không có"],
    ["% VA RTH", D.has?`${D.pct}% · ${D.pct>=60?"rộng":D.pct>=25?"vừa":"hẹp"}`:"0%"],
    ["Open", loc],
    [D.has?"Độ dày overlap":"Khoảng trống", D.has?`${fmt(D.ovHi-D.ovLo)} điểm`:`${fmt(D.gapLo)} – ${fmt(D.gapHi)}`]
  ].map(t=>`<div class="tile"><div class="k">${t[0]}</div><div class="v">${t[1]}</div></div>`).join("");
  $("#b-svg").innerHTML = drawPlan(D, sc, lastOpen);
  const A = sc.A(D), B = sc.B(D);
  const near = [...[["VAH RTH",D.rVah],["POC RTH",D.rPoc],["VAL RTH",D.rVal],["VAH OVN",D.oVah],["POC OVN",D.oPoc],["VAL OVN",D.oVal],["ONH",D.onh],["ONL",D.onl],["PDH",D.pdh],["PDL",D.pdl]]];
  const up = lastOpen==null?null:near.filter(n=>n[1]>lastOpen).sort((a,b)=>a[1]-b[1])[0];
  const dn = lastOpen==null?null:near.filter(n=>n[1]<lastOpen).sort((a,b)=>b[1]-a[1])[0];
  lastPlan =
`PLAN NQ · ${$("#b-date").value}  ·  RTH × OVN Overlap
────────────────────────────────────
KỊCH BẢN ${sc.id}: ${sc.n.toUpperCase()} (${width}${D.has?`, ${D.pct}%`:""})
${sc.read(D)}
${$("#b-news").value?`Tin: ${$("#b-news").value}\n`:""}
LEVEL
  RTH hôm qua : VAH ${fmt(D.rVah)} · POC ${fmt(D.rPoc)} · VAL ${fmt(D.rVal)} · PDH ${fmt(D.pdh)} · PDL ${fmt(D.pdl)}
  OVN         : VAH ${fmt(D.oVah)} · POC ${fmt(D.oPoc)} · VAL ${fmt(D.oVal)} · ONH ${fmt(D.onh)} · ONL ${fmt(D.onl)}
  ${D.has?`Overlap     : ${fmt(D.ovLo)} – ${fmt(D.ovHi)}`:`Khoảng trống: ${fmt(D.gapLo)} – ${fmt(D.gapHi)}`}

OPEN ${lastOpen==null?"—":fmt(lastOpen)} → ${loc}
  Level gần nhất: trên ${up?`${up[0]} ${fmt(up[1])} (+${fmt(up[1]-lastOpen)})`:"—"} · dưới ${dn?`${dn[0]} ${fmt(dn[1])} (−${fmt(lastOpen-dn[1])})`:"—"}

KỲ VỌNG
${sc.expect.map(e=>"  • "+e).join("\n")}

KỊCH BẢN A (chính)
  ${A.t}

KỊCH BẢN B (thay thế)
  ${B.t}

INVALIDATION
  ${sc.inv(D)}

IB: ${sc.ib}
KHÔNG LÀM: ${sc.no}
DAY TYPE HAY GẶP: ${DAYS[sc.id].join(" · ")}

RTH HÔM QUA
${cb ? `  ${dtT.name} → ${cb.tone}
  ${cb.t}
  ${DT.find(x=>x.k===dtSel[0]).key}` : "  (chưa chọn day type)"}

CẬP NHẬT 10:00 · OPEN TYPE
${jj ? `  ${OPEN_BY(ot).n} → ${jj.v}. ${jj.read}
  ${jj.act}
  Day type nghiêng về: ${jj.days.join(" · ")}` : "  (chưa xác định)"}

CẬP NHẬT 10:30 · IB
${ibCls ? `  IB ${ibCls} (${ibw}% TB)${ibpos?", "+ibposT:""} → ${ibRead}` : "  (chưa có)"}

QUY TẮC: trigger orderflow (CVD / delta flip / footprint) + EMA 9/34 không ngược hướng · VWAP RTH dốc thì không fade · tối đa 2–3 lệnh · dừng 11:30 ET.`;
  $("#b-out").textContent = lastPlan;
}

/* ---------- 03 log ---------- */
function initLog(){
  $("#l-sc").innerHTML = SC.map(s=>`<option value="${s.id}">${s.id} · ${s.n}</option>`).join("");
  $("#l-ot").innerHTML = OPENS.map(o=>`<option value="${o.k}">${o.n}</option>`).join("");
  $("#l-dt").innerHTML = DT_OPTS.map(([k,dn],i)=>`<option value="${i}">${dtLabel(k,dn)}</option>`).join("");
  $("#l-date").value = new Date().toLocaleDateString("vi-VN");
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
      `<div class="tile"><div class="k">Số phiên</div><div class="v">${n}/30</div></div>
       <div class="tile"><div class="k">60' đầu chạm mép</div><div class="v">${pct(touched.length,n)}</div></div>
       <div class="tile"><div class="k">Bật khi chạm</div><div class="v">${pct(bounced.length,touched.length)}</div></div>
       <div class="tile"><div class="k">Plan A / B đúng</div><div class="v">${pct(aOk,n)} / ${pct(bOk,n)}</div></div>
       <div class="tile"><div class="k">Ma trận đoán đúng</div><div class="v">${(()=>{ const ev = rows.filter(r=>r.ot); const hit = ev.filter(r=>{ try{ const j = judge(+r.sc, r.ot, derive(SC_BY(+r.sc).ex)); return j.v===r.ab || (j.v==="Chờ IB" && r.ab!=="none"); }catch(e){ return false; } }); return pct(hit.length, ev.length); })()}</div><div class="small muted">kết luận ma trận khớp plan đúng</div></div>` +
      byS.map(([id,c,ok])=>`<div class="tile"><div class="k">Kịch bản ${id}</div><div class="v">${c}</div><div class="small muted">plan đúng ${pct(ok,c)}</div></div>`).join("");
    $("#l-rows").innerHTML = rows.map((r,i)=>`<tr><td class="mono">${r.date}</td><td class="small">${r.dt!=null&&r.dt!==""&&DT_OPTS[+r.dt]?dtLabel(...DT_OPTS[+r.dt]):"—"}</td><td>${r.sc}</td><td class="num mono">${r.pct}</td><td class="small">${lab("l-open",r.open)}</td><td>${r.ot?(OPEN_BY(r.ot)||{n:r.ot}).n:"—"}</td><td class="small">${r.ibw?lab("l-ibw",r.ibw):"—"}</td><td>${lab("l-touch",r.touch)}</td><td class="small">${lab("l-react",r.react)}</td><td class="small">${lab("l-day",r.day)}</td><td>${lab("l-ab",r.ab)}</td><td class="small">${r.note||""}</td><td><button data-del="${i}" aria-label="Xoá phiên ${r.date}">Xoá</button></td></tr>`).join("") || `<tr><td colspan="13" class="muted small">Chưa có phiên nào. Dùng nút "Đưa vào Log" ở Plan Builder hoặc nhập tay.</td></tr>`;
  };
  $("#l-rows").addEventListener("click", e=>{ const b = e.target.closest("button[data-del]"); if(!b) return; rows.splice(+b.dataset.del,1); draw(); });
  $("#l-add").addEventListener("click", ()=>{
    const r = { date:$("#l-date").value.trim(), sc:$("#l-sc").value, pct:$("#l-pct").value||"", open:$("#l-open").value, dt:$("#l-dt").value, ot:$("#l-ot").value, ibw:$("#l-ibw").value, touch:$("#l-touch").value, react:$("#l-react").value, day:$("#l-day").value, ab:$("#l-ab").value, note:$("#l-note").value.trim() };
    if(!r.date){ lmsg("Nhập ngày trước."); return; }
    rows.push(r); draw(); $("#l-note").value = ""; lmsg("Đã thêm phiên.");
  });
  $("#l-csv").addEventListener("click", async ()=>{
    const csv = "date,prev_day_type,scenario,overlap_pct,open,open_type,ib,touch_60m,reaction,day_type,plan,note\n" + rows.map(r=>[r.date,(r.dt!=null&&r.dt!==""&&DT_OPTS[+r.dt])?dtLabel(...DT_OPTS[+r.dt]):"",r.sc,r.pct,lab("l-open",r.open),r.ot?(OPEN_BY(r.ot)||{n:r.ot}).n:"",r.ibw?lab("l-ibw",r.ibw):"",lab("l-touch",r.touch),lab("l-react",r.react),lab("l-day",r.day),lab("l-ab",r.ab),(r.note||"").replace(/,/g,";")].join(",")).join("\n");
    try{ await navigator.clipboard.writeText(csv); lmsg("Đã copy CSV."); }catch(e){ lmsg("Trình duyệt chặn copy."); }
  });
  let armed = false;
  $("#l-clear").addEventListener("click", ()=>{
    if(!armed){ armed = true; $("#l-clear").textContent = "Bấm lần nữa để xoá hết"; setTimeout(()=>{ armed=false; $("#l-clear").textContent="Xoá toàn bộ log"; }, 3000); return; }
    rows = []; draw(); armed = false; $("#l-clear").textContent = "Xoá toàn bộ log"; lmsg("Đã xoá log.");
  });
  draw();
}

/* ---------- 04 quiz ---------- */
const QZ = [
 {q:"VA RTH 28,700–28,800, VA OVN 28,725–28,775. Kịch bản nào?",o:["1 · OVN trong VA RTH","2 · Overlap lệch lên","6 · OVN bao trùm RTH","4 · OVN trên RTH"],a:0,e:"VA OVN nằm gọn trong VA RTH → balance."},
 {q:"VA RTH 28,680–28,780, VA OVN 28,750–28,830. Overlap là bao nhiêu và kịch bản nào?",o:["28,680–28,830 · kịch bản 6","28,750–28,780 · kịch bản 2","28,780–28,830 · kịch bản 4","Không có overlap · kịch bản 4"],a:1,e:"Overlap = [max VAL, min VAH] = [28,750, 28,780]; giữa VA OVN cao hơn → trôi lên."},
 {q:"VA RTH 28,640–28,720, VA OVN 28,760–28,830. Đọc thế nào?",o:["Balance","Qua đêm từ chối value cũ, imbalance lên; khoảng trống 28,720–28,760","Value trôi xuống","Không kết luận được"],a:1,e:"Kịch bản 4: không có overlap, OVN nằm trên."},
 {q:"Kịch bản 2 (lệch lên). Zone long chính ở đâu?",o:["ONH","Mép dưới overlap (VAL OVN)","PDL","POC RTH"],a:1,e:"Lần test đầu sau open thường là mép dưới overlap; giữ được thì value trôi lên tiếp."},
 {q:"Kịch bản 4, RTH mở cửa rồi đóng period dưới VAL OVN và đi vào khoảng trống. Kỳ vọng?",o:["Mua thêm","Imbalance thất bại; giá dễ đi nhanh về VA RTH, short theo kịch bản B","Đứng yên","Chỉ fade ONH"],a:1,e:"Phe mua qua đêm bị kẹt, khoảng trống được đi qua nhanh."},
 {q:"Kịch bản 6 (OVN bao trùm). Cách xử lý A period?",o:["Đuổi theo cú phá đầu tiên","Không trade A period, chờ IB chọn phía","Fade ONH ngay","Short POC"],a:1,e:"Thị trường chưa chọn hướng; cửa sổ đẹp nhất là sau 10:30."},
 {q:"Overlap chiếm 18% VA RTH. Nghĩa là?",o:["Balance mạnh","Overlap hẹp: qua đêm gần như từ chối value cũ, thiên imbalance","Không có ý nghĩa","Phải fade hai mép"],a:1,e:"< 25% = hẹp."},
 {q:"Vì sao không dùng VA TPO của ETH full session để tính overlap?",o:["ATAS không có","TPO ETH bị lệch về overnight (31 period OVN so với ~14 period RTH)","Vì ETH không có POC","Không có lý do"],a:1,e:"Overlap so RTH hôm qua với OVN, cùng thước đo."},
 {q:"Kịch bản 1: bạn fade mép trên overlap, nhưng period đóng trên mép và VWAP RTH bắt đầu dốc lên. Làm gì?",o:["Giữ lệnh, chờ quay lại","Fade đã sai; thoát và xét kịch bản B (đi theo hướng phá)","Thêm lệnh short","Dời stop xa hơn"],a:1,e:"Đúng định nghĩa invalidation của kịch bản 1."},
 {q:"Kịch bản 2 (value trôi lên), lúc 10:00 bạn thấy Open Test Drive ↑: giá xuống test mép dưới overlap rồi drive lên qua open. Kết luận?",o:["Chuyển sang B","Giữ A, vào ở retest mép dưới overlap; đây là setup đẹp nhất","Chờ IB","Đứng ngoài cả ngày"],a:1,e:"OTD cùng hướng value trôi = A, cùng logic OSR."},
 {q:"Kịch bản 4 (OVN trên RTH), RTH Open Drive ↓ xuyên VAL OVN. Kết luận?",o:["Giữ A, mua pullback","Chuyển sang B: phe mua qua đêm bị kẹt, đi theo drive xuống về value RTH","Chờ IB","Fade ONH"],a:1,e:"OD ngược hướng qua đêm = B, thường mạnh."},
 {q:"Kịch bản 1 (balance), 10:00 là Open Auction, IB rộng lúc 10:30. Day type nghiêng về?",o:["Trend","Normal / Non-Trend: fade mép overlap về TPOC","Double Distribution","Neutral extreme"],a:1,e:"Balance hai phiên + OA + IB rộng = rotation."},
 {q:"Kịch bản 6 (OVN bao trùm), 10:00 là ORR ↓ sau khi thử phá VAH RTH. Hành động?",o:["Long breakout","Fade về TPOC sau khi giá xuyên open (B của kịch bản 6)","Short đến ONL ngay","Không có ý nghĩa"],a:1,e:"Thử phá VA RTH bị từ chối → balance rộng vẫn giữ."},
 {q:"Hôm qua là P-shape (short covering), qua đêm value trôi xuống (kịch bản 3). Đọc thế nào?",o:["A cần xác nhận","Củng cố A: cú tăng hôm qua chủ yếu là short covering đã hết lực","Balance","Bỏ qua day type"],a:1,e:"P yếu + qua đêm đi ngược nó = phe bán chủ động thật."},
 {q:"Hôm qua Trend ↑, qua đêm OVN dưới RTH (kịch bản 5). Cách xử lý?",o:["Short ngay open","A cần xác nhận: sau trend day thường là balance, chờ OD/OTD xuống","Long breakout","Không có ý nghĩa"],a:1,e:"Đảo chiều ngay sau trend cần xác nhận mạnh."},
 {q:"Hôm qua Non-Trend, qua đêm value trôi lên (kịch bản 2). Đọc?",o:["Balance","Củng cố A: breakout của năng lượng tích luỹ","Ưu tiên B","Chờ cả ngày"],a:1,e:"Compression hôm qua + qua đêm rời range = breakout."},
 {q:"Zone overlap đã đẹp nhưng chưa có CVD divergence hay delta flip. Có vào lệnh không?",o:["Có, zone đủ mạnh","Không; zone là location, cần trigger orderflow","Có nếu EMA 9 > 34","Có nếu là thứ Hai"],a:1,e:"Quy tắc chung của playbook."}
];
function shuffle(a){ const b = a.slice(); for(let i=b.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } return b; }
function renderQuiz(){
  const box = $("#quiz"); let right = 0, done = 0;
  box.innerHTML = `<div class="row" style="justify-content:space-between"><h3>${QZ.length} câu</h3><div class="row"><span class="mono small" id="qs" aria-live="polite">0 / ${QZ.length}</span><button id="qr">Làm lại</button></div></div>` +
    QZ.map((q,i)=>`<div class="q" data-a="${q.a}"><span class="k">Câu ${i+1}</span><p><b>${q.q}</b></p><div class="opts">${shuffle(q.o.map((_,k)=>k)).map(k=>`<button data-i="${k}">${q.o[k]}</button>`).join("")}</div><p class="expl" hidden>${q.e}</p></div>`).join("");
  $$(".q", box).forEach(el => el.addEventListener("click", e=>{
    const b = e.target.closest(".opts button"); if(!b || el.dataset.done) return;
    el.dataset.done = "1"; done++; const ok = b.dataset.i===el.dataset.a; if(ok) right++;
    $$(".opts button", el).forEach(x=>{ x.disabled = true; if(x.dataset.i===el.dataset.a) x.classList.add("right"); });
    if(!ok) b.classList.add("wrong");
    $(".expl", el).hidden = false;
    $("#qs").textContent = `${right} / ${QZ.length}` + (done===QZ.length ? (right>=Math.ceil(QZ.length*0.8)?" · Đạt":" · Chưa đạt") : "");
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
