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
        /* Apple Specific Direct Colors */
        apple: {
          blue: "var(--color-interactive-blue)",
          "blue-hover": "var(--color-action-blue)",
          gray: "var(--color-medium-gray)",
          "light-gray": "var(--color-light-gray)",
          "midnight": "var(--color-midnight-graphite)",
        }
      },
      borderRadius: {
        lg: "var(--radius-images)",
        md: "calc(var(--radius-images) - 2px)",
        sm: "calc(var(--radius-images) - 4px)",
        full: "var(--radius-buttons)",
      },
      fontFamily: {
        sans: ["SF Pro Text", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["SF Pro Display", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        'apple': 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0px',
      }
    },
  },
  plugins: [],
}
