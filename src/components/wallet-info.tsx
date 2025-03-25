'use client'

import { ControlButton } from '@/components/ui/control-button'
import useWalletBalance from '@/hooks/use-wallet-balance'
import { cn } from '@/lib/utils'
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'
import { RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function WalletDropdown() {
    const { connected, publicKey } = useWallet()
    const { balance, isLoading, error, fetchBalance } = useWalletBalance()
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Format credits with 2 decimal places
    const formatCredits = (amount: number | null) => {
        return amount ? amount.toFixed(2) : '0.00'
    }

    // Refresh balance
    const handleRefresh = async (e: React.MouseEvent) => {
        e.stopPropagation()

        if (!connected || isRefreshing) {
            return
        }

        setIsRefreshing(true)
        await fetchBalance()

        setTimeout(() => {
            setIsRefreshing(false)
        }, 1000)
    }

    // Auto-refresh balance every minute
    useEffect(() => {
        if (!connected) {
            return
        }

        const intervalId = setInterval(() => {
            fetchBalance()
        }, 60000)

        return () => {
            clearInterval(intervalId)
        }
    }, [connected, fetchBalance])

    if (!connected || !publicKey) {
        return null
    }

    return (
        <ControlButton
            variant='bordered'
            className='min-w-30 px-4'
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}>
            <div className='flex items-center justify-center gap-2 text-sm font-medium text-white'>
                {isLoading || isRefreshing ? (
                    <span className='inline-block w-16 animate-pulse'>Loading...</span>
                ) : error ? (
                    <div className='flex items-center gap-1 text-red-400' title={error}>
                        <span>Error</span>
                        <span className='text-xs'>(!)</span>
                    </div>
                ) : (
                    <div className='flex items-end justify-center gap-1'>
                        <div className='relative flex size-5 rounded-full p-1.5'>
                            <Image src='/images/icons/aleo-icon.svg' alt='Aleo' fill />
                        </div>
                        <span className='text-sm font-medium'>{formatCredits(balance)}</span>
                        <div
                            className={cn(
                                'text-white/70 transition-all hover:text-white',
                                isRefreshing && 'animate-spin',
                            )}
                            title='Refresh balance'
                        />
                    </div>
                )}
                <RefreshCw className={cn('size-4', isRefreshing && 'animate-spin')} />
            </div>
        </ControlButton>
    )
}
