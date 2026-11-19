# Sinh logo / minh hoạ ZenDojo dạng SVG path (không phụ thuộc font), D49.
# Chạy: python3 scripts/zendojo-brand.py [thư mục ra] (mặc định /tmp/zendojo-brand), rồi chép file cần dùng vào
# apps/web/public/assets/img/zendojo/ (logo-enso.svg → logo.svg, mark-enso.svg → mark.svg, empty-dojo.svg → empty.svg).
# PNG (icon-180/192/512, og.png) xuất bằng sharp / Playwright, xem claude/09-nhat-ky.md 2026-11-19.
import math, os, random, sys
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/zendojo-brand"
os.makedirs(OUT, exist_ok=True)
SAND = "#D4B483"; SAND_HI = "#E8CFA3"; INK = "#ECE7DC"; BG = "#0F1115"

def bez(p0, p1, p2, p3, n=60):
    out = []
    for i in range(n + 1):
        t = i / n; u = 1 - t
        x = u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0]
        y = u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]
        out.append((x, y))
    return out

def stroke(pts, w0, w1, ease=1.0, cap0=True, cap1=True):
    """Nét bút: dày w0 ở đầu, mảnh dần w1 ở cuối; đầu tròn."""
    n = len(pts); L = []; R = []
    for i, (x, y) in enumerate(pts):
        a = pts[max(i - 1, 0)]; b = pts[min(i + 1, n - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]; d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d, dx / d
        t = (i / (n - 1)) ** ease
        w = (w0 + (w1 - w0) * t) / 2
        L.append((x + nx * w, y + ny * w)); R.append((x - nx * w, y - ny * w))
    def cap(c, p, q, fwd, steps=12):
        # nửa vòng tròn từ p sang q, phình về phía fwd (hướng tiếp tuyến ra ngoài nét)
        cx, cy = c; r = math.hypot(p[0] - cx, p[1] - cy)
        a0 = math.atan2(p[1] - cy, p[0] - cx)
        best = None
        for sgn in (1, -1):
            am = a0 + sgn * math.pi / 2
            dot = math.cos(am) * fwd[0] + math.sin(am) * fwd[1]
            if best is None or dot > best[0]: best = (dot, sgn)
        sgn = best[1]
        return [(cx + r * math.cos(a0 + sgn * math.pi * k / steps), cy + r * math.sin(a0 + sgn * math.pi * k / steps)) for k in range(1, steps)]
    def tan(a, b):
        dx, dy = b[0] - a[0], b[1] - a[1]; d = math.hypot(dx, dy) or 1
        return (dx / d, dy / d)
    poly = L[:]
    if cap1: poly += cap(pts[-1], L[-1], R[-1], tan(pts[-2], pts[-1]))
    poly += R[::-1]
    if cap0: poly += cap(pts[0], R[0], L[0], tan(pts[1], pts[0]))
    return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in poly) + " Z"

def enso(cx, cy, r, w0=34, w1=7, start=-62, sweep=318, seed=3):
    rnd = random.Random(seed); pts = []
    n = 140
    for i in range(n + 1):
        t = i / n; a = math.radians(start + sweep * t)
        rr = r * (1 + 0.012 * math.sin(t * 9) + rnd.uniform(-0.002, 0.002))
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return stroke(pts, w0, w1, ease=1.6)

def tsu(cx, cy, s, w=1.0):
    """Chữ ツ bằng 3 nét bút, s = cỡ (≈ chiều cao chữ)."""
    k = s / 200
    P = lambda x, y: (cx + x * k, cy + y * k)
    d1 = stroke(bez(P(-80, -58), P(-74, -46), P(-66, -32), P(-56, -16), 20), 34 * k * w, 22 * k * w)
    d2 = stroke(bez(P(-30, -76), P(-24, -62), P(-16, -48), P(-6, -32), 20), 34 * k * w, 22 * k * w)
    d3 = stroke(bez(P(72, -76), P(70, 4), P(24, 64), P(-62, 92), 60), 40 * k * w, 9 * k * w, ease=1.25)
    return [d1, d2, d3]

def svg(w, h, body, extra=""):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"{extra}>{body}</svg>\n'

def path(d, fill, op=None):
    o = f' fill-opacity="{op}"' if op is not None else ""
    return f'<path d="{d}" fill="{fill}"{o}/>'

# ---------- A · Ensō + ツ ----------
def logo_enso(size=512, bg=True):
    c = size / 2
    body = f'<rect width="{size}" height="{size}" rx="{size*0.22:.0f}" fill="{BG}"/>' if bg else ""
    body += path(enso(c, c, size * 0.37, size * 0.07, size * 0.014), SAND)
    body += "".join(path(d, INK) for d in tsu(c - size * 0.01, c + size * 0.01, size * 0.42))
    return svg(size, size, body)

# ---------- B · [ツ] (khớp tên server Discord) ----------
def bracket(x, y, h, wv, wt, flip=False):
    # ngoặc vuông: thân đứng + 2 gạch ngang
    if not flip:
        return f'M{x},{y} h{wt} v{wv} h{-wt+wv} v{h-2*wv} h{wt-wv} v{wv} h{-wt} Z'
    return f'M{x},{y} h{-wt} v{wv} h{wt-wv} v{h-2*wv} h{-wt+wv} v{wv} h{wt} Z'

def logo_bracket(size=512, bg=True):
    s = size
    body = f'<rect width="{s}" height="{s}" rx="{s*0.22:.0f}" fill="{BG}"/>' if bg else ""
    h = s * 0.56; y = (s - h) / 2; wv = s * 0.06; wt = s * 0.13
    body += path(bracket(s * 0.15, y, h, wv, wt), SAND)
    body += path(bracket(s * 0.85, y, h, wv, wt, flip=True), SAND)
    body += "".join(path(d, INK) for d in tsu(s / 2 + s * 0.005, s / 2 + s * 0.005, s * 0.40, 1.1))
    return svg(s, s, body)

# ---------- C · Núi Market Profile trong ensō ----------
def profile_mountain(cx, base, top, half, rows, fill, op_va=None, va=(0.35, 0.8), poc=None, poc_fill=None, gap=0.28):
    # hàng ngang (như TPO) xếp thành núi: hẹp ở đỉnh, rộng ở chân
    out = []; rh = (base - top) / rows
    for i in range(rows):
        t = (i + 0.5) / rows
        wdt = half * (0.08 + 0.92 * (t ** 0.75))
        y = top + i * rh
        f = fill; op = None
        if op_va is not None and va[0] <= t <= va[1]: op = op_va
        if poc is not None and i == poc: f = poc_fill; op = None
        out.append(f'<rect x="{cx-wdt:.1f}" y="{y:.1f}" width="{2*wdt:.1f}" height="{rh*(1-gap):.1f}" rx="{rh*0.3:.1f}" fill="{f}"' + (f' fill-opacity="{op}"' if op else "") + "/>")
    return "".join(out)

def logo_profile(size=512, bg=True):
    s = size; c = s / 2
    body = f'<rect width="{s}" height="{s}" rx="{s*0.22:.0f}" fill="{BG}"/>' if bg else ""
    body += path(enso(c, c, s * 0.37, s * 0.06, s * 0.012, start=-58), SAND)
    body += profile_mountain(c, s * 0.69, s * 0.31, s * 0.27, 9, INK, op_va=0.75, poc=5, poc_fill=SAND)
    return svg(s, s, body)

open(OUT + "/logo-enso.svg", "w").write(logo_enso())
open(OUT + "/logo-bracket.svg", "w").write(logo_bracket())
open(OUT + "/logo-profile.svg", "w").write(logo_profile())
open(OUT + "/mark-enso.svg", "w").write(logo_enso(bg=False))
open(OUT + "/mark-bracket.svg", "w").write(logo_bracket(bg=False))
print("ok")

# ---------- Nền login: ensō mặt trời + dãy núi ghép từ thanh TPO ----------
def ridge(cx, base, top, half, rows, fill, va_fill=None, va=(0.38, 0.78), poc=None, poc_fill=None, poc_op=0.6, gap=0.34, skew=0.0, seed=1, mask=BG):
    rnd = random.Random(seed); out = []; rh = (base - top) / rows
    # lớp che: hình bóng núi màu nền, để núi gần che núi xa / mặt trời phía sau
    rnd2 = random.Random(seed); L = []; R = []
    for i in range(rows):
        t = (i + 0.5) / rows
        wdt = half * (0.05 + 0.95 * (t ** 0.8)) * (1 + rnd2.uniform(-0.05, 0.05))
        y = top + i * rh
        L.append((cx - wdt, y)); L.append((cx - wdt, y + rh)); R.append((cx + wdt, y)); R.append((cx + wdt, y + rh))
    pts = L + R[::-1]
    out.append('<path d="M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + f' Z" fill="{mask}"/>')
    for i in range(rows):
        t = (i + 0.5) / rows
        wdt = half * (0.05 + 0.95 * (t ** 0.8)) * (1 + rnd.uniform(-0.05, 0.05))
        off = skew * (1 - t) * half
        y = top + i * rh
        f = fill; extra = ""
        if va_fill and va[0] <= t <= va[1]: f = va_fill
        if poc is not None and i == poc: f = poc_fill; extra = f' fill-opacity="{poc_op}"'
        out.append(f'<rect x="{cx-wdt+off:.1f}" y="{y:.1f}" width="{2*wdt:.1f}" height="{rh*(1-gap):.1f}" rx="{rh*(1-gap)/2:.1f}" fill="{f}"{extra}/>')
    return "".join(out)

def login_bg(W=1600, H=1000):
    b = f'<rect width="{W}" height="{H}" fill="{BG}"/>'
    # mặt trời ensō
    b += path(enso(1130, 330, 230, 26, 5, start=-70, sweep=322, seed=7), SAND, 0.16)
    # dãy xa
    b += ridge(330, 1000, 600, 420, 34, "#14171D", seed=2)
    b += ridge(1500, 1000, 640, 380, 30, "#14171D", seed=3)
    # núi chính (lệch phải, đỉnh dưới mặt trời)
    b += ridge(1130, 1000, 470, 560, 46, "#191D25", va_fill="#1D222B", poc=21, poc_fill=SAND, poc_op=0.42, seed=4)
    # đồi gần
    b += ridge(520, 1000, 800, 520, 16, "#1E232C", seed=5, gap=0.4)
    b += ridge(1560, 1000, 840, 300, 13, "#1E232C", seed=6, gap=0.4)
    return svg(W, H, b, ' preserveAspectRatio="xMidYMid slice"')

# ---------- Minh hoạ trạng thái trống (ngày nghỉ / chưa có plan) ----------
def empty_art(W=360, H=150, panel="#161A20"):
    b = path(enso(232, 50, 36, 8, 2, start=-70, sweep=320, seed=9), SAND, 0.6)
    b += ridge(96, 150, 66, 110, 11, "#22272F", seed=11, gap=0.38, mask=panel)
    b += ridge(232, 150, 70, 130, 10, "#2A303A", va_fill="#323843", poc=5, poc_fill=SAND, poc_op=0.55, seed=12, gap=0.38, mask=panel)
    b += ridge(330, 150, 108, 64, 5, "#22272F", seed=13, gap=0.38, mask=panel)
    return svg(W, H, b)

open(OUT + "/login-bg.svg", "w").write(login_bg())
open(OUT + "/empty-dojo.svg", "w").write(empty_art())
print("bg ok")

def og_bg(W=1200, H=630):
    b = f'<rect width="{W}" height="{H}" fill="{BG}"/>'
    b += path(enso(905, 205, 150, 18, 4, start=-70, sweep=322, seed=7), SAND, 0.16)
    b += ridge(160, 630, 420, 300, 22, "#14171D", seed=2)
    b += ridge(1150, 630, 400, 260, 24, "#14171D", seed=3)
    b += ridge(905, 630, 290, 380, 34, "#191D25", va_fill="#1D222B", poc=15, poc_fill=SAND, poc_op=0.42, seed=4)
    b += ridge(380, 630, 500, 360, 12, "#1E232C", seed=5, gap=0.4)
    return svg(W, H, b)
open(OUT + "/og-bg.svg", "w").write(og_bg())
