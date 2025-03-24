import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
    title: 'Mental Poker',
    description: 'A provably fair poker platform built on zero-knowledge technology',
    applicationName: 'Mental Poker',
    keywords: ['poker', 'blockchain', 'zero-knowledge', 'provably fair', 'gaming'],
    authors: [{ name: 'Mental Poker Team' }],
    // manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        title: 'Mental Poker',
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#0E1C2E',
    colorScheme: 'dark',
}
