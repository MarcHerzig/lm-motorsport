export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0c0e',
        surface: '#16181c',
        border: '#2a2d33',
        ink: '#f5f5f3',
        muted: '#9ca0a8',
        accent: '#e10600',
        'accent-hover': '#ff241a'
      },
      fontFamily: {
        heading: ['Oswald', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
