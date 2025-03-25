import NetworkSettings from '@/components/network-settings'
import SoundToggle from '@/components/sound-toggle'
import { ControlButton } from '@/components/ui/control-button'
import WalletInfo from '@/components/wallet-info'
import { ArrowLeftSquare, Blinds, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface GameHeaderProps {
    gameInfo?: {
        type: string
        blinds: string
        players: number
        maxPlayers: number
    }
}

export default function GameHeader({ gameInfo }: GameHeaderProps) {
    return (
        <header className='absolute top-0 right-0 left-0 z-10 flex h-16 items-center justify-between bg-[#112237]/90 px-4 backdrop-blur-sm md:px-6'>
            <div className='flex items-center space-x-4'>
                <Link href='/' className='relative flex h-10 w-60 items-center space-x-2'>
                    <Image src='/images/logos/top-logo.svg' alt='Mental Poker' fill />
                </Link>

                {gameInfo && (
                    <div className='flex items-center space-x-3 rounded-lg bg-[#0A1624]/60 px-3 py-1.5 text-sm text-white/80'>
                        <div className='hidden items-center md:flex'>
                            <span className='mr-2'>{gameInfo.type}</span>
                            <span className='text-white/40'>|</span>
                        </div>
                        <div className='flex items-center'>
                            <Blinds className='mr-1.5 size-4 text-[#4df0b4]/70' />
                            <span>{gameInfo.blinds}</span>
                        </div>
                        <div className='flex items-center'>
                            <Users className='mr-1.5 size-4 text-[#4df0b4]/70' />
                            <span>
                                {gameInfo.players}/{gameInfo.maxPlayers}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className='flex items-center space-x-3'>
                <WalletInfo />
                <NetworkSettings />
                <SoundToggle />
                <ControlButton variant='bordered' onClick={() => (window.location.href = '/')}>
                    <ArrowLeftSquare className='size-4 text-white/80' />
                    <span className='text-sm font-medium text-white'>Leave</span>
                </ControlButton>
            </div>
        </header>
    )
}
