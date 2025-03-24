'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function LobbyFooter() {
    const [hyperTurbo, setHyperTurbo] = useState(true)

    return (
        <footer className='flex h-[102px] w-full items-center justify-between rounded-br-3xl rounded-bl-3xl border-2 border-[#37455e] bg-[#27374a] px-4 sm:px-6 md:px-8'>
            <div className='flex items-center gap-3'>
                <Image
                    src='/bottom-logo-faded.svg'
                    alt='Mental Poker'
                    width={268}
                    height={30}
                    className='h-auto w-auto max-w-[180px] md:max-w-full'
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
                <div className='ml-2 font-bold text-white'>Hyper turbo</div>
            </div>
        </footer>
    )
}
