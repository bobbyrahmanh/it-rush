import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#1B1B3A", grape: "#5B4BDB", sun: "#FFC93C", coral: "#FF5D73", mint: "#19B5A5", sky: "#DDF3FF", paper: "#F7F5FF" },
      fontFamily: { display: ["var(--font-display)", "system-ui", "sans-serif"], body: ["var(--font-body)", "system-ui", "sans-serif"] },
      boxShadow: { pop: "0 6px 0 0 #1B1B3A", popsm: "0 4px 0 0 #1B1B3A" },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        wave: {
          "0%,100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(18deg)" },
          "75%": { transform: "rotate(-12deg)" },
        },
        blink: {
          "0%, 90%, 100%": { opacity: "0" },
          "92%, 96%": { opacity: "1" },
        },
        bounceDot: {
          "0%,80%,100%": { transform: "translateY(0)" },
          "40%": { transform: "translateY(-14px)" },
        },
        pagein: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "none" },
        },
        pop: {
          "0%": { transform: "scale(0.6)" },
          "70%": { transform: "scale(1.12)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        floaty: "floaty 3.4s ease-in-out infinite",
        wave: "wave 1.6s ease-in-out infinite",
        blink: "blink 4s ease-in-out infinite",
        bounceDot: "bounceDot 1s ease-in-out infinite",
        pagein: "pagein .45s ease-out both",
        pop: "pop .3s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
