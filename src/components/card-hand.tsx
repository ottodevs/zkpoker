import Image from 'next/image'

interface CardHandProps {
    card1: string
    card2: string
    className?: string
}

export default function CardHand({ card1, card2, className = '' }: CardHandProps) {
    return (
        <div className={`flex ${className}`}>
            <div className='relative -mr-5 -rotate-15 transform transition-transform duration-300 hover:-translate-y-2'>
                <div className='relative h-36 w-28'>
                    <Image src={card1} alt='Card 1' fill className='drop-shadow-xl' />
                </div>
            </div>
            <div className='relative rotate-15 transform transition-transform duration-300 hover:-translate-y-2'>
                <div className='relative h-36 w-28'>
                    <Image src={card2} alt='Card 2' fill className='drop-shadow-xl' />
                </div>
            </div>
        </div>
    )
}
