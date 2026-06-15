/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        cinnabar: {
          50: "#FDF5F3",
          100: "#FAE6E2",
          200: "#F2BFB7",
          300: "#E58B7E",
          400: "#D45D4C",
          500: "#BE3A2B",
          600: "#9E2C20",
          700: "#8B2323",
          800: "#6E1B1B",
          900: "#4A1010",
          950: "#2A0808",
        },
        gold: {
          50: "#FDF9EC",
          100: "#FAF0CC",
          200: "#F2DE94",
          300: "#E7C75D",
          400: "#DDB83D",
          500: "#D4AF37",
          600: "#B89127",
          700: "#997221",
          800: "#7C5A20",
          900: "#664A1E",
          950: "#3A290C",
        },
        ink: {
          50: "#F7F5F3",
          100: "#EDE9E3",
          200: "#D5CEC3",
          300: "#B8ADA0",
          400: "#8B7C6C",
          500: "#5F4F3F",
          600: "#3E2F22",
          700: "#2C1810",
          800: "#1A0F09",
          900: "#0E0805",
        },
        rice: {
          50: "#FDFBF5",
          100: "#FAF5E9",
          200: "#F5EFE0",
          300: "#ECE2CA",
          400: "#D9C8A4",
          500: "#C2A97B",
        },
        warn: {
          soft: "#FF9F43",
          danger: "#EE2E2E",
        },
      },
      fontFamily: {
        song: ['"Noto Serif SC"', '"Source Han Serif SC"', '"SimSun"', "serif"],
        hei: ['"Noto Sans SC"', '"Source Han Sans SC"', '"Microsoft YaHei"', "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #F6CD70 0%, #D4AF37 45%, #B89127 100%)",
        "cinnabar-gradient": "linear-gradient(135deg, #D45D4C 0%, #8B2323 55%, #6E1B1B 100%)",
        "ink-wash": "linear-gradient(180deg, rgba(44,24,16,0.02) 0%, rgba(44,24,16,0.08) 100%)",
        "rice-paper": "radial-gradient(circle at 20% 30%, rgba(212,175,55,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139,35,35,0.04) 0%, transparent 50%), #F5EFE0",
      },
      boxShadow: {
        "gold-glow": "0 0 24px rgba(212,175,55,0.35), 0 0 4px rgba(212,175,55,0.5)",
        "cinnabar-glow": "0 0 24px rgba(139,35,35,0.3), 0 0 4px rgba(190,58,43,0.5)",
        "lacquer": "0 10px 30px -10px rgba(44,24,16,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
        "panel": "0 4px 20px -6px rgba(44,24,16,0.18)",
      },
      borderColor: {
        "gold-line": "#D4AF37",
      },
      animation: {
        "pulse-warn": "pulse-warn 1.6s ease-in-out infinite",
        "float-gentle": "float-gentle 6s ease-in-out infinite",
        "shine": "shine 3s linear infinite",
      },
      keyframes: {
        "pulse-warn": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(238,46,46,0.5)" },
          "50%": { boxShadow: "0 0 0 10px rgba(238,46,46,0)" },
        },
        "float-gentle": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "shine": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
