const { join } = require("path");
const plugin = require("tailwindcss/plugin");

module.exports = {
  content: [join(__dirname, "./src/**/*.{js,ts,jsx,tsx,mdx,html}")],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {},
  },
  plugins: [
    plugin(function ({ addBase, theme }) {
      function extractVars(obj, group = "", prefix) {
        return Object.keys(obj).reduce((vars, key) => {
          const value = obj[key];
          const cssVariable =
            key === "DEFAULT"
              ? `--${prefix}${group}`
              : `--${prefix}${group}-${key}`;
          const newVars =
            typeof value === "string"
              ? { [cssVariable]: value }
              : extractVars(value, `-${key}`, prefix);
          return { ...vars, ...newVars };
        }, {});
      }

      // Add CSS variables to :root using addBase instead of addUtilities
      addBase({
        ":root": {
          ...extractVars(theme("colors"), "", "color"),
          ...extractVars(theme("boxShadow"), "", "box-shadow"),
        },
      });
    }),
  ],
};
