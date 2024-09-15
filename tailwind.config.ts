import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          background: "#121b2f", // Main background color
          surface: "#071026", // Sidebar and card background color
          primary: "#61dafb", // Primary accent color (cyan)
          secondary: "#bb86fc", // Secondary accent color (purple)
          text: {
            primary: "#E3E8F3", // Primary text color
            secondary: "#7B8191", // Secondary text color
          },
          border: "#2d3748", // Border color
        },
      },
    },
  },
  plugins: [],
};
export default config;
