# ZenDojo (D49): ensō vẽ bằng mô phỏng sợi lông bút khô (kasure / phi bạch) + lớp glitch, chữ ツ bút lông.
# Chỉ dùng path SVG, không dùng font hay filter. Dùng bởi build.py.
import math, random

def noise1(seed):
    r = random.Random(seed); ph = [r.uniform(0, 6.283) for _ in range(4)]; fr = [1.7, 3.9, 7.3, 13.1]; am = [1, .5, .25, .12]
    return lambda t: sum(a * math.sin(f * t * 6.283 + p) for a, f, p in zip(am, fr, ph)) / 1.87

def taper(ws, a=7, b=12):
    n = len(ws)
    return [w * max(0.12, min(1, (i + 1) / a, (n - i) / b)) for i, w in enumerate(ws)]

def poly_stroke(pts, ws):
    n = len(pts); L = []; R = []
    for i in range(n):
        a = pts[max(i - 1, 0)]; b = pts[min(i + 1, n - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]; d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d, dx / d; w = ws[i] / 2
        L.append((pts[i][0] + nx * w, pts[i][1] + ny * w)); R.append((pts[i][0] - nx * w, pts[i][1] - ny * w))
    P = L + R[::-1]
    return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in P) + "Z"

def enso_ink(cx, cy, R, W, seed=7, start=118, sweep=328, clumps=15, per=5, n=300, splatter=True, hairs=True, dryness=1.0, geo=False):
    """Ensō bút lông khô: sợi gom thành búi, búi khô dần tạo khe (phi bạch). Góc SVG: 0 = phải, kim đồng hồ dương."""
    rnd = random.Random(seed)
    rad_n = noise1(seed + 1); w_n = noise1(seed + 2)
    def center(t):
        a = math.radians(start + sweep * t)
        r = R * (1 + 0.02 * rad_n(t) - 0.045 * t)
        return cx + r * math.cos(a), cy + r * math.sin(a), a
    def width(t):
        press = 0.82 + 0.18 * min(1, max(0, t) / 0.1)
        tail = 1 - 0.72 * max(0, (t - 0.3) / 0.7) ** 1.2
        return W * press * tail * (1 + 0.09 * w_n(t))
    out = []
    # phân bố búi trên đầu bút: búi giữa rộng, mép hẹp
    cuts = sorted(rnd.uniform(-0.5, 0.5) for _ in range(clumps - 1))
    edges = [-0.5] + cuts + [0.5]
    for c in range(clumps):
        lo, hi = edges[c], edges[c + 1]; mid = (lo + hi) / 2; cw = hi - lo
        edge = abs(mid) * 2
        cdry = 1.0 - 0.42 * edge ** 1.4 + rnd.uniform(-0.12, 0.02)      # búi mép khô sớm
        gc = noise1(seed * 300 + c)
        for b in range(per):
            gb = noise1(seed * 500 + c * 10 + b)
            u = lo + cw * (b + 0.5) / per
            dry = cdry + rnd.uniform(-0.05, 0.01)
            t_in = -rnd.uniform(0, 0.025)                                  # đầu nét lởm chởm
            bw_k = rnd.uniform(1.1, 1.9)
            jit = noise1(seed * 1000 + c * 10 + b); hf = random.Random(seed * 77 + c * 10 + b)
            seg = []; segw = []
            for i in range(-8, n + 1):
                t = i / n
                if t < t_in: continue
                if t > dry: break
                thr = 1.0 - dryness * (1.35 * max(0, t) ** 1.3 + 0.45 * edge ** 2)
                gap = 0.55 * gc(t * 1.3) + 0.6 * gb(t * 1.1) > thr
                x, y, a = center(max(t, -0.03))
                if t < 0:
                    tx, ty = -math.sin(a), math.cos(a)
                    x += tx * t * R * 2; y += ty * t * R * 2
                nx, ny = math.cos(a), math.sin(a)
                off = u * width(t) + jit(t) * W * 0.02 + hf.uniform(-1, 1) * W * 0.006 * (0.4 + edge)
                if gap:
                    if len(seg) > 3: out.append(poly_stroke(seg, taper(segw)))
                    seg = []; segw = []; continue
                fade = 1 - max(0, (t - dry + 0.08) / 0.08)
                seg.append((x + nx * off, y + ny * off)); segw.append(W * cw / per * bw_k * max(0.3, fade))
            if len(seg) > 3: out.append(poly_stroke(seg, taper(segw, 7, 26)))
    x0, y0, a0 = center(0.0); tx, ty = -math.sin(a0), math.cos(a0)
    if hairs:
        for h in range(2):
            t0 = rnd.uniform(0.12, 0.3); t1 = t0 + rnd.uniform(0.2, 0.3); side = (-1, 1)[h % 2]
            gap0 = W * rnd.uniform(0.05, 0.1); pts = []; ws = []
            for i in range(80):
                t = t0 + (t1 - t0) * i / 79
                x, y, a = center(t); off = side * (width(t) * 0.5 + gap0 * (1 + 0.5 * math.sin(math.pi * i / 79)))
                pts.append((x + math.cos(a) * off, y + math.sin(a) * off)); ws.append(0.6 + W * 0.03 * math.sin(math.pi * i / 79))
            out.append(poly_stroke(pts, ws))
    if splatter:
        for s in range(3):
            d = W * rnd.uniform(0.5, 1.2); lat = W * rnd.uniform(-0.5, 0.5); r = W * rnd.uniform(0.012, 0.04)
            px = x0 - tx * d + math.cos(a0) * lat; py = y0 - ty * d + math.sin(a0) * lat
            out.append(f"M{px - r:.1f},{py:.1f} a{r:.1f},{r:.1f} 0 1,0 {2 * r:.1f},0 a{r:.1f},{r:.1f} 0 1,0 {-2 * r:.1f},0Z")
    return (out, center, width) if geo else out

def g(ds, fill, op=None):
    o = f' fill-opacity="{op}"' if op else ""
    return f'<g fill="{fill}"{o}>' + "".join(f'<path d="{d}"/>' for d in ds) + "</g>"

def bez(p0, p1, p2, p3, n=60):
    out = []
    for i in range(n + 1):
        t = i / n; u = 1 - t
        out.append((u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0], u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]))
    return out

def brush_curve(pts, W, seed=1, clumps=7, per=4, dryness=0.8, w_end=0.3, press_len=0.12):
    """Nét bút lông khô dọc một đường bất kỳ (danh sách điểm dày)."""
    rnd = random.Random(seed); n = len(pts) - 1
    def at(t):
        i = min(n - 1, int(t * n)); f = t * n - i
        x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f; y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f
        dx, dy = pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]; d = math.hypot(dx, dy) or 1
        return x, y, -dy / d, dx / d
    def width(t):
        press = 0.3 + 0.7 * min(1, t / press_len) ** 0.6       # vào bút nhọn
        return W * press * (1 - (1 - w_end) * max(0, (t - 0.25) / 0.75) ** 1.2)
    out = []; cuts = sorted(rnd.uniform(-0.5, 0.5) for _ in range(clumps - 1)); edges = [-0.5] + cuts + [0.5]
    N = 120
    for c in range(clumps):
        lo, hi = edges[c], edges[c + 1]; cw = hi - lo; edge = abs((lo + hi) / 2) * 2
        cdry = 1.0 - 0.35 * edge ** 1.4 + rnd.uniform(-0.08, 0.02); gc = noise1(seed * 300 + c)
        for b in range(per):
            u = lo + cw * (b + 0.5) / per; dry = cdry + rnd.uniform(-0.05, 0.01); gb = noise1(seed * 500 + c * 10 + b)
            jit = noise1(seed * 1000 + c * 10 + b); bw_k = rnd.uniform(1.1, 1.9); seg = []; segw = []
            t_in = rnd.uniform(0, 0.06) * (0.4 + edge)
            for i in range(N + 1):
                t = i / N
                if t < t_in: continue
                if t > dry: break
                thr = 1.0 - dryness * (1.3 * t ** 1.4 + 0.45 * edge ** 2)
                x, y, nx, ny = at(t); off = u * width(t) + jit(t) * W * 0.03
                if 0.55 * gc(t * 1.3) + 0.6 * gb(t * 1.1) > thr:
                    if len(seg) > 3: out.append(poly_stroke(seg, taper(segw, 4, 8)))
                    seg = []; segw = []; continue
                seg.append((x + nx * off, y + ny * off)); segw.append(W * cw / per * bw_k)
            if len(seg) > 3: out.append(poly_stroke(seg, taper(segw, 4, 14)))
    return out

def tsu_brush(cx, cy, s, seed=5):
    k = s / 200; P = lambda x, y: (cx + x * k, cy + y * k)
    d = []
    d += brush_curve(bez(P(-84, -62), P(-78, -48), P(-70, -32), P(-58, -12), 80), 38 * k, seed, clumps=5, per=3, dryness=0.35, w_end=0.45, press_len=0.45)
    d += brush_curve(bez(P(-34, -80), P(-28, -64), P(-20, -46), P(-8, -28), 80), 38 * k, seed + 1, clumps=5, per=3, dryness=0.35, w_end=0.45, press_len=0.45)
    d += brush_curve(bez(P(76, -80), P(72, 6), P(26, 66), P(-64, 94), 160), 44 * k, seed + 2, clumps=7, per=4, dryness=0.8, w_end=0.16, press_len=0.14)
    return d

_uid = [0]
def enso_tech(cx, cy, R, W, color, seed=7, op=None, bands=3, cuts=7, pixels=True, splatter=False):
    """Mực + công nghệ: ensō bút lông, vài lát dịch ngang (glitch), khe scanline, đuôi tan thành pixel vuông."""
    _uid[0] += 1; uid = f"z{_uid[0]}"
    rnd = random.Random(seed * 13 + 1)
    ds, center, width = enso_ink(cx, cy, R, W, seed=seed, splatter=splatter, geo=True)
    o = f' opacity="{op}"' if op else ""      # làm mờ cả nhóm, không cộng dồn chỗ sợi chồng nhau
    x0, y0, x1, y1 = cx - R - W, cy - R - W, cx + R + W, cy + R + W
    # lát glitch: dải ngang mảnh, dịch trái / phải
    B = []
    for k in range(bands):
        h = W * rnd.uniform(0.10, 0.28); y = rnd.uniform(cy - R * 0.85, cy + R * 0.7); dx = W * rnd.choice([-1, 1]) * rnd.uniform(0.18, 0.5)
        B.append((y, h, dx))
    # khe scanline cắt vào thân nét
    C = []
    for k in range(cuts):
        t = rnd.uniform(0.12, 0.8); x, y, a = center(t); w = width(t)
        cw = w * rnd.uniform(0.5, 1.3); ch = max(1.2, W * rnd.uniform(0.025, 0.07))
        C.append((x - cw / 2 + rnd.uniform(-w, w) * 0.2, y + rnd.uniform(-w, w) * 0.3, cw, ch))
    d = f'<defs><g id="{uid}e">' + "".join(f'<path d="{p}"/>' for p in ds) + "</g>"
    d += f'<mask id="{uid}m" maskUnits="userSpaceOnUse" x="{x0-W}" y="{y0-W}" width="{x1-x0+2*W}" height="{y1-y0+2*W}"><rect x="{x0-W}" y="{y0-W}" width="{x1-x0+2*W}" height="{y1-y0+2*W}" fill="#fff"/>'
    d += "".join(f'<rect x="{x0-W}" y="{y:.1f}" width="{x1-x0+2*W}" height="{h:.1f}" fill="#000"/>' for y, h, dx in B)
    d += "".join(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="#000"/>' for x, y, w, h in C)
    d += "</mask>"
    for k, (y, h, dx) in enumerate(B):
        d += f'<clipPath id="{uid}c{k}"><rect x="{x0-W}" y="{y:.1f}" width="{x1-x0+2*W}" height="{h:.1f}"/></clipPath>'
    d += "</defs>"
    body = f'<g fill="{color}"{o}><use href="#{uid}e" mask="url(#{uid}m)"/>'
    for k, (y, h, dx) in enumerate(B):
        body += f'<g clip-path="url(#{uid}c{k})"><use href="#{uid}e" transform="translate({dx:.1f},0)"/></g>'
    if pixels:
        # đuôi nét tan thành pixel vuông bám lưới, nhỏ dần và thưa dần ra ngoài
        px = max(2.0, W * 0.075); prng = random.Random(seed * 31 + 7)
        cells = set()
        for i in range(70):
            t = prng.uniform(0.86, 1.08); x, y, a = center(min(t, 1.0))
            if t > 1.0:
                tx, ty = -math.sin(a), math.cos(a); x += tx * (t - 1) * R * 3; y += ty * (t - 1) * R * 3
            spread = width(min(t, 1.0)) * (0.6 + 2.2 * max(0, t - 0.86) / 0.22)
            x += math.cos(a) * prng.uniform(-0.5, 0.5) * spread; y += math.sin(a) * prng.uniform(-0.5, 0.5) * spread
            gx, gy = round(x / px), round(y / px)
            if (gx, gy) in cells or prng.random() < 0.25: continue
            cells.add((gx, gy))
            sz = px * prng.choice([1, 1, 1, 0.6, 0.6, 0.4])
            body += f'<rect x="{gx*px:.1f}" y="{gy*px:.1f}" width="{sz:.1f}" height="{sz:.1f}"/>'
    body += "</g>"
    return d + body
