import Image from 'next/image'
import { useState } from 'react'

interface AvatarButtonProps {
    avatarNumber: number
    isSelected?: boolean
    onClick?: () => void
}

export function AvatarButton({ avatarNumber, isSelected = false, onClick }: AvatarButtonProps) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`relative size-20 cursor-pointer`}
            role='button'
            tabIndex={0}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onClick?.()
                }
            }}>
            {/* Outer glow effect for selected state - positioned behind */}
            {isSelected && (
                <div
                    className='animate-pulse-medium absolute -inset-2 -z-10 rounded-full opacity-60'
                    style={{
                        background: 'radial-gradient(circle, rgba(85,255,190,0.3) 0%, rgba(85,255,190,0) 70%)',
                    }}
                    aria-hidden='true'
                />
            )}

            {/* Avatar container with border styles */}
            <div
                className={`relative size-20 overflow-hidden rounded-full transition-transform duration-200 ${
                    isSelected
                        ? 'scale-105 transform border-3 border-[#55ffbe]'
                        : isHovered
                          ? 'scale-105 transform border border-white/30'
                          : 'border border-transparent'
                }`}>
                <Image
                    src={`/avatar${avatarNumber}.png`}
                    alt={`Avatar ${avatarNumber}`}
                    fill
                    sizes='(max-width: 768px) 100vw, 80vw'
                    className={`transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}
                    unoptimized={isSelected}
                />
            </div>
        </div>
    )
}
