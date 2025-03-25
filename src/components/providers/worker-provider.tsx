import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

// Types
type Network = 'local' | 'testnet'
type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error'

interface GameState {
    gameId: number
    status: string
    txId?: string
    error?: string
    details?: string
}

interface PokerWorkerState {
    isInitialized: boolean
    isLoading: boolean
    privateKey: string | null
    connectionStatus: ConnectionStatus
    error: string | null
    network: Network
    lastGameState: GameState | null
}

interface PokerWorkerContextValue extends PokerWorkerState {
    initializeWorker: () => Promise<void>
    generateAccount: () => Promise<void>
    createGame: (gameId: number, buyIn?: number) => Promise<void>
    joinGame: (gameId: number) => Promise<void>
    placeBet: (gameId: number, amount: number) => Promise<void>
    getGameState: (gameId: number) => Promise<void>
    getChipsState: (gameId: number) => Promise<void>
    getCardsState: (gameId: number) => Promise<void>
    setNetwork: (network: Network) => void
}

// Create context
const PokerWorkerContext = createContext<PokerWorkerContextValue | null>(null)

// Provider component
export function PokerWorkerProvider({ children }: { children: React.ReactNode }) {
    const workerRef = useRef<Worker | null>(null)
    const [state, setState] = useState<PokerWorkerState>({
        isInitialized: false,
        isLoading: false,
        privateKey: null,
        connectionStatus: 'idle',
        error: null,
        network: 'testnet',
        lastGameState: null,
    })

    // Initialize worker
    const initializeWorker = useCallback(async () => {
        if (typeof window === 'undefined') return

        try {
            setState(prev => ({ ...prev, isLoading: true, connectionStatus: 'connecting' }))

            // Create worker instance
            workerRef.current = new Worker(new URL('@/lib/workers/poker-worker.ts', import.meta.url))

            // Set up message handler
            workerRef.current.onmessage = (event: MessageEvent) => {
                const { type, result } = event.data

                switch (type) {
                    case 'init':
                        setState(prev => ({
                            ...prev,
                            isInitialized: true,
                            isLoading: false,
                            connectionStatus: 'connected',
                        }))
                        break
                    case 'key':
                        setState(prev => ({
                            ...prev,
                            privateKey: result,
                            isLoading: false,
                        }))
                        break
                    case 'error':
                        setState(prev => ({
                            ...prev,
                            error: result,
                            isLoading: false,
                            connectionStatus: 'error',
                        }))
                        break
                    case 'network':
                        setState(prev => ({
                            ...prev,
                            network: result as Network,
                        }))
                        break
                    case 'create_game':
                    case 'join_game':
                    case 'place_bet':
                    case 'game_state':
                    case 'chips_state':
                    case 'cards_state':
                        setState(prev => ({
                            ...prev,
                            lastGameState: result as GameState,
                            isLoading: false,
                        }))
                        break
                }
            }

            // Initialize stored private key if exists
            const storedKey = localStorage.getItem('pokerPrivateKey')
            if (storedKey) {
                setState(prev => ({
                    ...prev,
                    privateKey: storedKey,
                    isLoading: false,
                }))
            }
        } catch (error) {
            console.error('Error initializing worker:', error)
            setState(prev => ({
                ...prev,
                error: 'Failed to initialize worker',
                isLoading: false,
                connectionStatus: 'error',
            }))
        }
    }, [])

    // Generate new account
    const generateAccount = useCallback(async () => {
        if (!workerRef.current) return

        setState(prev => ({ ...prev, isLoading: true }))
        workerRef.current.postMessage({ action: 'get_key' })
    }, [])

    // Create game
    const createGame = useCallback(
        async (gameId: number, buyIn: number = 100) => {
            if (!workerRef.current || !state.privateKey) return

            setState(prev => ({ ...prev, isLoading: true }))
            workerRef.current.postMessage({
                action: 'create_game',
                data: {
                    gameId,
                    privateKey: state.privateKey,
                    buyIn,
                    network: state.network,
                },
            })
        },
        [state.privateKey, state.network],
    )

    // Join game
    const joinGame = useCallback(
        async (gameId: number) => {
            if (!workerRef.current || !state.privateKey) return

            setState(prev => ({ ...prev, isLoading: true }))
            workerRef.current.postMessage({
                action: 'join_game',
                data: {
                    gameId,
                    privateKey: state.privateKey,
                    network: state.network,
                },
            })
        },
        [state.privateKey, state.network],
    )

    // Place bet
    const placeBet = useCallback(
        async (gameId: number, amount: number) => {
            if (!workerRef.current || !state.privateKey) return

            setState(prev => ({ ...prev, isLoading: true }))
            workerRef.current.postMessage({
                action: 'place_bet',
                data: {
                    gameId,
                    amount,
                    privateKey: state.privateKey,
                    network: state.network,
                },
            })
        },
        [state.privateKey, state.network],
    )

    // Get game state
    const getGameState = useCallback(
        async (gameId: number) => {
            if (!workerRef.current) return

            setState(prev => ({ ...prev, isLoading: true }))
            workerRef.current.postMessage({
                action: 'get_game_state',
                data: {
                    gameId,
                    network: state.network,
                },
            })
        },
        [state.network],
    )

    // Get chips state
    const getChipsState = useCallback(
        async (gameId: number) => {
            if (!workerRef.current) return

            setState(prev => ({ ...prev, isLoading: true }))
            workerRef.current.postMessage({
                action: 'get_chips_state',
                data: {
                    gameId,
                    network: state.network,
                },
            })
        },
        [state.network],
    )

    // Get cards state
    const getCardsState = useCallback(
        async (gameId: number) => {
            if (!workerRef.current) return

            setState(prev => ({ ...prev, isLoading: true }))
            workerRef.current.postMessage({
                action: 'get_cards_state',
                data: {
                    gameId,
                    network: state.network,
                },
            })
        },
        [state.network],
    )

    // Set network
    const setNetwork = useCallback((network: Network) => {
        console.log(`Setting network to ${network}`)

        setState(prev => ({ ...prev, network }))

        if (workerRef.current) {
            workerRef.current.postMessage({
                action: 'set_network',
                data: { network },
            })
        }
    }, [])

    // Initialize on mount
    useEffect(() => {
        initializeWorker()

        // Cleanup worker on unmount
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate()
            }
        }
    }, [initializeWorker])

    const value: PokerWorkerContextValue = {
        ...state,
        initializeWorker,
        generateAccount,
        createGame,
        joinGame,
        placeBet,
        getGameState,
        getChipsState,
        getCardsState,
        setNetwork,
    }

    return <PokerWorkerContext.Provider value={value}>{children}</PokerWorkerContext.Provider>
}

// Context hook
export function usePokerWorker() {
    const context = useContext(PokerWorkerContext)
    if (!context) {
        throw new Error('usePokerWorker must be used within a PokerWorkerProvider')
    }
    return context
}
