
(function(){
'use strict';
const $=s=>document.querySelector(s);
const fmt=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FONT="'Be Vietnam Pro','Segoe UI',Arial,sans-serif", MONO="'JetBrains Mono',Consolas,monospace";
const ZC={
  A:{fill:'#8a6a12',stroke:'#d4a63a',text:'#fff3d1'},
  B:{fill:'#1d5a8a',stroke:'#4aa3e8',text:'#e3f2ff'},
  T:{fill:'#5f1a1e',stroke:'#9a2d33',text:'#ffd9d9'},
  TK:{fill:'#4a4f57',stroke:'#7d838c',text:'#e6e8eb'},
  Z:{fill:'#3b2f5c',stroke:'#7d6cf2',text:'#e6e1ff'}
};
const LC={tpo:{c:'#f5a623',dash:'2 4'},gex:{c:'#b388ff',dash:'6 4'},ref:{c:'#8a9099',dash:'2 3'},on:{c:'#8a9099',dash:'6 3'},pd:{c:'#c9ced6',dash:''}};
const INV={long:'net long',short:'net short',neutral:'neutral'};

function niceStep(r){const raw=r/9,p=Math.pow(10,Math.floor(Math.log10(raw))),m=raw/p;return(m<1.5?1:m<3.5?2.5:m<7.5?5:10)*p;}

function build(){
  if(!window.PLAN_READ) return null;
  const d=PLAN_READ();
  if(d.px==null) return {msg:'Enter the 9:15 price to draw the map.'};
  const lines=[],zones=[];
  const addL=(p,label,kind)=>{if(p!=null&&!isNaN(p))lines.push({p,label,kind});};
  addL(d.pdh,'PD High','pd');addL(d.pdl,'PD Low','pd');
  addL(d.vah,'PD VAH','tpo');addL(d.poc,'PD POC','tpo');addL(d.val,'PD VAL','tpo');
  addL(d.onh,'ON High','on');addL(d.onl,'ON Low','on');
  (d.custom||[]).forEach(c=>{
    const t=c.tag||'';
    if(c.lo!=null) zones.push({tag:ZC[t]?t:'Z',score:c.score||'',lo:c.lo,hi:c.hi,label:c.label||''});
    else if(['A','B','T','TK'].includes(t)) zones.push({tag:t,score:c.score||'',lo:c.p,hi:c.p,label:c.label||''});
    else addL(c.p,c.label||c.n,t==='GEX'?'gex':t==='TPO'?'tpo':'ref');
  });
  const all=[d.px,...lines.map(l=>l.p),...zones.flatMap(z=>[z.lo,z.hi])];
  let mn=Math.min(...all),mx=Math.max(...all);const pad=Math.max(8,(mx-mn)*0.05);mn-=pad;mx+=pad;

  const W=1000,T=78,PH=Math.max(560,Math.min(900,(mx-mn)*0.9)),LEG=118,H=T+PH+24+LEG,X0=74,X1=984,ZX=128;
  const Y=p=>T+(mx-p)/(mx-mn)*PH;
  let g='';
  g+=`<defs>${['#ef5350','#3fbf7f','#4aa3e8','#ffa94d'].map((c,i)=>`<marker id="ah${i}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('')}</defs>`;
  g+=`<rect width="${W}" height="${H}" fill="#101215"/>`;
  // title
  const sub=[`${d.dtype||''}${d.shape?' · shape '+d.shape:''}`,`Value ${fmt(d.val)}–${fmt(d.vah)} · POC ${fmt(d.poc)}`,
    d.onl!=null&&d.onh!=null?`ON ${fmt(d.onl)}–${fmt(d.onh)}${d.inv?' · '+(INV[d.inv]||d.inv):''}`:'',d.news?`News: ${d.news}`:''].filter(Boolean).join(' · ');
  g+=`<text x="${X0}" y="34" font-family="${FONT}" font-size="21" font-weight="700" fill="#e6e8eb">NQ · Plan ${esc(d.date||'')}</text>`;
  g+=`<text x="${X0}" y="56" font-family="${FONT}" font-size="12.5" fill="#9aa0a8">${esc(sub)}</text>`;
  // frame + grid
  g+=`<rect x="${X0}" y="${T}" width="${X1-X0}" height="${PH}" fill="none" stroke="#2c2f35"/>`;
  const st=niceStep(mx-mn);
  for(let p=Math.ceil(mn/st)*st;p<=mx;p+=st){const y=Y(p);g+=`<line x1="${X0}" x2="${X1}" y1="${y}" y2="${y}" stroke="#1d2026"/><text x="${X0-8}" y="${y+4}" text-anchor="end" font-family="${MONO}" font-size="11" fill="#7e858f">${fmt(p)}</text>`;}
  // left column: PD range + PD VA
  if(d.pdh!=null&&d.pdl!=null)g+=`<rect x="${X0+12}" y="${Y(d.pdh)}" width="5" height="${Y(d.pdl)-Y(d.pdh)}" fill="#5a606a"/>`;
  if(d.vah!=null&&d.val!=null){g+=`<rect x="${X0+22}" y="${Y(d.vah)}" width="18" height="${Y(d.val)-Y(d.vah)}" fill="#f5a623" opacity=".28"/>`;
    if(d.poc!=null)g+=`<rect x="${X0+20}" y="${Y(d.poc)-1.5}" width="22" height="3" fill="#f5a623"/>`;
    g+=`<text x="${X0+31}" y="${Y(d.vah)-6}" text-anchor="middle" font-family="${MONO}" font-size="10" fill="#ffcf85">PD VA</text>`;}
  // zones
  zones.sort((a,b)=>b.hi-a.hi).forEach(z=>{
    const c=ZC[z.tag],y1=Y(z.hi),y2=Y(z.lo),h=Math.max(z.tag==='TK'?5:12,y2-y1),yc=y1+(y2-y1)/2;
    g+=`<rect x="${ZX}" y="${yc-h/2}" width="${X1-ZX}" height="${h}" fill="${c.fill}" stroke="${c.stroke}" stroke-width=".8" opacity=".92"/>`;
    const rng=z.lo===z.hi?fmt(z.lo):`${fmt(z.lo)}–${fmt(z.hi)}`;
    const head=z.tag==='T'?'':z.tag==='Z'?'':`${z.tag}${z.score} · `;
    const txt=`${head}${rng}${z.label?' · '+z.label:''}`;
    const ty=z.tag==='TK'?yc-6:yc+4;
    g+=`<text x="${ZX+10}" y="${ty}" font-family="${FONT}" font-size="12" font-weight="${z.tag==='A'||z.tag==='B'?700:500}" fill="${z.tag==='TK'?'#e6e8eb':c.text}">${esc(txt)}</text>`;
  });
  // lines with label de-collision
  const L=lines.slice().sort((a,b)=>b.p-a.p);let lastY=-99;
  L.forEach(l=>{const s=LC[l.kind]||LC.ref,y=Y(l.p);
    g+=`<line x1="${ZX}" x2="${X1}" y1="${y}" y2="${y}" stroke="${s.c}" stroke-width="${l.kind==='pd'?1.2:1.3}"${s.dash?` stroke-dasharray="${s.dash}"`:''}/>`;
    let ly=y-4;if(ly-lastY<12){ly=y+13;if(ly-lastY<12)ly=lastY+12;}lastY=ly;
    g+=`<text x="${X1-6}" y="${ly}" text-anchor="end" font-family="${FONT}" font-size="11" fill="${s.c}">${esc(l.label)} ${fmt(l.p)}</text>`;});
  // scenario arrows from A/B zones
  const ab=zones.filter(z=>z.tag==='A'||z.tag==='B');
  const up=ab.filter(z=>z.lo>d.px).sort((a,b)=>a.lo-b.lo)[0], dn=ab.filter(z=>z.hi<d.px).sort((a,b)=>b.hi-a.hi)[0];
  
  const nextAbove=p=>{const z=zones.filter(z=>z.lo>p+2).sort((a,b)=>a.lo-b.lo)[0];if(z)return z.lo;return lines.map(l=>l.p).filter(x=>x>p+2).sort((a,b)=>a-b)[0];};
  const nextBelow=p=>{const z=zones.filter(z=>z.hi<p-2).sort((a,b)=>b.hi-a.hi)[0];if(z)return z.hi;return lines.map(l=>l.p).filter(x=>x<p-2).sort((a,b)=>b-a)[0];};
  const arrow=(x,p1,p2,ci,col,label,side)=>{const y1=Y(p1),y2=Y(p2);if(Math.abs(y2-y1)<14)return;
    g+=`<line x1="${x}" x2="${x}" y1="${y1}" y2="${y2}" stroke="${col}" stroke-width="2.2" marker-end="url(#ah${ci})"/>`;
    g+=`<text x="${side<0?x-8:x+8}" y="${(y1+y2)/2+4}" text-anchor="${side<0?'end':'start'}" font-family="${FONT}" font-size="12.5" fill="${col}">${esc(label)}</text>`;};
  if(up){arrow(800,up.lo,d.px,0,'#ef5350',`${up.tag}${up.score} sell`,1);const t=nextAbove(up.hi);if(t!=null)arrow(700,up.hi,t,2,'#4aa3e8','Break up',-1);}
  if(dn){arrow(880,dn.hi,d.px,1,'#3fbf7f',`${dn.tag}${dn.score} buy`,-1);const t=nextBelow(dn.lo);if(t!=null)arrow(700,dn.lo,t,3,'#ffa94d','Break down',-1);}
  // price
  const py=Y(d.px);
  g+=`<line x1="${X0}" x2="${X1}" y1="${py}" y2="${py}" stroke="#00e676" stroke-width="2"/>`;
  g+=`<text x="${ZX+6}" y="${py-6}" font-family="${FONT}" font-size="13" font-weight="700" fill="#00e676">Price 9:15 · ${fmt(d.px)}</text>`;
  // legend
  const LG=[['#d4a63a','Gold = zone A, enter on a trigger'],['#4aa3e8','Blue = zone B, enter on a trigger'],
    ['#9a2d33','Dark red = target, take profit, no entry'],['#7d838c','Grey = liquidity high/low · grey dotted = reference'],
    ['#f5a623','Orange dotted = TPO level (PD VAH/POC/VAL)'],['#b388ff','Purple dashed = GEX level'],
    ['#c9ced6','White = PD High/Low · grey dashed = ON High/Low'],['#00e676','Green = current price']];
  const ly0=T+PH+40;
  LG.forEach(([c,t],i)=>{const x=X0+(i%2)*460,y=ly0+Math.floor(i/2)*24;
    g+=`<rect x="${x}" y="${y-12}" width="22" height="14" rx="2" fill="${c}"/><text x="${x+32}" y="${y}" font-family="${FONT}" font-size="12.5" fill="#c9cdd3">${esc(t)}</text>`;});
  return {svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Plan level map">${g}</svg>`,date:d.date||''};
}

function render(){
  const el=$('#p-chart');if(!el)return;
  const r=build();if(!r)return;
  el.innerHTML=r.svg||`<p class="small muted" style="padding:12px">${r.msg}</p>`;
}
let tm;
document.addEventListener('input',e=>{if(e.target.id&&e.target.id.startsWith('p-')){clearTimeout(tm);tm=setTimeout(render,250);}});
document.addEventListener('change',e=>{if(e.target.id&&e.target.id.startsWith('p-'))render();});
document.addEventListener('click',e=>{if(e.target.id==='p-build')setTimeout(render,0);});

function png(){
  const svg=$('#p-chart svg'),msg=$('#p-chart-msg');if(!svg)return;
  const xml=new XMLSerializer().serializeToString(svg);
  const img=new Image(),W=+svg.getAttribute('width'),H=+svg.getAttribute('height'),S=2;
  img.onload=()=>{const c=document.createElement('canvas');c.width=W*S;c.height=H*S;const x=c.getContext('2d');x.scale(S,S);x.drawImage(img,0,0,W,H);
    c.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);
      const r=build();a.download=`plan-NQ-${(r&&r.date||'').replace(/[^\d]+/g,'-')||'map'}.png`;document.body.appendChild(a);a.click();a.remove();
      if(msg){msg.textContent='Image downloaded.';setTimeout(()=>msg.textContent='',2500);}},'image/png');};
  img.onerror=()=>{if(msg)msg.textContent='Could not export the image in this browser.';};
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml);
}
document.addEventListener('DOMContentLoaded',()=>{render();const b=$('#p-chart-png');if(b)b.addEventListener('click',png);});
})();
