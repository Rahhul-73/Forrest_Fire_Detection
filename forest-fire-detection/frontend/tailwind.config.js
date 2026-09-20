/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgDark: '#0a0e14',
        cardDark: '#121824',
        borderDark: '#1e293b',
        fireOrange: '#ff6b35',
        alertRed: '#ff2d55',
        safeTeal: '#00d9a5',
        amberWarn: '#ffb703',
        cyanGlow: '#00f0ff',
      },
    },
  },
  plugins: [],
}
