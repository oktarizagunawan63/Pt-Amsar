/** @type {import('tailwindcss').Config} */

// Brand green, built around #237043 (step 600). Every step is darker than the
// previous one so hover/active states always move in the expected direction.
const brand = {
  50:  '#eef7f1',
  100: '#d6ecdd',
  200: '#aed8bc',
  300: '#7cbf93',
  400: '#4c9f6c',
  500: '#2f8453',
  600: '#237043',
  700: '#1c5a36',
  800: '#17482c',
  900: '#123923',
  950: '#0a2214',
}

// Brand accent (logo pink). Use sparingly: highlights, never for status.
const accent = {
  50:  '#fdf0f7',
  100: '#fbe0ef',
  200: '#f7c1df',
  300: '#f092c6',
  400: '#e756a6',
  500: '#de168c',
  600: '#c0107a',
  700: '#9c0e63',
  800: '#7d0f51',
  900: '#661044',
}

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // gray / slate / red / amber / orange / yellow are Tailwind's real defaults:
      // neutrals must be neutral and danger/warning must look like danger/warning.
      // `blue` and `green` stay mapped to the brand ramp because existing pages
      // use them as the primary/success color.
      colors: {
        brand: { ...brand, DEFAULT: brand[600], light: brand[500] },
        primary: brand,
        blue: brand,
        green: brand,
        accent: { ...accent, DEFAULT: accent[500] },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)',
      },
    },
  },
  plugins: [],
}
