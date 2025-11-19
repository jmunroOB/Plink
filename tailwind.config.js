// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Specify the files Tailwind should scan for CSS classes.
  // This helps Tailwind generate only the CSS you actually use, keeping file sizes small.
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Look for classes in all JS, JSX, TS, TSX files within the src directory
    "./public/index.html",       // Also scan the main HTML file
  ],
  theme: {
    // Extend Tailwind's default theme.
    // You can add custom colors, fonts, spacing, breakpoints, etc., here.
    extend: {
      fontFamily: {
        // Define a custom font family, 'Inter', to be used in your application.
        // This should match the font imported in your index.css.
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        // Define custom colors if needed, e.g., a primary brand color
        // 'primary-black': '#1a1a1a',
      }
    },
  },
  plugins: [
    // Add any Tailwind CSS plugins here.
    // For example, @tailwindcss/forms for better form styling, or @tailwindcss/typography.
  ],
}
