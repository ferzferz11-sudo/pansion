/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'sos-pulse': 'sos-pulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        'sos-pulse': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.7)' },
          '50%': { boxShadow: '0 0 0 12px rgba(239,68,68,0)' },
        },
      },
    },
  },
  plugins: [],
}
