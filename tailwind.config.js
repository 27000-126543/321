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
        'tech-bg': '#0A1628',
        'tech-panel': 'rgba(16, 30, 54, 0.85)',
        'tech-border': 'rgba(24, 144, 255, 0.3)',
        'tech-blue': '#1890FF',
        'tech-cyan': '#13C2C2',
        'tech-green': '#52C41A',
        'tech-orange': '#FA8C16',
        'tech-red': '#FF4D4F',
        'tech-purple': '#722ED1',
        'tech-gold': '#FAAD14',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        sans: ['PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink-orange': 'blink-orange 1.5s ease-in-out infinite',
        'blink-red': 'blink-red 0.8s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'flow': 'flow 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'blink-orange': {
          '0%, 100%': { boxShadow: '0 0 5px #FA8C16, 0 0 10px #FA8C16' },
          '50%': { boxShadow: '0 0 20px #FA8C16, 0 0 30px #FA8C16' },
        },
        'blink-red': {
          '0%, 100%': { boxShadow: '0 0 5px #FF4D4F, 0 0 10px #FF4D4F' },
          '50%': { boxShadow: '0 0 25px #FF4D4F, 0 0 40px #FF4D4F' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'flow': {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 5px rgba(24, 144, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(24, 144, 255, 0.8), 0 0 30px rgba(24, 144, 255, 0.4)' },
        },
      },
      boxShadow: {
        'tech': '0 0 15px rgba(24, 144, 255, 0.3), inset 0 0 15px rgba(24, 144, 255, 0.1)',
        'tech-hover': '0 0 25px rgba(24, 144, 255, 0.5), inset 0 0 20px rgba(24, 144, 255, 0.15)',
      },
    },
  },
  plugins: [],
};
