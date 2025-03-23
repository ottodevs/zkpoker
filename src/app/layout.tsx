'use client'

import { WalletModalProvider } from '@/components/WalletModalProvider'
import { WalletProvider } from '@/components/WalletProvider'
import { DecryptPermission, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base'
import { ThemeProvider } from 'next-themes'
import { Geist, Geist_Mono } from 'next/font/google'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ToastContainer } from 'react-toastify'

// base css file
// import '@/assets/css/globals.css'
// import '@/assets/css/range-slider.css'
// import '@/assets/css/scrollbar.css'
// import 'react-toastify/dist/ReactToastify.css'
// import 'swiper/css'
import './globals.css'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

const PROGRAMS = ['credits.aleo', 'zkpoker_v0_1.aleo']
const NETWORK = WalletAdapterNetwork.Testnet

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <html lang='en' suppressHydrationWarning>
            <head>
                <meta name='viewport' content='width=device-width, initial-scale=1 maximum-scale=1' />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <QueryClientProvider client={queryClient}>
                    <WalletProvider
                        network={NETWORK}
                        programs={PROGRAMS}
                        decryptPermission={DecryptPermission.OnChainHistory}
                        autoConnect>
                        <WalletModalProvider
                            decryptPermission={DecryptPermission.OnChainHistory}
                            network={NETWORK}
                            programs={PROGRAMS}>
                            <ThemeProvider attribute='class' enableSystem={false} defaultTheme='dark'>
                                {children}
                            </ThemeProvider>
                        </WalletModalProvider>
                    </WalletProvider>
                </QueryClientProvider>
                <ToastContainer
                    position='top-right'
                    theme='dark'
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    draggable={false}
                    closeOnClick
                    pauseOnHover
                />
            </body>
        </html>
    )
}
