/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6', // blue-500
          hover: '#2563eb',   // blue-600
          dark: '#1d4ed8',    // blue-700
        },
        secondary: '#64748b', // slate-500
        accent: '#f59e0b',    // amber-500
        danger: '#ef4444',    // red-500
        success: '#10b981',   // emerald-500
        surface: {
          DEFAULT: '#ffffff',
          hover: '#f1f5f9',
        },
        background: '#f8fafc', // slate-50
      },
    },
  },
  plugins: [],
}
