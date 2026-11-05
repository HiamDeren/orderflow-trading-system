/* ===== Nội dung playbook (dữ liệu) ===== */
window.PB = {};

PB.roadmap = [
  { id:"p1", title:"Giai đoạn 1 · Nền móng", when:"Tuần 1–2", items:[
    "Đọc Dalton – Mind Over Markets: phần TPO, Initial Balance, Value Area",
    "Thuộc toàn bộ từ điển ở tab 01 (đọc to được định nghĩa + cách dùng của từng mục)",
    "Trên ATAS Daily Profile RTH: tự đánh dấu POC, VAH, VAL, IB, open/close cho 20 phiên NQ gần nhất",
    "Trong 20 phiên đó, khoanh mọi single prints, tail (excess) và poor high/low",
    "Tính Rotation Factor bằng tay cho 5 phiên, so với cảm nhận ban đầu của bạn",
    "Qua bài: Quiz 01 ≥ 80% và 20 phiên đã đánh dấu đủ"
  ]},
  { id:"p2", title:"Giai đoạn 2 · Cấu trúc ngày", when:"Tuần 3–4", items:[
    "Phân loại day type + shape + open type cho 30 phiên (lưu vào database Notion hoặc sheet)",
    "Ghi value relationship ngày-với-ngày cho 30 phiên đó",
    "Đo IB width trung bình 20 phiên NQ và % ngày có range extension (dùng làm baseline cho Plan Builder)",
    "Đếm: bao nhiêu % ngày IB bị phá cả hai phía (neutral) trên NQ của bạn",
    "Luyện spike rules: tìm 10 ngày có spike cuối phiên, ghi ngày sau open ở đâu và kết quả",
    "Qua bài: Quiz 02 ≥ 80%, phân loại lại 10 phiên ngẫu nhiên đúng ≥ 8"
  ]},
  { id:"p3", title:"Giai đoạn 3 · Level & Plan", when:"Tuần 5–6", items:[
    "Mỗi tối dùng Plan Builder (tab 06) lên plan cho 10 phiên liên tiếp, trade trên sim",
    "Mỗi plan có đúng 2 kịch bản (A/B), mỗi kịch bản có zone, trigger, target, invalidation",
    "Backtest 80% rule trên ATAS Market Replay: 20 lần, ghi tỉ lệ đi hết VA",
    "Backtest IB extension 1.5x/2x khi IB hẹp: 20 lần",
    "Chấm điểm level (bảng tab 03) cho mọi zone trước khi vào lệnh sim",
    "Qua bài: 10 plan liên tiếp viết trước 9:25 ET, ≥ 90% lệnh nằm trong plan"
  ]},
  { id:"p4", title:"Giai đoạn 4 · Add-in VWAP RTH + CVD", when:"Tuần 7–8", items:[
    "Mỗi phiên ghi trạng thái VWAP (balance / trend / chuyển pha) lúc 10:30 ET",
    "Ghi quan hệ VWAP vs dPOC lúc 10:30 và 11:30 ET",
    "Đặt CVD reset 9:30 ET trên chart M1 execution, cùng mốc với VWAP RTH",
    "Thu thập 20 CVD divergence tại zone TPO, phân loại exhaustion / absorption, ghi kết quả",
    "Grade mọi setup A++ / A+ / B / C, chỉ trade A+ trở lên trên sim",
    "Qua bài: Quiz 04 + 05 ≥ 80%, winrate của setup A+ trên sim được đo trên ≥ 30 lệnh"
  ]},
  { id:"p5", title:"Giai đoạn 5 · Thực chiến prop", when:"Tuần 9+", items:[
    "Live: tối đa 2–3 lệnh/ngày, chỉ setup A+ trở lên, dừng 11:30 ET (23:30 VN)",
    "Weekly review: tỉ lệ kịch bản A/B đúng, lỗi lặp lại, lệnh ngoài plan",
    "Tuỳ chọn: bật Tier 4 scalping chỉ khi 20 phiên liên tiếp ≥ 90% lệnh trong plan",
    "Bài kiểm tra tổng 50 câu (tab 08) ≥ 40/50 ba lần liên tiếp"
  ]}
];

PB.glossary = [
  { n:"TPO & Period", c:"", def:"Mỗi ô (hoặc chữ cái) = giá đã được giao dịch trong một khoảng 30 phút. RTH NQ có 13 period: A 9:30, B 10:00, C 10:30, D 11:00, E 11:30, F 12:00, G 12:30, H 13:00, I 13:30, J 14:00, K 14:30, L 15:00, M 15:30 ET.", read:"Càng nhiều ô xếp ngang ở một giá, thị trường càng dành nhiều thời gian ở đó.", use:"Cửa sổ trade của bạn (9:30–11:30 ET) chỉ gồm A–D. Mọi quyết định trong phiên dựa trên A–D so với profile hôm qua." },
  { n:"Presence vs Participation", c:"", def:"Presence = thời gian có mặt ở giá (TPO). Participation = volume thực sự khớp ở giá (volume profile).", read:"TPO dày + volume mỏng = có mặt nhưng ít người tham gia: value yếu. TPO mỏng + volume dày = giao dịch lớn đi qua nhanh: level mạnh.", use:"Đây là lý do template của bạn đặt TPO và volume profile cạnh nhau. Ưu tiên level mà cả hai cùng xác nhận." },
  { n:"POC (TPOC vs VPOC)", c:"poc", def:"TPOC = giá có nhiều TPO nhất (thời gian). VPOC = giá có volume lớn nhất. Thường gần nhau nhưng không bắt buộc.", read:"POC là giá 'công bằng nhất' của phiên. POC nằm cao = buyers xây value cao (P); POC thấp = b.", use:"POC hôm qua là target tự nhiên của mọi rotation trong VA. POC chưa bị chạm lại = naked POC, magnet." },
  { n:"Value Area (VAH / VAL)", c:"va", def:"Vùng chứa ~70% TPO (hoặc volume) quanh POC. Cạnh trên VAH, cạnh dưới VAL.", read:"Trong VA = fair value, hai bên đồng thuận. Ngoài VA = giá 'không công bằng', thị trường hoặc từ chối nhanh, hoặc chấp nhận và xây value mới.", use:"Cạnh VA là level Tier 2 quan trọng nhất trong ngày: fade nếu bị reject, go-with nếu được accept (tab 03)." },
  { n:"Initial Balance (IB)", c:"ib", def:"Range của A + B, tức 9:30–10:30 ET. IB width = IB High − IB Low.", read:"IB hẹp so với trung bình = hai bên chưa đồng thuận, dễ có range extension mạnh. IB rộng = phần lớn range ngày đã có, thiên về rotation.", use:"IB là anchor của model IB bạn đang dùng. So IB width với trung bình 20 phiên (công cụ ở tab 03)." },
  { n:"Range Extension (RE)", c:"ib", def:"Giá đi ra ngoài IB sau 10:30 ET.", read:"RE một phía = initiative activity theo phía đó. RE hai phía = Neutral day.", use:"RE kèm VWAP dốc và CVD cùng chiều → đánh go-with, target IB 1.5x/2x." },
  { n:"Single prints", c:"", def:"Các dòng giá chỉ có duy nhất một chữ cái, nằm bên trong profile (không phải ở cực trị).", read:"Giá đi nhanh một chiều, không có trao đổi hai chiều = vùng imbalance.", use:"Lần test đầu thường là support/resistance. Nếu bị lấp hết và giá được accept, imbalance đã được sửa, level hết tác dụng." },
  { n:"Tail / Excess", c:"va", def:"≥ 2 dòng single print liên tiếp ở cực trị của phiên. Buying tail ở đáy, selling tail ở đỉnh.", read:"Responsive participant từ chối giá rất nhanh: auction ở phía đó đã hoàn tất.", use:"Đỉnh/đáy có tail là level mạnh, không kỳ vọng quay lại quét. Stop có thể đặt ngoài tail." },
  { n:"Poor high / Poor low", c:"", def:"Cực trị có ≥ 2 chữ cái khác nhau cùng chạm đúng một giá, không có tail. Còn gọi là unfinished auction.", read:"Thị trường dừng ở đó vì hết người tham gia trong phiên, không phải vì bị từ chối mạnh.", use:"Magnet: thường bị quay lại quét trong các phiên sau. Dùng làm target, không đặt stop ngay sau nó." },
  { n:"Open / Close marker", c:"", def:"Mũi tên trên template của bạn: giá mở 9:30 và giá đóng 16:00.", read:"Close gần cực trị theo hướng ngày = mạnh, dễ tiếp diễn. Close về giữa = balance.", use:"Close location là đầu vào của spike rules và của kỳ vọng open ngày sau." },
  { n:"Halfback & IB mid", c:"", def:"Halfback = điểm giữa range hiện tại của ngày. IB mid = điểm giữa IB.", read:"Giá trên halfback = buyers đang thắng phiên; dưới = sellers.", use:"Level scalping Tier 4, cũng là chỗ dời stop về hoà vốn." },
  { n:"Rotation Factor (RF)", c:"", def:"Tổng điểm so sánh high/low của từng period với period trước (+1 cao hơn, −1 thấp hơn, 0 bằng).", read:"RF dương lớn = rotation lên chiếm ưu thế; gần 0 = hai chiều.", use:"Xác nhận nhanh open type sau A–C. Không dùng làm tín hiệu vào lệnh." },
  { n:"Naked POC (nPOC)", c:"poc", def:"POC của một phiên cũ mà giá chưa quay lại chạm.", read:"Fair value cũ chưa được kiểm tra lại.", use:"Target có xác suất cao. Nhiều nPOC xếp gần nhau = zone Tier 1." },
  { n:"Spike", c:"", def:"Cú đi mạnh một chiều trong 1–2 period cuối phiên (L, M).", read:"Chưa được thị trường kiểm chứng. Ngày sau open ở đâu so với spike cho biết spike thật hay giả.", use:"Xem bảng spike rules ở tab 03." },
  { n:"Overnight inventory", c:"lvl", def:"Phần lớn giao dịch ETH nằm trên (net long) hay dưới (net short) close RTH hôm qua.", read:"Inventory lệch nhiều một phía hay bị 'xả' ngược trong 30–60 phút đầu RTH.", use:"Overnight inventory net long + open ở ON high → cẩn thận long ngay open; kết hợp với model OSR (sweep ON range → reclaim)." },
  { n:"Composite profile", c:"lvl", def:"Gộp nhiều ngày có VA chồng nhau thành một profile lớn.", read:"VA nhiều ngày chồng nhau = fair value bền. Cạnh composite mạnh hơn cạnh VA một ngày.", use:"Ví dụ trong template: 30/10, 02/11, 04/11 có VA chồng nhau quanh 28,360–28,880, rất hợp để composite." }
];

PB.tiers = [
  ["1","Weekly VAH / VAL / POC","Tab Weekly Profile","Value của tuần, bias khung lớn","Giá trong weekly VA → balance, ưu tiên rotation. Open ngoài weekly VA → ưu tiên go-with",false],
  ["1","Composite VA (nhiều ngày)","Gộp profile","Fair value bền nhiều ngày","Cạnh composite là zone fade mạnh nhất; phá và accept → trend nhiều ngày",false],
  ["1","Naked POC nhiều ngày","POC kéo dài (extend)","Fair value cũ chưa test","Target ưu tiên; lần chạm đầu hay phản ứng",false],
  ["2","PD VAH / PD VAL","Daily Profile RTH hôm qua","Cạnh fair value hôm qua","Fade nếu reject; go-with nếu accept; 80% rule khi quay lại vào VA",false],
  ["2","PD POC","Daily Profile RTH hôm qua","Giá công bằng nhất hôm qua","Target của rotation trong VA, pivot bias",false],
  ["2","PD High / PD Low","Daily Profile RTH hôm qua","Liquidity, stop của phe hôm qua","Sweep & reclaim (cùng logic OSR); poor thì là magnet",false],
  ["2","Poor high / poor low","Đánh dấu tay","Unfinished auction","Magnet / target, không đặt stop ngay sau",false],
  ["2","Single prints / RTH gap","Profile + so open/close","Vùng imbalance","Support/resistance lần test đầu; lấp hết = hết tác dụng",false],
  ["3","ON High / ON Low / ON POC","Tab Daily Profile ETH","Biên inventory overnight","Model OSR của bạn: sweep biên ON → reclaim → retest",false],
  ["3","RTH Open (9:30)","Marker open","Mốc phân loại open type","Giữ trên/dưới open sau 30 phút = ai thắng A period",false],
  ["3","IB High / IB Low","10:30 ET","Biên range extension","IB hẹp → breakout go-with; IB rộng → fade cạnh IB",false],
  ["3","VWAP RTH ± SD","Chart M1 execution","Value động của phiên","Confluence, xem tab 04",false],
  ["4","A-period High / Low","30 phút đầu","Opening range","Break + retest; fail break = ORR",true],
  ["4","IB mid, IB 1.5x / 2x","Tính từ IB","Target extension","Chốt lời từng phần; 2x hiếm, chỉ ngày trend",true],
  ["4","Developing POC (dPOC)","Profile hôm nay","Value đang dịch chuyển","dPOC migrate theo hướng trade → pullback về dPOC là điểm thêm",true],
  ["4","Halfback","Mid range ngày","Ai thắng phiên đến lúc này","Dời stop hoà vốn, filter hướng scalp",true],
  ["4","Period High / Low (30m)","Từng chữ cái","Cấu trúc nhỏ","Trailing stop: trend lên, stop dưới low period trước",true],
  ["4","Single prints trong ngày","Profile hôm nay","Imbalance mới","Retest đầu tiên là entry scalp",true],
  ["4","VWAP ±1 SD","Chart M1","Bingbong zone","Scalp rotation khi VWAP phẳng",true]
];

/* Day types: periods [lo,hi] theo đơn vị dòng giá (số lớn = giá cao) */
PB.dayTypes = {
  normal:{ name:"Normal", periods:[[12,30],[13,29],[16,26],[15,24],[17,25],[18,24],[16,23],[17,25],[19,24],[18,23],[17,23],[19,25],[20,23]], open:20, close:21,
    sig:"IB rất rộng (A, B đã tạo gần hết range). Không có hoặc rất ít range extension.",
    mean:"Large timeframe participants vào sớm và đặt biên cho cả ngày. Phần còn lại là rotation.",
    act:"Fade cạnh IB khi có CVD exhaustion. Target IB mid / POC. Không đuổi breakout." },
  nvar:{ name:"Normal Variation", periods:[[16,26],[15,24],[18,25],[22,31],[25,33],[26,32],[24,30],[25,31],[26,30],[25,31],[24,29],[25,30],[26,29]], open:19, close:28,
    sig:"IB trung bình, range extension một phía, thường khoảng 1.2–2x IB.",
    mean:"Initiative buyers (hoặc sellers) xuất hiện sau IB và dời value. Loại ngày thường gặp trên index futures.",
    act:"Sau RE, buy pullback về IB high / dPOC / VWAP. Target IB 1.5x – 2x." },
  trend:{ name:"Trend", periods:[[2,7],[5,10],[8,13],[11,16],[14,19],[17,22],[19,24],[22,27],[24,29],[26,31],[29,34],[31,36],[33,38]], open:3, close:37,
    sig:"IB hẹp, profile mỏng và dài, mỗi period tạo high/low mới, close ở cực trị.",
    mean:"Một phe kiểm soát hoàn toàn, phe kia không có cơ hội tạo value.",
    act:"Không fade. Vào ở low của period trước / VWAP / +1 SD. Trailing stop theo period." },
  dd:{ name:"Double Distribution", periods:[[4,10],[5,11],[6,10],[5,9],[7,11],[10,23],[20,27],[21,28],[22,27],[20,26],[21,27],[22,28],[23,27]], open:6, close:25,
    sig:"Hai vùng value tách nhau bởi một dải single prints. Thường bắt đầu bằng IB hẹp.",
    mean:"Balance sáng, sau đó có thông tin mới đẩy giá sang vùng balance thứ hai.",
    act:"Single prints ở giữa là support (hoặc resistance) lần test đầu. Ngày sau nếu lấp hết single prints = tín hiệu yếu." },
  neutral:{ name:"Neutral", periods:[[14,24],[15,25],[17,29],[18,26],[15,23],[9,17],[11,19],[13,20],[15,21],[16,22],[17,23],[16,22],[17,21]], open:19, close:19,
    sig:"Range extension cả hai phía IB. Neutral center: close giữa range. Neutral extreme: close ở một cực trị.",
    mean:"Center = hai phe cân bằng, chưa ai thắng. Extreme = phe thắng xuất hiện cuối phiên, thường tiếp diễn ngày sau.",
    act:"Center: ngày sau kỳ vọng balance. Extreme: ngày sau ưu tiên hướng close." },
  nontrend:{ name:"Non-Trend", periods:[[17,22],[18,22],[17,21],[18,22],[17,21],[18,21],[17,22],[18,21],[17,21],[18,22],[17,21],[18,21],[18,21]], open:19, close:20,
    sig:"IB hẹp, cả ngày gần như không ra khỏi IB. Range rất nhỏ.",
    mean:"Thiếu thông tin, thường trước tin lớn hoặc ngày lễ. Năng lượng đang được tích.",
    act:"Không trade trong range. Ngày sau chú ý breakout khỏi vùng balance này." },
  pshape:{ name:"P-shape", periods:[[2,9],[7,15],[13,22],[18,26],[21,27],[20,26],[21,27],[22,26],[21,26],[22,27],[21,26],[22,26],[22,25]], open:3, close:24,
    sig:"Thân mỏng phía dưới, value phình ra ở trên.",
    mean:"Thường là short covering: phe short cũ đóng lệnh, không hẳn là new buyers.",
    act:"Ngày sau cần thấy new buying (giữ trên VA) mới tin tiếp diễn. Nếu giá quay xuống phần thân mỏng → dễ đi nhanh." },
  bshape:{ name:"b-shape", flipOf:"pshape", open:26, close:5,
    sig:"Thân mỏng phía trên, value phình ra ở dưới.",
    mean:"Thường là long liquidation: phe long cũ thoát hàng.",
    act:"Ngày sau cần thấy new selling (giữ dưới VA) mới tin tiếp diễn." }
};
PB.dayOrder = ["normal","nvar","trend","dd","neutral","nontrend","pshape","bshape"];

PB.openTypes = [
  { id:"od", name:"Open Drive", conf:"Cao nhất", chip:"good", pts:[[0,50],[10,56],[20,60],[30,58],[40,66],[55,72],[70,70],[85,80],[100,86]],
    def:"Giá đi mạnh một chiều ngay từ 9:30 và không quay lại test open.",
    act:"Go-with. Chỉ vào pullback nhỏ đầu tiên vào level gần (ON high, PDH). Tuyệt đối không fade." },
  { id:"otd", name:"Open Test Drive", conf:"Cao", chip:"good", level:36, pts:[[0,50],[10,44],[20,38],[28,36],[36,40],[46,50],[58,58],[70,64],[85,74],[100,82]],
    def:"Giá test một level phía ngược (PDH/PDL, ON high/low) để kiểm tra không còn business, rồi đảo và drive qua open.",
    act:"Chờ test xong + reclaim open. Rất khớp với model OSR của bạn (sweep → reclaim → retest)." },
  { id:"orr", name:"Open Rejection Reverse", conf:"Trung bình", chip:"warn", pts:[[0,50],[12,56],[22,63],[30,66],[40,60],[52,50],[64,42],[78,34],[90,28],[100,24]],
    def:"Giá đi một hướng, gặp responsive activity ở level, bị từ chối và quay ngược xuyên qua open.",
    act:"Trade theo hướng sau khi xuyên open. Target cạnh VA đối diện. Stop ngoài cực trị bị từ chối." },
  { id:"oa", name:"Open Auction", conf:"Thấp", chip:"bad", pts:[[0,50],[10,57],[20,46],[30,55],[40,43],[52,54],[64,47],[76,58],[88,45],[100,52]],
    def:"Giá xoay quanh open hai chiều, không phe nào chủ động. In range: kỳ vọng balance. Out of range: phải chọn hướng sớm.",
    act:"Không trade A period. Chờ IB hình thành, đánh cạnh IB hoặc breakout có CVD xác nhận." }
];

PB.openLoc = [
  { id:"or-up", label:"Trên range hôm qua", conf:"Imbalance mạnh", chip:"good",
    txt:"Open trên PD High. Mức tự tin cao nhất là có imbalance lên. Thị trường phải chứng minh giá mới được chấp nhận.",
    watch:"Open Drive / Open Test Drive xuống PDH rồi giữ được → go-with. Nếu quay lại vào range hôm qua và giữ 1 period → trapped longs, ORR xuống, target VAH rồi POC.",
    model:"OSR: sweep ON low hoặc PDH → reclaim → long." },
  { id:"va-up", label:"Trên VA, trong range", conf:"Thiên lên, vừa phải", chip:"warn",
    txt:"Open giữa VAH và PD High. Thị trường đang thử giá cao hơn value nhưng chưa vượt range.",
    watch:"Giữ trên VAH (accept) → test PD High. Quay vào VA và accept 2 period → 80% rule về VAL.",
    model:"Kịch bản A: long retest VAH. Kịch bản B: short khi accept lại trong VA." },
  { id:"in-va", label:"Trong VA hôm qua", conf:"Balance", chip:"",
    txt:"Open trong value hôm qua. Mặc định là hai bên vẫn đồng thuận, rotation trong VA.",
    watch:"Fade VAH / VAL với CVD exhaustion hoặc absorption, target POC. Chỉ đổi sang breakout khi accept ngoài VA.",
    model:"Playbook VWAP ±1 SD bingbong + fade cạnh VA." },
  { id:"va-dn", label:"Dưới VA, trong range", conf:"Thiên xuống, vừa phải", chip:"warn",
    txt:"Open giữa VAL và PD Low. Đối xứng với 'Trên VA, trong range'.",
    watch:"Giữ dưới VAL → test PD Low. Quay vào VA + accept 2 period → 80% rule về VAH.",
    model:"Kịch bản A: short retest VAL. Kịch bản B: long khi accept lại trong VA." },
  { id:"or-dn", label:"Dưới range hôm qua", conf:"Imbalance mạnh", chip:"bad",
    txt:"Open dưới PD Low. Imbalance xuống, ví dụ 30/10 trong template của bạn.",
    watch:"Open Drive xuống → go-with, sell pullback. Quay lại vào range và giữ → trapped shorts, ORR lên.",
    model:"OSR: sweep ON high hoặc PDL → reject → short." }
];

PB.valRel = [
  { n:"Higher value", p:[20,50], t:[58,85], m:"VA hôm nay nằm hoàn toàn trên VA hôm qua.", b:"Bullish rõ. Ngày sau ưu tiên long ở VAH/POC mới." },
  { n:"Overlapping higher", p:[20,55], t:[40,75], m:"Chồng lên nhau nhưng dịch lên.", b:"Thiên bullish vừa phải, cần thêm xác nhận." },
  { n:"Unchanged / Overlapping", p:[25,65], t:[28,62], m:"Gần như trùng.", b:"Balance. Fade cạnh, chuẩn bị composite." },
  { n:"Inside value", p:[15,80], t:[35,60], m:"VA hôm nay nằm trong VA hôm qua.", b:"Nén lại. Chuẩn bị breakout, đừng đoán hướng trước." },
  { n:"Outside value", p:[35,60], t:[15,80], m:"VA hôm nay bao trùm VA hôm qua.", b:"Mở rộng, hai phe cùng hoạt động. Xem close location để chọn hướng." },
  { n:"Overlapping lower", p:[40,75], t:[20,55], m:"Chồng lên nhau nhưng dịch xuống.", b:"Thiên bearish vừa phải." },
  { n:"Lower value", p:[55,85], t:[15,48], m:"VA hôm nay nằm hoàn toàn dưới VA hôm qua.", b:"Bearish rõ. Ngày sau ưu tiên short ở VAL/POC mới." }
];

(function(){
  const flip = a => a.map(([x,y]) => [x,100-y]);
  const p1 = [[0,30],[15,55],[25,70],[35,58],[45,52],[60,68],[70,76],[80,62],[100,40]];
  const c1 = [[0,20],[15,50],[25,72],[35,55],[45,48],[60,58],[70,62],[80,45],[100,25]];
  const p2 = [[0,30],[15,55],[25,70],[35,58],[45,52],[60,66],[70,69],[80,55],[100,35]];
  const c2 = [[0,20],[15,45],[25,60],[35,50],[45,48],[60,70],[70,82],[80,62],[100,40]];
  PB.cvd = [
    { n:"Exhaustion · bearish", where:"Tại VAH / PDH / +2 SD", price:p1, cvd:c1, ph:[[25,70],[70,76]], ch:[[25,72],[70,62]], lvl:72,
      rule:"Giá tạo higher high, CVD tạo lower high.", mean:"Mỗi nhịp lên cần ít người mua chủ động hơn. Aggressive buyers cạn.", act:"Short sau khi phá low của nhịp cuối; stop trên high mới; target POC / VWAP." },
    { n:"Absorption · bearish", where:"Tại VAH / PDH / +2 SD", price:p2, cvd:c2, ph:[[25,70],[70,69]], ch:[[25,60],[70,82]], lvl:70,
      rule:"CVD tạo higher high mạnh, giá không vượt được high cũ.", mean:"Người mua vẫn bấm market rất mạnh nhưng passive sellers đứng ở level hấp thụ hết.", act:"Thường mạnh hơn exhaustion. Short khi delta flip âm; stop trên level; target VA đối diện." },
    { n:"Exhaustion · bullish", where:"Tại VAL / PDL / −2 SD", price:flip(p1), cvd:flip(c1), ph:flip([[25,70],[70,76]]), ch:flip([[25,72],[70,62]]), lvl:28,
      rule:"Giá tạo lower low, CVD tạo higher low.", mean:"Aggressive sellers cạn dần.", act:"Long sau khi phá high nhịp cuối; stop dưới low mới; target POC / VWAP." },
    { n:"Absorption · bullish", where:"Tại VAL / PDL / −2 SD", price:flip(p2), cvd:flip(c2), ph:flip([[25,70],[70,69]]), ch:flip([[25,60],[70,82]]), lvl:30,
      rule:"CVD tạo lower low mạnh, giá giữ higher low / equal low.", mean:"Passive buyers hấp thụ toàn bộ lệnh bán market.", act:"Long khi delta flip dương; stop dưới level; target VA đối diện." }
  ];
})();

PB.cvdCheck = [
  "Giá đang ở zone TPO có điểm ≥ 4 (tab 03)?",
  "Regime hôm nay: balance hay trend? (open type, IB, độ dốc VWAP)",
  "So 2 swing gần nhất của giá tại zone với 2 swing CVD tương ứng (reset 9:30 ET)",
  "Đó là exhaustion hay absorption? Smart Tape thấy lệnh lớn đứng ở level → cộng thêm tự tin",
  "Có trigger chưa: phá cấu trúc M1, reclaim level hoặc delta flip. Stop ngoài cực trị, target POC / VWAP"
];

PB.timeline = [
  ["16:00","04:00 (+1)","03:00 (+1)","Đóng phiên RTH. Chụp profile, làm post-session review khi bạn dậy."],
  ["Ban ngày VN","—","—","Đọc profile hôm qua: day type, shape, close, value relationship. Cập nhật level Tier 1–2."],
  ["18:00","06:00","05:00","Globex mở, phiên ETH bắt đầu."],
  ["08:00–09:00","20:00–21:00","19:00–20:00","Tab Daily Profile ETH: ON high/low/POC, inventory. Tin 8:30 ET."],
  ["09:15–09:25","21:15–21:25","20:15–20:25","Chốt open location dự kiến, kịch bản A/B, invalidation. Plan Builder."],
  ["09:30–10:00","21:30–22:00","20:30–21:00","A period: phân loại open type. Cửa sổ OSR."],
  ["10:00–10:30","22:00–22:30","21:00–21:30","B period: IB hình thành. Cẩn thận tin 10:00 ET."],
  ["10:30–11:30","22:30–23:30","21:30–22:30","Sau IB: range extension hay rotation. Model IB. Dừng 11:30 ET."],
  ["Sau 11:30","23:30","22:30","Tắt platform. Ghi journal ngắn."]
];

PB.preCheck = [
  "Ghi day type, shape, close location của hôm qua",
  "Value relationship hôm qua so với hôm kia",
  "Weekly VA: giá đang ở trong hay ngoài?",
  "Cập nhật Tier 1–2: VAH/VAL/POC, PDH/PDL, nPOC, poor H/L, single prints, gap",
  "Tab ETH: ON high/low, ON POC, inventory",
  "Lịch tin 8:30 / 10:00 ET",
  "Open location dự kiến (1 trong 5 vùng)",
  "Kịch bản A và B, mỗi kịch bản có zone, trigger, target, invalidation",
  "Đánh dấu no-trade zone (giữa VA, xa mọi level)",
  "Nhắc rule: tối đa 2–3 lệnh, dừng 11:30 ET, daily loss limit của prop"
];

PB.postCheck = [
  "Chụp Daily Profile RTH sau 16:00 ET",
  "Ghi day type, shape, open type, IB width, có RE không và phía nào",
  "Kịch bản nào đã xảy ra? Plan sai ở chỗ nào?",
  "Từng lệnh: zone mấy điểm, grade gì, có đúng trigger không",
  "Đánh dấu level mới cho mai: VA/POC, poor H/L, single prints, spike",
  "Ghi một bài học và một điều giữ nguyên"
];

PB.decision = [
  ["Open type (9:30–10:00)","OD → go-with, chỉ vào pullback đầu. OTD → chờ test xong + reclaim. ORR → kịch bản ngược. OA → không trade A period."],
  ["Giá có đến zone trong plan không?","Không → không làm gì. Lệnh ngoài plan là lỗi, kể cả khi thắng."],
  ["Zone có điểm ≥ 6?","Không → chỉ dùng làm target. 4–5 → cần CVD + trigger rất rõ."],
  ["VWAP có cho phép hướng này?","Trend ngược hướng (VWAP dốc, giá chạy dọc band) → bỏ ý tưởng fade."],
  ["CVD xác nhận?","Divergence / absorption khi fade; CVD tạo cực trị mới cùng giá khi breakout."],
  ["Trigger orderflow","Delta flip / DOM / phá cấu trúc M1. Stop ngoài cực trị, target level kế tiếp."],
  ["10:30 IB xong","IB < 70% trung bình → ưu tiên range extension. IB > 130% → ưu tiên rotation trong IB."],
  ["Dừng","Đủ 2–3 lệnh, chạm loss limit, hoặc 11:30 ET (23:30 VN)."]
];

/* Case study đọc từ ảnh template (xấp xỉ) */
PB.days = [
  { d:"29/10", h:29675, l:29105, vah:29625, poc:29485, val:29415, o:29610, c:29180,
    read:"Value xây ở trên cùng (VA ~29,415–29,625), sau đó cuối phiên giá trượt dài xuống ~29,105 với cột TPO chỉ một ô: single prints / spike bán cuối phiên. Close sát low.",
    lesson:"Close yếu + spike xuống. Theo spike rules: ngày sau open dưới spike (29,105–29,350) = tiếp diễn; open trong spike = balance; open trên spike = spike bị reject.", tag:"Spike xuống", chip:"bad" },
  { d:"30/10", h:28860, l:28230, vah:28745, poc:28570, val:28360, o:28795, c:28560,
    read:"Open ~28,795, thấp hơn low 29/10 khoảng 310 điểm: open ngoài range, dưới cả spike. Value thấp hơn hẳn (lower value). Để lại RTH gap 28,860–29,105 chưa lấp.",
    lesson:"Ví dụ chuẩn của 'open dưới range' + spike rules xác nhận tiếp diễn. Gap trên đầu là magnet / kháng cự Tier 2 cho các ngày sau.", tag:"Out-of-range open", chip:"bad" },
  { d:"02/11", h:28890, l:28100, vah:28880, poc:28650, val:28360, o:28720, c:28225,
    read:"Range rất rộng (~790 điểm), phá cả high lẫn low của 30/10 (outside day). VA rộng ra phía trên (overlapping higher), nhưng close sát low.",
    lesson:"Khả năng cao là Neutral Extreme (kiểm tra lại IB trên ATAS): phá cả hai phía, close ở cực trị dưới → ngày sau thiên xuống. Hãy nhớ kỳ vọng này để so với ngày 03/11.", tag:"Outside day · close yếu", chip:"warn" },
  { d:"03/11", h:28445, l:28215, vah:28395, poc:28330, val:28280, o:28270, c:28320,
    read:"Inside day hẹp (~230 điểm) nằm ở phần dưới range 02/11. VA rất hẹp 28,280–28,395. Giữ trên low 02/11 (28,100) và level tím 28,176.",
    lesson:"Kỳ vọng bearish từ close 02/11 KHÔNG được tiếp diễn: sellers không đẩy được giá thấp hơn. Balance hẹp sau ngày rộng = năng lượng tích luỹ, chuẩn bị breakout.", tag:"Inside day · balance", chip:"" },
  { d:"04/11", h:28975, l:28405, vah:28795, poc:28680, val:28505, o:28430, c:28657, dev:true,
    read:"Open ~28,430 sát high 03/11, drive lên thoát khỏi balance 03/11. Quét qua high 02/11 (28,890) lên ~28,975. Developing POC ~28,680 trùng POC 02/11 (~28,650).",
    lesson:"Higher value so với 03/11: breakout khỏi balance đã được accept. Giá quay về fair value của 02/11. Sau khi đóng phiên, kiểm tra high 28,975 có tail (reject) hay là poor high.", tag:"Breakout balance · developing", chip:"good" }
];

PB.caseLevels = [
  ["28,860 – 28,975","PD High 04/11 + 02/11 High + RTH gap đáy","Kháng cự cụm / zone breakout. Accept trên → mục tiêu lấp gap đến 29,105"],
  ["28,795","VAH 04/11 (developing)","Cạnh trên value. Fade nếu CVD exhaustion"],
  ["28,650 – 28,680","POC 04/11 + POC 02/11","Pivot. Hai POC trùng nhau = fair value nhiều ngày"],
  ["28,505","VAL 04/11 (developing)","Cạnh dưới value"],
  ["28,445","High 03/11 = biên balance bị phá","Retest breakout. Mất mức này = breakout 04/11 thất bại"],
  ["28,330","POC 03/11","Target nếu breakout thất bại"],
  ["28,176","Level tím của bạn","Tier 1 khung lớn, dưới low 03/11"],
  ["29,105 – 29,350","Single prints 29/10","Kháng cự lần test đầu phía trên gap"]
];

/* ===== Quiz ===== */
