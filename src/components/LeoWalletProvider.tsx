'use client'

import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react'
import { FoxWalletAdapter, LeoWalletAdapter, PuzzleWalletAdapter, SoterWalletAdapter } from 'aleo-adapters'
import { useMemo, type ReactNode } from 'react'

interface LeoWalletProviderProps {
    children: ReactNode
}

export function LeoWalletProvider({ children }: LeoWalletProviderProps) {
    // Initialize all available adapters
    const wallets = useMemo(
        () => [
            new LeoWalletAdapter({
                appName: 'ZK Poker',
            }),
            new PuzzleWalletAdapter({
                programIdPermissions: {
                    testnet3: ['mental_poker_trifecta.aleo'],
                },
                appName: 'ZK Poker',
                appDescription: 'ZK Poker game on Aleo blockchain',
                appIconUrl:
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            }),
            new FoxWalletAdapter({
                appName: 'ZK Poker',
            }),
            new SoterWalletAdapter({
                appName: 'ZK Poker',
            }),
        ],
        [],
    )

    const onError = (error: Error) => {
        console.error('Wallet error:', error)
        if (error instanceof Error) {
            console.error('Error name:', error.name)
            console.error('Error message:', error.message)
            console.error('Stack trace:', error.stack)
            console.error('Full error object:', JSON.stringify(error, null, 2))
        }
    }

    return (
        <WalletProvider wallets={wallets} onError={onError} autoConnect>
            {children}
        </WalletProvider>
    )
}

export default LeoWalletProvider
