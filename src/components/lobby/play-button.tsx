import Image from 'next/image'
import { useState } from 'react'

interface PlayButtonProps {
    onClick?: () => void
    disabled?: boolean
    onDisabledClick?: () => void
}

export function PlayButton({ onClick, disabled = false, onDisabledClick }: PlayButtonProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [isPressed, setIsPressed] = useState(false)

    const handleClick = () => {
        if (disabled) {
            onDisabledClick?.()
        } else {
            onClick?.()
        }
    }

    return (
        <div
            className={`relative h-24 w-40 transform cursor-pointer transition-all duration-300 ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${!disabled && isHovered ? 'scale-105' : ''} ${!disabled && isPressed ? 'scale-95' : ''}`}
            onClick={handleClick}
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false)
                setIsPressed(false)
            }}
            onMouseDown={() => !disabled && setIsPressed(true)}
            onMouseUp={() => !disabled && setIsPressed(false)}
            onTouchStart={() => !disabled && setIsPressed(true)}
            onTouchEnd={() => !disabled && setIsPressed(false)}
            role='button'
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={e => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    setIsPressed(true)
                }
            }}
            onKeyUp={e => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    setIsPressed(false)
                    onClick?.()
                } else if (disabled && (e.key === 'Enter' || e.key === ' ')) {
                    onDisabledClick?.()
                }
            }}>
            {/* Glow effect - position behind the button */}
            {isHovered && !disabled && (
                <div
                    className={`absolute inset-0 transition-opacity duration-300 ${isPressed ? 'animate-pulse-fast' : 'animate-pulse-medium'}`}
                    aria-hidden='true'>
                    <div className='absolute inset-0 opacity-70'>
                        <Image
                            src='/images/lobby/play-button-glow.svg'
                            alt=''
                            fill
                            className='object-contain'
                            sizes='(max-width: 768px) 100vw, 80vw'
                        />
                    </div>
                </div>
            )}

            {/* Original button */}
            <Image
                src='/images/lobby/play-button.svg'
                alt={disabled ? 'Play (Disabled)' : 'Play'}
                fill
                sizes='(max-width: 768px) 100vw, 80vw'
                className='size-auto'
            />

            {/* Inner glow effect that appears on click */}
            {isPressed && !disabled && (
                <div className='animate-pulse-fast absolute inset-0 opacity-30'>
                    <div className='absolute inset-3 rounded-xl bg-[#55ffbe]/20 blur-md' />
                </div>
            )}
        </div>
    )
}
