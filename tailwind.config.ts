import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B2B22", muted: "#6A756D", faint: "#9AA39C",
        line: "#E1E7E0", paper: "#FFFFFF", wash: "#EFF4EE",
        brand: "#1B7A47", branddeep: "#125634", brandsoft: "#E0F0E6",
        amber: "#B5730B", ambersoft: "#FDF0D9",
        danger: "#C2503F", dangersoft: "#FBE7E3",
      },
      fontFamily: {
        sans: ['Sarabun', 'system-ui', 'sans-serif'],
        display: ['Mitr', 'Sarabun', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
