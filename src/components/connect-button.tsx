'use client'

import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui'
import { Wallet } from 'lucide-react'

export function ConnectButton() {
    const { connecting, connected } = useWallet()

    return (
        <WalletMultiButton
            disabled={connecting}
            className='relative flex h-10 w-42 cursor-pointer items-center justify-center rounded-lg border border-[#55ffbe]/50 bg-gradient-to-b from-[#4DF0B4] to-[#25976C] px-4 py-0 text-sm font-medium text-[#0d1c2e] shadow-[0_0_8px_rgba(77,240,180,0.25)] transition-all duration-150 hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(77,240,180,0.4)] hover:brightness-105 active:translate-y-1 active:scale-95 active:shadow-inner active:brightness-95'>
            {!connected && (
                <div className='flex items-center gap-2'>
                    <Wallet className='size-4' />
                    <span>Connect</span>
                </div>
            )}
        </WalletMultiButton>
    )
}
