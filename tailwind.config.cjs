/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#10b759",
        muted: "#9aa0a6",
        card: "#1f1f1f",
      },
      borderRadius: {
        pill: "9999px",
      },
      borderColor: {
        faint: "rgba(255,255,255,0.06)",
      },
    },
  },
  plugins: [],
};