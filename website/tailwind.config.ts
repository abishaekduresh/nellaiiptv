import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#06B6D4', // Cyan
          dark: '#0891B2',
          light: '#22D3EE',
        },
        secondary: {
          DEFAULT: '#FCD34D', // Yellow
          dark: '#F59E0B',
          light: '#FDE68A',
        },
        background: {
          DEFAULT: '#0F172A', // Dark Navy
          card: '#1E293B',
          hover: '#334155',
        },
        text: {
          DEFAULT: '#FFFFFF',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
