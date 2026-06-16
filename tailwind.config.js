/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-transparent', 'border-zinc-600', 'text-zinc-100',
    'bg-zinc-700', 'border-zinc-700',
    'bg-amber-500', 'border-amber-500', 'text-white',
    'bg-emerald-600', 'border-emerald-600'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
