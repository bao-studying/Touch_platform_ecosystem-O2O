/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        espresso: {
          950: "#2A1810",
          900: "#3B2318",
          800: "#4A2E1F",
          700: "#5E3A28",
          600: "#7A4E36",
        },
        cream: {
          50: "#FBF6EE",
          100: "#F5EBDA",
          200: "#EBDCC0",
        },
        amber: {
          400: "#D4A24C",
          500: "#C08A2E",
          600: "#A5711F",
        },
        sage: {
          400: "#8FA382",
          500: "#71886A",
        },
        clay: {
          500: "#B8562F",
        },
        // Palette riêng cho khu vực Super Admin ("phòng điều hành" nền tảng) — CỐ Ý khác tông ấm
        // espresso/amber/clay của thương hiệu khách hàng, để không ai nhầm đây là trang của 1 doanh nghiệp thuê bao.
        ink: {
          950: "#12151B",
          900: "#191D26",
          800: "#242938",
          700: "#333B4E",
          600: "#4A5468",
          400: "#8992A6",
        },
        signal: {
          400: "#6C8EF5",
          500: "#3E6FEA",
          600: "#2F56C4",
        },
        paper: "#F4F5F8",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
        // Font riêng cho khu vực Super Admin Dashboard — set qua class "font-dash" ở SuperAdminLayout,
        // không ảnh hưởng font-body (Inter) dùng cho trang giới thiệu/tenant.
        dash: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      boxShadow: {
        "glow-blue": "0 0 0 4px rgba(37,99,235,0.12), 0 8px 24px -8px rgba(37,99,235,0.35)",
        "glow-white": "0 0 0 1px rgba(255,255,255,0.08)",
        "glow-orange": "0 20px 60px -12px rgba(255,80,40,0.45)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg) translateX(var(--orbit-radius)) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(var(--orbit-radius)) rotate(-360deg)" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        fabPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(74,46,31,0.35)" },
          "50%": { boxShadow: "0 0 0 14px rgba(74,46,31,0)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(-6px)" },
          "50%": { transform: "translateY(8px)" },
        },
        ripple: {
          "0%": { transform: "scale(0.55)", opacity: "0.55" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        marquee: "marquee 9s linear infinite",
        orbit: "orbit 7s linear infinite",
        "bounce-soft": "bounceSoft 1.6s ease-in-out infinite",
        "fab-pulse": "fabPulse 2s ease-out infinite",
        "fade-in": "fadeIn 0.5s cubic-bezier(0.16,1,0.3,1)",
        float: "float 7s ease-in-out infinite",
        ripple: "ripple 2.8s ease-out infinite",
        "spin-slow": "spinSlow 6s linear infinite",
      },
    },
  },
  plugins: [],
};
