import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "../../packages/shared/src/**/*.{js,ts,jsx,tsx}", // Include shared components
    ],
    presets: [
        require('../../packages/shared/tailwind.preset.js')
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
export default config;
