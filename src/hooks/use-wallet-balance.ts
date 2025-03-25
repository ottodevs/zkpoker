import { usePokerWorker } from '@/components/providers/worker-provider'
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'
import { useAccount } from '@puzzlehq/sdk'
import { getBalance } from '@puzzlehq/sdk-core'
import { useCallback, useEffect, useReducer, useRef } from 'react'

// Define state types
type State = {
    balance: number | null
    isLoading: boolean
    error: string | null
    lastUpdated: number | null
}

// Define action types
type Action =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; payload: number }
    | { type: 'FETCH_ERROR'; payload: string }
    | { type: 'RESET' }

// Initial state
const initialState: State = {
    balance: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
}

// Define token interface
interface TokenBalance {
    programId: string
    network: string
    values: {
        public: number
        private: number
    }
}

// State reducer
function balanceReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'FETCH_START':
            return {
                ...state,
                isLoading: true,
                error: null,
            }
        case 'FETCH_SUCCESS':
            return {
                balance: action.payload,
                isLoading: false,
                error: null,
                lastUpdated: Date.now(),
            }
        case 'FETCH_ERROR':
            return {
                ...state,
                isLoading: false,
                error: action.payload,
            }
        case 'RESET':
            return initialState
        default:
            return state
    }
}

export const useWalletBalance = () => {
    const wallet = useWallet()
    const { account } = useAccount()
    const { network } = usePokerWorker()
    const [state, dispatch] = useReducer(balanceReducer, initialState)
    const fetchingRef = useRef(false)
    const controllerRef = useRef<AbortController | null>(null)
    const prevWalletConnectedRef = useRef(wallet.connected)
    const prevNetworkRef = useRef(network)

    // Clear any ongoing requests
    const clearRequests = useCallback(() => {
        if (controllerRef.current) {
            controllerRef.current.abort()
            controllerRef.current = null
        }
        fetchingRef.current = false
    }, [])

    // Watch for wallet disconnection or network changes
    useEffect(() => {
        // If wallet was connected before and is now disconnected
        if (prevWalletConnectedRef.current && !wallet.connected) {
            // Immediately reset state when wallet disconnects
            clearRequests()
            dispatch({ type: 'RESET' })
        }

        // If network changed while fetching
        if (prevNetworkRef.current !== network && fetchingRef.current) {
            // Cancel current request when network changes
            clearRequests()
        }

        // Update previous values
        prevWalletConnectedRef.current = wallet.connected
        prevNetworkRef.current = network
    }, [wallet.connected, network, clearRequests])

    // Local balance fetching logic
    const fetchLocalBalance = useCallback(async (): Promise<number> => {
        // Double-check wallet connection before making request
        if (!wallet?.publicKey || !wallet?.connected) {
            return 0
        }

        try {
            const records = await wallet.requestRecordPlaintexts?.('credits.aleo')

            if (!records || records.length === 0) {
                console.info('No records found for local balance')
                return 0
            }

            const totalMicrocredits = records.reduce((sum, record) => {
                return sum + BigInt(record?.microcredits || 0)
            }, BigInt(0))

            return Number(totalMicrocredits) / 1_000_000
        } catch (error) {
            console.error('Error fetching local balance:', error)
            // Return 0 instead of throwing to handle wallet SDK errors gracefully
            return 0
        }
    }, [wallet])

    // Testnet balance fetching logic with better error handling
    const fetchTestnetBalance = useCallback(async (): Promise<number> => {
        // Double-check wallet connection before making request
        if (!account?.address) {
            return 0
        }

        // Create a wrapper function to handle the Puzzle SDK call
        const safeGetBalance = async (address: string) => {
            try {
                // Add a simple timeout in case the Puzzle SDK gets stuck
                const timeoutPromise = new Promise<{ balances: TokenBalance[] }>((_, reject) => {
                    setTimeout(() => reject(new Error('Puzzle SDK timeout')), 5000)
                })

                // Race between actual request and timeout
                const result = await Promise.race([getBalance({ address }), timeoutPromise])

                return result
            } catch (error) {
                // Silently fail with empty balances for network errors
                if (
                    error instanceof Error &&
                    (error.message.includes('No connection found') || error.message.includes('timeout'))
                ) {
                    console.log('Network connection issue, returning empty balance')
                    return { balances: [] }
                }

                // Log other errors but don't propagate them
                console.error('Error in safeGetBalance:', error)
                return { balances: [] }
            }
        }

        try {
            // Use our safe wrapper function
            const tokens = await safeGetBalance(account?.address)

            const aleoCreditToken = tokens.balances.find(
                (token: TokenBalance) => token?.programId === 'credits.aleo' && token?.network === 'AleoTestnet',
            )

            if (!aleoCreditToken) {
                return 0
            }

            const totalBalance = (aleoCreditToken.values.public || 0) + (aleoCreditToken.values.private || 0)
            return totalBalance
        } catch (error) {
            // This should rarely happen since we handle errors in safeGetBalance
            console.log('Unhandled error in fetchTestnetBalance:', error)
            return 0
        }
    }, [account])

    // Main fetch balance function
    const fetchBalance = useCallback(async () => {
        // Prevent concurrent fetches
        if (fetchingRef.current) {
            return
        }

        // Check if wallet is connected
        if (!wallet?.connected || !wallet?.publicKey) {
            dispatch({ type: 'RESET' })
            return
        }

        // Set up fetch
        fetchingRef.current = true
        dispatch({ type: 'FETCH_START' })

        // Set up abort controller
        clearRequests()
        controllerRef.current = new AbortController()

        // Set timeout
        const timeoutId = setTimeout(() => {
            if (controllerRef.current) {
                controllerRef.current.abort()
                dispatch({ type: 'FETCH_ERROR', payload: 'Request timed out' })
                fetchingRef.current = false
            }
        }, 15000)

        try {
            // Check again if wallet is still connected before fetching
            if (!wallet?.connected || !wallet?.publicKey) {
                clearTimeout(timeoutId)
                dispatch({ type: 'RESET' })
                fetchingRef.current = false
                return
            }

            // Choose the right fetch function based on network
            const fetchFunction = network === 'local' ? fetchLocalBalance : fetchTestnetBalance

            // Fetch balance
            const newBalance = await fetchFunction()

            // Clear timeout
            clearTimeout(timeoutId)

            // Final check for wallet connection before updating state
            if (!wallet?.connected || !wallet?.publicKey) {
                dispatch({ type: 'RESET' })
            } else if (!controllerRef.current?.signal.aborted) {
                dispatch({ type: 'FETCH_SUCCESS', payload: newBalance })
            }
        } catch (error) {
            // Clear timeout
            clearTimeout(timeoutId)

            // Handle errors only if still connected
            if (wallet?.connected && wallet?.publicKey) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    dispatch({ type: 'FETCH_ERROR', payload: 'Request aborted' })
                } else {
                    let errorMessage = 'Failed to fetch balance'
                    if (error instanceof Error) {
                        errorMessage = error.message
                    }
                    dispatch({ type: 'FETCH_ERROR', payload: errorMessage })
                }
            } else {
                dispatch({ type: 'RESET' })
            }
        } finally {
            // Always clean up
            fetchingRef.current = false
            controllerRef.current = null
        }
    }, [clearRequests, fetchLocalBalance, fetchTestnetBalance, network, wallet?.connected, wallet?.publicKey])

    // Trigger fetch on wallet or network changes with a small delay to avoid rapid state changes
    useEffect(() => {
        // Reset and exit if wallet not connected
        if (!wallet?.connected || !wallet?.publicKey) {
            dispatch({ type: 'RESET' })
            return
        }

        // Add a small delay to prevent rapid fetches during transitions
        const fetchTimeoutId = setTimeout(() => {
            if (wallet?.connected && wallet?.publicKey) {
                fetchBalance()
            }
        }, 100)

        // Clean up on unmount or dependencies change
        return () => {
            clearTimeout(fetchTimeoutId)
            clearRequests()
        }
    }, [wallet?.connected, wallet?.publicKey, network, fetchBalance, clearRequests])

    // Manual fetch function for UI refresh buttons
    const refreshBalance = useCallback(() => {
        if (!fetchingRef.current && wallet?.connected && wallet?.publicKey) {
            fetchBalance()
        }
    }, [fetchBalance, wallet?.connected, wallet?.publicKey])

    return {
        balance: state.balance,
        isLoading: state.isLoading,
        error: state.error,
        lastUpdated: state.lastUpdated,
        fetchBalance: refreshBalance,
    }
}

export default useWalletBalance
