// Linh vật hạt cà phê — minh họa SVG gốc, đơn giản hóa hình học, không liên quan tới IP của bên thứ ba.
// mood: "idle" (mặc định) | "wave" (vẫy tay, dùng lúc thành công/chào mừng) | "sleep" (mắt nhắm, dùng ở empty state)
export default function MascotIllustration({ mood = "idle", size = 96, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden="true">
      {/* Thân hạt cà phê */}
      <ellipse cx="60" cy="66" rx="38" ry="42" fill="#4A2E1F" />
      <ellipse cx="60" cy="66" rx="38" ry="42" fill="url(#mascotShine)" opacity="0.5" />
      <path d="M60 26 C 54 46, 54 86, 60 106" stroke="#2A1810" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* Mắt */}
      {mood === "sleep" ? (
        <>
          <path d="M42 60 Q48 65 54 60" stroke="#FBF6EE" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M66 60 Q72 65 78 60" stroke="#FBF6EE" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="48" cy="60" r="4.5" fill="#FBF6EE" />
          <circle cx="72" cy="60" r="4.5" fill="#FBF6EE" />
        </>
      )}

      {/* Má hồng */}
      <circle cx="40" cy="72" r="5" fill="#B8562F" opacity="0.45" />
      <circle cx="80" cy="72" r="5" fill="#B8562F" opacity="0.45" />

      {/* Miệng cười */}
      <path d="M50 78 Q60 86 70 78" stroke="#FBF6EE" strokeWidth="3.5" strokeLinecap="round" fill="none" />

      {/* Tay vẫy (chỉ hiện khi mood="wave") */}
      {mood === "wave" && (
        <circle cx="94" cy="46" r="7" fill="#4A2E1F" stroke="#FBF6EE" strokeWidth="2" />
      )}

      <defs>
        <radialGradient id="mascotShine" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#7A4E36" />
          <stop offset="100%" stopColor="#4A2E1F" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
