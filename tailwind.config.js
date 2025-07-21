const { platformSelect, platformColor } = require('nativewind/theme');
const { error } = require('console');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        error: platformSelect({
          ios: platformColor('systemRed'),
          android: platformColor('?android:colorError'),
          default: 'red',
        }),
      }
    },
  },
  plugins: [],
}