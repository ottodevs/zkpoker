'use client'

import Link from 'next/link'

export default function HomePage() {
    return (
        <main className='flex min-h-screen w-full flex-col items-center justify-center bg-[url("/images/lobby/poker-background.png")] bg-cover bg-center bg-no-repeat'>
            <div className='container mx-auto flex max-w-6xl flex-col items-center p-4 text-center'>
                <h1 className='mb-6 text-center text-6xl font-bold text-white'>
                    ZK <span className='text-[#4df0b4]'>Poker</span>
                </h1>
                <p className='mb-8 max-w-2xl text-xl text-gray-300'>
                    A provably fair poker platform built on Aleo with zero-knowledge technology
                </p>

                <div className='flex gap-4'>
                    <Link
                        href='/lobby'
                        className='group relative overflow-hidden rounded-lg border border-[#55ffbe]/50 bg-gradient-to-b from-[#4df0b4] to-[#25976c] px-8 py-3 text-center text-lg font-bold text-black shadow-[0_0_8px_rgba(77,240,180,0.25)] transition-all hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(77,240,180,0.4)] hover:brightness-105 active:translate-y-1 active:scale-95 active:shadow-inner active:brightness-95'>
                        <span className='absolute inset-0 translate-y-full bg-gradient-to-b from-[#27d89e] to-[#25976c] transition-transform duration-300 group-hover:translate-y-0' />
                        <span className='relative'>Enter Lobby</span>
                    </Link>

                    <Link
                        href='/dev'
                        className='rounded-lg border border-white/30 bg-white/10 px-8 py-3 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:translate-y-1'>
                        Dev Demo
                    </Link>
                </div>
            </div>
        </main>
    )
}
