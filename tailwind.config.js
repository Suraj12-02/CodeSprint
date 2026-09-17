/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12151C",
        surface: "#1B1F29",
        surface2: "#242938",
        surface3: "#2D3344",
        line: "#333A4B",
        text: "#E9E7E1",
        muted: "#8B93A7",
        faint: "#5B6377",
        accent: "#5B8DEF",
        accentDim: "#3B5B9E",
        good: "#6FCF97",
        bad: "#F2545B",
        warn: "#E8B04A",
        terminal: "#0d1117",
        termText: "#c9d1d9",
        termGreen: "#00ff9c",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": "0.6875rem",
      },
    },
  },
  plugins: [],
}

