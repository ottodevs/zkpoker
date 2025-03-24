'use client'

import soundService from '@/services/SoundService'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface ErrorCardProps {
    rotate: number
    delay: number
    position: [number, number]
}

// Animated error card component
const ErrorCard = ({ rotate, delay, position }: ErrorCardProps) => {
    return (
        <div
            className='absolute'
            style={{
                transform: `rotate(${rotate}deg)`,
                animation: `errorCardFall 1.2s ease-in forwards ${delay}s`,
                left: `${position[0]}%`,
                top: `${position[1]}%`,
            }}>
            <Image src='/backofcard.png' alt='Card' width={80} height={120} className='drop-shadow-2xl' priority />
        </div>
    )
}

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const [showDebug, setShowDebug] = useState(false)
    const [countdown, setCountdown] = useState(5)

    // Generate random positions for the falling cards
    const randomPositions: [number, number][] = Array(8)
        .fill(0)
        .map(() => [
            Math.random() * 80 + 10, // X position: 10% to 90%
            Math.random() * 40 - 80, // Y position: -80% to -40% (start above the viewport)
        ])

    // Generate random rotation angles
    const randomRotations = Array(8)
        .fill(0)
        .map(() => Math.random() * 360)

    // Generate random delays
    const randomDelays = Array(8)
        .fill(0)
        .map(() => Math.random() * 0.5)

    useEffect(() => {
        // Play error sound
        try {
            soundService.preloadGameSounds()
            soundService.playSfx('FOLD')
        } catch (e) {
            console.error('Could not play sound:', e)
        }

        // Log the error
        console.error('Application error:', error)

        // Auto countdown for reset
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [error, countdown])

    return (
        <div className='flex min-h-screen flex-col bg-[#0E1C2E]'>
            {/* Background with poker table design */}
            <div className='fixed inset-0 z-0'>
                <div className='absolute inset-0 bg-[#142030] opacity-90' />
                <Image src='/poker-table.svg' alt='Poker Table' fill className='object-contain opacity-20' priority />
            </div>

            {/* Falling cards animation */}
            <div className='fixed inset-0 z-10 overflow-hidden'>
                {randomPositions.map((pos, i) => (
                    <ErrorCard key={i} rotate={randomRotations[i]} delay={randomDelays[i]} position={pos} />
                ))}
            </div>

            <div className='relative z-20 mx-auto flex w-full max-w-2xl flex-col items-center px-4 pt-32 text-center'>
                {/* Logo */}
                <div className='mb-4'>
                    <Image src='/bottom-logo-faded.svg' alt='Mental Poker' width={200} height={40} className='mb-8' />
                </div>

                {/* Bad hand animation */}
                <div className='mb-12 flex'>
                    <div className='relative -mr-5 -rotate-15 transform transition-transform duration-300 hover:-translate-y-2'>
                        <Image
                            src='/cards/2c.svg'
                            alt='2 of Clubs'
                            width={100}
                            height={140}
                            className='drop-shadow-xl'
                        />
                    </div>
                    <div className='relative rotate-15 transform transition-transform duration-300 hover:-translate-y-2'>
                        <Image
                            src='/cards/7h.svg'
                            alt='7 of Hearts'
                            width={100}
                            height={140}
                            className='drop-shadow-xl'
                        />
                    </div>
                </div>

                <div className='mb-10 rounded-xl bg-[#112237]/80 p-8 backdrop-blur-sm'>
                    <h1 className='mb-2 text-3xl font-bold text-red-500'>Bad Beat!</h1>
                    <h2 className='mb-6 text-xl font-bold text-white'>Something went wrong</h2>

                    <p className='mb-4 text-white/80'>
                        Looks like we&apos;ve hit a snag at the table. Don&apos;t worry, even pros fold sometimes.
                    </p>

                    {/* Debug toggle */}
                    <div className='mb-6'>
                        <button
                            onClick={() => setShowDebug(!showDebug)}
                            className='text-sm text-white/50 underline hover:text-white/90'>
                            {showDebug ? 'Hide' : 'Show'} error details
                        </button>
                    </div>

                    {/* Error details */}
                    {showDebug && (
                        <div className='mb-6 overflow-hidden rounded bg-black/50 text-left text-sm'>
                            <div className='flex items-center justify-between border-b border-white/10 px-4 py-2'>
                                <span className='text-xs font-semibold text-white/60'>Error Details</span>
                                <div className='flex space-x-2'>
                                    <button
                                        onClick={() => {
                                            const errorText = `${error.message}\n\n${error.stack || ''}`
                                            navigator.clipboard
                                                .writeText(errorText)
                                                .then(() => alert('Error details copied to clipboard'))
                                                .catch(err => console.error('Failed to copy:', err))
                                        }}
                                        className='flex items-center rounded px-2 py-1 text-xs text-white/70 hover:bg-white/10'
                                        title='Copy to clipboard'>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            className='mr-1 h-3 w-3'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'>
                                            <rect x='9' y='9' width='13' height='13' rx='2' ry='2' />
                                            <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
                                        </svg>
                                        Copy
                                    </button>
                                    <a
                                        href={`https://github.com/ottodevs/zkpoker/issues/new?title=Error:+${encodeURIComponent(error.message)}&body=${encodeURIComponent(`## Error Details\n\n\`\`\`\n${error.message}\n${error.stack || ''}\n\`\`\`\n\n## Error ID\n${error.digest || 'unknown'}\n\n## Steps to Reproduce\n1. \n\n## Expected Behavior\n\n\n## Actual Behavior\n\n\n## Browser and OS Information\n- Browser: \n- OS: \n`)}`}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='flex items-center rounded px-2 py-1 text-xs text-white/70 hover:bg-white/10'
                                        title='Create GitHub issue'>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            className='mr-1 h-3 w-3'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'>
                                            <path d='M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22' />
                                        </svg>
                                        GitHub Issue
                                    </a>
                                </div>
                            </div>
                            <div className='p-4'>
                                <p className='font-mono break-words text-red-300'>{error.message}</p>
                                {error.stack && (
                                    <div className='mt-2 max-h-32 overflow-auto'>
                                        <pre className='text-xs break-words whitespace-pre-wrap text-white/70'>
                                            {error.stack}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recovery options */}
                    <div className='mt-8 flex flex-wrap justify-center gap-4'>
                        <button
                            onClick={reset}
                            className='inline-flex items-center rounded-full bg-gradient-to-b from-[#4DF0B4] to-[#25976C] px-6 py-3 font-bold text-black drop-shadow-lg hover:from-[#5AFFBE] hover:to-[#2BA77A] focus:ring-2 focus:ring-[#4DF0B4] focus:ring-offset-2 focus:ring-offset-[#142030] focus:outline-none'>
                            Try Again {countdown > 0 && `(${countdown})`}
                        </button>

                        <Link
                            href='/'
                            className='inline-flex items-center rounded-full border-2 border-[#4DF0B4]/50 bg-transparent px-6 py-3 font-bold text-[#4DF0B4] hover:bg-[#4DF0B4]/10 focus:ring-2 focus:ring-[#4DF0B4] focus:ring-offset-2 focus:ring-offset-[#142030] focus:outline-none'>
                            Return to Lobby
                        </Link>
                    </div>
                </div>

                <p className='text-sm text-white/40'>Error ID: {error.digest || 'unknown'}</p>
            </div>

            {/* CSS for animations */}
            <style jsx global>{`
                @keyframes errorCardFall {
                    0% {
                        transform: translateY(-10vh) rotate(var(--rotation));
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(120vh) rotate(var(--rotation));
                        opacity: 0;
                    }
                }

                @keyframes wiggle {
                    0%,
                    100% {
                        transform: rotate(-3deg);
                    }
                    50% {
                        transform: rotate(3deg);
                    }
                }

                @keyframes pulse {
                    0%,
                    100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.6;
                    }
                }

                .rotate-15 {
                    transform: rotate(15deg);
                }

                .-rotate-15 {
                    transform: rotate(-15deg);
                }
            `}</style>
        </div>
    )
}
