import { Exo } from 'next/font/google'

export const exo = Exo({
    subsets: ['latin'],
    display: 'swap',
    weight: ['400', '500', '700'],
    variable: '--font-exo',
    preload: true,
})
