/* Orderflow renderer: footprint kiểu cluster ATAS, DOM/Tape helpers, 13 kịch bản.
   Tách nguyên văn từ artifact "Orderflow - Tools Playbook". */
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
{id:'abs-bot',src:BASE.absBottom,dir:'long',type:'rev',title:'Absorption ở đáy',
 ctx:'<b>Cần có:</b> giá quét low cũ, VAL hoặc band −2σ VWAP sau một nhịp giảm.',
 cap:'<b>Nến 2:</b> bid 210 và 240 ở hai mức thấp nhất, delta âm mạnh nhưng nến đóng tăng. <b>Nến 3:</b> stacked imbalance mua xác nhận.',
 read:['Volume bán chủ động dồn cực lớn ở đáy nhưng giá không xuống thêm: có limit buy lớn hấp thụ.','Delta của nến hấp thụ âm nhưng thân nến tăng, đây là điểm mấu chốt.','Nến sau xuất hiện stacked imbalance mua: phe mua chuyển sang chủ động.'],
 plan:['Retest vùng stacked mua của nến 3, hoặc limit ngay trên vùng absorption.','2 tick dưới đáy vùng absorption.','POC phiên, VWAP hoặc HVN gần nhất phía trên.'],
 bad:'Nến đóng dưới vùng absorption, hoặc bid lớn tiếp tục khớp ở đáy mới thấp hơn.',
 conf:'Iceberg bid trên DOM, CVD tạo đáy cao hơn trong khi giá tạo đáy thấp hơn.'},
{id:'abs-top',src:mirror(BASE.absBottom),dir:'short',type:'rev',title:'Absorption ở đỉnh',
 ctx:'<b>Cần có:</b> giá quét high cũ, VAH hoặc band +2σ VWAP sau một nhịp tăng.',
 cap:'<b>Nến 2:</b> ask 210 và 240 ở hai mức cao nhất, delta dương mạnh nhưng nến đóng giảm. <b>Nến 3:</b> stacked imbalance bán xác nhận.',
 read:['Người mua đập lệnh market dồn dập ở đỉnh nhưng giá không lên thêm: limit sell lớn đang hấp thụ.','Delta dương mà thân nến giảm.','Stacked imbalance bán ở nến sau là xác nhận.'],
 plan:['Retest vùng stacked bán của nến 3.','2 tick trên đỉnh vùng absorption.','POC, VWAP hoặc HVN gần nhất phía dưới.'],
 bad:'Nến đóng trên vùng absorption, hoặc ask lớn tiếp tục khớp ở đỉnh mới.',
 conf:'Tường ask đứng vững trên heatmap, big trades mua cụm ở đỉnh.'},
{id:'stk-buy',src:BASE.stacked,dir:'long',type:'cont',title:'Stacked imbalance mua, retest',
 ctx:'<b>Cần có:</b> giá nén dưới IB high, high phiên trước hoặc VAH rồi phá lên.',
 cap:'<b>Nến 2:</b> 4 mức imbalance mua liên tiếp khi phá range. <b>Nến 3:</b> giá lùi về vùng stacked, volume bán nhỏ dần, delta vẫn dương.',
 read:['Stacked imbalance mua cho thấy phe mua chủ động ăn liền nhiều mức ask, đây là initiative.','Đỉnh nến 2 còn volume cả hai phía (unfinished), giá thường quay lại vượt qua.','Khi retest, bid khớp nhỏ dần về đáy vùng: người bán không còn lực.'],
 plan:['Limit trong nửa trên của vùng stacked, hoặc vào khi nến retest đóng lại trên vùng.','2 tick dưới mức thấp nhất của vùng stacked.','Đỉnh unfinished của nến breakout, rồi mục tiêu đo độ dài range.'],
 bad:'Giá đóng dưới đáy vùng stacked: chuyển sang kịch bản imbalance failure.',
 conf:'CVD tạo đỉnh mới cùng giá, VWAP dốc lên, speed of tape tăng lúc phá.'},
{id:'stk-sell',src:mirror(BASE.stacked),dir:'short',type:'cont',title:'Stacked imbalance bán, retest',
 ctx:'<b>Cần có:</b> giá nén trên IB low, low phiên trước hoặc VAL rồi phá xuống.',
 cap:'<b>Nến 2:</b> 4 mức imbalance bán liên tiếp khi phá range. <b>Nến 3:</b> giá hồi về vùng stacked, ask khớp nhỏ dần.',
 read:['Phe bán chủ động ăn liền nhiều mức bid.','Đáy nến 2 unfinished, giá thường quay lại xuống thấp hơn.','Khi hồi, ask nhỏ dần: người mua yếu.'],
 plan:['Limit trong nửa dưới vùng stacked bán.','2 tick trên mức cao nhất của vùng stacked.','Đáy unfinished, rồi mục tiêu đo độ dài range.'],
 bad:'Giá đóng trên đỉnh vùng stacked bán.',
 conf:'CVD tạo đáy mới, giá dưới VWAP, tường bid phía dưới bị rút trên heatmap.'},
{id:'exh-top',src:BASE.exhTop,dir:'short',type:'rev',title:'Exhaustion ở đỉnh',
 ctx:'<b>Cần có:</b> nhịp tăng dài chạm band +2σ, VAH hoặc vùng kháng cự HTF.',
 cap:'<b>Nến 2:</b> ask giảm dần 16 → 12 → 9 → 5 → 0 về phía đỉnh, đỉnh có ask = 0 (finished auction). <b>Nến 3:</b> stacked imbalance bán.',
 read:['Volume mua chủ động mỏng dần khi giá lên cao: không còn ai đuổi giá.','Đỉnh có ask bằng 0: phiên đấu giá phía trên đã kết thúc.','Khác absorption: ở đây volume nhỏ, không phải volume lớn bị chặn.'],
 plan:['Retest vùng stacked bán của nến xác nhận.','2 tick trên đỉnh exhaustion.','VWAP hoặc POC; nhịp đầu thường về lại giữa range.'],
 bad:'Giá quay lại vượt đỉnh với ask volume tăng mạnh.',
 conf:'Speed of tape giảm dần khi lên đỉnh, CVD đi ngang hoặc giảm.'},
{id:'exh-bot',src:mirror(BASE.exhTop),dir:'long',type:'rev',title:'Exhaustion ở đáy',
 ctx:'<b>Cần có:</b> nhịp giảm dài chạm band −2σ, VAL hoặc hỗ trợ HTF.',
 cap:'<b>Nến 2:</b> bid giảm dần về phía đáy, đáy có bid = 0 (finished auction). <b>Nến 3:</b> stacked imbalance mua.',
 read:['Bán chủ động cạn dần khi giá xuống thấp.','Đáy có bid bằng 0: không còn người bán ở dưới.','Cần nến xác nhận có initiative mua.'],
 plan:['Retest vùng stacked mua của nến xác nhận.','2 tick dưới đáy exhaustion.','VWAP hoặc POC.'],
 bad:'Giá quay lại phá đáy với bid volume tăng mạnh.',
 conf:'Speed of tape giảm khi xuống đáy, CVD không tạo đáy mới.'},
{id:'unf',src:{candles:[
  {d:[[0,0],[0,0],[12,9],[20,34],[26,45],[30,40],[28,30],[16,12]],o:7,c:2},
  {d:[[0,0],[0,0],[0,0],[9,6],[22,14],[30,20],[38,24],[33,22],[20,18],[8,5]],o:3,c:8},
  {d:[[3,0],[10,18],[16,30],[20,42],[24,50],[26,44],[22,30],[18,16],[10,6]],o:8,c:1}],
  hl:[[0,2,'unf'],[2,0,'exh']]},dir:'neu',type:'cont',title:'Unfinished auction làm target',
 ctx:'<b>Cần có:</b> một đỉnh hoặc đáy nến quan trọng (high phiên, swing) còn volume cả hai phía.',
 cap:'<b>Nến 1:</b> đỉnh còn 12 × 9, chưa kết thúc. <b>Nến 3:</b> giá quay lại vượt qua và tạo đỉnh mới có ask = 0.',
 read:['Đỉnh có cả bid và ask khác 0 nghĩa là đấu giá chưa xong, thị trường hay quay lại "sửa".','Khi giá quay lại và tạo đỉnh mới với ask = 0, mức đó đã được sửa.','Đây là công cụ chọn target, không phải tín hiệu vào lệnh.'],
 plan:['Không vào lệnh chỉ vì unfinished.','Không áp dụng.','Dùng mức unfinished làm TP cho lệnh long đang giữ, hoặc chờ sửa xong rồi mới xét short.'],
 bad:'Không phải mọi unfinished đều được quay lại trong cùng phiên; ưu tiên các mức ở swing quan trọng.',
 conf:'Mức unfinished trùng high phiên trước hoặc poor high trên TPO thì xác suất quay lại cao hơn.'},
{id:'trap-buy',src:BASE.trapBuy,dir:'short',type:'rev',title:'Người mua bị kẹt ở breakout giả',
 ctx:'<b>Cần có:</b> giá phá high range hoặc high phiên trước, kéo nhiều người mua đuổi.',
 cap:'<b>Nến 1:</b> imbalance mua dồn ở 3 mức cao nhất, delta +258 nhưng nến đóng thấp, râu trên dài. <b>Nến 2:</b> đóng dưới mức breakout với stacked bán.',
 read:['Người mua đuổi ở đỉnh (vùng viền xanh dương) giờ đang lỗ.','Khi giá đóng lại trong range, họ phải cắt lỗ bằng lệnh bán, đẩy giá xuống nhanh hơn.','Nến 3 hồi nhẹ với ask rất nhỏ: không ai muốn mua lại.'],
 plan:['Short khi nến đóng dưới mức breakout, hoặc retest nhẹ vào vùng stacked bán.','2 tick trên đỉnh nến bẫy.','Cạnh đối diện của range, POC range trước đó.'],
 bad:'Giá quay lại trên vùng bị kẹt và giữ được với delta dương.',
 conf:'Big trades mua cụm ở đỉnh, tường bid bên dưới bị rút trên heatmap.'},
{id:'trap-sell',src:mirror(BASE.trapBuy),dir:'long',type:'rev',title:'Người bán bị kẹt ở breakdown giả',
 ctx:'<b>Cần có:</b> giá phá low range hoặc low phiên trước, kéo người bán đuổi.',
 cap:'<b>Nến 1:</b> imbalance bán dồn ở 3 mức thấp nhất nhưng nến đóng cao, râu dưới dài. <b>Nến 2:</b> đóng trên mức breakdown với stacked mua.',
 read:['Người bán đuổi ở đáy đang lỗ.','Họ cắt lỗ bằng lệnh mua, đẩy giá lên nhanh (short covering).','Nến hồi xuống có bid rất nhỏ.'],
 plan:['Long khi nến đóng lại trên mức breakdown, hoặc retest vùng stacked mua.','2 tick dưới đáy nến bẫy.','Cạnh trên của range, POC range.'],
 bad:'Giá quay lại dưới vùng bị kẹt và giữ được với delta âm.',
 conf:'Big trades bán cụm ở đáy, đây là dạng sweep and reclaim quen thuộc.'},
{id:'div',src:{candles:[
  {d:[[0,0],[0,0],[0,0],[10,26],[22,50],[28,64],[30,70],[36,52],[30,34],[14,8]],o:9,c:3},
  {d:[[22,14],[46,30],[60,38],[58,34],[40,26],[18,10]],o:4,c:2},
  {d:[[0,0],[6,4],[26,8],[40,12],[48,16],[42,20],[30,18],[12,6]],o:2,c:7}],
  hl:[[1,0,'abs'],[1,1,'abs']]},dir:'short',type:'rev',title:'Delta divergence trên nến',
 ctx:'<b>Cần có:</b> giá tạo đỉnh mới tại kháng cự, sau ít nhất một nhịp tăng rõ.',
 cap:'<b>Nến 2:</b> giá tạo đỉnh cao hơn nhưng delta −92. <b>Nến 3:</b> stacked imbalance bán xác nhận.',
 read:['Giá lên mà delta âm: phe bán chủ động nhiều hơn nhưng giá vẫn được kéo lên bởi limit buy rút dần.','Lực mua thật đã yếu; đỉnh mới không có người mua chủ động đỡ.','Cần nến sau có initiative bán mới vào lệnh.'],
 plan:['Retest vùng stacked bán của nến 3.','2 tick trên đỉnh nến divergence.','VWAP, POC hoặc đáy nhịp tăng gần nhất.'],
 bad:'Nến tiếp theo đóng trên đỉnh divergence với delta dương.',
 conf:'CVD trên toàn phiên cũng tạo đỉnh thấp hơn; cluster statistic cho thấy max delta lớn nhưng delta đóng nến âm.'},
{id:'fail',src:{candles:[
  {d:[[0,0],[0,0],[8,30],[12,66],[16,74],[20,80],[26,58],[30,36],[18,10]],o:8,c:2},
  {d:[[0,0],[12,14],[22,20],[30,18],[36,22],[20,14],[8,4]],o:2,c:4},
  {d:[[0,0],[0,0],[0,0],[5,6],[30,8],[48,12],[62,14],[58,20],[40,18],[16,6]],o:4,c:9}],
  hl:[[2,4,'trap'],[2,5,'trap']]},dir:'short',type:'rev',title:'Imbalance failure (lật vùng stacked)',
 ctx:'<b>Cần có:</b> vùng stacked mua xuất hiện, nhưng giá không đi tiếp được sau đó.',
 cap:'<b>Nến 1:</b> stacked mua 3 mức. <b>Nến 3:</b> giá xuyên qua toàn bộ vùng stacked và đóng dưới, kèm stacked bán.',
 read:['Vùng stacked là nơi phe mua đã cam kết; khi giá đóng dưới vùng này, họ bị kẹt.','Vùng stacked mua cũ trở thành kháng cự.','Đây là kịch bản có tỷ lệ lợi nhuận/rủi ro tốt vì stop gần.'],
 plan:['Short khi nến đóng dưới đáy vùng stacked mua, hoặc retest từ dưới lên.','2 tick trên đỉnh vùng stacked mua cũ.','Đáy của nhịp tăng ban đầu, HVN phía dưới.'],
 bad:'Giá reclaim lại vùng stacked và đóng trên.',
 conf:'Delta flip từ dương sang âm mạnh, speed of tape tăng khi xuyên vùng.'},
{id:'p',src:BASE.pShape,dir:'neu',type:'rev',title:'P-shape: short covering',
 ctx:'<b>Cần có:</b> nến tăng mạnh sau một nhịp giảm, volume dồn ở phần trên.',
 cap:'<b>Nến 2:</b> phần dưới nến gần như trống (volume 2–14), volume dồn ở 3 mức trên cùng, delta chỉ +14. <b>Nến 3:</b> giá trôi xuống lại.',
 read:['Giá lên nhanh qua phần dưới mà không có volume: chủ yếu là người short cũ mua đóng lệnh.','Volume chỉ xuất hiện khi lên cao, delta gần bằng 0: không có người mua mới thật sự.','Phần dưới mỏng là LVN trong nến, giá thường quay lại lấp.'],
 plan:['Không đuổi long. Chờ giá quay về phần mỏng rồi đánh giá lại.','Nếu short theo nến 3: 2 tick trên đỉnh P.','Đáy của phần mỏng (gốc nến P).'],
 bad:'Volume mới xuất hiện ở phần dưới và giá giữ trên POC của nến P: thị trường đã chấp nhận giá cao hơn.',
 conf:'TPO/volume profile phiên có hình P, CVD không tăng tương ứng với giá.'},
{id:'b',src:mirror(BASE.pShape),dir:'neu',type:'rev',title:'b-shape: long liquidation',
 ctx:'<b>Cần có:</b> nến giảm mạnh sau một nhịp tăng, volume dồn ở phần dưới.',
 cap:'<b>Nến 2:</b> phần trên nến gần như trống, volume dồn ở 3 mức dưới cùng, delta gần 0. <b>Nến 3:</b> giá hồi lên lại.',
 read:['Giá rơi nhanh qua phần trên không có volume: người long cũ thoát hàng.','Không có người bán mới thật sự, delta gần 0.','Phần trên mỏng thường được lấp lại.'],
 plan:['Không đuổi short. Chờ giá hồi về phần mỏng.','Nếu long theo nến 3: 2 tick dưới đáy b.','Đỉnh của phần mỏng.'],
 bad:'Volume mới xuất hiện ở phần trên và giá giữ dưới POC của nến b.',
 conf:'Profile phiên có hình b, CVD không giảm tương ứng.'}
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
function tm(m){const h=Math.floor(m/60),mm=m%60;return`${h}:${String(mm).padStart(2,'0')} ${h<12?'SA':'CH'}`;}
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
  return`<svg viewBox="0 0 ${W} ${H}" style="min-width:${Math.round(W*0.85)}px;max-width:${Math.round(W*(n>1?1.3:1.1))}px;font-variant-numeric:tabular-nums" font-family="'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif" role="img" aria-label="Footprint kiểu cluster ATAS">${g}</svg>`;
}
window.__fpSVG=fpSVG;
const LV={'abs-bot':7,'abs-top':2,'stk-buy':4,'stk-sell':5,'exh-top':1,'exh-bot':8,'trap-buy':3,'trap-sell':6,'div':1};
function domHTML(rows){const mx=Math.max(...rows.map(r=>Math.max(r[1]||0,r[2]||0,r[3]||0)));let h='<div class="vz pad"><table class="t dom"><thead><tr><th>Bid</th><th style="text-align:center">Giá</th><th style="text-align:left">Ask T1</th><th style="text-align:left">Ask T2</th></tr></thead><tbody>';
  rows.forEach(([px,b,a1,a2,cls])=>{h+=`<tr><td class="b">${b?`<i class="bar" style="width:${Math.round(b/mx*100)}%"></i><span>${b}</span>`:''}</td><td class="px ${cls||''}">${fmt(px)}</td><td style="text-align:left;color:var(--muted)">${a1??''}</td><td class="a" style="text-align:left">${a2?`<i class="bar" style="width:${Math.round(a2/mx*100)}%"></i><span class="${a1&&a2<a1?'chg-dn':''}">${a2}</span>`:''}</td></tr>`;});
  return h+'</tbody></table></div>';}
function tapeHTML(rows){let h='<div class="vz pad"><table class="t"><thead><tr><th>Thời gian (ET)</th><th>Giá</th><th>Size</th><th>Bên</th></tr></thead><tbody>';
  rows.forEach(([t,p,s,sd])=>{const c=sd==='B'?'var(--buy)':'var(--sell)';h+=`<tr><td style="color:var(--muted)">${t}</td><td>${fmt(p)}</td><td style="color:${c}">${s}</td><td style="color:${c}">${sd==='B'?'Mua':'Bán'}</td></tr>`;});
  return h+'</tbody></table></div>';}
const scV=id=>()=>{const s=SC.find(x=>x.id===id);return fpSVG(s.src.candles,{lvRow:LV[id]??-1,top:25420,t0:640});};
function domQHTML(){const rows=[[25411.75,null,null,22],[25411.25,null,null,18],[25411.00,null,null,14,'last'],[25410.75,55,68,null],[25410.50,150,310,null,'lv'],[25410.25,60,74,null]];
  const mx=310;let h='<thead><tr><th>Bid T1</th><th>Bid T2</th><th style="text-align:center">Giá</th><th style="text-align:left">Ask T2</th></tr></thead><tbody>';
  rows.forEach(([px,b1,b2,a,cls])=>{h+=`<tr><td style="color:var(--muted)">${b1??''}</td><td class="b">${b2?`<i class="bar" style="width:${Math.round(b2/mx*100)}%"></i><span>${b2}</span>`:''}</td><td class="px ${cls||''}">${fmt(px)}</td><td class="a" style="text-align:left">${a?`<i class="bar" style="width:${Math.round(a/mx*100)}%"></i><span>${a}</span>`:''}</td></tr>`;});
  return '<div class="vz pad"><table class="t dom">'+h+'</tbody></table></div>';}
const absEx=BASE.absBottom.candles,stkEx=BASE.stacked.candles,exhEx=BASE.exhTop.candles,trapEx=BASE.trapBuy.candles;
const VIS={abs:()=>fpSVG(absEx,{lvRow:7,top:25420,t0:600}),stk:()=>fpSVG(stkEx,{lvRow:4,top:25420,t0:610}),exh:()=>fpSVG(exhEx,{lvRow:1,top:25420,t0:620}),trap:()=>fpSVG(trapEx,{lvRow:3,top:25420,t0:630})};
window.OF={N,fmt,pad,mirror,BASE,SC,LV,sum,delta,vol,rowsOf,imb,fpSVG,domHTML,tapeHTML,scV,domQHTML,VIS};
})();
