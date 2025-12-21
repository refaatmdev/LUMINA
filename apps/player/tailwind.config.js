/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            animation: {
                'blob-1': 'blob-bounce 20s infinite ease-in-out',
                'blob-2': 'blob-drift 25s infinite linear',
                'blob-3': 'blob-pulse 15s infinite ease-in-out',
            },
            keyframes: {
                'blob-bounce': {
                    '0%': { transform: 'translate(0, 0) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0, 0) scale(1)' },
                },
                'blob-drift': {
                    '0%': { transform: 'translate(0, 0) rotate(0deg)' },
                    '50%': { transform: 'translate(50px, 50px) rotate(180deg)' },
                    '100%': { transform: 'translate(0, 0) rotate(360deg)' },
                },
                'blob-pulse': {
                    '0%': { transform: 'scale(1) translate(0, 0)', opacity: '0.8' },
                    '50%': { transform: 'scale(1.2) translate(-30px, 30px)', opacity: '0.5' },
                    '100%': { transform: 'scale(1) translate(0, 0)', opacity: '0.8' },
                },
            },
        },
    },
    plugins: [],
};
