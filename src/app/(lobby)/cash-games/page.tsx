'use client'

import BuyInOverlay from '@/components/lobby/buy-in-overlay'
import soundService from '@/services/sound-service'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Cash games data
const CASH_GAMES = [
    { svg: 'nlh1020', blinds: '10/20', buyIn: '100 - 1,000', players: 2, minBuyIn: 100, maxBuyIn: 1000 },
    { svg: 'nlh100200', blinds: '100/200', buyIn: '4,000 - 40,000', players: 2, minBuyIn: 4000, maxBuyIn: 40000 },
    { svg: 'nlh5001000', blinds: '500/1,000', buyIn: '20,000 - 200k', players: 2, minBuyIn: 20000, maxBuyIn: 200000 },
    { svg: 'nlh25005000', blinds: '2,500/5,000', buyIn: '100k - 1M', players: 2, minBuyIn: 100000, maxBuyIn: 1000000 },
    {
        svg: 'nlh500010000',
        blinds: '5,000/10,000',
        buyIn: '200k - 2M',
        players: 2,
        minBuyIn: 200000,
        maxBuyIn: 2000000,
    },
]

const JoinButtonBg = () => (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 119 62' fill='none' className='size-full'>
        <path
            d='M15.9296 6.11273C17.1672 2.45877 20.596 0 24.4539 0H109.288C115.449 0 119.789 6.05161 117.812 11.8873L102.909 55.887C101.671 59.541 98.2427 61.9998 94.3848 61.9998H9.55065C3.38932 61.9998 -0.950255 55.9482 1.02635 50.1125L15.9296 6.11273Z'
            fill='url(#paint0_linear_41_28)'
        />
        <defs>
            <linearGradient
                id='paint0_linear_41_28'
                x1='59.4193'
                y1='10.3202'
                x2='59.4193'
                y2='61.9998'
                gradientUnits='userSpaceOnUse'>
                <stop stopColor='#4DF0B4' />
                <stop offset='1' stopColor='#25976C' />
            </linearGradient>
        </defs>
    </svg>
)

export default function CashGamesPage() {
    const router = useRouter()
    const [showBuyIn, setShowBuyIn] = useState(false)
    const [selectedGame, setSelectedGame] = useState<(typeof CASH_GAMES)[0] | null>(null)

    const handleJoinClick = (game: (typeof CASH_GAMES)[0]) => {
        soundService.playSfx('CLICKFX')
        setSelectedGame(game)
        setShowBuyIn(true)
    }

    const handleBuyIn = (avatarIndex: number, amount: number) => {
        soundService.playSfx('CLICKFX')
        setShowBuyIn(false)
        router.push(`/poker-room?avatar=${avatarIndex}&chips=${amount}&blinds=${selectedGame?.blinds}&gameType=cash`)
    }

    return (
        <div className='flex min-h-screen w-full justify-center p-8'>
            <div className='w-full max-w-[1260px] px-4'>
                {/* Header */}
                <div className='relative mb-6 w-[88%]'>
                    <div className='mb-4 grid grid-cols-12 gap-4'>
                        <div className='col-span-3'>
                            <span className='text-2xl font-bold text-white'>CASH GAMES</span>
                        </div>
                        <div className='col-span-3'>
                            <span className='text-lg font-bold text-white'>BLINDS</span>
                        </div>
                        <div className='col-span-4'>
                            <span className='text-lg font-bold text-white'>BUY-IN</span>
                        </div>
                        <div className='right-[18%] col-span-2'>
                            <span className='text-lg font-bold text-white'>ACTION</span>
                        </div>
                    </div>
                    <div className='h-px w-[95%] bg-white/10' />
                </div>

                {/* Games List */}
                <div className='space-y-6'>
                    {CASH_GAMES.map((game, index) => (
                        <div key={index} className='relative w-full'>
                            <div className='grid grid-cols-12 items-center gap-4'>
                                <div className='col-span-10'>
                                    <div className='relative aspect-[8.87/1] w-full'>
                                        <Image
                                            src={`/images/nlh-games/${game.svg}.svg`}
                                            alt={`NLH ${game.blinds}`}
                                            fill
                                            className='object-contain object-left'
                                            priority
                                        />
                                    </div>
                                </div>
                                <div className='absolute top-[12%] right-[19%] col-span-2'>
                                    <div
                                        className='cursor-pointer'
                                        onClick={() => handleJoinClick(game)}
                                        data-action='join-game'>
                                        <div className='relative aspect-[1.919/1] w-[8.73vw] max-w-[90px] min-w-[60px]'>
                                            <JoinButtonBg />
                                            <div className='absolute inset-0 flex items-center justify-center'>
                                                <span className='text-[min(1.6vw,18px)] font-bold text-black'>
                                                    JOIN
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Buy-in Overlay */}
                {selectedGame && (
                    <BuyInOverlay
                        isOpen={showBuyIn}
                        onClose={() => setShowBuyIn(false)}
                        onBuyIn={handleBuyIn}
                        minBuyIn={selectedGame.minBuyIn}
                        maxBuyIn={selectedGame.maxBuyIn}
                        blinds={selectedGame.blinds}
                    />
                )}
            </div>
        </div>
    )
}
