import { useCallback, useEffect, useRef, useState } from "react";

// Bảng chọn màu HSV chính xác (không phụ thuộc input[type=color] của trình duyệt vốn khác nhau
// giữa các hệ điều hành). Kéo trên ô bão hòa/độ sáng + thanh trượt Hue, hoặc gõ thẳng mã Hex.
// value: chuỗi hex "#rrggbb" — onChange trả về hex mới mỗi lần đổi.

function hexToHsv(hex) {
  const clean = (hex || "#000000").replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

function hsvToHex(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const isValidHex = (v) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);

export default function ColorPicker({ value, onChange }) {
  const initial = hexToHsv(value);
  const [h, setH] = useState(initial.h);
  const [s, setS] = useState(initial.s);
  const [v, setV] = useState(initial.v);
  const [hexInput, setHexInput] = useState(value || "#000000");
  const panelRef = useRef(null);
  const hueRef = useRef(null);
  const draggingPanel = useRef(false);
  const draggingHue = useRef(false);

  // Đồng bộ lại khi value đổi từ bên ngoài (ví dụ chọn preset)
  useEffect(() => {
    if (!value || !isValidHex(value)) return;
    const next = hexToHsv(value);
    setH(next.h);
    setS(next.s);
    setV(next.v);
    setHexInput(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commit = useCallback(
    (nh, ns, nv) => {
      const hex = hsvToHex(nh, ns, nv);
      setHexInput(hex);
      onChange(hex);
    },
    [onChange]
  );

  const updateFromPanelEvent = useCallback(
    (clientX, clientY) => {
      const rect = panelRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
      const ns = rect.width ? x / rect.width : 0;
      const nv = rect.height ? 1 - y / rect.height : 0;
      setS(ns);
      setV(nv);
      commit(h, ns, nv);
    },
    [h, commit]
  );

  const updateFromHueEvent = useCallback(
    (clientX) => {
      const rect = hueRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const nh = rect.width ? (x / rect.width) * 360 : 0;
      setH(nh);
      commit(nh, s, v);
    },
    [s, v, commit]
  );

  useEffect(() => {
    const handleMove = (e) => {
      const point = e.touches ? e.touches[0] : e;
      if (draggingPanel.current) updateFromPanelEvent(point.clientX, point.clientY);
      if (draggingHue.current) updateFromHueEvent(point.clientX);
    };
    const handleUp = () => {
      draggingPanel.current = false;
      draggingHue.current = false;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [updateFromPanelEvent, updateFromHueEvent]);

  const handleHexInputChange = (e) => {
    const raw = e.target.value;
    setHexInput(raw);
    if (isValidHex(raw)) {
      const next = hexToHsv(raw);
      setH(next.h);
      setS(next.s);
      setV(next.v);
      onChange(raw.length === 4 ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}` : raw);
    }
  };

  const pureHueHex = hsvToHex(h, 1, 1);

  return (
    <div className="select-none">
      {/* Ô bão hòa (Saturation) x độ sáng (Value) */}
      <div
        ref={panelRef}
        onMouseDown={(e) => {
          draggingPanel.current = true;
          updateFromPanelEvent(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          draggingPanel.current = true;
          const t = e.touches[0];
          updateFromPanelEvent(t.clientX, t.clientY);
        }}
        className="relative w-full h-36 rounded-xl cursor-crosshair touch-none"
        style={{
          backgroundColor: pureHueHex,
          backgroundImage: "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
        }}
      >
        <div
          role="slider"
          tabIndex={0}
          aria-label="Độ bão hòa và độ sáng của màu"
          aria-valuetext={`Bão hòa ${Math.round(s * 100)}%, sáng ${Math.round(v * 100)}%`}
          onKeyDown={(e) => {
            // Hỗ trợ bàn phím: mũi tên chỉnh bão hòa (trái/phải) và độ sáng (lên/xuống), Shift để bước lớn hơn
            const step = e.shiftKey ? 0.1 : 0.02;
            let ns = s;
            let nv = v;
            if (e.key === "ArrowRight") ns = Math.min(1, s + step);
            else if (e.key === "ArrowLeft") ns = Math.max(0, s - step);
            else if (e.key === "ArrowUp") nv = Math.min(1, v + step);
            else if (e.key === "ArrowDown") nv = Math.max(0, v - step);
            else return;
            e.preventDefault();
            setS(ns);
            setV(nv);
            commit(h, ns, nv);
          }}
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow -translate-x-1/2 -translate-y-1/2 ring-1 ring-black/20 focus:outline-none focus:ring-2 focus:ring-espresso-800"
          style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%`, backgroundColor: hexInput }}
        />
      </div>

      {/* Thanh trượt Hue */}
      <div
        ref={hueRef}
        onMouseDown={(e) => {
          draggingHue.current = true;
          updateFromHueEvent(e.clientX);
        }}
        onTouchStart={(e) => {
          draggingHue.current = true;
          updateFromHueEvent(e.touches[0].clientX);
        }}
        className="relative w-full h-3.5 rounded-full mt-3 cursor-pointer touch-none"
        style={{
          background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
        }}
      >
        <div
          role="slider"
          tabIndex={0}
          aria-label="Tông màu (Hue)"
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(h)}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 15 : 3;
            let nh = h;
            if (e.key === "ArrowRight" || e.key === "ArrowUp") nh = (h + step) % 360;
            else if (e.key === "ArrowLeft" || e.key === "ArrowDown") nh = (h - step + 360) % 360;
            else return;
            e.preventDefault();
            setH(nh);
            commit(nh, s, v);
          }}
          className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow -translate-x-1/2 -translate-y-1/2 ring-1 ring-black/20 focus:outline-none focus:ring-2 focus:ring-espresso-800"
          style={{ left: `${(h / 360) * 100}%`, backgroundColor: pureHueHex }}
        />
      </div>

      {/* Nhập Hex trực tiếp — cho ai cần độ chính xác tuyệt đối / dán mã có sẵn */}
      <div className="flex items-center gap-2 mt-3">
        <div
          className="w-9 h-9 rounded-lg ring-1 ring-espresso-900/15 shrink-0"
          style={{ backgroundColor: isValidHex(hexInput) ? hexInput : "transparent" }}
        />
        <input
          value={hexInput}
          onChange={handleHexInputChange}
          spellCheck={false}
          maxLength={7}
          placeholder="#4A2E1F"
          className="flex-1 rounded-lg border border-espresso-900/15 px-3 py-2 text-sm font-mono uppercase tracking-wide"
        />
      </div>
    </div>
  );
}
