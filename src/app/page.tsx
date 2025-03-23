'use client'

import BuyInOverlay from '@/components/BuyInOverlay'
import Header from '@/components/Header'
import soundService from '@/services/SoundService'
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'
import { Exo } from 'next/font/google'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import aleoLogo from '../../public/aleo-logo.svg'
import cursorLogo from '../../public/cursor-logo.svg'
import ethglobalLogo from '../../public/ethglobal-logo.svg'
import provableLogo from '../../public/provable-logo.svg'

const exo = Exo({
    subsets: ['latin'],
    display: 'swap',
    weight: ['400', '500', '700'],
})

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

export default function Dashboard() {
    const router = useRouter()
    const { connected } = useWallet()
    const [hyperTurbo, setHyperTurbo] = useState(true)
    const [currentView, setCurrentView] = useState<'home' | 'tournaments' | 'cash-games'>('home')
    const [showBuyIn, setShowBuyIn] = useState(false)
    const [selectedGame, setSelectedGame] = useState<(typeof CASH_GAMES)[0] | null>(null)

    // Initialize background music when the component mounts
    useEffect(() => {
        // For browsers with autoplay restrictions, we need user interaction
        // Create a one-time click handler to enable audio
        const enableAudio = () => {
            soundService.preloadLobbyMusic()
            soundService.playMusic('LOBBY')
            // Remove the event listener once it's used
            document.removeEventListener('click', enableAudio)
        }

        // Try to play immediately, but set up the click handler as fallback
        soundService.preloadLobbyMusic()
        soundService.playMusic('LOBBY')
        document.addEventListener('click', enableAudio, { once: true })

        // Cleanup on unmount
        return () => {
            soundService.stopMusic()
            document.removeEventListener('click', enableAudio)
        }
    }, [])

    // Actualizar useEffect para que verifique la conexión de la wallet
    useEffect(() => {
        // Precargar efectos de sonido del juego
        soundService.preloadLobbyMusic()

        // Verificar si el usuario está intentando unirse a una mesa sin estar conectado
        const handleJoinGameWithoutWallet = (e: MouseEvent) => {
            if (!connected && e.target && (e.target as Element).closest('[data-action="join-game"]')) {
                e.preventDefault()
                e.stopPropagation()

                // Mostrar alerta
                alert('Please connect your wallet before joining a game.')

                // No permitir la navegación
                return false
            }
        }

        // Agregar listener para capturar clicks en botones de unirse a juego
        document.addEventListener('click', handleJoinGameWithoutWallet, true)

        // Cleanup
        return () => {
            soundService.stopMusic()
            document.removeEventListener('click', handleJoinGameWithoutWallet, true)
        }
    }, [connected])

    const handleJoinClick = (game: (typeof CASH_GAMES)[0]) => {
        if (!connected) {
            alert('Please connect your wallet before joining a game.')
            return
        }

        soundService.playSfx('CLICKFX')
        setSelectedGame(game)
        setShowBuyIn(true)
    }

    const handleBuyIn = (avatarIndex: number, amount: number) => {
        soundService.playSfx('CLICKFX')
        setShowBuyIn(false)
        router.push(`/poker-room?avatar=${avatarIndex}&chips=${amount}&blinds=${selectedGame?.blinds}&gameType=cash`)
    }

    // Render the main content based on current view
    const renderMainContent = () => {
        switch (currentView) {
            case 'tournaments':
                return (
                    <div className='mx-auto w-full max-w-[1260px]'>
                        <div className='mb-6 flex flex-col'>
                            <div className='mb-4 flex items-center text-white'>
                                <h1 className={`text-2xl font-bold ${exo.className}`}>TOURNAMENTS</h1>
                            </div>
                            <div className='h-px bg-white/10' />
                        </div>
                        <div className='text-lg text-white'>Tournaments coming soon...</div>
                    </div>
                )

            case 'cash-games':
                return (
                    <div className='mx-auto w-full max-w-[1260px]'>
                        <div className='mb-6 flex flex-col'>
                            <div className='mb-4 flex items-center text-white'>
                                <h1 className={`text-2xl font-bold ${exo.className} w-[300px]`}>CASH GAMES</h1>
                                <div className={`flex ${exo.className} ml-[200px]`}>
                                    <span className='-ml-4 w-[300px] text-lg font-bold'>BLINDS</span>
                                    <span className='ml-56 w-[300px] text-lg font-bold'>BUY-IN</span>
                                    <span className='-ml-40 text-lg font-bold'>ACTION</span>
                                </div>
                            </div>
                            <div className='h-px bg-white/10' />
                        </div>

                        <div className='space-y-6'>
                            {CASH_GAMES.map((game, index) => (
                                <div key={index} className='relative flex w-full items-center'>
                                    <Image
                                        src={`/nlh-games/${game.svg}.svg`}
                                        alt={`NLH ${game.blinds}`}
                                        width={1260}
                                        height={80}
                                        className='h-auto w-full'
                                        style={{ height: 'auto' }}
                                    />
                                    <div
                                        className='absolute top-7 right-8 h-[62px] w-[124.839px] cursor-pointer'
                                        onClick={() => handleJoinClick(game)}
                                        data-action='join-game'>
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
                )

            default: // Home view
                return (
                    <div className='relative mx-auto h-[793px] w-full max-w-[1281px]'>
                        <div className='absolute top-14 left-0 h-[698px] w-full rounded-tl-3xl rounded-tr-3xl bg-[#142030]'>
                            <div className='absolute inset-0 h-full w-full'>
                                <Image
                                    src='/dashboard-bg.png'
                                    alt='Dashboard Background'
                                    fill
                                    sizes='100vw'
                                    style={{ objectFit: 'cover' }}
                                    priority
                                />
                            </div>

                            {/* Sponsor Logos */}
                            <div className='absolute -bottom-52 left-1/2 flex w-full max-w-4xl -translate-x-1/2 transform items-center justify-center space-x-4 px-4 md:space-x-8 lg:space-x-16'>
                                <Image
                                    src={provableLogo}
                                    alt='Provable'
                                    width={120}
                                    height={40}
                                    className='w-auto sm:h-6 md:h-8 lg:h-10'
                                    loader={({ src, width, quality }) => {
                                        return `${src}?w=${width}&q=${quality || 75}`
                                    }}
                                />
                                <Image
                                    src={aleoLogo}
                                    alt='Aleo'
                                    width={100}
                                    height={30}
                                    className='w-auto sm:h-6 md:h-7 lg:h-8'
                                    loader={({ src, width, quality }) => {
                                        return `${src}?w=${width}&q=${quality || 75}`
                                    }}
                                />
                                <Image
                                    src={ethglobalLogo}
                                    alt='ETHGlobal'
                                    width={120}
                                    height={40}
                                    className='w-auto sm:h-6 md:h-8 lg:h-10'
                                    loader={({ src, width, quality }) => {
                                        return `${src}?w=${width}&q=${quality || 75}`
                                    }}
                                />
                                <Image
                                    src={cursorLogo}
                                    alt='Cursor'
                                    width={100}
                                    height={30}
                                    className='w-auto sm:h-5 md:h-6 lg:h-7'
                                    loader={({ src, width, quality }) => {
                                        return `${src}?w=${width}&q=${quality || 75}`
                                    }}
                                />
                            </div>

                            <div className='absolute right-[64px] bottom-[124px] w-[600px]'>
                                <div className='text-left'>
                                    <div className='mb-2 flex flex-col rounded-[13px] bg-white/5 p-[32px] text-left backdrop-blur-lg backdrop-filter'>
                                        <h2 className={`mb-4 text-[16px] font-bold text-white/80 ${exo.className}`}>
                                            Select Avatar
                                        </h2>
                                        <div className='flex justify-between gap-4'>
                                            {[1, 2, 3, 4, 5].map(num => (
                                                <div
                                                    key={num}
                                                    className={`h-20 w-20 rounded-full ${num === 1 ? 'border-3 border-[#55ffbe]' : ''} overflow-hidden`}>
                                                    <Image
                                                        src={`/avatar${num}.png`}
                                                        alt={`Avatar ${num}`}
                                                        width={80}
                                                        height={80}
                                                        priority
                                                        unoptimized={num === 1}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className='rounded-[13px] bg-white/5 p-[32px] backdrop-blur-lg backdrop-filter'>
                                        <h2 className={`mb-4 text-[16px] font-bold text-white/80 ${exo.className}`}>
                                            Enter Amount
                                        </h2>
                                        <div className='flex items-center'>
                                            <div className='flex-1'>
                                                <input
                                                    type='text'
                                                    defaultValue='0.00'
                                                    className={`mb-2 inline-flex h-[48px] w-[354px] items-center justify-center rounded-[13px] bg-white/5 px-4 text-white outline-2 outline-[#e7e7e7]/20 ${exo.className}`}
                                                />
                                                <div className='flex gap-2'>
                                                    {['5', '10', '50', 'MAX'].map(value => (
                                                        <div
                                                            key={value}
                                                            className='inline-flex h-12 w-[83px] cursor-pointer items-center justify-center gap-2.5 rounded-[13px] bg-white/5 px-[37px] py-2.5 outline-2 outline-[#e7e7e7]/20'>
                                                            <div
                                                                className={`text-center text-lg font-bold text-white ${exo.className}`}>
                                                                {value}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className='flex cursor-pointer items-center'>
                                                <Image
                                                    src='/play-button.svg'
                                                    alt='Play'
                                                    width={172}
                                                    height={108}
                                                    priority
                                                    className='h-auto w-auto'
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='absolute top-[691px] left-0 flex h-[102px] w-full items-center justify-between rounded-br-3xl rounded-bl-3xl border-2 border-[#37455e] bg-[#27374a] px-8'>
                            <div className='flex items-center gap-3'>
                                <Image
                                    src='/bottom-logo-faded.svg'
                                    alt='Mental Poker'
                                    width={268}
                                    height={30}
                                    className='h-auto w-auto'
                                />
                            </div>

                            <div className='flex items-center'>
                                <div className='relative inline-block'>
                                    <input
                                        type='checkbox'
                                        id='hyperTurbo'
                                        className='sr-only'
                                        checked={hyperTurbo}
                                        onChange={() => setHyperTurbo(!hyperTurbo)}
                                    />
                                    <div
                                        className={`flex h-[28px] w-[50px] items-center p-[2px] ${
                                            hyperTurbo
                                                ? 'justify-end bg-gradient-to-b from-[#4DF0B4] from-[16.65%] to-[#25976C] to-[100%]'
                                                : 'justify-start bg-gray-400'
                                        } rounded-full transition-all duration-200`}>
                                        <div className='h-[24px] w-[24px] rounded-full bg-white shadow-md' />
                                    </div>
                                </div>
                                <div className={`ml-2 font-bold text-white ${exo.className}`}>Hyper turbo</div>
                            </div>
                        </div>
                    </div>
                )
        }
    }

    return (
        <div className='flex min-h-screen flex-col bg-[#0E1C2E]'>
            <Header />

            <div className='flex flex-1 bg-[#18293E]'>
                {/* Sidebar */}
                <div className={`w-[271px] min-w-[271px] bg-[#112237] ${exo.className}`}>
                    <div className='flex flex-col space-y-4 p-5'>
                        <div
                            className={`relative h-[54px] w-full cursor-pointer ${currentView === 'home' ? 'bg-white/5' : 'hover:bg-white/5'} rounded-[13px]`}
                            onClick={() => setCurrentView('home')}>
                            <div className='absolute top-[11px] left-[18px] text-2xl font-bold text-white'>HOME</div>
                        </div>
                        <div
                            className={`flex cursor-pointer items-center px-[18px] py-[11px] text-2xl font-bold text-white ${currentView === 'tournaments' ? 'bg-white/5' : 'hover:bg-white/5'} rounded-[13px]`}
                            onClick={() => setCurrentView('tournaments')}>
                            TOURNAMENTS
                        </div>
                        <div
                            className={`flex cursor-pointer items-center px-[18px] py-[11px] text-2xl font-bold text-white ${currentView === 'cash-games' ? 'bg-white/5' : 'hover:bg-white/5'} rounded-[13px]`}
                            onClick={() => setCurrentView('cash-games')}>
                            CASH GAMES
                        </div>
                    </div>
                </div>

                {/* Main Area */}
                <div className='flex-1 p-8'>{renderMainContent()}</div>
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
    )
}
