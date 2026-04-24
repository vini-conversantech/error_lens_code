/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#070B10',
        panel: '#0E131A',
        card: '#121923',
        border: 'rgba(255,255,255,0.06)',
        text: '#EAF2FF',
        muted: '#7D8CA3',
        primary: '#4F8CFF',
        'cyan-glow': '#00D4FF',
        'violet-glow': '#8B5CFF',
        success: '#16C784',
        error: '#FF5D73',
        warning: '#F5A524',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'SF Pro', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '18px': '18px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(79, 140, 255, 0.3)',
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-violet': '0 0 20px rgba(139, 92, 255, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(79, 140, 255, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(79, 140, 255, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}