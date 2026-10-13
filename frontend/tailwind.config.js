export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        academic: {
          primary: '#7A2832', // Academic Oxblood / Burgundy
          'primary-light': '#963540',
          'primary-dark': '#5C1D25',
          accent: '#C29B62', // Muted Brass / Ochre
          'accent-light': '#D1B182',
          surface: '#FFFFFF', // Pure white for structural elements
          background: '#FCFCFB', // Warm ivory/parchment
          text: '#2A2A2A', // Deep charcoal for readability
          heading: '#1C1C1C', // Almost black for headings
          border: '#E6E4DD', // Subtle warm border
          muted: '#6E6C68', // Muted text
          success: '#3A7D54', // Muted institutional green
          warning: '#C77926', // Warm warning orange
          error: '#B23A3A', // Classic red
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'], // For academic-feeling headings
      },
      borderRadius: {
        'sm': '0.125rem',
        DEFAULT: '0.125rem', // Very subtle rounding, classic paper feel
        'md': '0.25rem',
        'lg': '0.375rem',    // No large pills
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
