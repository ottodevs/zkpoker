'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ConnectButton } from './connect-button'
import GameModeToggle from './game-mode-toggle'
import NetworkSettings from './network-settings'
import SoundToggle from './sound-toggle'
import WalletInfo from './wallet-info'

interface HeaderProps {
    onToggleMode?: (mode: string) => void
}

export default function Header({ onToggleMode }: HeaderProps) {
    const [mode, setMode] = useState('real')

    return (
        <header className='flex h-16 items-center justify-between bg-[#0E1C2E] px-4 md:px-6'>
            <div className='flex items-center gap-6'>
                <NetworkSettings />
                <GameModeToggle
                    mode={mode}
                    setMode={setMode}
                    onToggleMode={
                        onToggleMode ??
                        (() => {
                            console.log('onToggleMode not provided')
                        })
                    }
                />
                <Link href='/' className='relative flex h-10 w-60 items-center space-x-2'>
                    <Image src='/images/logos/top-logo.svg' alt='Mental Poker' fill />
                </Link>
            </div>
            <div className='flex items-center gap-6'>
                <WalletInfo />
                <SoundToggle />
                <ConnectButton />
            </div>
        </header>
    )
}
