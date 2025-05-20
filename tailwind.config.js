// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        exo: ['"Exo 2"', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
      },

      colors: {
        cyberblue: '#00f0ff',
        cyberwhite: '#f1faff',
        cyberdark: '#0a1f33',
        glassdark: 'rgba(10, 31, 51, 0.4)',
        glassborder: 'rgba(255, 255, 255, 0.15)',
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(to bottom right, #f1faff, #d3eafd, #a8dcff)',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0, 240, 255, 0.1)',
      },
      backdropBlur: {
        soft: '6px',
      },
    },
  },
  plugins: [],
};
