'use client'

import CardHand from '@/components/card-hand'
import ErrorContent from '@/components/error/error-content'
import ErrorLayout from '@/components/error/error-layout'
import tenOfSpades from '@/public/cards/10s.svg'
import threeOfDiamonds from '@/public/cards/3d.svg'
import soundService from '@/services/sound-service'
import { useEffect, useState } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const [showDebug, setShowDebug] = useState(false)
    const [countdown, setCountdown] = useState(5)

    useEffect(() => {
        // Play error sound
        try {
            soundService.preloadGameSounds()
            soundService.playMusic('LOBBY')
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
        <ErrorLayout>
            {/* Bad hand animation - different cards for error page */}
            <CardHand card1={threeOfDiamonds} card2={tenOfSpades} className='mb-12' />

            <ErrorContent
                title='Bad Beat!'
                subtitle='Something went wrong'
                message="Looks like we've hit a snag at the table. Don't worry, even pros fold sometimes.">
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
                </div>

                <p className='mt-4 text-sm text-white/40'>Error ID: {error.digest || 'unknown'}</p>
            </ErrorContent>
        </ErrorLayout>
    )
}
