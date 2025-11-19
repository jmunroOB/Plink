// postcss.config.js
module.exports = {
  // Plugins for PostCSS to process your CSS.
  // Tailwind CSS is a PostCSS plugin.
  plugins: {
    // Tailwind CSS plugin. It reads your tailwind.config.js for configuration.
    tailwindcss: {},
    // Autoprefixer is a PostCSS plugin to parse CSS and add vendor prefixes
    // to CSS rules using values from Can I Use. It's highly recommended.
    autoprefixer: {},
  },
};