// const { createGlobPatternsForDependencies } = require('@nx/next/tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './{src,pages,components,app}/**/*.{ts,tsx,js,jsx,html}',
    '!./{src,pages,components,app}/**/*.{stories,spec}.{ts,tsx,js,jsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        // Surface hierarchy (no-border rule — depth via background shifts)
        'surface':                   '#f8fafa',
        'surface-bright':            '#f8fafa',
        'surface-dim':               '#d8dada',
        'surface-container-lowest':  '#ffffff',
        'surface-container-low':     '#f2f4f4',
        'surface-container':         '#eceeee',
        'surface-container-high':    '#e6e8e9',
        'surface-container-highest': '#e1e3e3',
        'surface-variant':           '#e1e3e3',
        'surface-tint':              '#006a6a',

        // Primary — deep teal
        'primary':                   '#005050',
        'primary-container':         '#006a6a',
        'primary-fixed':             '#a0f0f0',
        'primary-fixed-dim':         '#84d4d3',
        'on-primary':                '#ffffff',
        'on-primary-container':      '#97e7e6',
        'on-primary-fixed':          '#002020',
        'on-primary-fixed-variant':  '#004f4f',
        'inverse-primary':           '#84d4d3',

        // Secondary — architectural gray
        'secondary':                 '#5c5f5f',
        'secondary-container':       '#e1e3e2',
        'secondary-fixed':           '#e1e3e2',
        'secondary-fixed-dim':       '#c5c7c6',
        'on-secondary':              '#ffffff',
        'on-secondary-container':    '#626565',
        'on-secondary-fixed':        '#191c1c',
        'on-secondary-fixed-variant':'#444747',

        // Tertiary — emerald
        'tertiary':                  '#00514a',
        'tertiary-container':        '#006b62',
        'tertiary-fixed':            '#61f9e9',
        'tertiary-fixed-dim':        '#3adccc',
        'on-tertiary':               '#ffffff',
        'on-tertiary-container':     '#56f0e0',
        'on-tertiary-fixed':         '#00201d',
        'on-tertiary-fixed-variant': '#005049',

        // Surface text
        'on-surface':                '#191c1d',
        'on-surface-variant':        '#3e4948',
        'on-background':             '#191c1d',
        'background':                '#f8fafa',

        // Outline
        'outline':                   '#6e7979',
        'outline-variant':           '#bec9c8',

        // Inverse
        'inverse-surface':           '#2e3131',
        'inverse-on-surface':        '#eff1f1',

        // Error
        'error':                     '#ba1a1a',
        'error-container':           '#ffdad6',
        'on-error':                  '#ffffff',
        'on-error-container':        '#93000a',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body:     ['Inter', 'sans-serif'],
        label:    ['Inter', 'sans-serif'],
        sans:     ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg:      '0.5rem',
        xl:      '0.75rem',
        full:    '9999px',
      },
      boxShadow: {
        // Ambient shadow tinted with primary hue
        'ambient': '0 12px 32px 0 rgba(0, 80, 80, 0.08)',
        'ambient-lg': '0 12px 32px 0 rgba(0, 80, 80, 0.12)',
      },
    },
  },
  plugins: [],
};
