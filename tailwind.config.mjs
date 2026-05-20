/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0D9488", // Teal 600
          light: "#2DD4BF",
          dark: "#0F766E",
        },
        secondary: {
          DEFAULT: "#2563EB", // Blue 600
          light: "#60A5FA",
        },
        accent: "#F59E0B", // Amber 500
        background: "#0F172A", // Slate 900
        surface: {
          DEFAULT: "rgba(30, 41, 59, 0.7)", // Slate 800 with opacity
          border: "rgba(255, 255, 255, 0.1)",
        },
        text: {
          primary: "#F8FAFC",
          secondary: "#94A3B8",
        },
      },
      spacing: {
        "container-max": "1280px",
        "gutter": "2rem",
      },
    },
  },
  plugins: [],
};
