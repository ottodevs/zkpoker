'use client'

import { useEffect, useRef, useState } from 'react'
import { AmountButton } from './amount-button'
import { PlayButton } from './play-button'

export function AmountSelector() {
    const [amount, setAmount] = useState('0.00')
    const [inputFocused, setInputFocused] = useState(false)
    const [containerFocused, setContainerFocused] = useState(false)
    const [isZeroAmount, setIsZeroAmount] = useState(true)
    const [inputAttention, setInputAttention] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Check if amount is zero or invalid
    useEffect(() => {
        const numericAmount = parseFloat(amount)
        setIsZeroAmount(isNaN(numericAmount) || numericAmount <= 0)
    }, [amount])

    // Handle the attention animation
    useEffect(() => {
        if (inputAttention) {
            // Focus the input to draw user attention
            inputRef.current?.focus()

            // Reset after the animation completes
            const timer = setTimeout(() => {
                setInputAttention(false)
            }, 1500)

            return () => clearTimeout(timer)
        }
    }, [inputAttention])

    const handleAmountClick = (value: string) => {
        if (value === 'MAX') {
            setAmount('100.00') // Example MAX value
        } else {
            setAmount(value)
        }
    }

    const handlePlay = () => {
        if (isZeroAmount) return // Prevent play with zero amount

        console.log('Starting game with amount:', amount)
        // Additional play logic goes here
    }

    // Handle when disabled button is clicked
    const handleDisabledPlayClick = () => {
        if (isZeroAmount) {
            setInputAttention(true)
        }
    }

    return (
        <div
            className={`rounded-[13px] bg-white/5 p-[32px] backdrop-blur-lg backdrop-filter transition-shadow duration-300 ${containerFocused || inputFocused ? 'shadow-[0_0_15px_rgba(85,255,190,0.1)]' : ''}`}
            onMouseEnter={() => setContainerFocused(true)}
            onMouseLeave={() => setContainerFocused(false)}>
            <h2 className='mb-4 text-[16px] font-bold text-white/80'>Enter Amount</h2>
            <div className='flex flex-wrap items-center gap-4'>
                <div className='min-w-[200px] flex-1'>
                    <div className='relative mb-2'>
                        <input
                            ref={inputRef}
                            type='text'
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            className={`inline-flex h-[48px] w-full max-w-[354px] items-center justify-center rounded-[13px] bg-white/5 px-4 text-white transition-all duration-200 ease-in-out hover:bg-white/8 focus:ring-2 focus:ring-[#4DF0B4]/70 focus:outline-none ${
                                inputFocused ? 'shadow-[0_0_15px_rgba(77,240,180,0.3)]' : ''
                            } ${
                                inputAttention
                                    ? 'animate-input-attention shadow-[0_0_20px_rgba(77,240,180,0.5)] ring-2 ring-[#4DF0B4]'
                                    : ''
                            }`}
                        />
                        {(inputFocused || inputAttention) && (
                            <div
                                className={`pointer-events-none absolute inset-0 -z-10 rounded-[13px] bg-[#4DF0B4]/5 blur-md ${
                                    inputAttention ? 'animate-pulse-fast' : 'animate-pulse-slow'
                                }`}
                                aria-hidden='true'
                            />
                        )}
                    </div>
                    <div className='flex flex-wrap gap-2'>
                        {['5', '10', '50', 'MAX'].map(value => (
                            <AmountButton key={value} value={value} onClick={() => handleAmountClick(value)} />
                        ))}
                    </div>
                </div>
                <PlayButton onClick={handlePlay} disabled={isZeroAmount} onDisabledClick={handleDisabledPlayClick} />
            </div>
        </div>
    )
}
