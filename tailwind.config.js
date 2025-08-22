/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
'background': '#070815',
        'background-content-1': '#105466',
        'background-content-2': '#060F24',
        'background-content-3': '#050E23',
        'border-titles': '#32BEE7',
        'text': '#ffffff',
        'icons': '#19A6D3'
      },
    },
  },
  plugins: [],
}
