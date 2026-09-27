// Khung skeleton dùng thay cho chữ "Đang tải..." trơn — cảm giác có chiều sâu hơn khi chờ dữ liệu.
export function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse bg-espresso-900/8 rounded-xl ${className}`} />;
}

export function SkeletonList({ rows = 3 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock key={i} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
  );
}
