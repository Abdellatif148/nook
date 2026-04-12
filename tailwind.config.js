/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        bg2: 'var(--bg2)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        border: 'var(--border)',
        border2: 'var(--border2)',
        accent: 'var(--accent)',
        accent2: 'var(--accent2)',
        'accent-glow': 'var(--accent-glow)',
        'accent-border': 'var(--accent-border)',
        text: 'var(--text)',
        text2: 'var(--text2)',
        text3: 'var(--text3)',
        success: 'var(--success)',
        error: 'var(--error)',
        warning: 'var(--warning)',
        info: 'var(--info)',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'text-xs': '11px',
        'text-sm': '13px',
        'text-base': '14px',
        'text-md': '16px',
        'text-lg': '18px',
        'text-xl': '22px',
        'text-2xl': '28px',
        'text-3xl': '36px',
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '20': '20px',
        '24': '24px',
        '32': '32px',
      },
      borderRadius: {
        'btn': '8px',
        'card': '12px',
        'card-lg': '16px',
        'modal': '24px',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0,0,0,0.3)',
        'lg': '0 8px 32px rgba(0,0,0,0.4)',
        'accent': '0 2px 12px rgba(249,115,22,0.3)',
        'accent-hover': '0 4px 20px rgba(249,115,22,0.4)',
      }
    },
  },
  plugins: [],
}
