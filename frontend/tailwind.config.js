export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#111827',
        panel: '#1f2937',
        accent: '#7c3aed',
        muted: '#9ca3af',
      },
      boxShadow: {
        card: '0 20px 70px rgba(15, 23, 42, 0.35)',
      },
    },
  },
  plugins: [],
};
