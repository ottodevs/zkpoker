'use client'

import { ConnectButton } from '@/components/connect-button'
import useWalletBalance from '@/hooks/use-wallet-balance'
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

// Console logging with emojis for better debugging
const logAction = (action: string, message: string) => console.log(`🎮 [Lobby-${action}] ${message}`)

const GameTypes = ['cash', 'tournament'] as const
type GameType = (typeof GameTypes)[number]

const BlindsOptions = ['5/10', '10/20', '25/50', '50/100', '100/200', '250/500', '500/1000'] as const
type BlindsOption = (typeof BlindsOptions)[number]

export default function LobbyPage() {
    const { connected, publicKey } = useWallet()
    const { balance, isLoading: isBalanceLoading, error: balanceError } = useWalletBalance()
    const router = useRouter()

    // Game setup state
    const [gameType, setGameType] = useState<GameType>('cash')
    const [blinds, setBlinds] = useState<BlindsOption>('10/20')
    const [buyInAmount, setBuyInAmount] = useState<number>(100)
    const [isCreatingGame, setIsCreatingGame] = useState(false)

    // Input validation
    const isValidAmount = useCallback(() => {
        if (!connected || !publicKey) return false
        if (isBalanceLoading || balanceError) return false
        if (!balance) return false

        return buyInAmount > 0 && buyInAmount <= balance
    }, [connected, publicKey, balance, buyInAmount, isBalanceLoading, balanceError])

    // Handle play button click
    const handlePlay = useCallback(() => {
        if (!isValidAmount()) return

        logAction('Play', `Creating game with buy-in: ${buyInAmount} credits`)
        setIsCreatingGame(true)

        // Simulate game creation - in a real app this would interact with the blockchain
        setTimeout(() => {
            setIsCreatingGame(false)

            // Navigate to the poker room with game parameters
            router.push(
                `/poker-room?gameType=${gameType}&blinds=${blinds}&buyIn=${buyInAmount}&avatar=${Math.floor(
                    Math.random() * 8,
                )}`,
            )
        }, 1500)
    }, [gameType, blinds, buyInAmount, router, isValidAmount])

    // Format credits with 2 decimal places
    const formatCredits = (amount: number | null) => {
        if (amount === null) return '0.00'
        return amount.toFixed(2)
    }

    // Calculate big blind value from blinds string (e.g., "10/20" => 20)
    const getBigBlind = (blindsStr: string): number => {
        const parts = blindsStr.split('/')
        return parseInt(parts[1]) || 0
    }

    // Reset buy-in amount when blinds change
    useEffect(() => {
        const bigBlind = getBigBlind(blinds)
        setBuyInAmount(bigBlind * 100) // Default buy-in = 100x big blind
    }, [blinds])

    return (
        <main className='flex min-h-screen w-full flex-col items-center justify-center bg-[url("/images/lobby/poker-background.png")] bg-cover bg-center bg-no-repeat'>
            <div className='container mx-auto flex max-w-6xl flex-col items-center p-4'>
                <h1 className='mb-8 text-center text-4xl font-bold text-white md:text-5xl lg:text-6xl'>
                    ZK Poker <span className='text-[#4df0b4]'>Lobby</span>
                </h1>

                <div className='mb-6 w-full max-w-lg'>
                    <div className='mb-4 flex w-full justify-center'>
                        <div className='h-12 w-48'>
                            <ConnectButton />
                        </div>
                    </div>

                    {connected && publicKey ? (
                        <div className='rounded-lg border border-[#4df0b4]/40 bg-black/70 p-6 shadow-[0_0_15px_rgba(77,240,180,0.3)]'>
                            <h2 className='mb-4 text-2xl text-[#4df0b4]'>Game Setup</h2>

                            {/* Game Type Selection */}
                            <div className='mb-4'>
                                <label className='mb-2 block text-white'>Game Type</label>
                                <div className='flex gap-4'>
                                    {GameTypes.map(type => (
                                        <button
                                            key={type}
                                            className={`flex-1 rounded-md border px-4 py-2 transition-all ${
                                                gameType === type
                                                    ? 'border-[#4df0b4] bg-[#4df0b4]/20 text-[#4df0b4]'
                                                    : 'border-gray-600 bg-black/50 text-gray-300 hover:border-[#4df0b4]/50 hover:bg-[#4df0b4]/10'
                                            }`}
                                            onClick={() => setGameType(type)}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Blinds Selection */}
                            <div className='mb-4'>
                                <label className='mb-2 block text-white'>Blinds</label>
                                <select
                                    value={blinds}
                                    onChange={e => setBlinds(e.target.value as BlindsOption)}
                                    className='w-full rounded-md border border-gray-600 bg-black/80 px-4 py-2 text-white focus:border-[#4df0b4] focus:ring-1 focus:ring-[#4df0b4] focus:outline-none'>
                                    {BlindsOptions.map(option => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Buy-in Amount */}
                            <div className='mb-6'>
                                <div className='mb-2 flex items-center justify-between'>
                                    <label className='text-white'>Buy-in Amount</label>
                                    <div className='flex items-center gap-1 text-sm text-gray-300'>
                                        <span>Balance: </span>
                                        <div className='flex items-center gap-1'>
                                            <div className='flex h-4 w-4 items-center justify-center rounded-full bg-[#121212]'>
                                                <Image
                                                    src='/images/icons/aleo-icon.svg'
                                                    alt='Aleo'
                                                    width={8}
                                                    height={8}
                                                    style={{ height: 'auto', width: 'auto' }}
                                                />
                                            </div>
                                            <span className='font-medium'>
                                                {isBalanceLoading ? '...' : formatCredits(balance)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className='relative'>
                                    <input
                                        type='number'
                                        value={buyInAmount}
                                        onChange={e => setBuyInAmount(Math.max(0, Number(e.target.value)))}
                                        className={`w-full rounded-md border px-4 py-2 pr-16 text-white focus:ring-1 focus:outline-none ${
                                            isValidAmount()
                                                ? 'border-gray-600 bg-black/80 focus:border-[#4df0b4] focus:ring-[#4df0b4]'
                                                : 'border-red-500 bg-red-900/30 focus:border-red-500 focus:ring-red-500'
                                        }`}
                                    />
                                    <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
                                        <span className='text-gray-400'>credits</span>
                                    </div>
                                </div>
                                {!isValidAmount() && balance !== null && (
                                    <p className='mt-1 text-sm text-red-400'>
                                        {buyInAmount <= 0
                                            ? 'Buy-in amount must be greater than 0'
                                            : `Insufficient balance. Maximum: ${formatCredits(balance)} credits`}
                                    </p>
                                )}
                                {balanceError && (
                                    <p className='mt-1 text-sm text-red-400'>Error getting balance: {balanceError}</p>
                                )}
                            </div>

                            {/* Play Button */}
                            <button
                                onClick={handlePlay}
                                disabled={!isValidAmount() || isCreatingGame}
                                className={`group relative w-full overflow-hidden rounded-lg py-3 text-center text-lg font-bold transition-all ${
                                    isValidAmount() && !isCreatingGame
                                        ? 'border border-[#55ffbe]/50 bg-gradient-to-b from-[#4df0b4] to-[#25976c] text-black shadow-[0_0_8px_rgba(77,240,180,0.25)] hover:scale-[1.01] hover:shadow-[0_0_12px_rgba(77,240,180,0.4)] hover:brightness-105 active:translate-y-1 active:scale-95 active:shadow-inner active:brightness-95'
                                        : 'cursor-not-allowed border border-gray-700 bg-gray-800/50 text-gray-500'
                                }`}>
                                <span
                                    className={`absolute inset-0 translate-y-full bg-gradient-to-b from-[#27d89e] to-[#25976c] transition-transform duration-300 ${
                                        isValidAmount() && !isCreatingGame ? 'group-hover:translate-y-0' : ''
                                    }`}
                                />
                                <span className='relative'>{isCreatingGame ? 'Creating Game...' : 'Play Poker'}</span>
                            </button>
                        </div>
                    ) : (
                        <div className='rounded-lg border border-[#4df0b4]/20 bg-black/70 p-6 text-center shadow-[0_0_15px_rgba(77,240,180,0.15)]'>
                            <p className='mb-4 text-lg text-gray-300'>Connect your wallet to play ZK Poker</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
