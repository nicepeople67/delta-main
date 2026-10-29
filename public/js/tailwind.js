tailwind.config = {
  theme: {
    extend: {
      colors: {

        'baby-blue': 'var(--color-accent)', 


        'dark-navy': 'var(--color-background)', 


        'dark-surface': 'var(--color-surface)',
      },
      boxShadow: {

        'neon-glow': '0 0 8px var(--color-accent), 0 0 20px var(--color-accent-shadow)',
      },
      fontFamily: {
        electrolize: ['Electrolize', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
};
