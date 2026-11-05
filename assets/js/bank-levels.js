/* Ngân hàng câu hỏi khoá TPO Level — 93 câu, giữ nguyên văn từ artifact gốc. */
(function(){
'use strict';
const PB={};
PB.quiz = [
  /* tpo */
  {m:"tpo",q:"Trên NQ RTH, chữ cái C tương ứng khung giờ ET nào?",o:["9:30–10:00","10:00–10:30","10:30–11:00","11:00–11:30"],a:2,e:"A = 9:30, B = 10:00, C = 10:30. Cửa sổ 9:30–11:30 của bạn gồm A–D."},
  {m:"tpo",q:"Initial Balance trên NQ RTH là gì?",o:["Range của A period","Range của A + B (9:30–10:30 ET)","Range phiên ETH","Range 9:30–9:50"],a:1,e:"IB = A + B, tức giờ đầu tiên của RTH."},
  {m:"tpo",q:"TPO POC khác Volume POC ở điểm nào?",o:["Không khác gì","TPO POC là giá có nhiều thời gian nhất, VPOC là giá có volume lớn nhất","TPO POC luôn cao hơn VPOC","VPOC chỉ có trên ETH"],a:1,e:"Một bên đo presence (thời gian), một bên đo participation (volume). Thường gần nhau nhưng không bắt buộc."},
  {m:"tpo",q:"Ở đỉnh phiên có 3 chữ cái khác nhau cùng chạm đúng mức cao nhất, không có dòng single print nào phía trên. Đây là gì?",o:["Selling tail","Poor high (unfinished auction)","Excess","Spike"],a:1,e:"Nhiều chữ cùng chạm một cực trị mà không có tail = poor high. Thị trường dễ quay lại quét."},
  {m:"tpo",q:"Selling tail ở đỉnh profile cho biết điều gì?",o:["Buyers đang mạnh","Responsive sellers từ chối giá cao rất nhanh, auction phía trên đã hoàn tất","Giá chắc chắn sẽ quay lại đỉnh","Volume ở đỉnh rất lớn"],a:1,e:"Tail = excess. Đỉnh có tail là level mạnh, không kỳ vọng bị quét lại sớm."},
  {m:"tpo",q:"Value Area thường được định nghĩa là:",o:["50% TPO quanh POC","Khoảng 70% TPO (hoặc volume) quanh POC","Range của IB","Toàn bộ range trừ tail"],a:1,e:"70% là quy ước CBOT, gốc từ 1 độ lệch chuẩn ≈ 68.27%."},
  {m:"tpo",q:"Phiên có Rotation Factor = +9. Ý nghĩa đúng nhất?",o:["Thị trường balance hoàn toàn","Rotation lên chiếm ưu thế, buyers điều khiển","Sắp đảo chiều xuống","Volume lớn hơn bình thường"],a:1,e:"RF dương lớn = các period liên tục tạo high/low cao hơn period trước."},
  {m:"tpo",q:"Single prints giữa profile hình thành khi nào?",o:["Thị trường đi ngang lâu","Giá đi nhanh một chiều trong một period, không có giao dịch hai chiều","Có tin tức sau 16:00","IB quá rộng"],a:1,e:"Vùng imbalance. Lần test đầu thường là support/resistance."},
  {m:"tpo",q:"Một vùng có TPO dày nhưng volume profile rất mỏng. Theo khái niệm presence vs participation:",o:["Value rất mạnh","Có mặt về thời gian nhưng ít người thực sự giao dịch, value yếu","Đây là single prints","Đây là POC"],a:1,e:"Presence không có participation. Ưu tiên level mà cả TPO và volume cùng xác nhận."},

  /* structure */
  {m:"structure",q:"IB hôm nay chỉ bằng 55% IB trung bình 20 phiên. Kỳ vọng hợp lý nhất?",o:["Ngày Normal, rotation trong IB","Khả năng range extension cao (trend / normal variation)","Không trade cả ngày","Chắc chắn là Neutral day"],a:1,e:"IB hẹp = hai bên chưa đồng thuận, năng lượng dồn cho range extension."},
  {m:"structure",q:"Neutral day được nhận diện bằng:",o:["Không có range extension","Range extension cả hai phía của IB","Profile mỏng và dài","Hai vùng value tách bởi single prints"],a:1,e:"RE hai phía. Close giữa = neutral center, close ở cực trị = neutral extreme."},
  {m:"structure",q:"Open Drive có đặc điểm nào?",o:["Giá xoay quanh open","Giá đi mạnh một chiều ngay từ open và không quay lại test open","Giá test một level rồi đảo","Giá đi một hướng rồi đảo xuyên open"],a:1,e:"Open type có mức tự tin cao nhất. Go-with, không fade."},
  {m:"structure",q:"Giá mở, chạy lên test ON high, bị từ chối, rồi rơi xuyên qua open. Đây là:",o:["Open Drive","Open Test Drive","Open Rejection Reverse","Open Auction"],a:2,e:"ORR: đi một hướng, gặp responsive activity, đảo xuyên open. Target cạnh VA đối diện."},
  {m:"structure",q:"VA hôm nay nằm hoàn toàn bên trong VA hôm qua. Quan hệ này nói gì?",o:["Bullish mạnh","Bearish mạnh","Nén lại (inside value), chuẩn bị breakout","Thị trường đóng cửa"],a:2,e:"Inside value = compression. Không đoán hướng trước, chờ breakout được accept."},
  {m:"structure",q:"P-shape thường phản ánh điều gì?",o:["Long liquidation","Short covering, không hẳn là new buying","New sellers xuất hiện","Ngày Non-Trend"],a:1,e:"Phần thân mỏng ở dưới là phe short đóng lệnh. Ngày sau cần thấy new buying mới tin tiếp diễn."},
  {m:"structure",q:"Trong Double Distribution day, dải single prints ở giữa có vai trò gì?",o:["Không có ý nghĩa","Support/resistance ở lần test đầu","Luôn bị lấp ngay trong ngày","Là POC của ngày"],a:1,e:"Ranh giới giữa hai vùng balance. Bị lấp hết = tín hiệu phe đẩy giá đã yếu."},
  {m:"structure",q:"Open ngoài range hôm qua nhưng sau 30 phút giá quay lại vào range và giữ được. Cách hiểu đúng?",o:["Tiếp tục go-with hướng open","Trapped traders, khả năng đảo chiều mạnh (ORR)","Bỏ qua, không quan trọng","Chờ ngày mai"],a:1,e:"Out-of-range open thất bại thường cho cú đảo mạnh vì phe theo gap bị kẹt."},
  {m:"structure",q:"Ngày Trend lên: cách xử lý đúng?",o:["Fade mỗi đỉnh mới","Không fade, mua pullback về low của period trước / VWAP","Đứng ngoài cả ngày","Short ở +2 SD"],a:1,e:"Ngày trend phe kia không có cơ hội. Trailing stop theo period."},

  /* levels */
  {m:"levels",q:"Điều kiện kích hoạt 80% rule là gì?",o:["Giá chạm VAH","Giá ở ngoài VA hôm qua, quay lại vào trong và được chấp nhận 2 period TPO liên tiếp","IB phá cả hai phía","Giá open trong VA"],a:1,e:"Khi kích hoạt, kỳ vọng giá đi hết VA sang cạnh còn lại. Tự kiểm chứng tỉ lệ trên NQ."},
  {m:"levels",q:"Dấu hiệu acceptance ngoài một level là gì?",o:["Chỉ chạm 1 tick","Giá ở ngoài level ≥ 2 period và xây TPO/volume ở đó","Có tail ở đó","CVD divergence"],a:1,e:"Thời gian + volume ngoài level = được chấp nhận. Level cũ chuyển vai trò."},
  {m:"levels",q:"Hôm qua có spike bán cuối phiên. Hôm nay open nằm bên trong vùng spike. Theo spike rules:",o:["Tiếp diễn xuống","Spike thành vùng balance, đánh rotation trong spike","Spike bị reject, tăng mạnh","Không có ý nghĩa"],a:1,e:"Open trong spike → spike trở thành vùng giá được thị trường xem xét lại."},
  {m:"levels",q:"Naked POC dùng tốt nhất như thế nào?",o:["Bỏ qua","Target / magnet, và zone phản ứng ở lần chạm đầu","Luôn đảo chiều tại đó","Stop loss"],a:1,e:"Fair value cũ chưa được kiểm tra lại."},
  {m:"levels",q:"Level nào thuộc Tier 1 trong playbook?",o:["A-period high","Weekly VA / composite / naked POC nhiều ngày","IB mid","Halfback"],a:1,e:"Tier 1 = khung lớn, nhiều ngày đồng thuận."},
  {m:"levels",q:"Overnight inventory net long mạnh, open sát ON high. Cẩn trọng điều gì?",o:["Long ngay open vì trend mạnh","Inventory correction: giá dễ bị xả xuống ở 30–60 phút đầu","Không có gì","Chắc chắn Open Drive lên"],a:1,e:"Inventory lệch một phía hay được cân bằng lại đầu RTH. Kết hợp với OSR."},
  {m:"levels",q:"Sau khi Mỹ hết DST (từ 01/11/2026), 9:30 ET là mấy giờ ở Việt Nam?",o:["20:30","21:30","22:30","19:30"],a:1,e:"EST = UTC−5, VN = UTC+7, chênh 12 giờ."},
  {m:"levels",q:"IB High 28,700, IB Low 28,600. Mức IB extension 2x phía trên là:",o:["28,750","28,800","28,900","28,650"],a:1,e:"IB width 100. 2x IB tính từ IB Low = 28,600 + 200 = 28,800 (tức IB High + 1 width). 1.5x = 28,750."},
  {m:"levels",q:"Developing POC liên tục dịch lên trong phiên. Với scalping, điều này gợi ý:",o:["Short mỗi lần dPOC đổi","Value đang migrate lên, pullback về dPOC là điểm long","Không có ý nghĩa","Thị trường balance"],a:1,e:"dPOC migration là xác nhận value đang dịch theo hướng đó."},
  {m:"levels",q:"Halfback là gì?",o:["Điểm giữa IB","Điểm giữa range hiện tại của ngày","POC hôm qua","VWAP"],a:1,e:"Trên halfback = buyers đang thắng phiên đến lúc đó."},

  /* vwap */
  {m:"vwap",q:"Trong hệ thống của bạn, VWAP RTH được anchor lúc nào?",o:["18:00 ET","9:30 ET","00:00 ET","8:30 ET"],a:1,e:"Cùng mốc với IB và TPO RTH. VWAP ETH anchor 18:00 là lớp phụ."},
  {m:"vwap",q:"Công thức VWAP:",o:["Trung bình cộng giá đóng cửa","Σ(Giá × Volume) / Σ Volume","(High + Low) / 2","Giá × Volume"],a:1,e:"Giá trung bình có trọng số volume từ mốc anchor."},
  {m:"vwap",q:"VWAP phẳng, giá cắt qua lại nhiều lần và nằm trong ±1 SD. Trạng thái và hành động?",o:["Trend, đuổi theo","Balance, bingbong ±1 SD và fade ±2 SD","Chuyển pha, đứng ngoài","Không xác định"],a:1,e:"Khớp với khái niệm bingbong ±1 SD bạn đang dùng."},
  {m:"vwap",q:"Ngày Open Drive lên, VWAP dốc, giá chạy dọc +1/+2 SD. Hành động đúng?",o:["Short ở +2 SD","Buy pullback về VWAP / +1 SD, không fade","Short ở +3 SD chắc chắn thắng","Đứng ngoài cả ngày"],a:1,e:"Trên ngày trend, band là chỗ thêm lệnh theo hướng, không phải chỗ đảo."},
  {m:"vwap",q:"VWAP và dPOC cùng dịch lên sau 10:30 ET nghĩa là:",o:["Balance","Value đang migrate lên, ngày có khả năng trend / normal variation","Sắp đảo chiều","Không liên quan"],a:1,e:"Thời gian và volume cùng xác nhận value mới."},
  {m:"vwap",q:"Tại sao không nên fade band VWAP RTH trước 10:00 ET?",o:["Vì ATAS không hiển thị","Vì σ còn nhỏ và thay đổi liên tục, band quá hẹp và không ổn định","Vì volume quá lớn","Vì luật prop cấm"],a:1,e:"Ít dữ liệu → độ lệch chuẩn chưa có ý nghĩa."},
  {m:"vwap",q:"Giá đang nằm trên VWAP RTH. Điều này nói gì về người tham gia hôm nay?",o:["Người bán trung bình đang lãi","Người mua trung bình hôm nay đang lãi, buyers kiểm soát intraday","Thị trường chắc chắn tăng tiếp","Không có ý nghĩa"],a:1,e:"VWAP là giá vốn trung bình của phiên."},
  {m:"vwap",q:"Zone nào có grade cao nhất cho lệnh long trong ngày balance?",o:["Giữa VA hôm qua","PD VAL trùng −2 SD VWAP RTH + CVD absorption bullish","Trên PD High","Tại VWAP khi giá đang trend xuống"],a:1,e:"Ba lớp: location TPO + VWAP band + CVD. Đó là A++."},

  /* cvd */
  {m:"cvd",q:"Delta của một bar được tính thế nào?",o:["Volume ask − volume bid (market buy − market sell)","High − Low","Close − Open","Tổng volume"],a:0,e:"Delta đo aggression. CVD là tổng luỹ kế delta từ mốc reset."},
  {m:"cvd",q:"Tại sao nên reset CVD lúc 9:30 ET?",o:["ATAS bắt buộc","Để cùng mốc với VWAP RTH và TPO RTH, so sánh swing trong cùng một phiên","Để CVD luôn dương","Không cần reset"],a:1,e:"Ba công cụ cùng mốc thời gian thì mới so sánh được."},
  {m:"cvd",q:"Tại PD VAH: giá tạo higher high, CVD tạo lower high. Đây là:",o:["Absorption bullish","Exhaustion bearish","Xác nhận breakout","Không phải divergence"],a:1,e:"Nhịp lên mới cần ít người mua chủ động hơn → buyers cạn."},
  {m:"cvd",q:"Tại PD VAL: CVD tạo lower low rất mạnh nhưng giá giữ higher low. Đây là:",o:["Exhaustion bearish","Absorption bullish: passive buyers hấp thụ lệnh bán","Breakout xuống","Nhiễu"],a:1,e:"Sellers vẫn bấm market mạnh nhưng không đẩy được giá → có người lớn đứng mua ở level."},
  {m:"cvd",q:"Ngày Open Drive + IB extension + VWAP dốc lên. Thấy bearish divergence ở giữa range. Nên làm gì?",o:["Short ngay","Bỏ qua: divergence ngược trend thường fail, và không có location","Short gấp đôi size","Đảo hết lệnh long"],a:1,e:"Hai bộ lọc đều fail: regime là trend và không ở zone TPO."},
  {m:"cvd",q:"Divergence xuất hiện tại zone điểm 7. Bước tiếp theo?",o:["Vào lệnh ngay khi thấy divergence","Chờ trigger: phá cấu trúc M1, reclaim hoặc delta flip","Đợi đến 11:30","Hỏi người khác"],a:1,e:"Divergence là điều kiện, không phải entry."},
  {m:"cvd",q:"Lệnh short dựa trên bearish divergence tại VAH bị invalidate khi:",o:["Giá chạm VWAP","Giá vượt qua high đã tạo divergence","CVD giảm","Hết 30 phút"],a:1,e:"Stop đặt ngoài cực trị tạo divergence."},
  {m:"cvd",q:"So sánh CVD giữa các ngày như thế nào?",o:["So giá trị tuyệt đối hôm nay với hôm qua","Không so tuyệt đối giữa các ngày, chỉ so hình dạng swing trong cùng phiên","CVD dương luôn bullish","CVD âm luôn bearish"],a:1,e:"Giá trị tuyệt đối phụ thuộc mốc reset và volume từng ngày."},

  /* case */
  {m:"case",q:"Trong template của bạn, 30/10 open ~28,795, dưới low 29/10 (~29,105). Theo bảng open location, đây là:",o:["Open trong VA","Open dưới range hôm qua: imbalance mạnh","Open trên VA trong range","Open Auction"],a:1,e:"Out-of-range open, và cũng là open dưới spike bán cuối phiên 29/10 → tiếp diễn."},
  {m:"case",q:"03/11 có range nằm gọn trong range 02/11 và VA rất hẹp. Kỳ vọng hợp lý cho 04/11?",o:["Chắc chắn giảm","Balance hẹp sau ngày rộng, chuẩn bị breakout, chờ breakout được accept","Không trade được","Lặp lại y hệt 03/11"],a:1,e:"04/11 đã breakout lên khỏi balance này."},
  {m:"case",q:"POC developing 04/11 (~28,680) gần POC 02/11 (~28,650). Ý nghĩa cho plan 05/11?",o:["Không liên quan","Cụm fair value nhiều ngày, là pivot quan trọng","Phải short ở đó","Là single prints"],a:1,e:"Hai POC trùng nhau = zone điểm cao theo bảng chấm level."},
  {m:"case",q:"02/11 phá cả high và low của 30/10, close sát low. Nếu IB cũng bị phá cả hai phía, day type là:",o:["Trend","Neutral Extreme","Non-Trend","Normal"],a:1,e:"RE hai phía + close ở cực trị. Ngày sau thiên theo hướng close, nhưng 03/11 đã không tiếp diễn."},
  {m:"case",q:"RTH gap 28,860–29,105 (giữa low 29/10 và high 30/10) đóng vai trò gì trong plan các ngày sau?",o:["Không quan trọng vì đã qua","Magnet / kháng cự Tier 2: lần test đầu hay phản ứng, accept vào trong thì kỳ vọng lấp gap","Support mạnh nhất","Là POC"],a:1,e:"Gap RTH là vùng imbalance chưa được giao dịch trong phiên chính."},
  {m:"case",q:"VA 04/11 nằm hoàn toàn trên VA 03/11. Quan hệ value này là:",o:["Inside value","Higher value","Lower value","Outside value"],a:1,e:"Higher value = bullish rõ, breakout khỏi balance 03/11 đã được accept."},
  {m:"case",q:"Trên template ATAS của bạn, phần volume profile màu hồng (crimson) thể hiện gì?",o:["Delta âm","Value area của volume profile","Single prints","Phiên ETH"],a:1,e:"Phần hồng là 70% volume quanh POC, phần xám là ngoài value."},

  /* thêm: tpo */
  {m:"tpo",q:"Tail ở đáy profile được gọi là gì?",o:["Selling tail","Buying tail","Poor low","Spike"],a:1,e:"Buyers phản ứng từ chối giá thấp rất nhanh → buying tail (excess ở đáy)."},
  {m:"tpo",q:"Row size của bạn là 5 điểm/dòng. Theo quy ước thực dụng trong playbook, tail tối thiểu dài bao nhiêu?",o:["5 điểm (1 dòng)","10 điểm (2 dòng)","25 điểm","Không có quy ước"],a:1,e:"Excess tối thiểu = 2 dòng single print ở cực trị."},
  {m:"tpo",q:"Tại sao nên giữ cố định một con số cho Value Area (70% hoặc 68%)?",o:["Vì ATAS bắt buộc","Để VA giữa các ngày so sánh được với nhau","Vì 70% luôn chính xác hơn","Để VA rộng hơn"],a:1,e:"Đổi tham số giữa chừng làm hỏng mọi so sánh value relationship."},
  {m:"tpo",q:"Khi nào nên dùng composite profile?",o:["Mỗi ngày đều gộp","Khi nhiều ngày liên tiếp có VA chồng lên nhau","Chỉ ngày trend","Chỉ phiên ETH"],a:1,e:"VA chồng nhau = fair value bền; cạnh composite mạnh hơn cạnh VA một ngày."},
  {m:"tpo",q:"Marker close nằm sát high của ngày, sau một ngày up. Điều này gợi ý:",o:["Balance","Close mạnh, dễ tiếp diễn hướng lên ngày sau","Chắc chắn đảo chiều","Không có ý nghĩa"],a:1,e:"Close location là đầu vào cho kỳ vọng open và spike rules."},
  {m:"tpo",q:"Trong A–D (9:30–11:30 ET), RF của A–C dùng để làm gì?",o:["Tín hiệu vào lệnh","Xác nhận open type / ai đang chủ động","Đặt stop loss","Tính VWAP"],a:1,e:"RF là công cụ xác nhận context, không phải trigger."},

  /* thêm: structure */
  {m:"structure",q:"Ngày Normal (Dalton) có đặc điểm gì?",o:["IB rất hẹp, trend cả ngày","IB rất rộng, gần như không có range extension","RE cả hai phía","Hai vùng value"],a:1,e:"Large timeframe vào sớm, đặt biên cả ngày trong IB."},
  {m:"structure",q:"Open Auction trong range hôm qua. Hành động đúng?",o:["Vào lệnh ngay A period","Không trade A period, chờ IB rồi đánh cạnh IB hoặc breakout có xác nhận","Short mọi nhịp lên","Long mọi nhịp xuống"],a:1,e:"OA = không ai chủ động, tự tin thấp nhất."},
  {m:"structure",q:"Hôm qua Neutral Extreme, close ở high. Ngày sau ưu tiên:",o:["Hướng xuống","Hướng lên (theo hướng close)","Không trade","Đánh ngược mọi breakout"],a:1,e:"Phe thắng xuất hiện cuối phiên, thường tiếp diễn."},
  {m:"structure",q:"VA hôm nay bao trùm toàn bộ VA hôm qua. Đây là:",o:["Inside value","Outside value: mở rộng, hai phe cùng hoạt động","Higher value","Unchanged"],a:1,e:"Xem close location để chọn hướng."},
  {m:"structure",q:"b-shape thường phản ánh điều gì?",o:["Short covering","Long liquidation","New buying","Non-trend"],a:1,e:"Thân mỏng ở trên là phe long cũ thoát hàng."},
  {m:"structure",q:"Open Test Drive khớp nhất với model nào bạn đang dùng?",o:["Range69","OSR: sweep biên ON range → reclaim → retest","VWAP ±3 SD","Không model nào"],a:1,e:"Test một level ngược hướng để kiểm tra business rồi drive qua open."},

  /* thêm: levels & plan */
  {m:"levels",q:"Open nằm trong VA hôm qua. Kỳ vọng mặc định là gì?",o:["Trend mạnh","Rotation trong VA, fade cạnh VAH/VAL về POC","Gap fill","Không trade cả ngày"],a:1,e:"Hai bên vẫn đồng thuận cho đến khi có acceptance ngoài VA."},
  {m:"levels",q:"Level đã bị xuyên qua và được accept trong phiên hôm nay được chấm bao nhiêu điểm?",o:["+3","−3","0","+1"],a:1,e:"Level đã mất vai trò, không fade lại ở đó."},
  {m:"levels",q:"Zone được chấm 5 điểm. Cách xử lý?",o:["Trade full size","Chỉ trade khi CVD + trigger rất rõ","Không bao giờ trade","Dùng làm stop"],a:1,e:"≥ 6 là zone A; 4–5 cần thêm xác nhận; ≤ 3 chỉ là target."},
  {m:"levels",q:"Single prints bị lấp hết và giá xây value ở đó. Ý nghĩa?",o:["Level mạnh hơn","Imbalance đã được sửa, level hết tác dụng","Chắc chắn đảo chiều","Cần vẽ thêm"],a:1,e:"Single prints chỉ có tác dụng khi còn là vùng imbalance."},
  {m:"levels",q:"IB width 80 điểm, trung bình 20 phiên 200 điểm. Đánh giá?",o:["Rộng → rotation","Hẹp (40%) → ưu tiên range extension","Trung bình","Không đủ dữ liệu"],a:1,e:"Dưới 70% trung bình được xem là IB hẹp."},
  {m:"levels",q:"Ngày trend lên, cách trailing stop theo TPO?",o:["Dưới VWAP −3 SD","Dưới low của period trước","Trên high của period hiện tại","Không dời stop"],a:1,e:"Mỗi period trend tạo low cao hơn, stop đi theo."},
  {m:"levels",q:"Plan mỗi ngày phải được chốt trước thời điểm nào?",o:["9:25 ET","10:30 ET","Sau khi vào lệnh đầu","16:00 ET"],a:0,e:"Bias và kịch bản xây xong trước 9:25 ET, như hệ thống bạn đã quy định."},
  {m:"levels",q:"Mỗi kịch bản trong plan cần đủ 4 thành phần nào?",o:["Zone, trigger, target, invalidation","Entry, size, tin tức, cảm xúc","Giá, giờ, VWAP, RSI","Chỉ cần hướng"],a:0,e:"Thiếu invalidation thì plan chỉ là dự đoán."},
  {m:"levels",q:"Một lệnh thắng nhưng nằm ngoài plan. Trong post-session review, nó được đánh giá thế nào?",o:["Tốt vì có lãi","Lỗi process, dù có lãi","Không cần ghi","Tăng size lần sau"],a:1,e:"Chấm process, không chấm kết quả."},
  {m:"levels",q:"Điều kiện dừng trade trong ngày theo playbook là:",o:["Khi thắng 1 lệnh","Đủ 2–3 lệnh, chạm daily loss limit, hoặc 11:30 ET","Khi hết tin tức","Không có"],a:1,e:"Khớp giới hạn prop và cửa sổ 2 tiếng NY AM của bạn."},

  /* thêm: vwap */
  {m:"vwap",q:"Khi nào dùng chiến thuật bingbong ±1 SD?",o:["Ngày trend mạnh","Khi VWAP phẳng, thị trường balance","Ngay 9:30","Khi có tin"],a:1,e:"Rotation quanh VWAP chỉ hợp lệ khi không có trend."},
  {m:"vwap",q:"VWAP ETH (anchor 18:00 ET) có vai trò gì trong hệ thống của bạn?",o:["Trigger chính","Lớp confluence phụ, xem khi volume overnight bất thường","Thay thế VWAP RTH","Không dùng"],a:1,e:"VWAP RTH là trigger chính vì cùng mốc với IB."},
  {m:"vwap",q:"Giá chạm VWAP RTH. Đây đã là tín hiệu vào lệnh chưa?",o:["Có, vào ngay","Chưa: chỉ là location, vẫn cần CVD + trigger","Có nếu là phiên Á","Chỉ khi trên VWAP"],a:1,e:"VWAP được cộng điểm khi trùng location TPO, không phải tín hiệu độc lập."},

  /* thêm: cvd */
  {m:"cvd",q:"Khác biệt cốt lõi giữa absorption và exhaustion?",o:["Không khác","Absorption: aggressor vẫn mạnh nhưng bị passive chặn; exhaustion: aggressor yếu dần","Absorption chỉ có ở đáy","Exhaustion mạnh hơn absorption"],a:1,e:"Absorption thường mạnh hơn vì có người lớn đứng ở level."},
  {m:"cvd",q:"Công cụ nào trên ATAS giúp xác nhận có lệnh lớn đứng hấp thụ ở level?",o:["Weekly VWAP","Smart Tape (Price + Volume) / DOM","RSI","Moving average"],a:1,e:"Bạn đã setup Smart Tape 2 cột Price + Volume đúng cho việc này."},
  {m:"cvd",q:"Setup grade A++ cần những gì?",o:["Chỉ CVD divergence","Zone TPO ≥ 6 + VWAP/band trùng + CVD divergence + trigger","Chỉ VWAP","Open type bất kỳ"],a:1,e:"Ba lớp confluence + trigger = A++."},

  /* ib */
  {m:"ib",q:"IB của NQ RTH tính theo giờ Việt Nam (mùa đông, EST) là khoảng nào?",o:["20:30–21:30","21:30–22:30","22:30–23:30","21:30–22:00"],a:1,e:"9:30–10:30 ET, chênh 12 giờ khi Mỹ không áp dụng DST."},
  {m:"ib",q:"IB gồm những TPO period nào?",o:["Chỉ A","A và B","A, B và C","Toàn bộ ETH"],a:1,e:"A (9:30–10:00) + B (10:00–10:30)."},
  {m:"ib",q:"IBH 28,800, IBL 28,650. IB mid là bao nhiêu?",o:["28,700","28,725","28,750","28,650"],a:1,e:"(28,800 + 28,650) / 2 = 28,725."},
  {m:"ib",q:"IB width 150 điểm, trung bình 20 phiên 250 điểm. Đánh giá và thiên hướng?",o:["Rộng, fade cạnh IB","Hẹp (60%), ưu tiên chờ breakout go-with","Bình thường, đứng ngoài","Không kết luận được"],a:1,e:"Dưới 70% trung bình = IB hẹp, năng lượng dồn cho range extension."},
  {m:"ib",q:"IBH 28,800, IBL 28,700. Theo quy ước 'tổng range' của playbook, extension 1.5x phía trên là:",o:["28,850","28,950","28,900","28,825"],a:0,e:"Width 100. 1.5x = IBL + 150 = IBH + 50 = 28,850. 2x = 28,900."},
  {m:"ib",q:"10:45 ET giá phá IBH, nhưng period C đóng lại trong IB và CVD tạo lower high. Đây là kịch bản gì?",o:["Breakout được accept","Failed break: ưu tiên fade về IB mid rồi IBL","Neutral day","Trend day"],a:1,e:"Setup IB-2. Stop ngoài extreme của cú phá."},
  {m:"ib",q:"Cả ngày giá không rời IB, IB lại rộng. Day type khả năng cao là:",o:["Trend","Normal","Double Distribution","Neutral"],a:1,e:"Large timeframe đặt biên sớm, phần còn lại là rotation."},
  {m:"ib",q:"Vì sao không nên vào breakout ngay khi giá vừa chạm IBH lúc 10:31?",o:["Vì IBH không phải level","Chưa có acceptance; cú chạm đầu thường là thăm dò, dễ fake-out","Vì prop cấm","Vì VWAP chưa có"],a:1,e:"Chờ 1 period giữ ngoài IB hoặc retest IBH có trigger."},
  {m:"ib",q:"Setup IB-1 (breakout go-with), stop hợp lý nằm ở đâu?",o:["Trên IBH khi long","Dưới retest low, hoặc khi giá quay sâu lại trong IB","Tại IB mid đối diện","Không cần stop"],a:1,e:"Breakout hợp lệ thì IBH cũ phải giữ vai trò support."},
  {m:"ib",q:"Tin 10:00 ET (ISM, JOLTS…) ảnh hưởng gì đến IB?",o:["Không ảnh hưởng","Làm méo period B, IB width có thể không đại diện cho cấu trúc","Luôn làm IB hẹp","Huỷ IB"],a:1,e:"Ghi chú phiên có tin vào IB Journal để lọc khi thống kê."},
  {m:"ib",q:"IB nằm hoàn toàn trên range hôm qua và IB hẹp. Bối cảnh này gợi ý:",o:["Fade mọi nhịp lên","Bối cảnh trend lên mạnh nhất, ưu tiên breakout lên","Balance","Không trade"],a:1,e:"Imbalance theo hướng open + IB hẹp = xác suất RE cùng hướng cao."},
  {m:"ib",q:"Kịch bản Neutral (phá cả hai phía IB) thường hoàn thành khi nào, và bạn dùng nó thế nào?",o:["Trước 10:30, trade ngay","Thường sau 11:30 (ngoài cửa sổ của bạn), dùng làm context cho ngày sau","Không bao giờ xảy ra","Chỉ trong ETH"],a:1,e:"Cửa sổ 9:30–11:30 hiếm khi đủ thời gian cho cả hai phía bị phá."},
  {m:"ib",q:"dPOC nằm nửa trên IB, giá giữ trên IB mid, VWAP dốc lên lúc 10:30. Gợi ý gì?",o:["Chắc chắn phá IBH","Thiên hướng breakout lên, nhưng vẫn cần acceptance + CVD xác nhận","Short IBH","Đứng ngoài cả ngày"],a:1,e:"Context nghiêng một phía, chưa phải tín hiệu."},
  {m:"ib",q:"IB mid nên được dùng chủ yếu như thế nào?",o:["Zone vào lệnh mạnh nhất","Đích của rotation và chỗ dời stop","Level Tier 1","Không dùng"],a:1,e:"IBH/IBL mới là biên chính; IB mid là trọng tâm."}
];
window.QBANK=(window.QBANK||[]).concat(PB.quiz.map((q,i)=>({id:'L'+String(i+1).padStart(3,'0'),course:'levels',mod:q.m,q:q.q,o:q.o,a:q.a,e:q.e,vis:null})));
window.QMODS=window.QMODS||{};window.QMODS.levels={tpo:'Nền tảng TPO',structure:'Day & Open types',case:'Case study',ib:'Initial Balance',levels:'Level map',vwap:'VWAP RTH',cvd:'CVD divergence'};
})();
