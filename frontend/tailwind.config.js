/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        firetv: {
          dark: "#080B10",
          card: "#121824",
          cardBorder: "#232F3E",
          amber: "#FF9900",
          cyan: "#00A8E1",
          emerald: "#00E676",
          rose: "#FF1744",
          violet: "#7C4DFF"
        }
      },
      fontFamily: {
        sans: ["Amazon Ember", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        'dpad-focus': '0 0 0 4px #FF9900, 0 10px 25px -5px rgba(255, 153, 0, 0.4)',
        'cyan-focus': '0 0 0 4px #00A8E1, 0 10px 25px -5px rgba(0, 168, 225, 0.4)',
        'glow-ambient': '0 0 50px -10px rgba(0, 168, 225, 0.25)',
      },
      scale: {
        '103': '1.03',
      }
    },
  },
  plugins: [],
}
