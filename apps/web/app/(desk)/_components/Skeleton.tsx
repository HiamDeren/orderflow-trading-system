// Khung chờ (skeleton) cho loading.tsx và <Suspense>: giữ đúng bố cục card để trang không nhảy khi dữ liệu tới.
// Server component, không JS phía client. Hiệu ứng nhấp nháy tắt khi người dùng bật "giảm chuyển động".

export function SkelLine({ w = "100%", h = 12 }: { w?: number | string; h?: number }) {
  return <span className="skel" style={{ width: w, height: h }} />;
}

export function CardSkeleton({ label, lines = 4, tall = false }: { label?: string; lines?: number; tall?: boolean }) {
  return (
    <section className="card" aria-busy="true" aria-label={label}>
      <div className="row">{label ? <span className="lbl">{label}</span> : <SkelLine w={120} />}</div>
      <div className="stack" style={{ gap: 10, minHeight: tall ? 260 : undefined }}>
        {Array.from({ length: lines }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: dòng giả cố định, không đổi thứ tự
          <SkelLine key={i} w={`${92 - ((i * 17) % 40)}%`} />
        ))}
      </div>
    </section>
  );
}

// Khung chờ cả trang: tiêu đề + lưới 2 cột như phần lớn trang desk.
export function PageSkeleton({ cards = 4, label = "Đang tải…" }: { cards?: number; label?: string }) {
  return (
    <div className="stack" style={{ gap: 20 }} aria-busy="true">
      <span className="sr-only" role="status">
        {label}
      </span>
      <header className="page-head">
        <div>
          <SkelLine w={140} h={11} />
          <SkelLine w={220} h={26} />
        </div>
      </header>
      <div className="dash-grid two">
        {Array.from({ length: cards }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: card giả cố định
          <CardSkeleton key={i} lines={i === 0 ? 6 : 4} tall={i === 0} />
        ))}
      </div>
    </div>
  );
}
