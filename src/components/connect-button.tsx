'use client'

import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui'

export function ConnectButton() {
    const { connecting } = useWallet()

    return (
        <div className='group relative cursor-pointer overflow-visible transition-transform duration-150 active:translate-y-1 active:scale-95'>
            <div className='animate-gradient-x absolute -inset-3 -z-10 rounded-xl bg-gradient-to-r from-[#4DF0B4] via-[#76ffce] to-[#4DF0B4] opacity-80 blur-sm transition-all duration-150 group-hover:opacity-100 group-hover:blur-md' />
            <div className='relative h-[48px] overflow-hidden rounded-lg border border-[#55ffbe]/50 shadow-[0_0_15px_rgba(77,240,180,0.5)] transition-all duration-150 group-hover:shadow-[0_0_25px_rgba(77,240,180,0.8)] group-active:shadow-inner'>
                <WalletMultiButton
                    disabled={connecting}
                    className='from-16.65% size-full bg-gradient-to-b from-[#4DF0B4] to-[#25976C] to-100% px-[12px] py-[10px] transition-all duration-150 group-hover:scale-[1.02] hover:brightness-110 active:brightness-90'
                />
            </div>
        </div>
    )
}
