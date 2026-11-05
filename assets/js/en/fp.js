
(function(){
'use strict';
const N=10;
const fmt=p=>p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const pad=d=>{const a=d.slice();while(a.length<N)a.push([0,0]);return a;};
const mirror=sc=>({candles:sc.candles.map(c=>({d:pad(c.d).slice().reverse().map(([b,a])=>[a,b]),o:N-1-c.o,c:N-1-c.c})),hl:sc.hl.map(([ci,r,t])=>[ci,N-1-r,t])});
const BASE={
 absBottom:{candles:[
  {d:[[8,9],[20,12],[30,18],[44,25],[52,30],[61,34],[58,30]],o:0,c:6},
  {d:[[0,0],[0,0],[0,0],[0,0],[25,30],[40,44],[88,52],[210,58],[240,6]],o:6,c:4},
  {d:[[0,0],[6,28],[10,64],[14,72],[20,81],[24,60],[38,44],[30,12]],o:7,c:1}],
  hl:[[1,7,'abs'],[1,8,'abs']]},
 stacked:{candles:[
  {d:[[0,0],[0,0],[0,0],[0,0],[12,10],[30,34],[52,48],[60,58],[41,45],[14,9]],o:8,c:5},
  {d:[[4,10],[10,46],[12,88],[16,104],[20,96],[24,58],[30,20]],o:6,c:1},
  {d:[[6,8],[22,15],[18,20],[12,26],[5,14]],o:1,c:3}],
  hl:[[1,0,'unf'],[2,4,'exh'],[2,3,'exh']]},
 exhTop:{candles:[
  {d:[[0,0],[6,22],[14,48],[20,70],[28,86],[30,80],[34,60],[30,40],[22,12]],o:8,c:1},
  {d:[[4,0],[10,5],[18,9],[26,12],[30,16]],o:3,c:2},
  {d:[[0,0],[10,8],[34,10],[52,14],[60,18],[48,22],[30,10]],o:1,c:6}],
  hl:[[1,0,'exh'],[1,1,'exh']]},
 trapBuy:{candles:[
  {d:[[20,62],[24,110],[30,128],[40,70],[44,52],[38,40],[30,26],[12,8]],o:6,c:4},
  {d:[[0,0],[0,0],[0,0],[6,8],[30,12],[52,16],[70,20],[64,24],[40,18],[14,6]],o:4,c:9},
  {d:[[0,0],[0,0],[0,0],[0,0],[0,0],[10,4],[14,9],[18,12],[12,10]],o:8,c:6}],
  hl:[[0,0,'trap'],[0,1,'trap'],[0,2,'trap']]},
 pShape:{candles:[
  {d:[[0,0],[0,0],[0,0],[0,0],[8,6],[20,12],[26,16],[30,20],[24,14],[10,5]],o:4,c:9},
  {d:[[18,12],[60,58],[90,84],[70,66],[30,34],[6,14],[4,12],[3,10],[4,8],[2,3]],o:9,c:1},
  {d:[[0,0],[0,0],[10,8],[30,14],[34,16],[22,10],[18,9],[8,4]],o:2,c:6}],
  hl:[[1,5,'exh'],[1,6,'exh'],[1,7,'exh'],[1,8,'exh']]}
};

const SC=[
{id:'abs-bot',src:BASE.absBottom,dir:'long',type:'rev',title:'Absorption at the low',
 ctx:'<b>Required:</b> price sweeps an old low, VAL or the −2σ VWAP band after a down leg.',
 cap:'<b>Candle 2:</b> bid 210 and 240 at the two lowest levels, strongly negative delta but the candle closes up. <b>Candle 3:</b> buy stacked imbalance confirms.',
 read:['Aggressive selling volume piles up hugely at the low but price does not go lower: a large buy limit is absorbing.','The absorption candle’s delta is negative but the body is bullish, this is the key point.','The next candle shows a buy stacked imbalance: buyers turn aggressive.'],
 plan:['Retest of candle 3’s buy stacked zone, or a limit just above the absorption zone.','2 ticks below the low of the absorption zone.','Session POC, VWAP or the nearest HVN above.'],
 bad:'A candle closes below the absorption zone, or large bids keep filling at a new lower low.',
 conf:'Iceberg bid on the DOM, CVD makes a higher low while price makes a lower low.'},
{id:'abs-top',src:mirror(BASE.absBottom),dir:'short',type:'rev',title:'Absorption at the high',
 ctx:'<b>Required:</b> price sweeps an old high, VAH or the +2σ VWAP band after an up leg.',
 cap:'<b>Candle 2:</b> ask 210 and 240 at the two highest levels, strongly positive delta but the candle closes down. <b>Candle 3:</b> sell stacked imbalance confirms.',
 read:['Buyers hammer market orders at the high but price does not go higher: a large sell limit is absorbing.','Positive delta but a bearish body.','A sell stacked imbalance on the next candle is the confirmation.'],
 plan:['Retest of candle 3’s sell stacked zone.','2 ticks above the high of the absorption zone.','POC, VWAP or the nearest HVN below.'],
 bad:'A candle closes above the absorption zone, or large asks keep filling at a new high.',
 conf:'Ask wall holding firm on the heatmap, big buy trades clustered at the high.'},
{id:'stk-buy',src:BASE.stacked,dir:'long',type:'cont',title:'Buy stacked imbalance, retest',
 ctx:'<b>Required:</b> price compresses under the IB high, the prior session high or VAH, then breaks up.',
 cap:'<b>Candle 2:</b> 4 consecutive buy imbalance levels on the range break. <b>Candle 3:</b> price pulls back to the stacked zone, sell volume shrinks, delta stays positive.',
 read:['A buy stacked imbalance shows aggressive buyers lifting several ask levels in a row, this is initiative.','Candle 2’s high still has volume on both sides (unfinished), price usually comes back above it.','On the retest, filled bids shrink towards the bottom of the zone: sellers have no strength left.'],
 plan:['Limit in the upper half of the stacked zone, or enter when the retest candle closes back above the zone.','2 ticks below the lowest level of the stacked zone.','The unfinished high of the breakout candle, then a measured move of the range height.'],
 bad:'Price closes below the bottom of the stacked zone: switch to the imbalance failure scenario.',
 conf:'CVD makes a new high with price, VWAP slopes up, speed of tape rises on the break.'},
{id:'stk-sell',src:mirror(BASE.stacked),dir:'short',type:'cont',title:'Sell stacked imbalance, retest',
 ctx:'<b>Required:</b> price compresses above the IB low, the prior session low or VAL, then breaks down.',
 cap:'<b>Candle 2:</b> 4 consecutive sell imbalance levels on the range break. <b>Candle 3:</b> price bounces back to the stacked zone, filled asks shrink.',
 read:['Aggressive sellers hit several bid levels in a row.','Candle 2’s low is unfinished, price usually comes back lower.','On the bounce asks shrink: buyers are weak.'],
 plan:['Limit in the lower half of the sell stacked zone.','2 ticks above the highest level of the stacked zone.','The unfinished low, then a measured move of the range height.'],
 bad:'Price closes above the top of the sell stacked zone.',
 conf:'CVD makes a new low, price below VWAP, the bid wall below gets pulled on the heatmap.'},
{id:'exh-top',src:BASE.exhTop,dir:'short',type:'rev',title:'Exhaustion at the high',
 ctx:'<b>Required:</b> a long up leg touches the +2σ band, VAH or an HTF resistance zone.',
 cap:'<b>Candle 2:</b> ask shrinks 16 → 12 → 9 → 5 → 0 towards the high, the high has ask = 0 (finished auction). <b>Candle 3:</b> sell stacked imbalance.',
 read:['Aggressive buying volume thins out as price rises: nobody is chasing price any more.','The high has ask = 0: the auction above is over.','Unlike absorption: here volume is small, not large volume being blocked.'],
 plan:['Retest of the confirmation candle’s sell stacked zone.','2 ticks above the exhaustion high.','VWAP or POC; the first leg usually returns to mid-range.'],
 bad:'Price comes back above the high with sharply rising ask volume.',
 conf:'Speed of tape slows going into the high, CVD flat or falling.'},
{id:'exh-bot',src:mirror(BASE.exhTop),dir:'long',type:'rev',title:'Exhaustion at the low',
 ctx:'<b>Required:</b> a long down leg touches the −2σ band, VAL or HTF support.',
 cap:'<b>Candle 2:</b> bid shrinks towards the low, the low has bid = 0 (finished auction). <b>Candle 3:</b> buy stacked imbalance.',
 read:['Aggressive selling dries up as price goes lower.','The low has bid = 0: no sellers left below.','Needs a confirmation candle with buy initiative.'],
 plan:['Retest of the confirmation candle’s buy stacked zone.','2 ticks below the exhaustion low.','VWAP or POC.'],
 bad:'Price comes back to break the low with sharply rising bid volume.',
 conf:'Speed of tape slows into the low, CVD makes no new low.'},
{id:'unf',src:{candles:[
  {d:[[0,0],[0,0],[12,9],[20,34],[26,45],[30,40],[28,30],[16,12]],o:7,c:2},
  {d:[[0,0],[0,0],[0,0],[9,6],[22,14],[30,20],[38,24],[33,22],[20,18],[8,5]],o:3,c:8},
  {d:[[3,0],[10,18],[16,30],[20,42],[24,50],[26,44],[22,30],[18,16],[10,6]],o:8,c:1}],
  hl:[[0,2,'unf'],[2,0,'exh']]},dir:'neu',type:'cont',title:'Unfinished auction as a target',
 ctx:'<b>Required:</b> an important candle high or low (session high, swing) with volume still on both sides.',
 cap:'<b>Candle 1:</b> the high still shows 12 × 9, not finished. <b>Candle 3:</b> price comes back above it and makes a new high with ask = 0.',
 read:['A high with both bid and ask non-zero means the auction is not finished, the market often comes back to "repair it".','When price comes back and makes a new high with ask = 0, the level has been repaired.','This is a tool for choosing targets, not an entry signal.'],
 plan:['Do not enter just because of an unfinished auction.','Not applicable.','Use the unfinished level as TP for a long you are holding, or wait until it is repaired before considering a short.'],
 bad:'Not every unfinished auction gets revisited in the same session; prefer levels at important swings.',
 conf:'An unfinished level that matches the prior session high or a TPO poor high has a higher probability of being revisited.'},
{id:'trap-buy',src:BASE.trapBuy,dir:'short',type:'rev',title:'Buyers trapped in a false breakout',
 ctx:'<b>Required:</b> price breaks the range high or the prior session high, pulling in many buyers chasing.',
 cap:'<b>Candle 1:</b> buy imbalance piled at the 3 highest levels, delta +258 but the candle closes low with a long upper wick. <b>Candle 2:</b> closes below the breakout level with sell stacked imbalance.',
 read:['Buyers who chased at the high (blue-outlined zone) are now losing.','When price closes back inside the range, they must stop out with sell orders, pushing price down faster.','Candle 3 bounces slightly with very small asks: nobody wants to buy again.'],
 plan:['Short when a candle closes below the breakout level, or on a light retest into the sell stacked zone.','2 ticks above the high of the trap candle.','The opposite edge of the range, the earlier range POC.'],
 bad:'Price comes back above the trapped zone and holds with positive delta.',
 conf:'Big buy trades clustered at the high, the bid wall below gets pulled on the heatmap.'},
{id:'trap-sell',src:mirror(BASE.trapBuy),dir:'long',type:'rev',title:'Sellers trapped in a false breakdown',
 ctx:'<b>Required:</b> price breaks the range low or the prior session low, pulling in sellers chasing.',
 cap:'<b>Candle 1:</b> sell imbalance piled at the 3 lowest levels but the candle closes high with a long lower wick. <b>Candle 2:</b> closes above the breakdown level with buy stacked imbalance.',
 read:['Sellers who chased at the low are losing.','They stop out with buy orders, pushing price up fast (short covering).','The pullback candle has very small bids.'],
 plan:['Long when a candle closes back above the breakdown level, or on a retest of the buy stacked zone.','2 ticks below the low of the trap candle.','The upper edge of the range, the range POC.'],
 bad:'Price comes back below the trapped zone and holds with negative delta.',
 conf:'Big sell trades clustered at the low, this is the familiar sweep and reclaim pattern.'},
{id:'div',src:{candles:[
  {d:[[0,0],[0,0],[0,0],[10,26],[22,50],[28,64],[30,70],[36,52],[30,34],[14,8]],o:9,c:3},
  {d:[[22,14],[46,30],[60,38],[58,34],[40,26],[18,10]],o:4,c:2},
  {d:[[0,0],[6,4],[26,8],[40,12],[48,16],[42,20],[30,18],[12,6]],o:2,c:7}],
  hl:[[1,0,'abs'],[1,1,'abs']]},dir:'short',type:'rev',title:'Delta divergence on a candle',
 ctx:'<b>Required:</b> price makes a new high at resistance, after at least one clear up leg.',
 cap:'<b>Candle 2:</b> price makes a higher high but delta is −92. <b>Candle 3:</b> sell stacked imbalance confirms.',
 read:['Price rises while delta is negative: aggressive sellers are larger but price is still lifted by buy limits being pulled.','Real buying force has weakened; the new high has no aggressive buyers supporting it.','Needs a following candle with new sell initiative before entering.'],
 plan:['Retest of candle 3’s sell stacked zone.','2 ticks above the high of the divergence candle.','VWAP, POC or the low of the most recent up leg.'],
 bad:'The next candle closes above the divergence high with positive delta.',
 conf:'Session CVD also makes a lower high; cluster statistic shows a large max delta but a negative closing delta.'},
{id:'fail',src:{candles:[
  {d:[[0,0],[0,0],[8,30],[12,66],[16,74],[20,80],[26,58],[30,36],[18,10]],o:8,c:2},
  {d:[[0,0],[12,14],[22,20],[30,18],[36,22],[20,14],[8,4]],o:2,c:4},
  {d:[[0,0],[0,0],[0,0],[5,6],[30,8],[48,12],[62,14],[58,20],[40,18],[16,6]],o:4,c:9}],
  hl:[[2,4,'trap'],[2,5,'trap']]},dir:'short',type:'rev',title:'Imbalance failure (stacked zone flips)',
 ctx:'<b>Required:</b> a buy stacked zone appears, but price cannot follow through afterwards.',
 cap:'<b>Candle 1:</b> buy stacked on 3 levels. <b>Candle 3:</b> price cuts through the whole stacked zone and closes below it, with sell stacked imbalance.',
 read:['The stacked zone is where buyers committed; when price closes below it, they are trapped.','The old buy stacked zone becomes resistance.','This scenario has a good reward/risk ratio because the stop is close.'],
 plan:['Short when a candle closes below the bottom of the buy stacked zone, or on a retest from below.','2 ticks above the top of the old buy stacked zone.','The low of the initial up leg, the HVN below.'],
 bad:'Price reclaims the stacked zone and closes above it.',
 conf:'A strong delta flip from positive to negative, speed of tape rises as the zone breaks.'},
{id:'p',src:BASE.pShape,dir:'neu',type:'rev',title:'P-shape: short covering',
 ctx:'<b>Required:</b> a strong bullish candle after a down leg, volume concentrated in the upper part.',
 cap:'<b>Candle 2:</b> the lower part of the candle is almost empty (volume 2–14), volume piles up at the top 3 levels, delta only +14. <b>Candle 3:</b> price drifts back down.',
 read:['Price rises fast through the lower part without volume: mostly old shorts buying to close.','Volume only appears higher up, delta near 0: no real new buyers.','The thin lower part is an LVN inside the candle, price usually comes back to fill it.'],
 plan:['Do not chase longs. Wait for price to return to the thin part, then reassess.','If shorting on candle 3: 2 ticks above the top of the P.','The bottom of the thin part (the base of the P candle).'],
 bad:'New volume appears in the lower part and price holds above the P candle’s POC: the market has accepted higher prices.',
 conf:'The session TPO/volume profile is P-shaped, CVD does not rise in line with price.'},
{id:'b',src:mirror(BASE.pShape),dir:'neu',type:'rev',title:'b-shape: long liquidation',
 ctx:'<b>Required:</b> a strong bearish candle after an up leg, volume concentrated in the lower part.',
 cap:'<b>Candle 2:</b> the upper part of the candle is almost empty, volume piles up at the bottom 3 levels, delta near 0. <b>Candle 3:</b> price bounces back up.',
 read:['Price falls fast through the upper part without volume: old longs exiting.','No real new sellers, delta near 0.','The thin upper part usually gets filled back.'],
 plan:['Do not chase shorts. Wait for price to bounce back into the thin part.','If buying on candle 3: 2 ticks below the bottom of the b.','The top of the thin part.'],
 bad:'New volume appears in the upper part and price holds below the b candle’s POC.',
 conf:'The session profile is b-shaped, CVD does not fall in line.'}
];


const sum=(d,k)=>d.reduce((s,v)=>s+v[k],0);
const delta=c=>sum(c.d,1)-sum(c.d,0);
const vol=c=>sum(c.d,0)+sum(c.d,1);
const rowsOf=c=>c.d.map((v,i)=>v[0]+v[1]>0?i:-1).filter(i=>i>=0);
function imb(c){const ib=Array(N).fill(false),is=Array(N).fill(false);
  for(let r=0;r<N-1;r++){const a=c.d[r][1],b=c.d[r+1][0];
    if(a>=20&&a>=3*Math.max(b,1))ib[r]=true;
    if(b>=20&&b>=3*Math.max(a,1))is[r+1]=true;}
  return{ib,is};}

/* ATAS-style cluster renderer */
const CF={bg:'#121314',num:'#A3A6AA',numB:'#FFFFFF',poc:'#E07B39',pocT:'#F2A262',up:'#6F8FB8',dn:'#5C5C5C',wick:'#3A3C40',hPos:'#3F7FD9',hNeg:'#4A4A4A',zone:'rgba(120,32,44,.42)',zoneL:'rgba(170,60,72,.65)',axis:'#7E8287',grid:'#1E2023'};
const MK={abs:['#4CC9F0','5 3'],exh:['#E7B04B','2 3'],unf:['#DCE3EE','5 3'],trap:['#4C9BF0','']};
function tm(m){const h=Math.floor(m/60),mm=m%60;return`${h}:${String(mm).padStart(2,'0')} ${h<12?'AM':'PM'}`;}
function fpSVG(cs0,o){
  const cs=cs0.map(c=>({...c,d:pad(c.d)}));
  const n=cs.length,RH=20,LW=86,CW=136,AW=72,TOP=6,R0=-1,R1=N,rows=R1-R0+1,chartH=rows*RH,W=LW+n*CW+AW,timeH=20,statH=o.noStats?0:3*22,H=TOP+chartH+timeH+statH+4;
  const y=r=>TOP+(r-R0)*RH,ms=cs.map(imb),maxRow=Math.max(...cs.flatMap(c=>c.d.map(v=>v[0]+v[1])));
  let g=`<rect x="0" y="0" width="${W}" height="${H}" fill="${CF.bg}"/>`;
  const lv=o.lvRow??-1;
  if(lv>=0){const zy=y(lv-1),zh=RH*3;g+=`<rect x="${LW-4}" y="${zy}" width="${n*CW+8}" height="${zh}" fill="${CF.zone}"/><line x1="${LW-4}" x2="${LW+n*CW+4}" y1="${zy}" y2="${zy}" stroke="${CF.zoneL}"/><line x1="${LW-4}" x2="${LW+n*CW+4}" y1="${zy+zh}" y2="${zy+zh}" stroke="${CF.zoneL}"/>`;}
  const ax=LW+n*CW;g+=`<line x1="${ax+2}" x2="${ax+2}" y1="${TOP}" y2="${TOP+chartH}" stroke="${CF.grid}"/>`;
  for(let r=R0;r<=R1;r++){const isLv=lv>=0&&r===lv;
    if(isLv)g+=`<rect x="${ax+4}" y="${y(r)+2}" width="${AW-6}" height="${RH-4}" rx="2" fill="#7A2230"/>`;
    if(isLv||((r-R0)%2===1))g+=`<text x="${ax+AW-6}" y="${y(r)+RH/2+4}" text-anchor="end" font-size="10.5" fill="${isLv?'#FFE3E6':CF.axis}">${fmt((o.top||25420)-r*0.25)}</text>`;}
  cs.forEach((c,i)=>{const x0=LW+i*CW,rs=rowsOf(c);if(!rs.length)return;const hiR=rs[0],loR=rs[rs.length-1],bt=Math.min(c.o,c.c),bb=Math.max(c.o,c.c);
    g+=`<rect x="${x0+4}" y="${y(hiR)+1}" width="7" height="${(loR-hiR+1)*RH-2}" fill="${CF.wick}"/><rect x="${x0+4}" y="${y(bt)+1}" width="7" height="${(bb-bt+1)*RH-2}" fill="${c.c<c.o?CF.up:c.c>c.o?CF.dn:'#8A8D91'}"/>`;
    let poc=rs[0],pv=-1;rs.forEach(r=>{const v=c.d[r][0]+c.d[r][1];if(v>pv){pv=v;poc=r;}});
    rs.forEach(r=>{const[b,a]=c.d[r],yy=y(r),ty=yy+RH/2+4,isP=r===poc,bB=ms[i].is[r],aB=ms[i].ib[r];
      const st=(bold,col)=>`font-weight="${bold?700:400}" fill="${col}"`;
      g+=`<text x="${x0+46}" y="${ty}" text-anchor="end" font-size="11.5" ${st(bB||isP,isP?CF.pocT:bB?CF.numB:CF.num)}>${b}</text><text x="${x0+54}" y="${ty}" font-size="11.5" ${st(aB||isP,isP?CF.pocT:aB?CF.numB:CF.num)}>${a}</text>`;
      if(isP)g+=`<rect x="${x0+15}" y="${yy+1.5}" width="68" height="${RH-3}" fill="none" stroke="${CF.poc}" stroke-width="1.5"/>`;
      const dv=a-b,bw=Math.max(3,Math.round((b+a)/maxRow*(CW-92)));
      g+=`<rect x="${x0+88}" y="${yy+1.5}" width="${bw}" height="${RH-3}" fill="${dv>0?CF.hPos:CF.hNeg}"/>${o.hideDelta?'':`<text x="${x0+91}" y="${ty}" font-size="10.5" font-weight="700" fill="#F2F4F7">${dv}</text>`}`;});
    (o.marks||[]).filter(([ci])=>ci===i).forEach(([,r,t])=>{const[col,da]=MK[t]||MK.abs;g+=`<rect x="${x0+13}" y="${y(r)}" width="72" height="${RH}" fill="none" stroke="${col}" stroke-width="2"${da?` stroke-dasharray="${da}"`:''}/>`;});
  });
  const ty0=TOP+chartH;cs.forEach((c,i)=>{g+=`<text x="${LW+i*CW+CW/2}" y="${ty0+14}" text-anchor="middle" font-size="10.5" fill="${CF.axis}">${o.labels?o.labels[i]:tm((o.t0||600)+i)}</text>`;});
  if(!o.noStats){const sy=ty0+timeH,maxD=Math.max(1,...cs.map(c=>Math.abs(delta(c)))),maxV=Math.max(...cs.map(vol));
    ['Delta','Delta/Volume','Volume'].forEach((l,k)=>{g+=`<rect x="0" y="${sy+k*22}" width="${LW-2}" height="21" fill="#2B3A55"/><text x="5" y="${sy+k*22+14.5}" font-size="10.5" fill="#E6EAF0">${l}</text>`;});
    cs.forEach((c,i)=>{const x0=LW+i*CW,dv=delta(c),v=vol(c),pct=Math.round(Math.abs(dv)/v*100),al=(0.18+0.67*Math.abs(dv)/maxD).toFixed(2),fD=dv>0?`rgba(63,127,217,${al})`:`rgba(110,110,110,${al})`;
      [[o.hideDelta?'?':dv,o.hideDelta?'#2A2C30':fD],[o.hideDelta?'?':pct+'%',o.hideDelta?'#2A2C30':fD],[v,`rgba(120,124,130,${(0.15+0.45*v/maxV).toFixed(2)})`]].forEach(([t,f],k)=>{const yy=sy+k*22;g+=`<rect x="${x0+1}" y="${yy}" width="${CW-2}" height="21" fill="${f}"/><text x="${x0+CW/2}" y="${yy+14.5}" text-anchor="middle" font-size="11" fill="#F2F4F7">${t}</text>`;});});}
  return`<svg viewBox="0 0 ${W} ${H}" style="min-width:${Math.round(W*0.85)}px;max-width:${Math.round(W*(n>1?1.3:1.1))}px;font-variant-numeric:tabular-nums" font-family="'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif" role="img" aria-label="ATAS cluster-style footprint">${g}</svg>`;
}
window.__fpSVG=fpSVG;
const LV={'abs-bot':7,'abs-top':2,'stk-buy':4,'stk-sell':5,'exh-top':1,'exh-bot':8,'trap-buy':3,'trap-sell':6,'div':1};
function domHTML(rows){const mx=Math.max(...rows.map(r=>Math.max(r[1]||0,r[2]||0,r[3]||0)));let h='<div class="vz pad"><table class="t dom"><thead><tr><th>Bid</th><th style="text-align:center">Price</th><th style="text-align:left">Ask T1</th><th style="text-align:left">Ask T2</th></tr></thead><tbody>';
  rows.forEach(([px,b,a1,a2,cls])=>{h+=`<tr><td class="b">${b?`<i class="bar" style="width:${Math.round(b/mx*100)}%"></i><span>${b}</span>`:''}</td><td class="px ${cls||''}">${fmt(px)}</td><td style="text-align:left;color:var(--muted)">${a1??''}</td><td class="a" style="text-align:left">${a2?`<i class="bar" style="width:${Math.round(a2/mx*100)}%"></i><span class="${a1&&a2<a1?'chg-dn':''}">${a2}</span>`:''}</td></tr>`;});
  return h+'</tbody></table></div>';}
function tapeHTML(rows){let h='<div class="vz pad"><table class="t"><thead><tr><th>Time (ET)</th><th>Price</th><th>Size</th><th>Side</th></tr></thead><tbody>';
  rows.forEach(([t,p,s,sd])=>{const c=sd==='B'?'var(--buy)':'var(--sell)';h+=`<tr><td style="color:var(--muted)">${t}</td><td>${fmt(p)}</td><td style="color:${c}">${s}</td><td style="color:${c}">${sd==='B'?'Buy':'Sell'}</td></tr>`;});
  return h+'</tbody></table></div>';}
const scV=id=>()=>{const s=SC.find(x=>x.id===id);return fpSVG(s.src.candles,{lvRow:LV[id]??-1,top:25420,t0:640});};
function domQHTML(){const rows=[[25411.75,null,null,22],[25411.25,null,null,18],[25411.00,null,null,14,'last'],[25410.75,55,68,null],[25410.50,150,310,null,'lv'],[25410.25,60,74,null]];
  const mx=310;let h='<thead><tr><th>Bid T1</th><th>Bid T2</th><th style="text-align:center">Price</th><th style="text-align:left">Ask T2</th></tr></thead><tbody>';
  rows.forEach(([px,b1,b2,a,cls])=>{h+=`<tr><td style="color:var(--muted)">${b1??''}</td><td class="b">${b2?`<i class="bar" style="width:${Math.round(b2/mx*100)}%"></i><span>${b2}</span>`:''}</td><td class="px ${cls||''}">${fmt(px)}</td><td class="a" style="text-align:left">${a?`<i class="bar" style="width:${Math.round(a/mx*100)}%"></i><span>${a}</span>`:''}</td></tr>`;});
  return '<div class="vz pad"><table class="t dom">'+h+'</tbody></table></div>';}
const absEx=BASE.absBottom.candles,stkEx=BASE.stacked.candles,exhEx=BASE.exhTop.candles,trapEx=BASE.trapBuy.candles;
const VIS={abs:()=>fpSVG(absEx,{lvRow:7,top:25420,t0:600}),stk:()=>fpSVG(stkEx,{lvRow:4,top:25420,t0:610}),exh:()=>fpSVG(exhEx,{lvRow:1,top:25420,t0:620}),trap:()=>fpSVG(trapEx,{lvRow:3,top:25420,t0:630})};
window.OF={N,fmt,pad,mirror,BASE,SC,LV,sum,delta,vol,rowsOf,imb,fpSVG,domHTML,tapeHTML,scV,domQHTML,VIS};
})();
