/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B0B12',
          soft: '#13131D',
          card: '#181826',
          line: '#26263A',
        },
        brand: {
          violet: '#7C3AED',
          fuchsia: '#DB2777',
          amber: '#F59E0B',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(120deg, #7C3AED 0%, #DB2777 55%, #F59E0B 100%)',
        'brand-radial': 'radial-gradient(60% 60% at 50% 0%, rgba(124,58,237,0.25) 0%, rgba(11,11,18,0) 70%)',
      },
      boxShadow: {
        glow: '0 10px 50px -12px rgba(124,58,237,0.55)',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
