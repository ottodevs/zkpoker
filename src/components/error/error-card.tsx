import Image from 'next/image'

interface ErrorCardProps {
    rotate: number
    delay: number
    position: [number, number]
}

// Animated error card component
export default function ErrorCard({ rotate, delay, position }: ErrorCardProps) {
    return (
        <div
            className='animate-error-card-fall absolute'
            style={
                {
                    '--card-rotation': `${rotate}deg`,
                    '--animation-delay': `${delay}s`,
                    'left': `${position[0]}%`,
                    'top': `${position[1]}%`,
                } as React.CSSProperties
            }>
            <div className='relative h-36 w-28'>
                <Image
                    src='/backofcard.png'
                    alt='Card'
                    fill
                    className='drop-shadow-2xl'
                    priority
                    sizes='(max-width: 768px) 100vw, 80vw'
                />
            </div>
        </div>
    )
}
