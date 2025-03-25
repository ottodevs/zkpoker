'use client'

import { usePokerWorker } from '@/components/providers/worker-provider'
import { ControlButton } from '@/components/ui/control-button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNetwork } from '@/hooks/use-network'
import { Box, CheckCircle2, ExternalLink, Loader2, RefreshCw, Settings, XCircle } from 'lucide-react'
import { memo, useCallback, useState } from 'react'

// Memoized block info component to prevent re-renders
const BlockInfo = memo(function BlockInfo({
    isLoading,
    isRefreshing,
    blockHeight,
    timeSinceBlock,
}: {
    isLoading: boolean
    isRefreshing: boolean
    blockHeight: number
    timeSinceBlock: string
}) {
    const showLoading = isLoading || isRefreshing

    return (
        <div className='ml-6 flex items-center'>
            <div className='relative min-h-[24px] min-w-[120px]'>
                <div
                    className={`absolute inset-0 flex items-center transition-opacity duration-200 ${
                        showLoading ? 'opacity-100' : 'opacity-0'
                    }`}>
                    <Loader2 className='mr-2 h-3 w-3 animate-spin text-white/60' />
                    <span className='text-xs text-white/60'>Loading...</span>
                </div>

                <div
                    className={`absolute inset-0 flex items-center transition-opacity duration-200 ${
                        showLoading ? 'opacity-0' : 'opacity-100'
                    }`}>
                    {blockHeight > 0 ? (
                        <div className='flex items-center'>
                            <span className='rounded bg-[#1A2A3A] px-2 py-1 text-xs font-semibold text-[#4df0b4]'>
                                #{blockHeight.toLocaleString()}
                            </span>
                            <span className='ml-2 min-w-14 text-xs text-white/60'>{timeSinceBlock}</span>
                        </div>
                    ) : (
                        <span className='rounded bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-300'>
                            Unknown
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
})

// Memoized connection status component
const ConnectionStatus = memo(function ConnectionStatus({
    isLoading,
    isConnected,
}: {
    isLoading: boolean
    isConnected: boolean
}) {
    return (
        <div className='flex items-center gap-3'>
            <div className='relative h-3 w-3'>
                <div
                    className={`absolute inset-0 transition-opacity duration-200 ${
                        isLoading ? 'opacity-100' : 'opacity-0'
                    }`}>
                    <Loader2 className='h-3 w-3 animate-spin text-white/60' />
                </div>
                <div
                    className={`absolute inset-0 transition-opacity duration-200 ${
                        isLoading ? 'opacity-0' : 'opacity-100'
                    }`}>
                    {isConnected ? (
                        <CheckCircle2 className='h-3 w-3 text-green-500' />
                    ) : (
                        <XCircle className='h-3 w-3 text-red-500' />
                    )}
                </div>
            </div>
            <span
                className={`rounded px-2 py-1 text-xs font-semibold capitalize transition-colors duration-200 ${
                    isLoading
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : isConnected
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                }`}>
                {isLoading ? 'Checking...' : isConnected ? 'Connected' : 'Disconnected'}
            </span>
        </div>
    )
})

export default function NetworkSettings() {
    const [open, setOpen] = useState(false)
    const { setNetwork } = usePokerWorker()
    const { network, blockHeight, isConnected, isLoading, timeSinceBlock, refresh } = useNetwork()
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleNetworkChange = useCallback(
        (value: string) => {
            if (value === 'local' || value === 'testnet') {
                setNetwork(value)
            }
        },
        [setNetwork],
    )

    const handleRefreshBlock = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation()
            if (isRefreshing) return

            setIsRefreshing(true)
            refresh()

            setTimeout(() => {
                setIsRefreshing(false)
            }, 1000)
        },
        [isRefreshing, refresh],
    )

    const openBlockExplorer = useCallback(() => {
        const url = network === 'local' ? 'http://localhost:3030' : 'https://explorer.aleo.org'
        window.open(url, '_blank')
    }, [network])

    return (
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenuTrigger asChild>
                <ControlButton variant='bordered'>
                    <Settings className='size-4' />
                    <span className='sr-only'>Settings</span>
                </ControlButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align='end'
                className='w-64 bg-[#0D1C2E] text-white'
                onCloseAutoFocus={e => e.preventDefault()}>
                <DropdownMenuLabel className='text-xs font-normal text-white/60'>Network Settings</DropdownMenuLabel>
                <DropdownMenuSeparator className='bg-white/10' />
                <DropdownMenuRadioGroup value={network} onValueChange={handleNetworkChange}>
                    <DropdownMenuRadioItem
                        value='testnet'
                        onSelect={(e: Event) => e.preventDefault()}
                        className='focus:bg-white/10 focus:text-white data-[state=checked]:bg-white/5'>
                        Aleo Testnet
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                        value='local'
                        onSelect={(e: Event) => e.preventDefault()}
                        className='focus:bg-white/10 focus:text-white data-[state=checked]:bg-white/5'>
                        Local Development
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator className='bg-white/10' />

                <div className='flex items-center justify-between px-3 py-2'>
                    <div className='flex items-center gap-2'>
                        <Box className='size-4 text-[#4df0b4]/70' />
                        <span className='text-xs font-normal text-white/60'>Latest Block</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            onClick={handleRefreshBlock}
                            disabled={isLoading || isRefreshing}
                            className={`text-white/70 transition-all hover:text-white ${
                                isRefreshing ? 'animate-spin' : ''
                            }`}
                            title='Refresh block info'>
                            <RefreshCw className='size-3.5' />
                        </button>
                        <button
                            onClick={openBlockExplorer}
                            className='text-white/70 transition-all hover:text-white'
                            title='Open Block Explorer'>
                            <ExternalLink className='size-3.5' />
                        </button>
                    </div>
                </div>

                <DropdownMenuItem className='cursor-default focus:bg-white/10 focus:text-white' disabled>
                    <div className='flex w-full items-center justify-between'>
                        <BlockInfo
                            isLoading={isLoading}
                            isRefreshing={isRefreshing}
                            blockHeight={blockHeight}
                            timeSinceBlock={timeSinceBlock}
                        />
                    </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className='bg-white/10' />

                <DropdownMenuItem className='cursor-default focus:bg-white/10 focus:text-white' disabled>
                    <div className='flex w-full items-center justify-between'>
                        <span className='text-xs font-normal'>Connection Status</span>
                        <ConnectionStatus isLoading={isLoading} isConnected={isConnected} />
                    </div>
                </DropdownMenuItem>

                <DropdownMenuItem className='cursor-default focus:bg-white/10 focus:text-white' disabled>
                    <div className='flex w-full items-center justify-between'>
                        <span className='text-xs font-normal'>Current Network</span>
                        <span className='rounded bg-white/10 px-2 py-1 text-xs font-semibold capitalize'>
                            {network}
                        </span>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
