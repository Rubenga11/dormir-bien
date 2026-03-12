import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        night:    '#04050c',
        deep:     '#0d0f1e',
        indigo:   '#151830',
        slate:    '#2a2f55',
        lavender: '#7b82c4',
        moon:     '#b8bde8',
        star:     '#e8eaf6',
        glow:     '#6366b8',
        accent:   '#a89ed6',
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", 'serif'],
        mono:  ["'DM Mono'", 'monospace'],
      },
      animation: {
        'moon-float': 'moonFloat 5s ease-in-out infinite',
        'core-glow':  'coreGlow 4s ease-in-out infinite',
        'aurora-1':   'auroraMove1 22s ease-in-out infinite',
        'aurora-2':   'auroraMove2 28s ease-in-out infinite',
        'halo-glow':  'haloGlow 8s ease-in-out infinite',
        'ring-pulse': 'ringPulse 8s ease-in-out infinite',
        'fade-in-up': 'fadeInUp .6s ease forwards',
      },
      keyframes: {
        moonFloat:    { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        coreGlow:     { '0%,100%': { opacity: '0.3', transform: 'scale(0.85)' }, '50%': { opacity: '0.9', transform: 'scale(1.15)' } },
        auroraMove1:  { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(60px,50px)' } },
        auroraMove2:  { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(-50px,-70px)' } },
        haloGlow:     { '0%,100%': { opacity: '0.5', transform: 'scale(1)' }, '50%': { opacity: '1', transform: 'scale(1.1)' } },
        ringPulse:    { '0%,100%': { opacity: '0.25', transform: 'scale(1)' }, '50%': { opacity: '0.6', transform: 'scale(1.05)' } },
        fadeInUp:     { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

export default config
