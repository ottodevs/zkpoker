import { PuzzleWalletAdapter } from '@/lib/wallet-adapters/puzzle-wallet'
import type { DecryptPermission, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base'
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo'
import { WalletProvider as BaseWalletProvider } from '@demox-labs/aleo-wallet-adapter-react'
import { useMemo } from 'react'

interface Props {
    children: React.ReactNode
    network: WalletAdapterNetwork
    programs: string[]
    decryptPermission: DecryptPermission
    autoConnect?: boolean
}

export function WalletProvider({ children, network, programs, decryptPermission, autoConnect }: Props) {
    const wallets = useMemo(
        () => [new LeoWalletAdapter({ appName: 'ZK Poker' }), new PuzzleWalletAdapter({ appName: 'ZK Poker' })],
        [],
    )

    return (
        <BaseWalletProvider
            wallets={wallets}
            decryptPermission={decryptPermission}
            network={network}
            programs={programs}
            autoConnect={autoConnect}>
            {children}
        </BaseWalletProvider>
    )
}
