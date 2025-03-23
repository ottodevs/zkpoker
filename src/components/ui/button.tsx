'use client'

import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        return (
            <button
                className={cn(
                    'focus-visible:ring-ring inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
                    {
                        'bg-primary text-primary-foreground hover:bg-primary/90 shadow': variant === 'default',
                        'border-input bg-background hover:bg-accent hover:text-accent-foreground border':
                            variant === 'outline',
                        'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
                    },
                    className,
                )}
                ref={ref}
                {...props}
            />
        )
    },
)
Button.displayName = 'Button'
