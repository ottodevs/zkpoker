import SoundToggle from '@/components/sound-toggle'
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
        <header className='absolute top-0 right-0 left-0 z-10 flex h-12 items-center justify-between bg-[#112237]/80 px-4 backdrop-blur-sm md:px-6'>
            <div className='flex items-center space-x-4'>
                <Link href='/' className='flex items-center space-x-2'>
                    <Image
                        src='/images/logos/logo.svg'
                        alt='Mental Poker'
                        width={24}
                        height={24}
                        className='h-auto w-auto'
                    />
                    <span className='hidden text-sm font-bold text-white sm:inline'>MENTAL POKER</span>
                </Link>

                {gameInfo && (
                    <div className='flex items-center space-x-2 text-sm text-white/80'>
                        <span className='hidden md:inline'>{gameInfo.type}</span>
                        <span className='hidden md:inline'>•</span>
                        <span>Blinds: {gameInfo.blinds}</span>
                        <span>•</span>
                        <span>
                            Players: {gameInfo.players}/{gameInfo.maxPlayers}
                        </span>
                    </div>
                )}
            </div>

            <div className='flex items-center space-x-3'>
                <SoundToggle />
                <Link
                    href='/'
                    className='rounded-md bg-white/10 px-3 py-1 text-sm font-medium text-white hover:bg-white/20'>
                    Leave Table
                </Link>
            </div>
        </header>
    )
}
