import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        risk: {
          green: "#6ee7b7",
          amber: "#facc15",
          red: "#fb7185",
          panel: "rgba(9, 12, 18, 0.74)"
        }
      },
      boxShadow: {
        glass: "0 24px 80px rgba(0, 0, 0, 0.38)"
      }
    }
  },
  plugins: []
};

export default config;
