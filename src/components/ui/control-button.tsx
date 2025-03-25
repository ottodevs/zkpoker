import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

export interface ControlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'bordered' | 'solid'
    size?: 'sm' | 'md' | 'lg'
    isActive?: boolean
}

const hasCustomWidth = (className?: string): boolean => {
    if (!className) return false
    const widthClasses = ['w-', 'min-w-', 'max-w-']
    const classNames = className.split(' ')
    return classNames.some(cls => widthClasses.some(prefix => cls.startsWith(prefix)))
}

export const ControlButton = forwardRef<HTMLButtonElement, ControlButtonProps>(
    ({ className, variant = 'bordered', size = 'lg', isActive = false, children, ...props }, ref) => {
        const hasWidth = hasCustomWidth(className)

        return (
            <Button
                className={cn(
                    'flex cursor-pointer items-center justify-center text-white/70 transition-all duration-150 hover:text-white',
                    // Size variants (height only)
                    {
                        'h-8': size === 'sm',
                        'h-10': size === 'md',
                        'h-12': size === 'lg',
                    },
                    // Default square dimensions (only applied if no custom width is provided)
                    !hasWidth && {
                        'w-8': size === 'sm',
                        'w-10': size === 'md',
                        'w-12': size === 'lg',
                    },
                    // Style variants
                    {
                        'rounded-lg border-2 border-[#4df0b4]/30 bg-[#0D1C2E]/80 shadow-[0_0_10px_rgba(77,240,180,0.15)] hover:border-[#4df0b4]/50 hover:shadow-[0_0_15px_rgba(77,240,180,0.25)]':
                            variant === 'bordered',
                        'rounded-lg border border-[#55ffbe]/50 bg-gradient-to-b from-[#4DF0B4] to-[#25976C] text-[#0D1C2E] shadow-[0_0_8px_rgba(77,240,180,0.25)] hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(77,240,180,0.4)] hover:brightness-105 active:translate-y-1 active:scale-95 active:shadow-inner active:brightness-95':
                            variant === 'solid',
                    },
                    // Active state
                    {
                        'border-[#4df0b4]/70 shadow-[0_0_15px_rgba(77,240,180,0.35)]':
                            isActive && variant === 'bordered',
                        'shadow-[0_0_15px_rgba(77,240,180,0.5)] brightness-110': isActive && variant === 'solid',
                    },
                    className,
                )}
                ref={ref}
                variant='default'
                {...props}>
                {children}
            </Button>
        )
    },
)
ControlButton.displayName = 'ControlButton'
