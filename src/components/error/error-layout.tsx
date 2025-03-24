import ErrorCard from '@/components/error/error-card'
import Image from 'next/image'

interface ErrorLayoutProps {
    children: React.ReactNode
    cardCount?: number
}

export default function ErrorLayout({ children, cardCount = 8 }: ErrorLayoutProps) {
    // Generate random positions for the falling cards
    const randomPositions: [number, number][] = Array(cardCount)
        .fill(0)
        .map(() => [
            Math.random() * 80 + 10, // X position: 10% to 90%
            Math.random() * 40 - 80, // Y position: -80% to -40% (start above the viewport)
        ])

    // Generate random rotation angles
    const randomRotations = Array(cardCount)
        .fill(0)
        .map(() => Math.random() * 360)

    // Generate random delays
    const randomDelays = Array(cardCount)
        .fill(0)
        .map(() => Math.random() * 0.5)

    return (
        <div className='flex min-h-screen flex-col bg-[#0E1C2E]'>
            {/* Background with poker table design */}
            <div className='fixed inset-0 z-0'>
                <div className='absolute inset-0 bg-[#142030] opacity-90' />
                <Image
                    src='/poker-table.svg'
                    alt='Poker Table'
                    fill
                    className='object-contain opacity-20'
                    priority
                    sizes='(max-width: 768px) 100vw, 80vw'
                />
            </div>

            {/* Falling cards animation */}
            <div className='fixed inset-0 z-10 overflow-hidden'>
                {randomPositions.map((pos, i) => (
                    <ErrorCard key={i} rotate={randomRotations[i]} delay={randomDelays[i]} position={pos} />
                ))}
            </div>

            <div className='relative z-20 mx-auto flex w-full max-w-2xl flex-col items-center px-4 pt-32 text-center'>
                {/* Logo */}
                <div className='relative mb-4 h-40 w-200'>
                    <Image src='/bottom-logo-faded.svg' alt='Mental Poker' fill className='mb-8' />
                </div>

                {children}
            </div>
        </div>
    )
}
