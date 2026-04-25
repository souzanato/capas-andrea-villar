import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokens base shadcn
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // Tokens estendidos
        'background-elevated': 'hsl(var(--background-elevated))',
        'background-subtle': 'hsl(var(--background-subtle))',
        'foreground-soft': 'hsl(var(--foreground-soft))',
        'foreground-mute': 'hsl(var(--foreground-mute))',

        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },

        // === CORES DA MARCA ANDREA ===
        andrea: {
          rose: {
            DEFAULT: 'hsl(var(--andrea-rose))',
            foreground: 'hsl(var(--andrea-rose-fg))',
            bg: 'hsl(var(--andrea-rose-bg))',
          },
          blue: {
            DEFAULT: 'hsl(var(--andrea-blue))',
            foreground: 'hsl(var(--andrea-blue-fg))',
            bg: 'hsl(var(--andrea-blue-bg))',
          },
          green: {
            DEFAULT: 'hsl(var(--andrea-green))',
            foreground: 'hsl(var(--andrea-green-fg))',
            bg: 'hsl(var(--andrea-green-bg))',
          },
        },

        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tight: '-0.01em',
        tighter: '-0.02em',
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
