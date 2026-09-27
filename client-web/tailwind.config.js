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
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
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
        popIn: {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        popOut: {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(12px) scale(0.98)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideOutRight: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        slideInUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        slideOutUp: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
        pageIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee: "marquee 9s linear infinite",
        orbit: "orbit 7s linear infinite",
        "bounce-soft": "bounceSoft 1.6s ease-in-out infinite",
        "fab-pulse": "fabPulse 2s ease-out infinite",
        "pop-in": "popIn 0.22s cubic-bezier(0.16,1,0.3,1)",
        "pop-out": "popOut 0.16s ease-in forwards",
        "fade-in": "fadeIn 0.18s ease-out",
        "fade-out": "fadeOut 0.16s ease-in forwards",
        "slide-in-right": "slideInRight 0.28s cubic-bezier(0.16,1,0.3,1)",
        "slide-out-right": "slideOutRight 0.22s cubic-bezier(0.4,0,1,1) forwards",
        "slide-in-up": "slideInUp 0.28s cubic-bezier(0.16,1,0.3,1)",
        "slide-out-up": "slideOutUp 0.22s cubic-bezier(0.4,0,1,1) forwards",
        "page-in": "pageIn 0.32s cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
};
