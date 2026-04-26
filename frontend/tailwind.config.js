/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        data: ['"Share Tech Mono"', 'monospace'],
      },
      colors: {
        void: '#000308',
        surface: '#050a12',
        elevated: '#0a1020',
        signal: '#00ff41',
        threat: '#ff1744',
        warn: '#ffab00',
        data: '#00b8d4',
        gemini: '#8ab4f8',
      },
    },
  },
  plugins: [],
}
