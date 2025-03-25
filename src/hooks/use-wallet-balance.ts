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

const CREDITS_PROGRAM_ID = 'credits.aleo'

enum AleoChainId {
    Localnet = 'localnet',
    AleoTestnet = 'testnetbeta',
}

const ALEO_REST_API_BASE_URLS = new Map([
    [AleoChainId.AleoTestnet, 'https://api.explorer.provable.com/v1'],
    [AleoChainId.Localnet, 'http://localhost:3000'],
])

const ALEO_API_BASE_URLS = new Map([
    [AleoChainId.AleoTestnet, 'https://testnetbeta.aleorpc.com'],
    [AleoChainId.Localnet, 'http://localhost:3000'],
])

// Define RPC request/response types
interface JsonRpcRequest {
    jsonrpc: string
    id: number | string
    method: string
    params: Record<string, unknown>
}

interface JsonRpcResponse {
    jsonrpc: string
    id: number | string
    result?: unknown
    error?: {
        code: number
        message: string
        data?: unknown
    }
}

// Simple JSON-RPC client implementation
async function makeRpcRequest(url: string, method: string, params: Record<string, unknown>): Promise<unknown> {
    const id = Date.now()
    const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params,
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(request),
        })

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data: JsonRpcResponse = await response.json()

        if (data.error) {
            throw new Error(`RPC error: ${data.error.message}`)
        }

        return data.result
    } catch (error) {
        console.error('RPC request failed:', error)
        throw error
    }
}

async function getMappingValue(
    chainId: AleoChainId,
    mappingKey: string,
    programId: string = 'credits.aleo',
    mappingName: string = 'account',
): Promise<string> {
    const apiUrl = ALEO_API_BASE_URLS.get(chainId)
    if (!apiUrl) {
        throw new Error(`No API URL found for chain ID: ${chainId}`)
    }

    const result = await makeRpcRequest(apiUrl, 'getMappingValue', {
        program_id: programId,
        mapping_name: mappingName,
        key: mappingKey,
    })

    // Type assertion since we know the result should be a string
    return result as string
}

function parseBalanceString(balanceString: string): bigint {
    try {
        // Assuming the balance string format needs parsing similar to the original approach
        return BigInt(balanceString.slice(0, -3))
    } catch {
        return BigInt(0)
    }
}

async function getPublicBalance(
    chainId: AleoChainId,
    publicKey: string,
    programId: string = CREDITS_PROGRAM_ID,
): Promise<bigint> {
    // Attempt to get the balance using the mapping value first
    try {
        const balanceString = await getMappingValue(chainId, publicKey, programId, 'account')
        return parseBalanceString(balanceString)
    } catch (error) {
        console.error('Error getting balance from getMappingValue, trying direct API call', error)
    }

    // Fallback to direct API call if the above method fails
    const apiUrl = ALEO_REST_API_BASE_URLS.get(chainId)
    if (!apiUrl) {
        console.error(`No REST API URL found for chain ID: ${chainId}`)
        return BigInt(0)
    }

    try {
        const response = await fetch(`${apiUrl}/testnet/program/${programId}/mapping/account/${publicKey}`)
        if (response.ok) {
            const balanceString = await response.json()
            return parseBalanceString(balanceString)
        }
    } catch (error) {
        console.error('Error getting balance from direct API call', error)
    }

    // Return 0 if both methods fail
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
        console.log('fetchLocalBalance')

        // Double-check wallet connection before making request
        if (!account?.address) {
            return 0
        }

        try {
            if (!account.network) {
                throw new Error('Network not specified in account')
            }

            // Convert account.network to AleoChainId
            // Need to handle the case where account.network might not match AleoChainId
            let chainId: AleoChainId

            // Convert the network string to string for comparison
            const networkStr = String(account.network)

            console.log('networkStr', networkStr)

            if (networkStr === 'AleoTestnet') {
                chainId = AleoChainId.AleoTestnet
            } else if (networkStr === 'Localnet') {
                chainId = AleoChainId.Localnet
            } else {
                // Default to testnetbeta if no match
                chainId = AleoChainId.AleoTestnet
                console.warn(`Network "${networkStr}" not recognized, using TestnetBeta as default`)
            }

            const balance = await getPublicBalance(chainId, account.address, 'credits.aleo')
            console.log('balance', balance)

            // Convert from bigint to number (with proper scaling)
            return Number(balance) / 1_000_000
        } catch (error) {
            console.error('Error fetching local balance:', error)
            // Return 0 instead of throwing to handle wallet SDK errors gracefully
            return 0
        }
    }, [account])

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
