# ZenDojo · brand kit

Võ đường trading của Derenツ. Logo: vòng ensō vẽ bằng nét bút lông khô (mực), thêm lớp "công nghệ" (lát glitch dịch ngang, khe scanline, đuôi nét tan thành pixel), chữ ツ bút lông màu cát ở giữa.

Mọi hình đều vẽ bằng code (path SVG, không dùng font hay ảnh có sẵn). Cần cỡ lớn hơn thì mở file trong `source-svg/` hoặc `01-logo/svg/`: vector nên phóng bao nhiêu cũng nét.

## Thư mục

| Thư mục | Có gì | Dùng cho |
|---|---|---|
| `01-logo/svg` | 3 dạng (vuông bo góc, tròn, không nền), vector | In ấn, thiết kế tiếp, cỡ bất kỳ |
| `01-logo/png` | Như trên, 1024 / 2048 / 4096 px | Ảnh dán nhanh |
| `02-wordmark` | Logo + chữ "ZenDojo", nằm ngang và dọc, nền tối / trong suốt (4×) | Banner, slide, header |
| `03-avatar` | Vuông tràn nền + tròn sẵn, 1024 / 2048 px | Avatar Discord, mạng xã hội |
| `04-icons` | `favicon.ico`, PNG 16 → 1024, `apple-touch-icon-180`, `maskable-512/1024` | Web, app, PWA |
| `05-backgrounds` | Hình nền 5K / 4K / QHD / 16:10, điện thoại, biểu ngữ server + biểu ngữ hồ sơ Discord, ảnh OG | Desktop, điện thoại, Discord, link preview |
| `05-backgrounds/tsu` | Bộ hình nền lấy ㋡ làm hình chính: 5K / 4K / QHD / 16:10, điện thoại, biểu ngữ server + hồ sơ Discord | Desktop, điện thoại, Discord |
| `06-illustrations` | Minh hoạ núi + ensō (trạng thái trống) | Trang trống, 404 |
| `07-theme` | Bảng màu (ảnh), `zendojo-tokens.css`, `zendojo-tokens.json`, `zendojo-atas-colors-ARGB.txt` | Web, thiết kế, ATAS |
| `source-svg` | Toàn bộ SVG gốc (kể cả nền) | Xuất lại cỡ khác |

## Dạng logo

Một biểu tượng duy nhất: ensō mực + ツ bút lông màu cát. Dạng: `square` (vuông bo góc, icon app), `round` (hình tròn, góc trong suốt), `none` (không nền, đặt lên nền tối). Avatar dùng dạng tràn nền vuông để Discord tự cắt tròn.

Logo thiết kế cho **nền tối**. Mực màu `#ECE7DC` nên đặt lên nền sáng sẽ không thấy rõ.

## Dùng cho Discord

| Chỗ | File |
|---|---|
| Avatar hồ sơ | `03-avatar/zendojo-avatar-tsu-1024.png` (Discord tự cắt tròn) |
| Biểu ngữ hồ sơ (Nitro) | `05-backgrounds/zendojo-discord-profile-banner-2040x720.png` |
| Icon server | `03-avatar/zendojo-avatar-tsu-1024.png` |
| Biểu ngữ server (Boost cấp 2) | `05-backgrounds/zendojo-discord-banner-1920x1080.png` |
| Nền link mời (Boost cấp 1) | `05-backgrounds/zendojo-discord-banner-1920x1080.png` |
| Icon app (Developer Portal) | `04-icons/icon-1024.png` |
| Tên server | `㋡ ZenDojo` |

## Màu chính

| Tên | HEX | ATAS (ARGB) |
|---|---|---|
| Nền | `#0F1115` | `#FF0F1115` |
| Thẻ | `#161A20` | `#FF161A20` |
| Chữ | `#E6E8EB` | `#FFE6E8EB` |
| Nhấn cát | `#D4B483` | `#FFD4B483` |
| Long | `#8CC2A4` | `#FF8CC2A4` |
| Short | `#E0947C` | `#FFE0947C` |
| Mực ensō | `#ECE7DC` | `#FFECE7DC` |

Đủ bảng: `07-theme/`. Font: Inter (giao diện), JetBrains Mono (số, giá, giờ).

## Sinh lại

Trong repo `orderflow-trading-system`:

```bash
python3 scripts/zendojo-brand/build.py /tmp/zendojo
cd apps/web && node ../../scripts/zendojo-brand/kit.mjs /tmp/zendojo /tmp/ZenDojo-brand-kit && cd ../..
python3 scripts/zendojo-brand/kit.py /tmp/zendojo /tmp/ZenDojo-brand-kit
```
