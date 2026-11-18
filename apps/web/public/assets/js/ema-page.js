/* Widget chương EMA 9/34 (engine + chart từ artifact gốc; bỏ case study, lộ trình, routine, quiz cũ) */
(function(){
if(!document.getElementById("wChart"))return;

/* ===== EMA chart engine (no deps) ===== */
var C = {fast:'#4CC9F0', slow:'#E7B04B', up:'#35C99B', dn:'#F2636D', grid:'#22272E', txt:'#8C99AD', cross:'#C4B5FD'};
function rng(seed){var a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function genBars(keys, seed, noise, wick, over){
  var r=rng(seed), out=[], prev=null, k=0;
  var last=keys[keys.length-1][0];
  for(var i=keys[0][0];i<=last;i++){
    while(k<keys.length-2 && i>keys[k+1][0]) k++;
    var a=keys[k], b=keys[k+1], t=(b[0]===a[0])?0:(i-a[0])/(b[0]-a[0]);
    var base=a[1]+(b[1]-a[1])*t;
    var c=base+noise*(r()-0.5)*2;
    var o=prev===null?base:prev;
    var h=Math.max(o,c)+r()*wick, l=Math.min(o,c)-r()*wick;
    var bar={o:o,h:h,l:l,c:c};
    if(over&&over[i]) for(var q in over[i]) bar[q]=over[i][q];
    out.push(bar); prev=bar.c;
  }
  return out;
}
function ema(vals,n){var a=2/(n+1),out=[],e=null;for(var i=0;i<vals.length;i++){if(i<n-1){out.push(null);continue;}if(e===null){var s=0;for(var j=i-n+1;j<=i;j++)s+=vals[j];e=s/n;}else e=a*vals[i]+(1-a)*e;out.push(e);}return out;}
function tlabel(t0,i){if(!t0)return '';var p=t0.split(':'),m=(+p[0])*60+(+p[1])+i;m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
function analyze(bars,f,s){
  var cl=bars.map(function(b){return b.c;}), ef=ema(cl,f), es=ema(cl,s), cross=[], flip=[];
  for(var i=1;i<bars.length;i++){
    if(ef[i-1]!=null&&es[i-1]!=null){var d0=ef[i-1]-es[i-1],d1=ef[i]-es[i];if(d0*d1<0||(d0===0&&d1!==0))cross.push({i:i,dir:d1>0?1:-1});}
    if(ef[i-1]!=null){var s0=cl[i-1]-ef[i-1],s1=cl[i]-ef[i];if(s0*s1<0)flip.push({i:i,dir:s1>0?1:-1});}
  }
  return {ef:ef,es:es,cross:cross,flip:flip};
}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
function chartSVG(bars,o){
  o=o||{};var W=o.W||900,H=o.H||340,pl=8,pr=62,pt=14,pb=o.t0?26:12;
  var f=o.fast||9,s=o.slow||34,from=o.from||0,extra=o.extra||0;
  var A=o.an||analyze(bars,f,s),vis=bars.slice(from),n=vis.length+extra;
  var lo=Infinity,hi=-Infinity;
  vis.forEach(function(b){lo=Math.min(lo,b.l);hi=Math.max(hi,b.h);});
  (o.ann||[]).forEach(function(a){[a.p,a.p0,a.p1].forEach(function(p){if(p!=null){lo=Math.min(lo,p);hi=Math.max(hi,p);}});});
  for(var i=from;i<bars.length;i++){[A.ef[i],A.es[i]].forEach(function(v){if(v!=null){lo=Math.min(lo,v);hi=Math.max(hi,v);}});}
  var pad=(hi-lo)*0.07;lo-=pad;hi+=pad;
  var cw=(W-pl-pr)/n;
  function X(i){return pl+(i-from+0.5)*cw;}
  function Y(p){return pt+(hi-p)/(hi-lo)*(H-pt-pb);}
  var g=[];
  g.push('<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" role="img" font-family="JetBrains Mono,monospace">');
  // grid
  var step=niceStep((hi-lo)/5),p0=Math.ceil(lo/step)*step;
  for(var p=p0;p<hi;p+=step){var y=Y(p).toFixed(1);g.push('<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y+'" y2="'+y+'" stroke="'+C.grid+'"/><text x="'+(W-pr+6)+'" y="'+(+y+3.5)+'" font-size="10" fill="'+C.txt+'">'+fmt(p,o.dec)+'</text>');}
  if(o.t0){for(var i=from;i<from+n;i++){if(((i+(o.tOff||0))%(o.tEvery||10))===0){var x=X(i).toFixed(1);g.push('<line x1="'+x+'" x2="'+x+'" y1="'+pt+'" y2="'+(H-pb)+'" stroke="'+C.grid+'" stroke-dasharray="2 4"/><text x="'+x+'" y="'+(H-8)+'" font-size="10" fill="'+C.txt+'" text-anchor="middle">'+tlabel(o.t0,i)+'</text>');}}}
  // boxes first
  (o.ann||[]).filter(function(a){return a.t==='box';}).forEach(function(a){
    var x0=X(a.i0)-cw/2,x1=X(a.i1)+cw/2,y0=Y(Math.max(a.p0,a.p1)),y1=Y(Math.min(a.p0,a.p1));
    g.push('<rect x="'+x0.toFixed(1)+'" y="'+y0.toFixed(1)+'" width="'+(x1-x0).toFixed(1)+'" height="'+(y1-y0).toFixed(1)+'" fill="'+(a.fill||'rgba(242,99,109,.18)')+'" stroke="'+(a.stroke||'rgba(242,99,109,.6)')+'" stroke-width="1"/>');
    if(a.label)g.push('<text x="'+(x1-4).toFixed(1)+'" y="'+(y0+12).toFixed(1)+'" font-size="10.5" fill="'+(a.lc||'#FFD5D9')+'" text-anchor="end">'+esc(a.label)+'</text>');
  });
  (o.ann||[]).filter(function(a){return a.t==='hline';}).forEach(function(a){
    var y=Y(a.p).toFixed(1),x0=a.i0!=null?X(a.i0):pl,x1=a.i1!=null?X(a.i1):W-pr;
    g.push('<line x1="'+x0+'" x2="'+x1+'" y1="'+y+'" y2="'+y+'" stroke="'+a.c+'" stroke-width="1.2" '+(a.dash?'stroke-dasharray="5 4"':'')+'/>');
    if(a.label)g.push('<text x="'+(a.la==='l'?x0+4:x1-4)+'" y="'+(+y-4)+'" font-size="10.5" fill="'+(a.lc||a.c)+'" text-anchor="'+(a.la==='l'?'start':'end')+'">'+esc(a.label)+'</text>');
  });
  // candles
  for(var i=from;i<bars.length;i++){var b=bars[i],x=X(i),up=b.c>=b.o,col=up?C.up:C.dn,bw=Math.max(1,cw*0.62);
    g.push('<line x1="'+x.toFixed(1)+'" x2="'+x.toFixed(1)+'" y1="'+Y(b.h).toFixed(1)+'" y2="'+Y(b.l).toFixed(1)+'" stroke="'+col+'" stroke-width="1"/>');
    var yt=Y(Math.max(b.o,b.c)),yb=Y(Math.min(b.o,b.c));
    g.push('<rect x="'+(x-bw/2).toFixed(1)+'" y="'+yt.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+Math.max(1,yb-yt).toFixed(1)+'" fill="'+(up?col:col)+'" fill-opacity="'+(up?0.85:0.85)+'"/>');}
  // emas
  [[A.es,C.slow],[A.ef,C.fast]].forEach(function(pr2){var pts=[];for(var i=from;i<bars.length;i++)if(pr2[0][i]!=null)pts.push(X(i).toFixed(1)+','+Y(pr2[0][i]).toFixed(1));g.push('<polyline points="'+pts.join(' ')+'" fill="none" stroke="'+pr2[1]+'" stroke-width="1.9" stroke-linejoin="round"/>');});
  if(o.crosses!==false){A.cross.forEach(function(c){if(c.i<from)return;var x=X(c.i),y=Y(A.es[c.i]);g.push('<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="4.5" fill="none" stroke="'+C.cross+'" stroke-width="1.6"/>');});}
  (o.ann||[]).forEach(function(a){
    if(a.t==='arrow'){var x0=X(a.i0),y0=Y(a.p0),x1=X(a.i1),y1=Y(a.p1),id='ah'+Math.random().toString(36).slice(2,7);
      g.push('<defs><marker id="'+id+'" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="'+a.c+'"/></marker></defs><line x1="'+x0.toFixed(1)+'" y1="'+y0.toFixed(1)+'" x2="'+x1.toFixed(1)+'" y2="'+y1.toFixed(1)+'" stroke="'+a.c+'" stroke-width="1.6" stroke-dasharray="'+(a.dash?'5 4':'0')+'" marker-end="url(#'+id+')"/>');
      if(a.label)g.push('<text x="'+(x1+(a.lx||6)).toFixed(1)+'" y="'+(y1+(a.ly||4)).toFixed(1)+'" font-size="10.5" fill="'+(a.lc||a.c)+'" text-anchor="'+(a.anchor||'start')+'">'+esc(a.label)+'</text>');}
    if(a.t==='num'){var pp=a.p!=null?a.p:(a.at==='low'?bars[a.i].l:bars[a.i].h);var x=X(a.i),y=Y(pp)+(a.dy||0);g.push('<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="9" fill="rgba(231,176,75,.28)" stroke="#E7B04B" stroke-width="1.3"/><text x="'+x.toFixed(1)+'" y="'+(y+3.6).toFixed(1)+'" font-size="10.5" fill="#FDF1D8" text-anchor="middle">'+a.n+'</text>');}
    if(a.t==='mark'){var mp=a.p!=null?a.p:(a.at==='low'?bars[a.i].l:bars[a.i].h);var x=X(a.i),yy=Y(mp),y=yy+(a.dy||0);g.push('<line x1="'+x.toFixed(1)+'" x2="'+x.toFixed(1)+'" y1="'+yy.toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="'+(a.c||'#DCE3EE')+'" stroke-width="1" stroke-dasharray="2 2"/><text x="'+(x+(a.dx||0)).toFixed(1)+'" y="'+(y+(a.dy<0?-3:11)).toFixed(1)+'" font-size="10.5" fill="'+(a.c||'#DCE3EE')+'" text-anchor="'+(a.anchor||'middle')+'">'+esc(a.label)+'</text>');}
  });
  g.push('</svg>');return g.join('');
}
function niceStep(r){var e=Math.pow(10,Math.floor(Math.log10(r))),m=r/e;return (m<1.5?1:m<3?2:m<7?5:10)*e;}
function fmt(p,dec){return (dec?p.toFixed(dec):Math.round(p).toLocaleString('en-US'));}
/* ===== page app ===== */
(function(){
var $=function(s,r){return (r||document).querySelector(s);}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var store={get:function(k){try{return localStorage.getItem('emapb:'+k);}catch(e){return null;}},set:function(k,v){try{localStorage.setItem('emapb:'+k,v);}catch(e){}},del:function(k){try{localStorage.removeItem('emapb:'+k);}catch(e){}}};
function sh(keys,base){return keys.map(function(k){return [k[0],base+k[1]];});}

/* --- regime charts --- */
var REG={
  s1:{k:[[0,100],[34,100],[40,104],[55,128],[70,152],[85,176],[100,198]],seed:3,n:1.6,w:2},
  s2:{k:[[0,100],[34,102],[50,132],[58,126],[64,121],[70,124],[84,146],[100,160]],seed:5,n:2.2,w:2.5},
  s3:{k:[[0,100],[34,104],[54,136],[62,141],[70,130],[76,137],[84,128],[92,134],[100,127]],seed:8,n:2.2,w:2.5},
  s4:{k:[[0,120],[34,120],[42,129],[50,113],[58,128],[66,112],[74,127],[82,113],[90,126],[100,117]],seed:13,n:2.4,w:2.6},
  s5:{k:[[0,100],[34,104],[52,134],[58,146],[61,131],[64,129],[68,137],[72,135],[86,112],[100,102]],seed:17,n:2,w:2.4}
};
$$('[data-chart]').forEach(function(el){var r=REG[el.getAttribute('data-chart')];var bars=genBars(sh(r.k,27000),r.seed,r.n,r.w);
  var ann=[];
  if(el.getAttribute('data-chart')==='s5'){ann=[{t:'num',i:58,at:'high',n:1,dy:-14},{t:'num',i:61,at:'low',n:2,dy:16},{t:'box',i0:61,i1:100,p0:27133,p1:27140,label:'VAH'}];
    var A=analyze(bars,9,34),cx=A.cross.filter(function(c){return c.i>58;})[0];if(cx)ann.push({t:'num',i:cx.i,p:A.es[cx.i],n:4,dy:-16});ann.push({t:'num',i:68,at:'high',n:3,dy:-14});}
  el.innerHTML=chartSVG(bars,{from:34,W:900,H:300,ann:ann});});

/* --- anatomy --- */
(function(){var bars=genBars(sh([[0,100],[34,100],[40,96],[46,104],[60,132],[70,152],[76,143],[80,140],[88,158],[98,166],[110,165]],27000),21,1.8,2.2);
  var A=analyze(bars,9,34),cx=A.cross.filter(function(c){return c.i>36&&c.dir>0;})[0];
  var ann=[{t:'num',i:69,at:'high',n:2,dy:-14},{t:'num',i:79,at:'low',n:3,dy:16},{t:'num',i:104,at:'high',n:4,dy:-14}];
  if(cx)ann.push({t:'num',i:cx.i,p:A.es[cx.i],n:1,dy:16});
  $('#chAnat').innerHTML=chartSVG(bars,{from:34,W:900,H:300,ann:ann});})();

/* --- management --- */
(function(){var bars=genBars(sh([[0,160],[34,158],[38,163],[42,150],[45,155],[48,147],[58,126],[64,119],[68,122],[73,112],[79,107],[83,114],[87,120],[92,127],[100,131]],27000),9,1.6,2.2,{38:{h:27166}});
  var A=analyze(bars,9,34),ent=47,warn=null,exit=null;
  for(var i=ent+1;i<bars.length;i++){var ab9=bars[i].c>A.ef[i];if(ab9&&warn===null){warn=i;continue;}
    if(warn!==null&&((ab9&&bars[i-1].c>A.ef[i-1])||bars[i].c>A.es[i])){exit=i;break;}
    if(warn!==null&&!ab9&&bars[i].c<A.ef[i]){/* reset warning if back under */}}
  var ann=[{t:'hline',p:27167,i0:ent,i1:exit||bars.length-1,c:'#F2636D',dash:1,label:'Stop ban đầu',la:'l',lc:'#FFD5D9'},
    {t:'mark',i:38,at:'high',dy:-16,label:'Sweep',c:'#DDD6FE'},
    {t:'mark',i:ent,at:'high',dy:-26,label:'Entry short',c:'#FDE7B8'}];
  if(warn)ann.push({t:'mark',i:warn,at:'high',dy:-34,label:'Bậc 2: chốt 50%',c:'#BAE6FD',anchor:'end',dx:4});
  if(exit)ann.push({t:'mark',i:exit,at:'high',dy:-40,label:'Bậc 3: thoát hết',c:'#A7F3D0',anchor:'end',dx:-6});
  $('#chMgmt').innerHTML=chartSVG(bars,{from:30,W:900,H:320,ann:ann});
  if(warn&&exit){var e=bars[ent].c,r=bars[38].h+1-e,p2=(e-bars[warn].c)/r,p3=(e-bars[exit].c)/r;
    $('#mgmtCap').innerHTML='Entry ở nến đóng dưới EMA9 sau khi retest. Nhịp giảm đầu: mọi nến đóng dưới EMA9, cứ thế giữ. Khi giá hồi nhẹ, nến đầu tiên đóng trên EMA9 kích hoạt bậc 2: chốt 50% ở khoảng <b>+'+p2.toFixed(1)+'R</b>. Giá giảm tiếp, phần còn lại được giữ đến khi bậc 3 xảy ra ở <b>+'+p3.toFixed(1)+'R</b>. Cả lệnh ≈ <b>+'+((p2+p3)/2).toFixed(1)+'R</b>. Phần lợi nhuận trả lại thị trường ở cuối lệnh khá nhỏ.';}})();

/* --- weight widget --- */
function drawW(N){var a=2/(N+1),K=Math.max(40,Math.min(70,N+20)),W=900,H=190,pl=10,pr=10,pt=18,pb=26,bw=(W-pl-pr)/K,mx=a,g=['<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" font-family="JetBrains Mono,monospace">'];
  for(var k=0;k<K;k++){var w=a*Math.pow(1-a,k),h=(w/mx)*(H-pt-pb),x=W-pr-(k+1)*bw;
    g.push('<rect x="'+(x+bw*0.12).toFixed(1)+'" y="'+(H-pb-h).toFixed(1)+'" width="'+(bw*0.76).toFixed(1)+'" height="'+Math.max(0.5,h).toFixed(1)+'" fill="'+(k<N?'#4CC9F0':'#3A4659')+'" fill-opacity="'+(k<N?0.85:0.9)+'"/>');
    if(k===0||k===N-1||(k%10===9&&k!==N-1&&Math.abs(k-(N-1))>3))g.push('<text x="'+(k===0?x+bw:x+bw/2).toFixed(1)+'" y="'+(H-9)+'" font-size="10" fill="#8C99AD" text-anchor="'+(k===0?'end':'middle')+'">'+(k===0?'mới nhất':'-'+k)+'</text>');}
  g.push('<text x="'+(W-pr)+'" y="12" font-size="10.5" fill="#BAE6FD" text-anchor="end">nến mới nhất: '+(a*100).toFixed(1)+'%</text></svg>');
  $('#wChart').innerHTML=g.join('');
  var cov=(1-Math.pow(1-a,N))*100,half=Math.log(.5)/Math.log(1-a);
  $('#wStats').innerHTML='<div class="stat"><b>'+a.toFixed(3)+'</b><span>α = 2/(N+1)</span></div><div class="stat"><b>'+cov.toFixed(1)+'%</b><span>trọng số trong '+N+' nến gần nhất</span></div><div class="stat"><b>'+half.toFixed(1)+'</b><span>half-life (nến)</span></div><div class="stat"><b>~'+((N-1)/2).toFixed(1)+'</b><span>độ trễ trung bình (nến)</span></div>';
  $('#wN').value=N;$('#wNo').textContent=N;}
$('#wN').addEventListener('input',function(){drawW(+this.value);});
$$('[data-wn]').forEach(function(b){b.addEventListener('click',function(){drawW(+b.getAttribute('data-wn'));});});
drawW(9);

/* --- simulator --- */
var simSeed=101;
function simKeys(reg,r){var segs,k=[[0,0]],i=0,p=0;function j(x){return x*(0.7+r()*0.6);}
  if(reg==='up'||reg==='down'){segs=[[40,0],[20,25],[10,-9],[20,28],[8,-11],[24,30],[12,-13],[20,22],[16,6]];}
  else if(reg==='range'){segs=[[40,0]];var s=1;for(var q=0;q<9;q++){segs.push([12+Math.floor(r()*7),s*(16+r()*6)]);s=-s;}segs.push([10,0]);}
  else if(reg==='vtop'){segs=[[40,0],[30,40],[8,12],[7,-24],[8,9],[30,-46],[27,-6]];}
  else{segs=[[40,0]];for(var q=0;q<10;q++)segs.push([10+Math.floor(r()*10),(r()-0.5)*36]);}
  segs.forEach(function(s){i+=Math.round(j(s[0]))||1;p+=(reg==='down'?-1:1)*(reg==='range'?s[1]:j(s[1]));k.push([i,p]);});
  if(reg==='range'){var m=k.reduce(function(a,b){return a+b[1];},0)/k.length;k=k.map(function(x,ix){return ix<2?x:[x[0],x[1]-((x[1]-m)*0.2)];});}
  return k;}
function drawSim(){var reg=$('#simReg').value,f=+$('#simF').value,s=+$('#simS').value;if(s<=f){s=f+4;$('#simS').value=s;}
  $('#simFo').textContent=f;$('#simSo').textContent=s;
  var r=rng(simSeed),bars=genBars(sh(simKeys(reg,r),27100),simSeed,2.4,2.8),A=analyze(bars,f,s),from=40;
  $('#simChart').innerHTML=chartSVG(bars,{from:from,W:900,H:320,fast:f,slow:s,an:A});
  var cr=A.cross.filter(function(c){return c.i>=from;}).length,fl=A.flip.filter(function(c){return c.i>=from;}).length,sp=0,st=0,n=0;
  for(var i=from;i<bars.length;i++){if(A.es[i]==null)continue;n++;sp+=Math.abs(A.ef[i]-A.es[i]);var c=bars[i].c;if((c>A.ef[i]&&A.ef[i]>A.es[i])||(c<A.ef[i]&&A.ef[i]<A.es[i]))st++;}
  $('#simStats').innerHTML='<div class="stat"><b>'+cr+'</b><span>số cross '+f+'/'+s+'</span></div><div class="stat"><b>'+fl+'</b><span>lần nến đóng đổi phía EMA'+f+'</span></div><div class="stat"><b>'+(sp/n).toFixed(1)+'</b><span>spread TB (điểm)</span></div><div class="stat"><b>'+Math.round(st/n*100)+'%</b><span>nến có stack đúng</span></div>';}
['simReg','simF','simS'].forEach(function(id){$('#'+id).addEventListener('input',drawSim);});
$('#simNew').addEventListener('click',function(){simSeed=Math.floor(Math.random()*1e6);drawSim();});
drawSim();

/* --- tabs --- */
$$('[data-tabs]').forEach(function(tl){var sec=tl.closest('section');$$('button',tl).forEach(function(b){b.addEventListener('click',function(){
  $$('button',tl).forEach(function(x){x.setAttribute('aria-selected',x===b?'true':'false');});
  $$('.tp',sec).forEach(function(p){p.classList.toggle('on',p.getAttribute('data-p')===b.getAttribute('data-t'));});});});});

/* --- score --- */
function grade(){var pts=$$('#score input[data-pt]').filter(function(x){return x.checked;}).length,gates=$$('#score input[data-gate]'),gok=gates.every(function(x){return x.checked;}),any=$$('#score input').some(function(x){return x.checked;});
  var G=$('#gradeG'),D=$('#gradeD'),box=$('#gradeBox');
  if(!any){G.textContent='–';G.style.color='';D.textContent='Tick các lớp để chấm điểm.';box.style.borderColor='';return;}
  var g,d,c;
  if(!gok){g='STOP';d='Thiếu cổng bắt buộc. Không trade, dù điểm bao nhiêu.';c='#F2636D';}
  else if(pts===5){g='A++';d='Đủ 5 lớp. Size đầy đủ theo plan.';c='#35C99B';}
  else if(pts===4){g='A+';d='4/5 lớp. Trade được, size chuẩn. Ghi rõ lớp nào thiếu vào journal.';c='#35C99B';}
  else if(pts===3){g='B';d='3/5 lớp. Giảm size một nửa hoặc bỏ qua. Không dùng nếu thiếu L2 hoặc L4.';c='#E7B04B';}
  else{g='NO';d=pts+'/5 lớp. Không đủ lý do. Đứng ngoài.';c='#F2636D';}
  if(gok&&pts>=3&&(!$('#score input[data-g=L2]').checked||!$('#score input[data-g=L4]').checked)){g='NO';d='Thiếu Location (L2) hoặc OF trigger (L4). EMA một mình không đủ để vào lệnh.';c='#F2636D';}
  G.textContent=g;G.style.color=c;D.textContent=d;box.style.borderColor=c;}
$$('#score input').forEach(function(x){x.addEventListener('change',grade);});
$('#scoreReset').addEventListener('click',function(){$$('#score input').forEach(function(x){x.checked=false;});grade();});

})();

})();
