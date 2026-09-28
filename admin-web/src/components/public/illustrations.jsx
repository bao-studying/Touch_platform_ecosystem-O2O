// Minh hoạ SVG gốc (hình học đơn giản, cùng bảng màu thương hiệu) cho các mô hình kinh doanh & giá trị cốt lõi.
// Chưa có ảnh chụp thật trong dự án — khi có ảnh, có thể thay bằng <img> / <ParallaxImage> mà không đổi bố cục.

const wave = (cx, cy, r, o = 1) => (
  <path d={`M${cx - r} ${cy}a${r} ${r} 0 0 1 ${r * 2} 0`} fill="none" stroke="#D4A24C" strokeWidth="3" strokeLinecap="round" opacity={o} />
);

export function CafeArt() {
  return (
    <svg viewBox="0 0 240 190" className="h-full w-full" aria-hidden="true">
      <ellipse cx="120" cy="158" rx="96" ry="14" fill="#000" opacity=".22" />
      <ellipse cx="120" cy="146" rx="78" ry="13" fill="#FBF6EE" />
      <path d="M64 78h112v30a56 56 0 0 1-112 0z" fill="#F5EBDA" />
      <path d="M176 90h10a15 15 0 0 1 0 30h-16" fill="none" stroke="#F5EBDA" strokeWidth="8" strokeLinecap="round" />
      <path d="M76 86h88" stroke="#7A4E36" strokeWidth="9" strokeLinecap="round" />
      <g fill="none" stroke="#D4A24C" strokeWidth="3.5" strokeLinecap="round">
        <path d="M98 58c-9-10 9-15 0-27" />
        <path d="M120 56c-9-10 9-15 0-27" opacity=".7" />
        <path d="M142 58c-9-10 9-15 0-27" opacity=".45" />
      </g>
      <circle cx="120" cy="122" r="10" fill="#D4A24C" />
      {wave(120, 122, 5)}
    </svg>
  );
}

export function DinnerArt() {
  return (
    <svg viewBox="0 0 240 190" className="h-full w-full" aria-hidden="true">
      <ellipse cx="120" cy="164" rx="90" ry="10" fill="#3B2318" opacity=".14" />
      <rect x="78" y="34" width="84" height="122" rx="14" fill="#4A2E1F" />
      <rect x="90" y="48" width="60" height="60" rx="6" fill="#FBF6EE" />
      {[[96, 54], [96, 68], [110, 54], [124, 68], [134, 54], [134, 96], [96, 96], [116, 84]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="10" height="10" fill="#4A2E1F" />
      ))}
      <rect x="90" y="120" width="60" height="7" rx="3.5" fill="#D4A24C" />
      <rect x="90" y="134" width="40" height="7" rx="3.5" fill="#7A4E36" />
      <path d="M40 60v34m-7-34v14a7 7 0 0 0 14 0V60M40 94v52" stroke="#B8562F" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M196 60c-9 8-9 28 0 34v52" stroke="#B8562F" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function SpaArt() {
  return (
    <svg viewBox="0 0 240 190" className="h-full w-full" aria-hidden="true">
      <ellipse cx="120" cy="162" rx="92" ry="11" fill="#3B2318" opacity=".14" />
      <ellipse cx="120" cy="146" rx="62" ry="17" fill="#8FA382" />
      <ellipse cx="120" cy="118" rx="46" ry="14" fill="#71886A" />
      <ellipse cx="120" cy="94" rx="30" ry="11" fill="#5E7458" />
      <circle cx="120" cy="94" r="5" fill="#D4A24C" />
      <path d="M170 70c28-6 44 10 46 34-26 4-44-8-46-34z" fill="#71886A" />
      <path d="M172 72c14 8 26 20 40 30" stroke="#FBF6EE" strokeWidth="2" opacity=".6" fill="none" />
      <path d="M70 80c-24-4-38 10-40 30 22 4 38-6 40-30z" fill="#8FA382" />
    </svg>
  );
}

export function RetailArt() {
  return (
    <svg viewBox="0 0 240 190" className="h-full w-full" aria-hidden="true">
      <ellipse cx="120" cy="164" rx="92" ry="10" fill="#3B2318" opacity=".14" />
      <path d="M70 70h100l10 88H60z" fill="#4A2E1F" />
      <path d="M94 70v-8a26 26 0 0 1 52 0v8" fill="none" stroke="#4A2E1F" strokeWidth="7" strokeLinecap="round" />
      <rect x="98" y="96" width="44" height="44" rx="10" fill="#D4A24C" />
      {wave(120, 122, 7)}
      {wave(120, 122, 13, 0.6)}
      <circle cx="120" cy="126" r="3.5" fill="#4A2E1F" />
      <circle cx="196" cy="60" r="9" fill="#B8562F" />
      <circle cx="46" cy="110" r="6" fill="#8FA382" />
    </svg>
  );
}

// Giá trị cốt lõi (About) — 3 hình khối lớn, không cần chữ.
export function MissionArt() {
  return (
    <svg viewBox="0 0 320 260" className="h-full w-full" aria-hidden="true">
      <circle cx="160" cy="130" r="112" fill="#EBDCC0" opacity=".6" />
      <circle cx="160" cy="130" r="80" fill="none" stroke="#B8562F" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
      <circle cx="160" cy="130" r="46" fill="#4A2E1F" />
      <circle cx="160" cy="130" r="16" fill="#D4A24C" />
      <path d="M160 130L236 62" stroke="#4A2E1F" strokeWidth="3" strokeLinecap="round" />
      <path d="M226 62h14v14" fill="none" stroke="#4A2E1F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ApproachArt() {
  return (
    <svg viewBox="0 0 320 260" className="h-full w-full" aria-hidden="true">
      <rect x="40" y="70" width="110" height="130" rx="20" fill="#D4A24C" opacity=".95" />
      <circle cx="95" cy="118" r="16" fill="#3B2318" />
      {wave(95, 118, 26, 0.9)}
      {wave(95, 118, 38, 0.55)}
      <path d="M160 135h34" stroke="#FBF6EE" strokeWidth="3" strokeDasharray="1 9" strokeLinecap="round" />
      <rect x="196" y="42" width="84" height="176" rx="18" fill="#FBF6EE" />
      <rect x="206" y="58" width="64" height="36" rx="8" fill="#B8562F" />
      <rect x="206" y="106" width="64" height="8" rx="4" fill="#EBDCC0" />
      <rect x="206" y="122" width="44" height="8" rx="4" fill="#EBDCC0" />
      <rect x="206" y="176" width="64" height="24" rx="12" fill="#4A2E1F" />
    </svg>
  );
}

export function ValuesArt() {
  return (
    <svg viewBox="0 0 320 260" className="h-full w-full" aria-hidden="true">
      <path d="M160 214C78 158 52 112 74 76c18-28 62-24 86 12 24-36 68-40 86-12 22 36-4 82-86 138z" fill="#B8562F" />
      <path d="M160 88c-6 40-4 78 0 126" stroke="#FBF6EE" strokeWidth="3" opacity=".45" fill="none" />
      <circle cx="238" cy="52" r="12" fill="#D4A24C" />
      <circle cx="84" cy="200" r="8" fill="#8FA382" />
    </svg>
  );
}
