# Brand kit ZenDojo (D49), phần 2: logo kèm chữ, bảng màu + token, ảnh OG @2x, favicon.ico, README, zip.
# Chạy sau kit.mjs:  python3 scripts/zendojo-brand/kit.py /tmp/zendojo /tmp/ZenDojo-brand-kit
# Cần Playwright + Chrome và font Inter / JetBrains Mono / Noto Sans CJK (cho chữ ツ).
import json, os, shutil, sys
from PIL import Image
from playwright.sync_api import sync_playwright

SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/zendojo"
KIT = sys.argv[2] if len(sys.argv) > 2 else "/tmp/ZenDojo-brand-kit"
HERE = os.path.dirname(os.path.abspath(__file__))

# Màu theme (khớp :root trong apps/web/app/desk.css) + màu thương hiệu
PALETTE = [
    ("Nền", [("bg", "#0F1115", "Nền trang"), ("side", "#12151A", "Sidebar, ô nhập"), ("panel", "#161A20", "Thẻ"), ("panel-2", "#1A1E25", "Thẻ lồng"), ("panel-3", "#20252E", "Hover, ô chọn")]),
    ("Viền", [("line", "#252B34", "Viền thẻ"), ("line-2", "#1F242C", "Đường kẻ mảnh"), ("line-3", "#2E3540", "Viền đậm")]),
    ("Chữ", [("text", "#E6E8EB", "Chữ chính"), ("text-2", "#C9CED5", "Chữ phụ"), ("muted", "#AEB6C0", "Mô tả"), ("dim", "#8A94A1", "Nhãn"), ("ghost", "#4A525E", "Mờ")]),
    ("Nhấn (cát)", [("accent", "#D4B483", "Nút chính, ツ trong logo"), ("accent-hi", "#E8CFA3", "Hover"), ("accent-bg", "#3A3326", "Nền chọn"), ("accent-soft", "#1E1C17", "Nền nhấn nhẹ"), ("accent-ring", "#5A4C33", "Viền chọn")]),
    ("Long / Short", [("long", "#8CC2A4", "Long, lãi"), ("long-bg", "#17231D", "Nền lãi"), ("short", "#E0947C", "Short, lỗ"), ("short-bg", "#281D1A", "Nền lỗ"), ("short-ring", "#4A2F28", "Viền lỗ")]),
    ("Tin kinh tế", [("imp-high", "#E5534B", "Tác động cao"), ("imp-medium", "#F0883E", "Trung bình"), ("imp-low", "#E3C14D", "Thấp"), ("imp-holiday", "#8A94A1", "Nghỉ lễ")]),
    ("Thương hiệu", [("ink", "#ECE7DC", "Mực ensō"), ("seal", "#B8432F", "Con dấu son"), ("ridge", "#191D25", "Núi Market Profile"), ("ridge-va", "#1D222B", "Vùng giá trị trên núi")]),
]
argb = lambda h: "#FF" + h[1:].upper()


def write_tokens(d):
    os.makedirs(d, exist_ok=True)
    css = ["/* ZenDojo theme · dán vào :root */", ":root {"]
    js = {}
    txt = ["ZenDojo · màu cho ATAS (ARGB #AARRGGBB, FF = đặc 100%)", ""]
    for grp, items in PALETTE:
        css.append(f"  /* {grp} */"); txt.append(f"[{grp}]")
        for name, hx, role in items:
            css.append(f"  --{name}: {hx.lower()};  /* {role} */")
            js[name] = {"hex": hx, "argb": argb(hx), "group": grp, "role": role}
            txt.append(f"  {name:<12} {argb(hx)}   {role}")
        txt.append("")
    css += ["  --sans: Inter, system-ui, -apple-system, \"Segoe UI\", sans-serif;", "  --mono: \"JetBrains Mono\", ui-monospace, monospace;", "}"]
    open(os.path.join(d, "zendojo-tokens.css"), "w").write("\n".join(css) + "\n")
    open(os.path.join(d, "zendojo-tokens.json"), "w").write(json.dumps(js, ensure_ascii=False, indent=2) + "\n")
    open(os.path.join(d, "zendojo-atas-colors-ARGB.txt"), "w").write("\n".join(txt))


def html_page(body, extra_css=""):
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
html,body{{margin:0}} body{{font-family:Inter,"Noto Sans CJK JP",sans-serif;color:#ECE7DC}}
{extra_css}</style></head><body>{body}</body></html>"""


def shot(pg, html, path, w, h, scale, transparent=False):
    f = os.path.join(SRC, "_tmp.html"); open(f, "w").write(html)
    pg.set_viewport_size({"width": w, "height": h}); pg.goto("file://" + f); pg.wait_for_timeout(500)
    pg.screenshot(path=path, omit_background=transparent)


def main():
    write_tokens(os.path.join(KIT, "07-theme"))
    wm = os.path.join(KIT, "02-wordmark"); os.makedirs(wm, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox", "--allow-file-access-from-files"])
        pg = b.new_page(device_scale_factor=4)
        # logo nằm ngang + logo dọc, nền tối và trong suốt
        for kind in ("tsu", "bracket"):
            logo = f"logo-{kind}-none.svg"
            row = f"""<div class="w"><img src="{logo}"><div><div class="n">ZenDojo</div><div class="s">Derenツ · Personal trading dashboard</div></div></div>"""
            css = """.w{display:flex;align-items:center;gap:34px;padding:40px 56px 40px 30px}.w img{width:200px;height:200px}
.n{font-size:112px;font-weight:700;letter-spacing:-.03em;line-height:1}.s{font-size:30px;color:#B8B2A6;margin-top:14px}"""
            for bg, tr in (("dark", False), ("transparent", True)):
                shot(pg, html_page(row, css + ("body{background:#0F1115}" if not tr else "")), os.path.join(wm, f"zendojo-wordmark-{kind}-horizontal-{bg}.png"), 1040, 280, 4, tr)
            stack = f"""<div class="v"><img src="{logo}"><div class="n">ZenDojo</div><div class="s">Derenツ</div></div>"""
            css2 = """.v{display:flex;flex-direction:column;align-items:center;gap:14px;padding:36px}.v img{width:300px;height:300px}
.n{font-size:96px;font-weight:700;letter-spacing:-.03em;line-height:1}.s{font-size:34px;color:#B8B2A6}"""
            for bg, tr in (("dark", False), ("transparent", True)):
                shot(pg, html_page(stack, css2 + ("body{background:#0F1115}" if not tr else "")), os.path.join(wm, f"zendojo-wordmark-{kind}-stacked-{bg}.png"), 560, 560, 4, tr)
        # ảnh OG @2x
        bgd = os.path.join(KIT, "05-backgrounds")
        og = open(os.path.join(HERE, "og.html")).read().replace("og-bg.png", "og-bg@2x.png").replace('src="logo.svg"', 'src="logo-tsu-square.svg"')
        pg2 = b.new_page(device_scale_factor=2)
        shot(pg2, og, os.path.join(bgd, "zendojo-og-2400x1260.png"), 1200, 630, 2)
        # bảng màu
        cards = ""
        for grp, items in PALETTE:
            cards += f'<h3>{grp}</h3><div class="g">'
            for name, hx, role in items:
                cards += f'<div class="c"><div class="sw" style="background:{hx}"></div><div class="m"><b>--{name}</b><span>{role}</span><code>HEX {hx}</code><code>ATAS {argb(hx)}</code></div></div>'
            cards += "</div>"
        css3 = """body{background:#0F1115;width:1400px;padding:48px;box-sizing:border-box}h1{margin:0 0 6px;font-size:40px}p.l{color:#AEB6C0;margin:0 0 20px;font-size:17px}
h3{font-size:15px;color:#8A94A1;letter-spacing:.08em;text-transform:uppercase;margin:26px 0 10px}.g{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
.c{background:#161A20;border:1px solid #252B34;border-radius:12px;overflow:hidden}.sw{height:84px;border-bottom:1px solid #252B34}
.m{display:flex;flex-direction:column;gap:4px;padding:12px;font-size:13px}.m span{color:#AEB6C0}.m code{font-family:"JetBrains Mono",monospace;font-size:12px;color:#C9CED5}
.f{margin-top:30px;display:flex;gap:40px;color:#C9CED5;font-size:18px}.f b{font-size:34px;display:block;color:#E6E8EB}.f .mono b{font-family:"JetBrains Mono",monospace}"""
        body = f"""<h1>ZenDojo · theme</h1><p class="l">Graphite trầm + một màu nhấn cát. Long xanh xám, Short cam đất. Mực ensō + con dấu son.</p>{cards}
<div class="f"><div><b>Inter</b>Chữ giao diện · 400 / 500 / 600 / 700</div><div class="mono"><b>JetBrains Mono</b>Số, giá, giờ</div></div>"""
        pg3 = b.new_page(device_scale_factor=2); f = os.path.join(SRC, "_tmp.html"); open(f, "w").write(html_page(body, css3))
        pg3.set_viewport_size({"width": 1400, "height": 800}); pg3.goto("file://" + f); pg3.wait_for_timeout(500)
        pg3.screenshot(path=os.path.join(KIT, "07-theme", "zendojo-palette.png"), full_page=True)
        b.close()
    # favicon.ico nhiều cỡ
    ic = os.path.join(KIT, "04-icons")
    Image.open(os.path.join(ic, "icon-256.png")).save(os.path.join(ic, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    shutil.copy(os.path.join(HERE, "README-kit.md"), os.path.join(KIT, "README.md"))
    os.remove(os.path.join(SRC, "_tmp.html"))
    out = shutil.make_archive(KIT, "zip", os.path.dirname(KIT), os.path.basename(KIT))
    print("zip →", out, round(os.path.getsize(out) / 1e6, 1), "MB")


main()
