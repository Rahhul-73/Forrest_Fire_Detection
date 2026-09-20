/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        fire: '#ff6b35',
        alert: '#ff2d55',
        safe: '#00d9a5',
        ink: '#0a0e14',
        panel: '#121826',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)', boxShadow: '0 0 15px rgba(255, 107, 53, 0.4)' },
          '50%': { opacity: '0.6', transform: 'scale(1.03)', boxShadow: '0 0 25px rgba(255, 45, 85, 0.7)' },
        },
        'flame-flicker': {
          '0%, 100%': { transform: 'rotate(-1deg) scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'rotate(1deg) scale(1.05)', filter: 'brightness(1.2)' },
        },
        'sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'flame-flicker': 'flame-flicker 1.5s ease-in-out infinite',
        'sweep': 'sweep 8s linear infinite',
      },
    },
  },
  plugins: [],
}
