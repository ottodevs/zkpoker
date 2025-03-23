'use client'

import BuyInOverlay from '@/components/BuyInOverlay'
import Header from '@/components/Header'
import { Exo } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const exo = Exo({
    subsets: ['latin'],
    display: 'swap',
    weight: ['400', '500', '700'],
})

const TOURNAMENTS = [
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
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='119'
        height='62'
        viewBox='0 0 119 62'
        fill='none'
        className='absolute inset-0'>
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

export default function Tournaments() {
    const router = useRouter()
    const [showBuyIn, setShowBuyIn] = useState(false)
    const [selectedTournament, setSelectedTournament] = useState<(typeof TOURNAMENTS)[0] | null>(null)

    const handleJoinClick = (tournament: (typeof TOURNAMENTS)[0]) => {
        setSelectedTournament(tournament)
        setShowBuyIn(true)
    }

    const handleBuyIn = (avatarIndex: number, amount: number) => {
        // Close the overlay
        setShowBuyIn(false)

        // Add console logs to track what's being passed
        console.log('Selected avatar index:', avatarIndex)
        console.log('Buy-in amount:', amount)
        console.log('Selected blinds:', selectedTournament?.blinds)

        // In a real app, you'd likely store this information in a state management solution
        // For now, we'll redirect to a poker room with query params
        router.push(
            `/poker-room?avatar=${avatarIndex}&chips=${amount}&blinds=${selectedTournament?.blinds}&gameType=tournament`,
        )
    }

    return (
        <div className='flex min-h-screen flex-col bg-[#0E1C2E]'>
            {/* Header */}
            <Header />

            {/* Main Content */}
            <div className='flex flex-1 bg-[#18293E]'>
                {/* Sidebar */}
                <div className={`w-[271px] min-w-[271px] border-r border-r-[#153F59] bg-[#112237] ${exo.className}`}>
                    <div className='flex flex-col space-y-4 p-5'>
                        <Link
                            href='/'
                            className='flex items-center rounded-[13px] px-[18px] py-[11px] text-2xl font-bold text-white hover:bg-white/5'>
                            HOME
                        </Link>
                        <Link href='/tournaments' className='relative h-[54px] w-full'>
                            <div className='absolute h-[54px] w-full rounded-[13px] bg-white/5'>
                                <div className='absolute top-[11px] left-[18px] text-2xl font-bold text-white'>
                                    TOURNAMENTS
                                </div>
                            </div>
                        </Link>
                        <Link
                            href='/cash-games'
                            className='flex items-center rounded-[13px] px-[18px] py-[11px] text-2xl font-bold text-white hover:bg-white/5'>
                            CASH GAMES
                        </Link>
                    </div>
                </div>

                {/* Main Area */}
                <div className='flex-1 p-8'>
                    <div className='mx-auto w-full max-w-[1260px]'>
                        {/* Header */}
                        <div className='mb-6 flex flex-col'>
                            <div className='mb-4 flex items-center text-white'>
                                <h1 className={`text-2xl font-bold ${exo.className} w-[300px]`}>TOURNAMENTS</h1>
                                <div className={`flex ${exo.className} ml-[200px]`}>
                                    <span className='-ml-4 w-[300px] text-lg font-bold'>BLINDS</span>
                                    <span className='ml-56 w-[300px] text-lg font-bold'>BUY-IN</span>
                                    <span className='-ml-40 text-lg font-bold'>ACTION</span>
                                </div>
                            </div>
                            <div className='h-px bg-white/10' />
                        </div>

                        {/* Game Cards */}
                        <div className='space-y-6'>
                            {TOURNAMENTS.map((tournament, index) => (
                                <div key={index} className='relative flex w-full items-center'>
                                    <Image
                                        src={`/nlh-games/${tournament.svg}.svg`}
                                        alt={`NLH ${tournament.blinds}`}
                                        width={1260}
                                        height={80}
                                        className='h-auto w-full'
                                        style={{ height: 'auto' }}
                                    />
                                    <div
                                        className='absolute top-7 right-8 h-[62px] w-[124.839px] cursor-pointer'
                                        onClick={() => handleJoinClick(tournament)}>
                                        <JoinButtonBg />
                                        <div className='absolute inset-0 flex items-center justify-center'>
                                            <span className={`text-xl font-bold text-black ${exo.className}`}>
                                                JOIN
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Buy-in Overlay */}
            {selectedTournament && (
                <BuyInOverlay
                    isOpen={showBuyIn}
                    onClose={() => setShowBuyIn(false)}
                    onBuyIn={handleBuyIn}
                    minBuyIn={selectedTournament.minBuyIn}
                    maxBuyIn={selectedTournament.maxBuyIn}
                    blinds={selectedTournament.blinds}
                />
            )}
        </div>
    )
}
