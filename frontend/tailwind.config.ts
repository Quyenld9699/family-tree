import type { Config } from 'tailwindcss';

export default {
    content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}', './src/views/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                canvas: '#fefef9',
                'surface-card': '#f9f7f2',
                'surface-soft': '#fbfaf6',
                hairline: '#e5e5e5',
                ink: '#0a0a0a',
                'brand-pink': '#ff4d8b',
                'brand-teal': '#1a3a3a',
                'brand-ochre': '#e8b94a',
                'brand-lavender': '#b8a4ed',
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
            },
            borderRadius: {
                clay: '12px',
                'clay-lg': '16px',
                'clay-xl': '24px',
            },
        },
    },
    plugins: [],
} satisfies Config;
