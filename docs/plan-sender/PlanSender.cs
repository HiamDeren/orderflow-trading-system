// PlanSender.cs
// Indicator ATAS X: lúc 9:29 ET bấm "Gửi plan" -> tính VA TPO của pRTH, OVN, VA từng phiên 30 ngày và composite,
// rồi (1) copy JSON vào clipboard, (2) lưu file JSON, (3) tuỳ chọn POST lên web (bước 2).
//
// Dùng trên chart NQ khung 30 phút (M30), phiên ETH đầy đủ, lookback >= 30 ngày.
// Mỗi nến M30 = một period TPO. Row = RowTicks tick (mặc định 4 tick = 1 điểm), VA 70% mở rộng 2 dòng,
// giống hệt script backtest (analyze.py) để số liệu khớp.
//
// LƯU Ý CHO CLAUDE CODE: tên property / method ATAS API có thể khác nhẹ giữa các bản.
// Nếu build lỗi, đối chiếu với M1DataExporter.cs (đã build được trên máy này) và sửa cho khớp,
// nhưng KHÔNG đổi tên field trong JSON và KHÔNG đổi thuật toán TPO / VA.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using ATAS.Indicators;

namespace Deren.Indicators.Plan
{
    [DisplayName("Deren · Plan Sender")]
    [Category("Deren")]
    public class PlanSender : Indicator
    {
        private static readonly CultureInfo Inv = CultureInfo.InvariantCulture;
        private static readonly HttpClient Http = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
        private bool _pending;
        private string _lastAutoDate = "";

        // ---------------- Gửi ----------------
        [Display(Name = "Bấm để gửi plan", GroupName = "1 · Gửi", Order = 10)]
        public bool SendNow
        {
            get => false;
            set
            {
                if (!value) return;
                _pending = true;
                RecalculateValues();
            }
        }

        [Display(Name = "Tự gửi lúc 9:29 ET", GroupName = "1 · Gửi", Order = 20)]
        public bool AutoSendAt929 { get; set; } = false;

        [Display(Name = "Copy JSON vào clipboard", GroupName = "1 · Gửi", Order = 30)]
        public bool CopyToClipboard { get; set; } = true;

        [Display(Name = "Thư mục lưu JSON", GroupName = "1 · Gửi", Order = 40)]
        public string OutputFolder { get; set; } =
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "ATAS_Export", "plans");

        // Để trống = dùng dữ liệu hiện tại. Nhập yyyy-MM-dd để tính lại plan như lúc 9:29 của ngày đó (dùng để kiểm tra).
        [Display(Name = "Tính như ngày (yyyy-MM-dd, để kiểm tra)", GroupName = "1 · Gửi", Order = 50)]
        public string AsOfDate { get; set; } = "";

        // ---------------- Bước 2: web ----------------
        [Display(Name = "Gửi lên web (bước 2)", GroupName = "2 · Web", Order = 10)]
        public bool SendHttp { get; set; } = false;

        [Display(Name = "API URL", GroupName = "2 · Web", Order = 20)]
        public string ApiUrl { get; set; } = "https://<ten-site>.vercel.app/api/plan";

        // Token lưu trong template ATAS dạng chữ thường. Không chia sẻ template có token.
        [Display(Name = "API token", GroupName = "2 · Web", Order = 30)]
        public string ApiToken { get; set; } = "";

        // ---------------- Tham số TPO ----------------
        [Display(Name = "Row TPO (tick)", GroupName = "3 · TPO", Order = 10)]
        public int RowTicks { get; set; } = 4;

        [Display(Name = "Value area %", GroupName = "3 · TPO", Order = 20)]
        public int ValueAreaPct { get; set; } = 70;

        [Display(Name = "Số ngày lấy VA từng phiên", GroupName = "3 · TPO", Order = 30)]
        public int SessionsLookback { get; set; } = 30;

        [Display(Name = "Số ngày composite", GroupName = "3 · TPO", Order = 40)]
        public int CompositeDays { get; set; } = 30;

        [Display(Name = "Row composite (tick)", GroupName = "3 · TPO", Order = 50)]
        public int CompositeRowTicks { get; set; } = 40;

        [Display(Name = "Thời gian nến là UTC", GroupName = "3 · TPO", Order = 60)]
        public bool CandleTimeIsUtc { get; set; } = true;

        public PlanSender() : base(true)
        {
            DenyToChangePanel = true;
            DataSeries[0].IsHidden = true;
        }

        protected override void OnCalculate(int bar, decimal value)
        {
            if (bar < CurrentBar - 1) return;
            try
            {
                if (_pending)
                {
                    _pending = false;
                    Send("manual");
                    return;
                }
                if (AutoSendAt929 && string.IsNullOrWhiteSpace(AsOfDate))
                {
                    var nowEt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, FindEt());
                    string d = nowEt.ToString("yyyy-MM-dd", Inv);
                    bool weekday = nowEt.DayOfWeek != DayOfWeek.Saturday && nowEt.DayOfWeek != DayOfWeek.Sunday;
                    if (weekday && nowEt.Hour == 9 && nowEt.Minute == 29 && _lastAutoDate != d)
                    {
                        _lastAutoDate = d;
                        Send("auto");
                    }
                }
            }
            catch (Exception ex)
            {
                Log("ERROR " + ex);
            }
        }

        // ================== Tính plan ==================
        private sealed class Bar30 { public DateTime Et; public decimal H, L, C; public string Sd; public string Kind; }
        private sealed class Tpo { public decimal Vah, Val, Poc, High, Low, Close; public int Periods; public string PeriodsHL; }

        private void Send(string trigger)
        {
            var et = FindEt();
            decimal tick = InstrumentInfo?.TickSize ?? 0.25m;
            if (tick <= 0) tick = 0.25m;
            decimal row = tick * Math.Max(1, RowTicks);
            decimal crow = tick * Math.Max(1, CompositeRowTicks);
            var warnings = new List<string>();

            // 1. Lấy nến (gồm cả nến cuối đang hình thành: OVN đến lúc bấm).
            var bars = new List<Bar30>();
            for (int i = 0; i <= CurrentBar - 1; i++)
            {
                var c = GetCandle(i);
                var t = TimeZoneInfo.ConvertTimeFromUtc(ToUtc(c.Time), et);
                var (sd, kind) = SessionOf(t);
                bars.Add(new Bar30 { Et = t, H = c.High, L = c.Low, C = c.Close, Sd = sd, Kind = kind });
            }
            if (bars.Count < 50) { Log("Quá ít nến: " + bars.Count); return; }

            // Kiểm tra khung thời gian.
            int bad = 0;
            for (int i = 1; i < bars.Count; i++)
            {
                double m = (bars[i].Et - bars[i - 1].Et).TotalMinutes;
                if (m > 0 && m < 120 && Math.Abs(m - 30) > 0.5) bad++;
            }
            if (bad > 5) warnings.Add("Chart khong phai khung 30 phut: VA se lech so voi TPO chuan");

            // 2. Xác định "hôm nay" và cắt dữ liệu nếu tính lại cho ngày cũ.
            string today;
            if (!string.IsNullOrWhiteSpace(AsOfDate))
            {
                today = AsOfDate.Trim();
                var cut = DateTime.ParseExact(today, "yyyy-MM-dd", Inv).AddHours(9); // nến 9:00 (9:00–9:29) là nến cuối của OVN
                bars = bars.Where(b => b.Et <= cut).ToList();
                if (bars.Count == 0) { Log("Không có dữ liệu trước " + today); return; }
            }
            else
            {
                var last = bars[bars.Count - 1];
                today = last.Sd ?? last.Et.ToString("yyyy-MM-dd", Inv);
            }

            decimal price = bars[bars.Count - 1].C;

            // 3. pRTH = phiên RTH gần nhất trước hôm nay; OVN = phiên OVN của hôm nay.
            var rthDates = bars.Where(b => b.Kind == "RTH" && string.CompareOrdinal(b.Sd, today) < 0)
                               .Select(b => b.Sd).Distinct().OrderBy(x => x).ToList();
            if (rthDates.Count == 0) { Log("Không tìm thấy pRTH"); return; }
            string prDate = rthDates[rthDates.Count - 1];
            var prBars = bars.Where(b => b.Sd == prDate && b.Kind == "RTH").ToList();
            var ovBars = bars.Where(b => b.Sd == today && b.Kind == "OVN").ToList();
            var pr = CalcTpo(prBars, row);
            var ov = CalcTpo(ovBars, row);
            if (pr == null || ov == null) { Log("Thiếu dữ liệu pRTH hoặc OVN"); return; }
            if (pr.Periods < 13) warnings.Add($"pRTH {prDate} chi co {pr.Periods} period (ngay nghi som?)");
            if (ov.Periods < 20) warnings.Add($"OVN chi co {ov.Periods} period");

            // 4. VA từng phiên (RTH + OVN) trong SessionsLookback ngày gần nhất, để web tìm HVN.
            var dates = bars.Where(b => b.Sd != null && string.CompareOrdinal(b.Sd, today) <= 0)
                            .Select(b => b.Sd).Distinct().OrderBy(x => x).ToList();
            var sesDates = dates.Skip(Math.Max(0, dates.Count - SessionsLookback)).ToList();
            var sessions = new StringBuilder();
            bool first = true;
            foreach (var d in sesDates)
            {
                foreach (var kind in new[] { "OVN", "RTH" })
                {
                    var g = bars.Where(b => b.Sd == d && b.Kind == kind).ToList();
                    if (g.Count < 4) continue;
                    var t = CalcTpo(g, row);
                    if (!first) sessions.Append(',');
                    first = false;
                    sessions.Append($"{{\"date\":\"{d}\",\"type\":\"{kind}\",\"val\":{D(t.Val)},\"vah\":{D(t.Vah)},\"poc\":{D(t.Poc)},\"periods\":{t.Periods}}}");
                }
            }

            // 5. Composite (toàn bộ nến ETH của CompositeDays ngày gần nhất).
            var compDates = new HashSet<string>(dates.Skip(Math.Max(0, dates.Count - CompositeDays)));
            var comp = CalcTpo(bars.Where(b => b.Sd != null && compDates.Contains(b.Sd)).ToList(), crow);

            // 6. JSON (chỉ ký tự ASCII để clip.exe copy đúng).
            string symbol = Ascii(InstrumentInfo?.Instrument ?? "NQ");
            string tsEt = string.IsNullOrWhiteSpace(AsOfDate)
                ? TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, et).ToString("yyyy-MM-ddTHH:mm:ss", Inv)
                : today + "T09:29:00";
            var sb = new StringBuilder();
            sb.Append('{');
            sb.Append("\"v\":1,\"source\":\"Deren.PlanSender v1\",");
            sb.Append($"\"trigger\":\"{trigger}\",\"symbol\":\"{symbol}\",\"date\":\"{today}\",\"ts_et\":\"{tsEt}\",");
            sb.Append($"\"price\":{D(price)},\"tick\":{D(tick)},\"row\":{D(row)},");
            sb.Append($"\"prth\":{{\"date\":\"{prDate}\",\"vah\":{D(pr.Vah)},\"val\":{D(pr.Val)},\"poc\":{D(pr.Poc)},\"high\":{D(pr.High)},\"low\":{D(pr.Low)},\"close\":{D(pr.Close)},\"periods\":{pr.Periods},\"periods_hl\":{pr.PeriodsHL}}},");
            sb.Append($"\"ovn\":{{\"vah\":{D(ov.Vah)},\"val\":{D(ov.Val)},\"poc\":{D(ov.Poc)},\"onh\":{D(ov.High)},\"onl\":{D(ov.Low)},\"periods\":{ov.Periods},\"periods_hl\":{ov.PeriodsHL}}},");
            sb.Append("\"sessions\":[").Append(sessions).Append("],");
            if (comp != null)
                sb.Append($"\"composite\":{{\"days\":{compDates.Count},\"row\":{D(crow)},\"vah\":{D(comp.Vah)},\"val\":{D(comp.Val)},\"poc\":{D(comp.Poc)}}},");
            sb.Append("\"warnings\":[").Append(string.Join(",", warnings.Select(w => "\"" + Ascii(w).Replace("\"", "'") + "\""))).Append("]");
            sb.Append('}');
            string json = sb.ToString();

            // 7. Xuất.
            Directory.CreateDirectory(OutputFolder);
            File.WriteAllText(Path.Combine(OutputFolder, $"plan_{today.Replace("-", "")}.json"), json, new UTF8Encoding(false));
            File.WriteAllText(Path.Combine(OutputFolder, "latest_plan.json"), json, new UTF8Encoding(false));
            if (CopyToClipboard) ToClipboard(json);
            Log($"OK {trigger} {today} price={D(price)} pRTH({prDate}) VA {D(pr.Val)}-{D(pr.Vah)} POC {D(pr.Poc)} | OVN VA {D(ov.Val)}-{D(ov.Vah)} POC {D(ov.Poc)} | warnings={warnings.Count}");

            if (SendHttp && !string.IsNullOrWhiteSpace(ApiUrl) && !ApiUrl.Contains("<"))
                _ = PostAsync(json);
        }

        // ================== TPO (giống analyze.py) ==================
        private Tpo CalcTpo(List<Bar30> bars, decimal row)
        {
            if (bars == null || bars.Count == 0) return null;
            decimal lo = bars.Min(b => b.L), hi = bars.Max(b => b.H);
            long loI = (long)Math.Floor(lo / row), hiI = (long)Math.Floor(hi / row);
            int n = (int)(hiI - loI + 1);
            var cnt = new long[n];
            foreach (var b in bars)
            {
                int a = (int)((long)Math.Floor(b.L / row) - loI);
                int e = (int)((long)Math.Floor(b.H / row) - loI);
                for (int i = a; i <= e; i++) cnt[i]++;
            }
            // POC: nhiều TPO nhất; hoà thì gần giữa range nhất; vẫn hoà thì lấy dòng thấp hơn.
            double mid = (n - 1) / 2.0;
            int poc = 0;
            for (int i = 1; i < n; i++)
                if (cnt[i] > cnt[poc] || (cnt[i] == cnt[poc] && Math.Abs(i - mid) < Math.Abs(poc - mid))) poc = i;
            long total = cnt.Sum();
            long target = (long)Math.Ceiling(total * (ValueAreaPct / 100.0));
            long acc = cnt[poc];
            int l = poc, h = poc;
            while (acc < target && (l > 0 || h < n - 1))
            {
                long up = h < n - 1 ? Sum(cnt, h + 1, Math.Min(n - 1, h + 2)) : -1;
                long dn = l > 0 ? Sum(cnt, Math.Max(0, l - 2), l - 1) : -1;
                if (up >= dn) { int st = Math.Min(2, n - 1 - h); acc += Sum(cnt, h + 1, h + st); h += st; }
                else { int st = Math.Min(2, l); acc += Sum(cnt, l - st, l - 1); l -= st; }
            }
            decimal Px(int i) => (loI + i) * row;
            return new Tpo
            {
                Vah = Px(h) + row, Val = Px(l), Poc = Px(poc) + row / 2,
                High = hi, Low = lo, Close = bars[bars.Count - 1].C, Periods = bars.Count,
                // [[high, low], ...] theo thứ tự thời gian: web dùng để vẽ lại profile TPO
                PeriodsHL = "[" + string.Join(",", bars.Select(b => "[" + D(b.H) + "," + D(b.L) + "]")) + "]"
            };
        }

        private static long Sum(long[] a, int from, int to)
        {
            long s = 0;
            for (int i = from; i <= to; i++) s += a[i];
            return s;
        }

        // RTH 9:30–16:14 (nến M30 bắt đầu 9:30 … 16:00), OVN 18:00–9:29 (nến 18:00 … 9:00).
        // Nến 16:00 chứa cả 16:15–16:29: chấp nhận lệch nhỏ này. Nến 16:30, 17:00 không thuộc phiên nào.
        private static (string, string) SessionOf(DateTime et)
        {
            int m = et.Hour * 60 + et.Minute;
            if (m >= 18 * 60) return (et.Date.AddDays(1).ToString("yyyy-MM-dd", Inv), "OVN");
            if (m < 9 * 60 + 30) return (et.Date.ToString("yyyy-MM-dd", Inv), "OVN");
            if (m < 16 * 60 + 15) return (et.Date.ToString("yyyy-MM-dd", Inv), "RTH");
            return (null, null);
        }

        // ================== Xuất ==================
        private void ToClipboard(string text)
        {
            try
            {
                var psi = new ProcessStartInfo("clip.exe")
                {
                    RedirectStandardInput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using var p = Process.Start(psi);
                if (p == null) return;
                p.StandardInput.Write(text);
                p.StandardInput.Close();
                p.WaitForExit(3000);
            }
            catch (Exception ex)
            {
                Log("Clipboard lỗi: " + ex.Message);
            }
        }

        private async Task PostAsync(string json)
        {
            try
            {
                using var req = new HttpRequestMessage(HttpMethod.Post, ApiUrl)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                };
                if (!string.IsNullOrWhiteSpace(ApiToken))
                    req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", ApiToken.Trim());
                using var res = await Http.SendAsync(req).ConfigureAwait(false);
                string body = await res.Content.ReadAsStringAsync().ConfigureAwait(false);
                Log($"HTTP {(int)res.StatusCode} {body.Substring(0, Math.Min(200, body.Length))}");
            }
            catch (Exception ex)
            {
                Log("HTTP lỗi: " + ex.Message);
            }
        }

        // ================== Tiện ích ==================
        private DateTime ToUtc(DateTime t)
        {
            if (CandleTimeIsUtc) return DateTime.SpecifyKind(t, DateTimeKind.Utc);
            return TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(t, DateTimeKind.Unspecified), TimeZoneInfo.Local);
        }

        private static TimeZoneInfo FindEt()
        {
            foreach (var id in new[] { "Eastern Standard Time", "America/New_York" })
            {
                try { return TimeZoneInfo.FindSystemTimeZoneById(id); } catch { }
            }
            throw new InvalidOperationException("Không tìm thấy múi giờ Eastern (ET).");
        }

        private static string D(decimal v) => v.ToString("0.########", Inv);

        private static string Ascii(string s)
        {
            var sb = new StringBuilder(s.Length);
            foreach (char ch in s) sb.Append(ch < 128 ? ch : '?');
            return sb.ToString();
        }

        private void Log(string line)
        {
            try
            {
                Directory.CreateDirectory(OutputFolder);
                File.AppendAllText(Path.Combine(OutputFolder, "plan_sender.log"),
                    $"{DateTime.Now:yyyy-MM-dd HH:mm:ss}  {line}\r\n");
            }
            catch { }
        }
    }
}
