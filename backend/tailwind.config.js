/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./resources/views/**/*.blade.php",
    "./resources/js/**/*.{js,ts,jsx,tsx}",
    "./resources/**/*.js",
    "./resources/**/*.ts",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        // 400px boundary used by the responsive spec (under 400 / 400+).
        xs: "400px",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success, 142 76% 36%))",
          foreground: "hsl(var(--success-foreground, 0 0% 100%))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning, 38 92% 50%))",
          foreground: "hsl(var(--warning-foreground, 0 0% 100%))",
        },
        // Solid surface levels (opaque). Glass fills come from the
        // .glass-* component classes in resources/css/app.css.
        surface: {
          1: "hsl(var(--surface-1))",
          2: "hsl(var(--surface-2))",
          3: "hsl(var(--surface-3))",
          inverse: "hsl(var(--surface-inverse))",
        },
        // Brand palette extracted from the existing tokens (no new hues).
        brand: {
          blue: "hsl(var(--brand-blue))",
          violet: "hsl(var(--brand-violet))",
          amber: "hsl(var(--brand-amber))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Additive iOS-style continuous corners. Deliberately NOT named
        // xl/2xl so Tailwind's built-in rounded-xl/2xl keep their meaning.
        // The full scale also lives in --radius-xs … --radius-2xl (app.css)
        // for use as arbitrary values.
        "ios-xs": "var(--radius-xs)",
        "ios-sm": "var(--radius-sm)",
        "ios-md": "var(--radius-md)",
        "ios-lg": "var(--radius-lg)",
        "ios-xl": "var(--radius-xl)",
        "ios-2xl": "var(--radius-2xl)",
      },
      // Named stacking scale. Plain z-40/z-50 keep working, so nothing
      // breaks while surfaces migrate to these names (B3).
      zIndex: {
        content: "0",
        sticky: "40",
        dock: "50",
        cluster: "55",
        sheet: "60",
        modal: "70",
        toast: "80",
        tip: "90",
      },
      // Theme-aware layered elevation (replaces Tailwind defaults so every
      // card/shadow in the app gets the same depth language in both themes).
      boxShadow: {
        xs: "0 1px 2px -1px hsl(var(--shadow-tint) / var(--shadow-alpha-xs))",
        sm: "0 1px 2px -1px hsl(var(--shadow-tint) / var(--shadow-alpha-sm)), 0 2px 4px -2px hsl(var(--shadow-tint) / var(--shadow-alpha-xs))",
        DEFAULT:
          "0 2px 4px -2px hsl(var(--shadow-tint) / var(--shadow-alpha-md)), 0 4px 12px -4px hsl(var(--shadow-tint) / var(--shadow-alpha-sm))",
        md: "0 4px 10px -3px hsl(var(--shadow-tint) / var(--shadow-alpha-md)), 0 12px 24px -8px hsl(var(--shadow-tint) / var(--shadow-alpha-sm))",
        lg: "0 8px 18px -6px hsl(var(--shadow-tint) / var(--shadow-alpha-lg)), 0 24px 48px -16px hsl(var(--shadow-tint) / var(--shadow-alpha-md))",
        xl: "0 12px 28px -8px hsl(var(--shadow-tint) / var(--shadow-alpha-xl)), 0 40px 80px -24px hsl(var(--shadow-tint) / var(--shadow-alpha-lg))",
        "2xl": "0 24px 60px -16px hsl(var(--shadow-tint) / var(--shadow-alpha-xl))",
        none: "none",
        // Colored under-glow for 3D controls.
        "glow-primary": "0 8px 24px -6px hsl(var(--brand-blue) / var(--shadow-alpha-glow))",
        "glow-secondary": "0 8px 24px -6px hsl(var(--brand-violet) / var(--shadow-alpha-glow))",
        "glow-success": "0 8px 24px -6px hsl(var(--success) / var(--shadow-alpha-glow))",
        "glow-danger": "0 8px 24px -6px hsl(var(--destructive) / var(--shadow-alpha-glow))",
        "glow-warning": "0 8px 24px -6px hsl(var(--warning) / var(--shadow-alpha-glow))",
        // Specular top highlight used on glass and 3D bodies.
        "inner-top": "inset 0 1px 0 0 hsl(var(--glass-highlight) / 0.35)",
        "contact-sm": "0 2px 4px -1px hsl(var(--shadow-tint) / var(--shadow-alpha-md))",
        "contact-lg": "0 6px 14px -4px hsl(var(--shadow-tint) / var(--shadow-alpha-lg))",
      },
      // Motion scale (CSS/WAAPI only; no animation library).
      transitionDuration: {
        instant: "var(--duration-instant)",
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
        slower: "var(--duration-slower)",
      },
      transitionTimingFunction: {
        "out-spring": "var(--ease-spring)",
        "in-out-soft": "var(--ease-in-out)",
      },
      // Fluid typography (additive; default text-* sizes untouched).
      fontSize: {
        display: [
          "clamp(1.75rem, 1.15rem + 2.4vw, 3rem)",
          { lineHeight: "1.08", letterSpacing: "-0.02em" },
        ],
        title: [
          "clamp(1.25rem, 1.05rem + 0.9vw, 1.75rem)",
          { lineHeight: "1.2", letterSpacing: "-0.01em" },
        ],
        subtitle: [
          "clamp(1rem, 0.92rem + 0.35vw, 1.125rem)",
          { lineHeight: "1.45" },
        ],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "glass-sheen": {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" },
        },
        "dock-bubble": {
          "0%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-2px) scale(1.06)" },
          "100%": { transform: "translateY(0) scale(1)" },
        },
        "press-sink": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(1px)" },
        },
        "tile-float": {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glass-sheen": "glass-sheen 1.1s var(--ease-out)",
        "dock-bubble": "dock-bubble 0.35s var(--ease-spring)",
        "tile-float": "tile-float 4.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
