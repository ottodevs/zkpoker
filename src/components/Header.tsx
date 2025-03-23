'use client'

import { Exo } from 'next/font/google'
import Image from 'next/image'
import { useState } from 'react'
import topLogo from '../../public/top-logo.svg'
import { LeoConnectButton } from './LeoConnectButton'
import SoundToggle from './SoundToggle'

const exo = Exo({
    subsets: ['latin'],
    display: 'swap',
    weight: ['400', '500', '700'],
})

interface HeaderProps {
    onToggleMode?: (mode: string) => void
}

export default function Header({ onToggleMode }: HeaderProps) {
    const [mode, setMode] = useState('real') // real or free

    // const handleToggle = () => {
    //   const newMode = mode === 'real' ? 'free' : 'real';
    //   setMode(newMode);
    //   if (onToggleMode) onToggleMode(newMode);
    // };

    return (
        <header className='flex items-center justify-between bg-[#0E1C2E] px-8 py-4'>
            <div className='flex items-center space-x-6'>
                {/* Settings button in frame */}
                <div className='relative flex h-[48px] w-[48px] items-center justify-center'>
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='52'
                        height='52'
                        viewBox='0 0 52 52'
                        fill='none'
                        className='absolute'>
                        <path
                            d='M42 51H10C5.02944 51 1 46.9706 1.00001 42L1.00006 9.99998C1.00007 5.02942 5.02951 0.999996 10.0001 0.999996H42C46.9706 0.999996 51 5.02944 51 10V42C51 46.9706 46.9706 51 42 51Z'
                            stroke='#253E5C'
                            strokeWidth='2'
                        />
                    </svg>
                    <button className='z-10'>
                        <Image
                            src='/settings-button.svg'
                            alt='Settings'
                            width={28}
                            height={28}
                            style={{ height: 'auto', width: 'auto' }}
                        />
                    </button>
                </div>

                {/* Real/Free mode toggle */}
                <div className='relative inline-flex h-12 w-[178px] items-center justify-center gap-px rounded-[80px] outline-2 outline-[#243d5c]'>
                    {/* Real Button */}
                    <div
                        className={`inline-flex h-12 w-[89px] cursor-pointer flex-col items-center justify-center rounded-[80px] px-4 py-3 ${mode === 'real' ? 'z-10 bg-[#0e1c2e] outline-2 outline-[#4ef0b3]' : ''}`}
                        onClick={() => {
                            setMode('real')
                            if (onToggleMode) onToggleMode('real')
                        }}>
                        <div className='inline-flex items-center justify-start'>
                            <div className={`text-lg leading-tight font-bold text-white ${exo.className}`}>Real</div>
                        </div>
                    </div>

                    {/* Free Button */}
                    <div
                        className={`inline-flex h-12 w-[89px] cursor-pointer flex-col items-center justify-center rounded-[80px] px-4 py-3 ${mode === 'free' ? 'z-10 bg-[#0e1c2e] outline-2 outline-[#4ef0b3]' : ''}`}
                        onClick={() => {
                            setMode('free')
                            if (onToggleMode) onToggleMode('free')
                        }}>
                        <div className='inline-flex items-center justify-start'>
                            <div className={`text-lg leading-tight font-bold text-white ${exo.className}`}>Free</div>
                        </div>
                    </div>
                </div>

                {/* Mental Poker Logo (true size) */}
                <div className='flex w-auto items-center'>
                    <Image
                        src={topLogo}
                        alt='Mental Poker'
                        width={230}
                        height={40}
                        className='w-auto'
                        loader={({ src, width, quality }) => {
                            return `${src}?w=${width}&q=${quality || 75}`
                        }}
                    />
                </div>
            </div>

            <div className='flex items-center space-x-4'>
                {/* Sound Toggle component in frame */}
                <div className='relative flex h-[48px] w-[48px] items-center justify-center'>
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='52'
                        height='52'
                        viewBox='0 0 52 52'
                        fill='none'
                        className='absolute'>
                        <path
                            d='M42 51H10C5.02944 51 1 46.9706 1.00001 42L1.00006 9.99998C1.00007 5.02942 5.02951 0.999996 10.0001 0.999996H42C46.9706 0.999996 51 5.02944 51 10V42C51 46.9706 46.9706 51 42 51Z'
                            stroke='#253E5C'
                            strokeWidth='2'
                        />
                    </svg>
                    <div className='z-10'>
                        <SoundToggle />
                    </div>
                </div>

                {/* Connect wallet button */}
                <LeoConnectButton />
            </div>
        </header>
    )
}
