/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0E1116', // Deep signal black
          accent: '#FF5A5F', // High impact accent
          light: '#F5F5F5', // Background wash
        },
        eqHigh: '#FFD700',   // Gold – Oracle tier
        eqMedium: '#C0C0C0', // Silver – Diplomat tier
        eqLow: '#708090'     // Steel – Forge tier
      },
      fontFamily: {
        heading: ['Oswald', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
