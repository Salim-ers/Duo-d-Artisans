import type { Config } from 'tailwindcss';

/**
 * Les tokens vivent dans app/globals.css (variables CSS).
 * Tailwind les expose ici pour pouvoir composer en utilitaires sans dupliquer les valeurs.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './data/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        duo: { DEFAULT: 'var(--duo-blue)', soft: 'var(--duo-blue-soft)', deep: 'var(--blue-deep)', facade: 'var(--facade)' },
        cream: 'var(--cream)',
        paper: 'var(--paper)',
        crust: 'var(--crust)',
        gold: 'var(--gold)',
        chocolate: 'var(--chocolate)',
        ink: 'var(--ink)',
      },
      fontFamily: {
        display: ['var(--font-display-next)', 'Iowan Old Style', 'Palatino', 'Georgia', 'serif'],
        sans: ['var(--font-ui-next)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)' },
      maxWidth: { container: 'var(--container)' },
    },
  },
  plugins: [],
};
export default config;
