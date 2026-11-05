
(function(){
'use strict';
const {N,fmt,pad,BASE,SC,LV,fpSVG}=window.OF;
/* anatomy */
try{(function(){const AD=[{d:[[0,0],[6,18],[22,64],[30,92],[41,118],[35,70],[28,40],[12,9]],o:6,c:1}];
  let svg=fpSVG(AD,{top:25412.5,labels:['Sample candle']});
  const x0=86,ax=222,y=r=>6+(r+1)*20,sy=6+12*20+20;
  const M=[[1,x0+8,y(0)+10],[2,x0+8,y(8)+10],[3,x0-12,y(2)+10],[4,ax+30,y(-1)+10],[5,x0+34,y(0)+10],[6,x0+62,y(0)+10],[7,x0+79,y(6)+10],[8,x0-12,y(4)+10],[9,x0+118,y(7)+10],[10,ax+14,sy+11],[11,ax+14,sy+33],[12,ax+14,sy+55]];
  let g=`<line x1="${x0-4}" y1="${y(4)+10}" x2="${x0+15}" y2="${y(4)+10}" stroke="#E7B04B" stroke-width="1.2"/>`;
  M.forEach(([n,cx,cy])=>{g+=`<circle cx="${cx}" cy="${cy}" r="8.5" fill="#E7B04B" stroke="#121314" stroke-width="1.5"/><text x="${cx}" y="${cy+3.8}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#1A1406" font-family="JetBrains Mono,monospace">${n}</text>`;});
  svg=svg.replace('</svg>',g+'</svg>').replace(/max-width:\d+px/,'max-width:420px');
  document.getElementById('anat').innerHTML=svg;
  const rows=AD[0].d.map((v,i)=>[25412.5-i*0.25,v[0],v[1]]).filter(r=>r[1]+r[2]>0);
  let sb=0,sa=0,h='<thead><tr><th>Price</th><th>Bid</th><th>Ask</th><th>Level delta</th><th>Level volume</th></tr></thead><tbody>';
  rows.forEach(([p,b,a])=>{sb+=b;sa+=a;const d=a-b,poc=a+b===159;h+=`<tr${poc?' class="hl"':''}><td>${fmt(p)}${poc?' · POC':''}</td><td>${b}</td><td>${a}</td><td style="color:var(${d>=0?'--buy':'--sell'})">${d>0?'+':''}${d}</td><td>${a+b}</td></tr>`;});
  h+=`<tr style="border-top:1px solid var(--line2)"><td><b>Full</b></td><td><b>${sb}</b></td><td><b>${sa}</b></td><td style="color:var(--buy)"><b>+${sa-sb}</b></td><td><b>${sa+sb}</b></td></tr><tr><td colspan="5" style="text-align:left;color:var(--accent)">Delta% = ${sa-sb} ÷ ${sa+sb} = ${((sa-sb)/(sa+sb)*100).toFixed(1)}%</td></tr></tbody>`;
  document.getElementById('dcalc').innerHTML=h;
  const C=[['A · 09:31',4200,210,'Open, high volume'],['B · 12:05',620,210,'Lunchtime, low volume'],['C · 10:14',1500,-480,'Candle breaking VAL']];
  let h2='<thead><tr><th>Candle</th><th>Volume</th><th>Delta</th><th>Delta%</th><th>Reading</th></tr></thead><tbody>';
  C.forEach(([n,v,d,t])=>{const pc=Math.round(d/v*100);h2+=`<tr><td>${n}</td><td>${v.toLocaleString('en-US')}</td><td style="color:var(${d>=0?'--buy':'--sell'})">${d>0?'+':''}${d}</td><td style="color:var(${d>=0?'--buy':'--sell'})">${pc>0?'+':''}${pc}%</td><td style="text-align:left;color:var(--muted)">${t}${Math.abs(pc)<=5?': balanced':Math.abs(pc)>=30?(d>0?': buyers dominate':': sellers dominate'):''}</td></tr>`;});
  document.getElementById('dcomp').innerHTML=h2+'</tbody>';
})();}catch(e){console.error(e);}

/* DOM tables */
function domSnap(id,rows){let h='<thead><tr><th>Bid T1</th><th>Bid T2</th><th style="text-align:center">Price</th><th style="text-align:left">Ask T2</th></tr></thead><tbody>';
  const mx=Math.max(...rows.map(r=>Math.max(r[1]||0,r[2]||0,r[3]||0)));
  rows.forEach(([px,b1,b2,a,cls])=>{const ch=b1&&b2?(b2>b1?'chg-up':b2<b1?'chg-dn':''):'';
    h+=`<tr><td style="color:var(--muted)">${b1??''}</td><td class="b">${b2?`<i class="bar" style="width:${Math.round(b2/mx*100)}%"></i><span class="${ch}">${b2}</span>`:''}</td><td class="px ${cls||''}">${fmt(px)}</td><td class="a" style="text-align:left">${a?`<i class="bar" style="width:${Math.round(a/mx*100)}%"></i><span>${a}</span>`:''}</td></tr>`;});
  document.getElementById(id).innerHTML=h+'</tbody>';}
try{domSnap('domA',[[25412.25,null,null,38],[25412.00,null,null,41],[25411.75,null,null,22],[25411.50,null,null,19],[25411.25,null,null,24],[25411.00,null,null,16,'last'],[25410.75,52,61,null],[25410.50,140,360,null,'lv'],[25410.25,66,80,null],[25410.00,58,71,null]]);
domSnap('domB',[[25412.25,null,null,62],[25412.00,null,null,70],[25411.75,null,null,58],[25411.50,null,null,66],[25411.25,null,null,49],[25411.00,null,null,55,'last'],[25410.75,48,30,null],[25410.50,300,18,null,'lv'],[25410.25,61,22,null],[25410.00,57,35,null]]);
(function(){const d=[['09:52:14',12,12],['09:52:15',12,12],['09:52:15',12,30],['09:52:17',12,41],['09:52:19',12,52],['09:52:22',12,39]];let t=0,h='<thead><tr><th>Time</th><th>Displayed bid</th><th>Filled this round</th><th>Total filled</th><th>Refills</th></tr></thead><tbody>';
  d.forEach((r,i)=>{t+=r[2];h+=`<tr><td style="color:var(--muted)">${r[0]}</td><td>${r[1]}</td><td style="color:var(--sell)">${r[2]}</td><td style="color:var(--accent)">${t}</td><td>${i}</td></tr>`;});
  document.getElementById('ice').innerHTML=h+'</tbody>';})();}catch(e){console.error(e);}

/* Tape tables */
function tape(id,rows){let h='<thead><tr><th>Time (ET)</th><th>Price</th><th>Size</th><th>Side</th></tr></thead><tbody>';
  rows.forEach(([t,p,s,sd,hl])=>{const c=sd==='B'?'var(--buy)':'var(--sell)',bg=hl===1?'background:var(--acc-bg)':hl===2?'background:var(--buy-bg)':'';
    h+=`<tr style="${bg}"><td style="color:var(--muted)">${t}</td><td>${fmt(p)}</td><td style="color:${c}">${s}</td><td style="color:${c}">${sd==='B'?'Buy':'Sell'}</td></tr>`;});
  document.getElementById(id).innerHTML=h+'</tbody>';}
try{tape('tapeA',[['09:41:07.812',25411.25,6,'B'],['09:41:07.906',25411.00,9,'S'],['09:41:08.120',25411.00,48,'S',1],['09:41:08.124',25411.00,62,'S',1],['09:41:08.301',25411.00,55,'S',1],['09:41:08.655',25411.25,7,'B'],['09:41:09.244',25411.75,31,'B',2],['09:41:09.390',25412.00,24,'B',2]]);
tape('tapeB',[['10:12:31.104',25429.50,8,'B'],['10:12:31.220',25429.75,44,'B',2],['10:12:31.236',25430.00,70,'B',2],['10:12:31.410',25430.25,52,'B',2],['10:12:31.702',25430.50,40,'B',2],['10:12:44.015',25430.25,5,'S'],['10:12:44.380',25430.00,3,'S'],['10:12:45.120',25430.00,6,'S']]);}catch(e){console.error(e);}

/* Cluster statistic */
try{(function(){const rows=[['Volume',[1840,2210,1960,2480,3920,1710]],['Delta',[120,-260,85,310,35,-190]],['Delta %',[6.5,-11.8,4.3,12.5,0.9,-11.1]],['Max Δ',[180,40,140,330,410,30]],['Min Δ',[-30,-290,-60,-20,-15,-220]]];
  let h='<thead><tr><th>Candle</th>'+[1,2,3,4,5,6].map(c=>`<th>${c}</th>`).join('')+'</tr></thead><tbody>';
  rows.forEach(([k,a],ri)=>{h+=`<tr><td style="color:var(--muted)">${k}</td>`+a.map((v,i)=>{let c='var(--fg)';if(ri>=1)c=v>0?'var(--buy)':v<0?'var(--sell)':'var(--fg)';
    const hl=i===4&&(ri===0||ri===1||ri===3)?'background:var(--acc-bg);':'';const t=ri===2?(v>0?'+':'')+v.toFixed(1)+'%':(ri>=1&&v>0?'+':'')+v.toLocaleString('en-US');return`<td style="color:${c};${hl}">${t}</td>`;}).join('')+'</tr>';});
  document.getElementById('cst').innerHTML=h+'</tbody>';})();}catch(e){console.error(e);}

/* CVD svg */
try{(function(){const pr=[0,3,6,5,9,12,14,13,16,18,21,17,14,12,13,15,17,16,18,20,21,22,23,24,25,22,18,15],cv=[0,60,140,120,220,330,420,390,500,600,720,600,480,410,420,460,520,500,540,580,590,600,610,620,630,560,430,330];
  const W=640,L=56,R=20,n=pr.length,x=i=>L+i*(W-L-R)/(n-1),yp=v=>20+120-v/26*120,yc=v=>180+110-v/740*110;
  const T=(x,y,t,c,a)=>`<text x="${x}" y="${y}" text-anchor="${a||'start'}" font-family="JetBrains Mono,monospace" font-size="11" fill="${c||'#8C99AD'}">${t}</text>`;
  let s=T(8,16,'Price')+T(8,176,'CVD')+`<line x1="${L}" x2="${W-R}" y1="160" y2="160" stroke="#252E3C"/>`;
  s+=`<polyline fill="none" stroke="#DCE3EE" stroke-width="2" points="${pr.map((v,i)=>`${x(i).toFixed(1)},${yp(v).toFixed(1)}`).join(' ')}"/>`;
  s+=`<polyline fill="none" stroke="#4C9BF0" stroke-width="2" points="${cv.map((v,i)=>`${x(i).toFixed(1)},${yc(v).toFixed(1)}`).join(' ')}"/>`;
  s+=`<line x1="${x(10)}" y1="${yp(21)}" x2="${x(24)}" y2="${yp(25)}" stroke="#E7B04B" stroke-width="2" stroke-dasharray="5 4"/><line x1="${x(10)}" y1="${yc(720)}" x2="${x(24)}" y2="${yc(630)}" stroke="#E7B04B" stroke-width="2" stroke-dasharray="5 4"/>`;
  s+=T(x(10)-14,yp(21)-8,'H','#DCE3EE')+T(x(24)-8,yp(25)-8,'HH','#DCE3EE')+T(x(10)-14,yc(720)-8,'H','#4C9BF0')+T(x(24)-8,yc(630)-8,'LH','#4C9BF0');
  s+=T(L-6,yp(26)+4,'25,426','#8C99AD','end')+T(L-6,yp(0)+4,'25,400','#8C99AD','end')+T(L-6,yc(740)+4,'+740','#8C99AD','end')+T(L-6,yc(0)+4,'0','#8C99AD','end');
  document.getElementById('cvd').innerHTML=s;})();}catch(e){console.error(e);}

/* Scenarios */
const DIRL={long:['p-long','Long'],short:['p-short','Short'],neu:['p-neu','Warning / target']};
try{document.getElementById('scs').innerHTML=SC.map((s,i)=>`<article class="sc" id="sc-${s.id}">
  <div class="hd"><span class="n">#${String(i+1).padStart(2,'0')}</span><h5>${s.title}</h5><span class="pill ${DIRL[s.dir][0]}">${DIRL[s.dir][1]}</span></div>
  <p class="ctx">${s.ctx}</p>
  <div class="vz">${fpSVG(s.src.candles,{lvRow:LV[s.id]??-1,top:25420,t0:9*60+40+i*7,marks:s.src.hl})}</div>
  <p class="cap">${s.cap}</p>
  <ul>${s.read.map(x=>`<li>${x}</li>`).join('')}</ul>
  <div class="plan3"><div class="e"><b>Entry</b>${s.plan[0]}</div><div class="s"><b>Stop</b>${s.plan[1]}</div><div class="tg"><b>Target</b>${s.plan[2]}</div></div>
  <p class="inv"><b>Invalidation:</b> ${s.bad}</p>
  <p class="inv" style="color:var(--muted)"><b style="color:var(--liq)">Extra confirmation:</b> ${s.conf}</p>
</article>`).join('');}catch(e){console.error(e);}

/* Grade checklist */
try{(function(){const ids=['k-g','k-c','k-d','k-t','k-f','k-x'],el=Object.fromEntries(ids.map(i=>[i,document.getElementById(i)]));
  function upd(){const g=el['k-g'].checked,f=el['k-f'].checked,x=el['k-x'].checked,n=['k-c','k-d','k-t'].filter(i=>el[i].checked).length;
    let v='Waiting',w='Tick from top to bottom.',c='var(--fg)';
    if(x){v='Skip';w='Red flag present.';c='var(--sell)';}
    else if(!g&&f){v='Skip';w='Trigger present but VWAP gate not passed.';c='var(--sell)';}
    else if(!g){w=n?`${n}/3 confirmations, VWAP gate not passed.`:w;}
    else if(!f){w=`VWAP gate passed, ${n}/3 confirmations. Waiting for the footprint trigger.`;}
    else if(n===3){v='A++';w='Enter, full size.';c='var(--buy)';}
    else if(n===2){v='A+';w='Enter.';c='var(--buy)';}
    else if(n===1){v='B';w='Skip, save the trade slot.';c='var(--accent)';}
    else{v='Skip';w='Footprint alone, no confirmation.';c='var(--sell)';}
    const G=document.getElementById('gG');G.textContent=v;G.style.color=c;document.getElementById('gW').textContent=w;}
  ids.forEach(i=>el[i].addEventListener('change',upd));upd();})();}catch(e){console.error(e);}

/* Glossary */
const GL=[['Absorption','Large aggressive volume blocked by limit orders, price does not follow through.'],['Aggressor','The side using market orders, accepting the other side’s price.'],['Ask','The lowest resting sell price. On the footprint: aggressive buy volume filled at the ask.'],['Bid','The highest resting buy price. On the footprint: aggressive sell volume filled at the bid.'],['Big trades','Fills above the size threshold, drawn as bubbles on the chart.'],['b-shape','Volume concentrated in the lower part of the candle/profile, usually long liquidation.'],['Climax','Volume and speed bursting at the end of a long leg.'],['Cluster Statistic','The table under the ATAS chart: volume, delta, delta %, max/min delta per candle.'],['CVD','Cumulative Volume Delta: delta accumulated through the session.'],['Delta','Σ ask − Σ bid: aggressive buying minus aggressive selling.'],['Delta flip','Delta clearly changes sign at a level and the next candle closes beyond the previous body.'],['Divergence','Price makes a new extreme but delta/CVD does not confirm.'],['DOM','Depth of Market: the book of resting limit orders.'],['Exhaustion','Attacking-side volume dries up towards the extreme.'],['Fade','Trading against the direction price just came from, expecting the level to hold (responsive).'],['Finished auction','A candle extreme with 0 on the attacking side.'],['Footprint','A bid × ask chart for each price level inside the candle (ATAS: cluster).'],['Heatmap','DOM history over time (ATAS: DOM Levels).'],['HVN / LVN','High-volume area (price slows down) / low-volume area (price passes quickly).'],['Iceberg','A hidden limit order that fills more than its displayed size and gets refilled.'],['Imbalance','Ask(P) ≥ 300% bid(P − 1) or bid(P) ≥ 300% ask(P + 1).'],['Initiative','The aggressive side pushes price out of value and it gets accepted.'],['Key level','A price chosen in advance (TPO: VAH, VAL, POC, poor high/low, single print, IB).'],['P-shape','Volume concentrated in the upper part, lower part thin, usually short covering.'],['POC','Point of Control: the price with the most volume (or TPO).'],['Pulling','Resting orders pulled before price touches.'],['Responsive','Price leaves value and gets pushed back.'],['Retest','Price comes back to the zone it just broke to test it before continuing.'],['Smart Tape','ATAS Time & Sales that merges orders split into pieces.'],['Speed of tape','Number of trades per unit of time.'],['Spoof','A large order placed to create an impression, then pulled.'],['Stacked imbalance','3 or more consecutive imbalance levels on the same side.'],['Stacking','Resting orders added as price approaches.'],['Trapped','The side that entered at an extreme before price closed the other way, forced to stop out.'],['Unfinished auction','A candle extreme with volume still on both bid and ask.'],['VWAP','Volume-weighted average price; RTH anchored at 9:30 ET, bands ±1σ/±2σ/±3σ.']];
try{document.getElementById('gloss').innerHTML=GL.map(([t,d])=>`<dt>${t}</dt><dd>${d}</dd>`).join('');}catch(e){console.error(e);}
})();
