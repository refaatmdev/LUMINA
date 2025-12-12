/** @type {import('tailwindcss').Config} */
import sharedPreset from '../../packages/shared/tailwind.preset.js';

export default {
    presets: [sharedPreset],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "../../packages/shared/src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
