const plugin = require("tailwindcss/plugin");

module.exports = {
  content: [
    "./src/Components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/Components/ui/shadcn/*.{js,ts,jsx,tsx,mdx}",
    "./src/Components/*.{js.ts.jsx.tsx.mdx}",
    "./src/*.{js,ts,jsx,tsx,mdx}",
    "./src/Pages/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class", "class"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
    },
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
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
  ],
};
