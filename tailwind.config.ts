import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
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
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: 'calc(var(--radius) + 2px)',
        md: 'var(--radius)',
        sm: 'calc(var(--radius) - 2px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'tile-explode': {
          '0%': { transform: 'scale(1) rotate(0deg)', opacity: '1', filter: 'brightness(1)' },
          '30%': { transform: 'scale(1.3) rotate(10deg)', opacity: '0.9', filter: 'brightness(1.5)' },
          '60%': { transform: 'scale(1.5) rotate(-5deg)', opacity: '0.5', filter: 'brightness(2)' },
          '100%': { transform: 'scale(0) rotate(180deg)', opacity: '0', filter: 'brightness(0)' },
        },
        'tile-fall': {
          '0%': { transform: 'translateY(-100%)', opacity: '0.5' },
          '70%': { transform: 'translateY(5%)', opacity: '1' },
          '85%': { transform: 'translateY(-2%)', opacity: '1' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'tile-spawn': {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0', filter: 'blur(2px)' },
          '60%': { transform: 'scale(1.15) rotate(5deg)', opacity: '1', filter: 'blur(0px)' },
          '80%': { transform: 'scale(0.95) rotate(-2deg)', opacity: '1', filter: 'blur(0px)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1', filter: 'blur(0px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 69, 207, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(139, 69, 207, 0.8), 0 0 60px rgba(139, 69, 207, 0.4)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'gridScroll': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(50px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'ping-slow': {
          '75%, 100%': { transform: 'scale(1.1)', opacity: '0' },
        },
        'ping-slower': {
          '75%, 100%': { transform: 'scale(1.2)', opacity: '0' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'tile-explode': 'tile-explode 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'tile-fall': 'tile-fall 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'tile-spawn': 'tile-spawn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'row-blast': 'row-blast 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'col-blast': 'col-blast 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'shatter': 'shatter 0.7s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards',
        'crack': 'crack 0.4s cubic-bezier(0.455, 0.03, 0.515, 0.955)',
        'jelly-pop': 'jelly-pop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'particle-burst': 'particle-burst 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
        'spin-reverse': 'spin-reverse 6s linear infinite',
        'ping-slow': 'ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'ping-slower': 'ping-slower 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    }
  },
  plugins: [
    animate,
    typography,
  ],
} satisfies Config;
