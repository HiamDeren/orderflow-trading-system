# Sinh ảnh gốc (SVG) cho ZenDojo (D49): logo, mark, nền login, nền OG, minh hoạ trạng thái trống.
# Chạy: python3 scripts/zendojo-brand/build.py /tmp/zendojo  →  node scripts/zendojo-brand/raster.mjs /tmp/zendojo
# (raster.mjs xuất PNG / WebP vào apps/web/public/assets/img/zendojo/; og.png chụp bằng Playwright từ og.html).
import math, os, random, sys
sys.path.insert(0, os.path.dirname(__file__))
from ink import enso_ink, enso_tech, tsu_brush, hanko, g

OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/zendojo"
os.makedirs(OUT, exist_ok=True)
BG = "#0F1115"; PANEL = "#161A20"; INK = "#ECE7DC"; SAND = "#D4B483"; RED = "#B8432F"

def svg(w, h, body, extra=""):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"{extra}>{body}</svg>\n'

def ridge(cx, base, top, half, rows, fill, va_fill=None, va=(0.38, 0.78), poc=None, poc_fill=None, poc_op=0.6, gap=0.34, seed=1, mask=BG):
    """Núi ghép từ thanh ngang kiểu Market Profile; lớp che màu nền để núi gần che núi xa."""
    rnd = random.Random(seed); rnd2 = random.Random(seed); out = []; rh = (base - top) / rows; L = []; R = []
    for i in range(rows):
        t = (i + 0.5) / rows; wdt = half * (0.05 + 0.95 * (t ** 0.8)) * (1 + rnd2.uniform(-0.05, 0.05)); y = top + i * rh
        L += [(cx - wdt, y), (cx - wdt, y + rh)]; R += [(cx + wdt, y), (cx + wdt, y + rh)]
    out.append('<path d="M' + " L".join(f"{x:.1f},{y:.1f}" for x, y in L + R[::-1]) + f' Z" fill="{mask}"/>')
    for i in range(rows):
        t = (i + 0.5) / rows; wdt = half * (0.05 + 0.95 * (t ** 0.8)) * (1 + rnd.uniform(-0.05, 0.05)); y = top + i * rh
        f = fill; extra = ""
        if va_fill and va[0] <= t <= va[1]: f = va_fill
        if poc is not None and i == poc: f = poc_fill; extra = f' fill-opacity="{poc_op}"'
        out.append(f'<rect x="{cx-wdt:.1f}" y="{y:.1f}" width="{2*wdt:.1f}" height="{rh*(1-gap):.1f}" rx="{rh*(1-gap)/2:.1f}" fill="{f}"{extra}/>')
    return "".join(out)

ENSO = dict(seed=7)

def logo(s=512):
    """Logo chính: ensō mực + glitch, chữ ツ bút lông màu cát ở giữa."""
    b = f'<rect width="{s}" height="{s}" rx="{s*0.22:.0f}" fill="{BG}"/>'
    b += enso_tech(s * 0.5, s * 0.5, s * 0.344, s * 0.145, INK, **ENSO) + g(tsu_brush(s * 0.49, s * 0.51, s * 0.37, seed=5), SAND)
    return svg(s, s, b)

def logo_hanko(s=512):
    """Phương án phụ: ensō mực + glitch, con dấu son ツ."""
    b = f'<rect width="{s}" height="{s}" rx="{s*0.22:.0f}" fill="{BG}"/>'
    b += enso_tech(s * 0.5, s * 0.5, s * 0.344, s * 0.145, INK, **ENSO)
    b += hanko(s * 0.645, s * 0.62, s * 0.152, red=RED, cut=BG)
    return svg(s, s, b)

def login_bg(W=1920, H=1200):
    b = f'<rect width="{W}" height="{H}" fill="{BG}"/>'
    b += enso_tech(1360, 400, 280, 92, INK, seed=11, op=0.13, bands=4, cuts=9)
    b += ridge(400, H, 720, 500, 34, "#14171D", seed=2)
    b += ridge(1800, H, 770, 460, 30, "#14171D", seed=3)
    b += ridge(1360, H, 565, 670, 46, "#191D25", va_fill="#1D222B", poc=21, poc_fill=SAND, poc_op=0.42, seed=4)
    b += ridge(620, H, 960, 620, 16, "#1E232C", seed=5, gap=0.4)
    b += ridge(1870, H, 1010, 360, 13, "#1E232C", seed=6, gap=0.4)
    b += hanko(1740, 120, 46, red=RED, cut=BG, seed=9).replace('fill="#B8432F"', 'fill="#B8432F" fill-opacity="0.55"')
    return svg(W, H, b, ' preserveAspectRatio="xMidYMid slice"')

def og_bg(W=1200, H=630):
    b = f'<rect width="{W}" height="{H}" fill="{BG}"/>'
    b += enso_tech(905, 210, 160, 54, INK, seed=11, op=0.13, bands=3, cuts=7)
    b += ridge(160, H, 420, 300, 22, "#14171D", seed=2)
    b += ridge(1150, H, 400, 260, 24, "#14171D", seed=3)
    b += ridge(905, H, 290, 380, 34, "#191D25", va_fill="#1D222B", poc=15, poc_fill=SAND, poc_op=0.42, seed=4)
    b += ridge(380, H, 500, 360, 12, "#1E232C", seed=5, gap=0.4)
    return svg(W, H, b)

def empty_art(W=360, H=150):
    b = f'<rect width="{W}" height="{H}" fill="{PANEL}"/>'
    b += enso_tech(232, 52, 38, 13, INK, seed=11, op=0.55, bands=2, cuts=3)
    b += ridge(96, H, 66, 110, 11, "#22272F", seed=11, gap=0.38, mask=PANEL)
    b += ridge(232, H, 72, 130, 10, "#2A303A", va_fill="#323843", poc=5, poc_fill=SAND, poc_op=0.55, seed=12, gap=0.38, mask=PANEL)
    b += ridge(330, H, 108, 64, 5, "#22272F", seed=13, gap=0.38, mask=PANEL)
    return svg(W, H, b)

files = {"logo.svg": logo(), "logo-hanko.svg": logo_hanko(), "login-bg.svg": login_bg(), "og-bg.svg": og_bg(), "empty.svg": empty_art()}
for k, v in files.items():
    open(os.path.join(OUT, k), "w").write(v)
print("ok", OUT, list(files))
