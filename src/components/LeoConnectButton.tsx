'use client'

import { logWallet } from '@/utils/logging'
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'
import { Exo } from 'next/font/google'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'

const exo = Exo({
    subsets: ['latin'],
    display: 'swap',
    weight: ['400', '500', '700'],
})

export const LeoConnectButton: FC = () => {
    const { connected, connecting, wallet, connect, disconnect } = useWallet()

    const [timeoutError, setTimeoutError] = useState(false)
    const [connectingTime, setConnectingTime] = useState<number | null>(null)

    // Log wallet state changes
    useEffect(() => {
        logWallet(
            `Wallet state: ${JSON.stringify({
                connected,
                connecting,
                walletName: wallet?.adapter?.name,
            })}`,
        )

        // Reset timeout error when connection state changes to not connecting
        if (!connecting) {
            setTimeoutError(false)
            setConnectingTime(null)
        } else if (connecting && !connectingTime) {
            // Set the timestamp when connecting starts
            setConnectingTime(Date.now())
        }
    }, [connected, connecting, wallet, connectingTime])

    // Handle timeout for connection
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | undefined

        if (connecting && connectingTime) {
            // Calculate how long we've been connecting
            const elapsedTime = Date.now() - connectingTime

            // If we've been connecting for less than 15 seconds, set a timeout
            if (elapsedTime < 15000) {
                const remainingTime = 15000 - elapsedTime
                timeoutId = setTimeout(() => {
                    logWallet('Connection timeout - wallet connection is taking too long')
                    setTimeoutError(true)
                    alert('Wallet connection timed out. Please try again or check your wallet extension.')
                }, remainingTime)
            } else {
                // We've already been connecting for more than 15 seconds
                setTimeoutError(true)
            }
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [connecting, connectingTime])

    const handleClick = useCallback(async () => {
        // If we're in a timeout error state, treat click as a reset button
        if (timeoutError) {
            setTimeoutError(false)
            setConnectingTime(null)
            return
        }

        try {
            if (connected) {
                await disconnect()
                return
            }

            if (!wallet) {
                alert('Please install an Aleo wallet extension to connect')
                return
            }

            if (connecting) {
                logWallet('Already connecting...')
                return
            }

            try {
                logWallet('Connecting to wallet...')
                if (wallet) {
                    // await connect(DecryptPermission.AutoDecrypt, WalletAdapterNetwork.Testnet)
                    logWallet('Connection successful')
                }
            } catch (error) {
                console.error('Connection error:', error)
                if (error instanceof Error) {
                    console.error('Error details:', {
                        name: error.name,
                        message: error.message,
                    })
                    alert(`Failed to connect wallet: ${error.message}`)
                } else {
                    alert('Failed to connect wallet: Unknown error')
                }
            }
        } catch (error) {
            console.error('Connection flow error:', error)
        }
    }, [timeoutError, connected, wallet, connecting, disconnect, connect])

    // Determine button text and style based on current state
    const buttonText = timeoutError
        ? 'RETRY CONNECTION'
        : connecting
          ? 'CONNECTING...'
          : connected
            ? 'DISCONNECT'
            : 'CONNECT WALLET'

    // Button style based on state
    const buttonStyle = {
        background: timeoutError
            ? 'linear-gradient(180deg, #ff4d4d 16.65%, #972525 100%)'
            : 'linear-gradient(180deg, #4DF0B4 16.65%, #25976C 100%)',
    }

    return (
        <button
            onClick={handleClick}
            disabled={connecting && !timeoutError}
            className={`flex h-[48px] cursor-pointer items-center gap-[10px] rounded-[8px] border-2 border-[rgba(142,255,196,0.7)] px-[12px] py-[10px] font-bold text-black ${exo.className} ${connecting && !timeoutError ? 'opacity-70' : ''}`}
            style={buttonStyle}>
            {buttonText}
        </button>
    )
}
