const { join } = require("path");
const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [join(__dirname, "./src/**/*.{js,ts,jsx,tsx}")],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {},
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms")],
};
