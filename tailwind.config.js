module.exports = {
  darkMode: "class",
  content: ["./index.html", "./app/**/*.js", "./firebase/**/*.js"],
  theme: {
    extend: {
      colors: {
        "on-secondary-container": "#b5b5b5",
        "inverse-surface": "#e5e2e1",
        "outline-variant": "#424656",
        "on-surface": "#e5e2e1",
        "inverse-primary": "#0054d6",
        "surface-container-low": "#1c1b1b",
        "error": "#ffb4ab",
        "on-surface-variant": "#c2c6d8",
        "primary-fixed-dim": "#b3c5ff",
        "surface-container-highest": "#353534",
        "surface-container": "#201f1f",
        "on-error-container": "#ffdad6",
        "tertiary-container": "#727171",
        "surface-container-lowest": "#0e0e0e",
        "on-primary-fixed": "#001849",
        "primary-fixed": "#dae1ff",
        "secondary-fixed-dim": "#c6c6c6",
        "on-primary-container": "#f8f7ff",
        "surface-variant": "#353534",
        "on-secondary-fixed-variant": "#454747",
        "primary-container": "#0066ff",
        "secondary": "#c6c6c6",
        "charcoal-deep": "#121212",
        "tertiary-fixed": "#e5e2e1",
        "on-secondary": "#2f3131",
        "primary": "#b3c5ff",
        "on-tertiary-fixed-variant": "#474746",
        "status-gold": "#D4AF37",
        "surface-tint": "#b3c5ff",
        "secondary-container": "#454747",
        "surface": "#131313",
        "surface-container-high": "#2a2a2a",
        "on-tertiary": "#313030",
        "error-container": "#93000a",
        "on-primary": "#002b75",
        "surface-bright": "#3a3939",
        "on-secondary-fixed": "#1a1c1c",
        "tertiary": "#c8c6c5",
        "titanium-silver": "#B0B0B0",
        "on-primary-fixed-variant": "#003fa4",
        "surface-dim": "#131313",
        "on-tertiary-fixed": "#1c1b1b",
        "electric-blue": "#0066FF",
        "background": "#131313",
        "inverse-on-surface": "#313030",
        "on-error": "#690005",
        "outline": "#8c90a1",
        "on-background": "#e5e2e1",
        "tertiary-fixed-dim": "#c8c6c5",
        "on-tertiary-container": "#faf7f6",
        "secondary-fixed": "#e2e2e2"
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px"
      },
      spacing: {
        "section-padding": "80px",
        base: "8px",
        "card-gap": "24px",
        "container-max": "1440px",
        gutter: "24px"
      }
    }
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries")
  ]
};
