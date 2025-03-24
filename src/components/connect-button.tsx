'use client'

import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui'

export function ConnectButton() {
    const { connecting } = useWallet()

    return (
        <WalletMultiButton
            disabled={connecting}
            className='relative size-full cursor-pointer rounded-lg border border-[#55ffbe]/50 bg-gradient-to-b from-[#4DF0B4] to-[#25976C] px-[12px] py-[10px] shadow-[0_0_8px_rgba(77,240,180,0.25)] transition-all duration-150 before:absolute before:-inset-1 before:-z-10 before:rounded-xl before:bg-gradient-to-r before:from-[#4DF0B4]/20 before:via-[#76ffce]/20 before:to-[#4DF0B4]/20 before:opacity-0 before:blur-sm before:transition-all before:duration-150 before:content-[""] hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(77,240,180,0.4)] hover:brightness-105 hover:before:opacity-100 hover:before:blur-md active:translate-y-1 active:scale-95 active:shadow-inner active:brightness-95'
        />
    )
}
