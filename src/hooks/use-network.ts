import { usePokerWorker } from '@/components/providers/worker-provider'
import { useCallback, useEffect, useRef, useState } from 'react'

interface NetworkState {
    blockHeight: number
    timeSinceBlock: string
    isLoading: boolean
    isConnected: boolean
    network: 'local' | 'testnet'
    error: string | null
}

const REQUEST_TIMEOUT = 10000 // 10 seconds timeout

export function useNetwork() {
    const { network = 'testnet' } = usePokerWorker() || {}
    const [state, setState] = useState<NetworkState>({
        blockHeight: 0,
        timeSinceBlock: 'No blocks yet',
        isLoading: true,
        isConnected: false,
        network,
        error: null,
    })
    const [lastBlockTime, setLastBlockTime] = useState<number>(0)
    const abortControllerRef = useRef<AbortController | null>(null)
    const isMounted = useRef(true)

    // Helper to create a fetch timeout
    const createTimeout = (ms: number, controller: AbortController) => {
        return setTimeout(() => {
            controller.abort()
        }, ms)
    }

    const fetchBlock = useCallback(async () => {
        // Cancel previous request if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Create new abort controller
        const controller = new AbortController()
        abortControllerRef.current = controller

        // Set up timeout
        const timeoutId = createTimeout(REQUEST_TIMEOUT, controller)

        try {
            const url = network === 'local' ? '/api/local/testnet/block/latest' : '/api/aleo/testnet/latest/height'
            const response = await fetch(url, { signal: controller.signal })

            // Clear timeout since request completed
            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            const height = network === 'local' ? parseInt(data.header.metadata.height) : parseInt(data)

            if (height !== state.blockHeight) {
                setLastBlockTime(Date.now())
            }

            if (isMounted.current) {
                setState(prev => ({
                    ...prev,
                    blockHeight: height,
                    isLoading: false,
                    isConnected: true,
                    network,
                    error: null,
                }))
            }
        } catch (error) {
            // Clear timeout
            clearTimeout(timeoutId)

            if (error instanceof DOMException && error.name === 'AbortError') {
                console.log('[useNetwork] Network request timed out')
                if (isMounted.current) {
                    setState(prev => ({
                        ...prev,
                        isLoading: false,
                        isConnected: false,
                        error: 'Request timed out',
                    }))
                }
            } else {
                console.log('[useNetwork] Error fetching block:', error)
                if (isMounted.current) {
                    setState(prev => ({
                        ...prev,
                        isLoading: false,
                        isConnected: false,
                        error: 'Failed to connect to network',
                    }))
                }
            }
        }
    }, [network, state.blockHeight])

    const updateTime = useCallback(() => {
        if (!lastBlockTime) return
        const seconds = Math.floor((Date.now() - lastBlockTime) / 1000)
        if (isMounted.current) {
            setState(prev => ({
                ...prev,
                timeSinceBlock: `${seconds}s ago`,
            }))
        }
    }, [lastBlockTime])

    // Update network state when network changes
    useEffect(() => {
        if (isMounted.current) {
            setState(prev => ({
                ...prev,
                network,
                isLoading: true,
                error: null,
            }))
        }
    }, [network])

    // Polling for network updates
    useEffect(() => {
        fetchBlock()

        const pollInterval = setInterval(fetchBlock, 5000) // More conservative interval (5s)
        const timeInterval = setInterval(updateTime, 1000)

        return () => {
            clearInterval(pollInterval)
            clearInterval(timeInterval)
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [fetchBlock, updateTime])

    // Reset isMounted on mount/unmount
    useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false
        }
    }, [])

    return {
        ...state,
        refresh: fetchBlock,
    }
}
