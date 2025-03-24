'use client'

import { DecryptPermission, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base'
import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react'
import { WalletModalProvider } from '@demox-labs/aleo-wallet-adapter-reactui'
import { LeoWalletAdapter, PuzzleWalletAdapter } from 'aleo-adapters'
import { useMemo } from 'react'

import '@demox-labs/aleo-wallet-adapter-reactui/styles.css'

export default function Providers({ children }: { children: React.ReactNode }) {
    const wallets = useMemo(
        () => [
            new LeoWalletAdapter({
                appName: 'ZKPoker',
                isMobile: true,
                mobileWebviewUrl: 'https://puzzlewallet.com',
            }),
            new PuzzleWalletAdapter({
                programIdPermissions: {
                    [WalletAdapterNetwork.TestnetBeta]: ['credits.aleo'],
                },
            }),
        ],
        [],
    )

    return (
        <WalletProvider
            wallets={wallets}
            decryptPermission={DecryptPermission.AutoDecrypt}
            programs={['credits.aleo']}
            network={'testnetbeta' as WalletAdapterNetwork}
            autoConnect>
            <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
    )
}
