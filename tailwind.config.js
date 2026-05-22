/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        /* AGON Specific Direct Colors */
        agon: {
          navy: "var(--color-agon-navy)",
          "navy-light": "var(--color-agon-navy-light)",
          "navy-dark": "var(--color-agon-navy-dark)",
          orange: "var(--color-agon-orange)",
          "orange-hover": "var(--color-agon-orange-hover)",
        },
        /* Action/Interactive Colors */
        action: {
          blue: "var(--color-action-blue)",
          "blue-hover": "var(--color-action-blue-hover)",
          interactive: "var(--color-interactive-blue)",
        }
      },
      borderRadius: {
        lg: "var(--radius-images)",      /* 8px */
        md: "var(--radius-cards)",       /* 6px */
        sm: "calc(var(--radius-cards) - 2px)", /* 4px */
        inputs: "var(--radius-inputs)",  /* 6px */
        full: "var(--radius-buttons)",   /* 980px */
      },
      fontSize: {
        caption: ["12px", { lineHeight: "1.5", letterSpacing: "-0.15px" }],
        "body-sm": ["14px", { lineHeight: "1.47", letterSpacing: "-0.18px" }],
        subheading: ["18px", { lineHeight: "1.24", letterSpacing: "-0.22px" }],
        callout: ["21px", { lineHeight: "1.19", letterSpacing: "-0.28px" }],
        "heading-sm": ["24px", { lineHeight: "1.33", letterSpacing: "-0.24px" }],
        "heading-lg": ["28px", { lineHeight: "1.14", letterSpacing: "0.29px" }],
        "display-xl": ["34px", { lineHeight: "1", letterSpacing: "-0.1px" }],
        "display-xxl": ["40px", { lineHeight: "1.1", letterSpacing: "0.44px" }],
        "display-giant": ["44px", { lineHeight: "2.12" }],
        display: ["56px", { lineHeight: "1.07", letterSpacing: "-0.28px" }],
      },
      fontFamily: {
        sans: ["var(--font-sf-pro-text)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-sf-pro-display)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        'agon': 'rgba(0, 0, 0, 0.04) 0px 8px 24px',
        'apple-img': 'rgba(0, 0, 0, 0.12) 3px 5px 30px 0px',
      }
    },
  },
  plugins: [],
}
