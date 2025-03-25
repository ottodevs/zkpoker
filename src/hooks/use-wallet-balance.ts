import { usePokerWorker } from '@/components/providers/worker-provider'
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'
import { useAccount } from '@puzzlehq/sdk'
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

const CREDITS_PROGRAM_ID = 'credits.aleo'

enum AleoChainId {
    Localnet = 'localnet',
    AleoTestnet = 'testnetbeta',
}

// Updated URL maps to use our proxied endpoints instead of direct calls
const ALEO_REST_API_BASE_URLS = new Map([
    [AleoChainId.AleoTestnet, '/api/aleo/testnet'],
    [AleoChainId.Localnet, '/api/local/testnet'],
])

function parseBalanceString(balanceString: string): bigint {
    try {
        // Handle the different balance string formats
        if (typeof balanceString === 'string') {
            // Format from local testnet: "93749999894244u64"
            if (balanceString.includes('u64')) {
                return BigInt(balanceString.replace('u64', '').trim())
            }
            // Format from RPC: might be normal number string
            return BigInt(balanceString)
        }
        return BigInt(0)
    } catch (error) {
        console.error('Error parsing balance string:', error, balanceString)
        return BigInt(0)
    }
}

async function getPublicBalance(
    chainId: AleoChainId,
    publicKey: string,
    programId: string = CREDITS_PROGRAM_ID,
): Promise<bigint> {
    console.log(`Getting public balance for ${publicKey} on chain ${chainId}`)

    // Get the base URL for the API
    const apiUrl = ALEO_REST_API_BASE_URLS.get(chainId)
    if (!apiUrl) {
        console.error(`No REST API URL found for chain ID: ${chainId}`)
        return BigInt(0)
    }

    // Implement retry logic
    const maxRetries = 3
    const retryDelay = 1000 // 1 second between retries
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Use the correct endpoint format based on the network
            const url = `${apiUrl}/program/${programId}/mapping/account/${publicKey}`
            console.log(`Fetching balance from URL (attempt ${attempt}/${maxRetries}):`, url)

            const response = await fetch(url)
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const balanceString = await response.json()
            console.log('Raw balance response:', balanceString)

            return parseBalanceString(balanceString)
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error))
            console.error(`Error getting balance (attempt ${attempt}/${maxRetries}):`, error)

            // If not the last attempt, wait before retrying
            if (attempt < maxRetries) {
                console.log(`Retrying in ${retryDelay}ms...`)
                await new Promise(resolve => setTimeout(resolve, retryDelay))
            }
        }
    }

    // If all retries failed, log and return 0
    console.error(`All ${maxRetries} attempts to fetch balance failed. Last error:`, lastError)
    return BigInt(0)
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
        console.log('fetchLocalBalance called with network:', network)

        // Double-check wallet connection before making request
        if (!account?.address) {
            return 0
        }

        try {
            // Map our network value to AleoChainId
            const chainId = network === 'local' ? AleoChainId.Localnet : AleoChainId.AleoTestnet
            console.log('Using chain ID:', chainId)

            const balance = await getPublicBalance(chainId, account.address, 'credits.aleo')
            console.log('Raw balance:', balance)

            // Convert from bigint to number (with proper scaling)
            return Number(balance) / 1_000_000
        } catch (error) {
            console.error('Error fetching local balance:', error)
            // Return 0 instead of throwing to handle wallet SDK errors gracefully
            return 0
        }
    }, [account, network])

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

            console.log('Fetching balance for network:', network)

            // Always use fetchLocalBalance for both networks, as we've updated it to handle both
            // This simplifies our code and avoids network-specific logic in multiple places
            const newBalance = await fetchLocalBalance()

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
    }, [clearRequests, fetchLocalBalance, network, wallet?.connected, wallet?.publicKey])

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
