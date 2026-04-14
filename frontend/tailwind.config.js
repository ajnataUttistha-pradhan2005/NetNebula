/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0e0e0e',
        surface_lowest: '#0a0a0a',
        surface_low: '#121212',
        surface_highest: '#1a1a1a',
        primary: '#99f7ff',
        primary_dim: '#00b5c4',
        primary_container: '#00f1fe',
        on_primary_container: '#004146',
        secondary: '#2ff801',
        secondary_container: '#1e4b0c',
        tertiary: '#ff7073',
        error: '#ff716c',
        outline_variant: '#3a3a3a'
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace', 'Orbitron'],
      },
      animation: {
        ripple: 'ripple 2s infinite ease-out',
        scanline: 'scanline 10s linear infinite',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        }
      }
    },
  },
  plugins: [],
}
