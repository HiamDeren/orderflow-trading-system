/* Ngân hàng câu hỏi chương EMA 9/34 — 15 câu (bỏ câu case 08/11), id L094–L108. */
(function(){
'use strict';
const Q=[
{
"id": "L094",
"course": "levels",
"mod": "ema",
"q": "α của EMA9 bằng bao nhiêu?",
"o": [
"0,111 (= 1/9)",
"0,200 (= 2/10)",
"0,900",
"0,050"
],
"a": 1,
"e": "α = 2/(N+1) = 2/10 = 0,2. Mỗi nến mới kéo EMA9 về phía giá đóng cửa 20% khoảng cách."
},
{
"id": "L095",
"course": "levels",
"mod": "ema",
"q": "Điểm khác cốt lõi giữa EMA9 và SMA9?",
"o": [
"EMA9 chỉ dùng giá high",
"EMA9 cho nến mới trọng số lớn hơn, giảm dần về quá khứ",
"EMA9 luôn nằm trên SMA9",
"Không khác gì, chỉ khác tên"
],
"a": 1,
"e": "SMA9 chia đều 1/9 cho mỗi nến. EMA9 cho nến mới nhất 20%, nến thứ 9 chỉ ~3,4%, nên EMA phản ứng nhanh hơn."
},
{
"id": "L096",
"course": "levels",
"mod": "ema",
"q": "9 nến gần nhất chiếm khoảng bao nhiêu % trọng số của EMA9?",
"o": [
"100%",
"~50%",
"~87%",
"~20%"
],
"a": 2,
"e": "1 − 0,8⁹ ≈ 86,6%. Phần còn lại đến từ các nến cũ hơn. Đó là lý do “EMA9 ≈ trung bình 9 nến” chỉ gần đúng."
},
{
"id": "L097",
"course": "levels",
"mod": "ema",
"q": "Độ trễ trung bình của EMA34 trên M1 khoảng?",
"o": [
"~4 phút",
"~16 phút",
"~34 phút",
"~1 phút"
],
"a": 1,
"e": "Lag ≈ (N−1)/2 = 16,5 nến. Trên M1 tức khoảng 16 phút. Vì vậy cross 9/34 luôn đến sau đỉnh/đáy."
},
{
"id": "L098",
"course": "levels",
"mod": "ema",
"q": "Dùng 9/34 trên chart 30s thì EMA9 phủ khoảng bao nhiêu thời gian?",
"o": [
"9 phút",
"4,5 phút",
"18 phút",
"30 giây"
],
"a": 1,
"e": "9 nến × 30s = 4,5 phút. Đổi khung là đổi chân trời thời gian của EMA, dù period giữ nguyên."
},
{
"id": "L099",
"course": "levels",
"mod": "ema",
"q": "Đang short, nến 1m có wick vượt lên EMA9 nhưng đóng cửa dưới EMA9. Theo rule?",
"o": [
"Thoát ngay",
"Giữ lệnh, chỉ tính giá đóng cửa",
"Vào thêm lệnh",
"Đổi sang 30s để xem lại"
],
"a": 1,
"e": "Rule chỉ tính body close. Wick xuyên rồi đóng lại là phản ứng, thậm chí có thể là dấu hiệu absorption tốt cho lệnh short."
},
{
"id": "L100",
"course": "levels",
"mod": "ema",
"q": "Vì sao không dùng cross 9/34 làm trigger vào lệnh?",
"o": [
"Vì cross không bao giờ đúng",
"Vì cross trễ theo cấu trúc và cắt liên tục khi thị trường đi ngang",
"Vì ATAS không vẽ được cross",
"Vì cross chỉ dùng cho khung D1"
],
"a": 1,
"e": "Hai lý do: cross đến sau (lag) và trong range thì “cross tùm lum”. Cross dùng để xác nhận trạng thái, không dùng để bóp cò."
},
{
"id": "L101",
"course": "levels",
"mod": "ema",
"q": "Dấu hiệu nào cho thấy đang ở S4 (range)?",
"o": [
"Spread 9–34 mở rộng",
"EMA9 và 34 phẳng, xoắn nhau, từ 3 cross trở lên trong 30 nến",
"Giá bám EMA9 không đóng ngược",
"EMA34 dốc mạnh"
],
"a": 1,
"e": "S4: hai đường phẳng và xoắn, cross liên tục. Lúc này tắt EMA làm tín hiệu và trade biên TPO bằng OF."
},
{
"id": "L102",
"course": "levels",
"mod": "ema",
"q": "Stack nào là bear?",
"o": [
"Giá > EMA9 > EMA34",
"Giá < EMA9 < EMA34",
"EMA9 > Giá > EMA34",
"EMA34 > EMA9 > Giá nhưng EMA34 dốc lên"
],
"a": 1,
"e": "Bear stack: giá dưới EMA9, EMA9 dưới EMA34. Phương án D có thứ tự giống bear nhưng EMA34 dốc lên, tức là đang chuyển tiếp, chưa phải trend giảm."
},
{
"id": "L103",
"course": "levels",
"mod": "ema",
"q": "Trend S1, giá đang cách EMA9 khoảng 40 điểm và bạn muốn long. Nên làm gì?",
"o": [
"Market long ngay kẻo lỡ",
"Chờ giá về EMA9 hoặc về TPO zone gần EMA9 rồi mới xét E1",
"Short vì giá đã lên nhiều",
"Đổi sang 2m"
],
"a": 1,
"e": "Giá giãn xa (extension) thì R:R xấu, stop phải đặt xa. Chờ retest theo E1. Short ngược S1 khi chưa có sweep và nến đóng ngược EMA9 là fade trend."
},
{
"id": "L104",
"course": "levels",
"mod": "ema",
"q": "Trong model E3 (short), stop hợp lý đặt ở đâu?",
"o": [
"Dưới EMA34",
"Trên đỉnh sweep hoặc ngoài zone vừa bị quét",
"Cố định 5 điểm",
"Dưới đáy gần nhất"
],
"a": 1,
"e": "Ý tưởng của E3 sai khi giá được chấp nhận lại bên kia zone hoặc lấy lại đỉnh sweep. Stop đặt ngoài các mức đó."
},
{
"id": "L105",
"course": "levels",
"mod": "ema",
"q": "Checklist đạt 3/5 lớp, đủ cổng, có cả L2 và L4. Xếp hạng?",
"o": [
"Hạng A++",
"Hạng A+",
"Hạng B: giảm size một nửa hoặc bỏ qua",
"STOP"
],
"a": 2,
"e": "5 = A++, 4 = A+, 3 = B. Nếu 3 điểm mà thiếu L2 (location) hoặc L4 (OF trigger) thì tự động thành NO."
},
{
"id": "L106",
"course": "levels",
"mod": "ema",
"q": "Đang short từ VAH, nến đóng trên cả EMA9 và EMA34 nhưng vẫn dưới VAH. Theo ladder?",
"o": [
"Thoát hết ngay",
"Vào thêm vì VAH còn giữ",
"Giữ một nửa, stop trên VAH, đọc OF tại VAH",
"Bỏ stop chờ giá về"
],
"a": 2,
"e": "Đây là bậc 4: TPO zone có ưu tiên cao hơn EMA. Lớp quyết định tiếp theo là orderflow tại VAH. Nến đóng trên VAH thì thoát hết."
},
{
"id": "L107",
"course": "levels",
"mod": "ema",
"q": "Đang có lệnh trên 1m, bạn mở chart 30s và thấy nến 30s “đóng đẹp” nên quyết định giữ tiếp dù 1m đã đóng sai phía EMA9 hai lần. Đây là lỗi gì?",
"o": [
"Không lỗi, càng nhiều khung càng tốt",
"Confirmation bias: đổi khung giữa lệnh để tìm lý do giữ lệnh",
"Lỗi setup indicator",
"Lỗi tính α"
],
"a": 1,
"e": "Khung phải chọn trước phiên. Đổi khung giữa lệnh để có được câu trả lời mình muốn là phá rule, và rất dễ dẫn tới cháy trailing drawdown."
},
{
"id": "L108",
"course": "levels",
"mod": "ema",
"q": "Trong stack của bạn, vai trò đúng của EMA 9/34 là gì?",
"o": [
"Trigger vào lệnh chính",
"Đọc trạng thái, cấp quyền trade chiều nào, và quản lý lệnh. Trigger là orderflow",
"Thay thế TPO zone",
"Xác định bias của ngày"
],
"a": 1,
"e": "Layer 3 · State. Context đến từ bias TPO, location từ TPO zone/VWAP, trigger từ footprint/delta/CVD. EMA nối các lớp đó với việc quản lý lệnh."
}
];
window.QBANK=(window.QBANK||[]).concat(Q.map(q=>Object.assign({vis:null},q)));
const M=(window.QMODS=window.QMODS||{}).levels||{},N={};
Object.keys(M).forEach(k=>{N[k]=M[k];if(k==='vwap')N.ema='EMA 9/34';});
if(!N.ema)N.ema='EMA 9/34';
window.QMODS.levels=N;
})();
