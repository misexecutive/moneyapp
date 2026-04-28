/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Sora', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 30px -16px rgba(37, 99, 235, 0.55)',
      },
      backgroundImage: {
        app: 'linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)',
      },
    },
  },
  plugins: [],
};

