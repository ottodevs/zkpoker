import * as AleoService from '@/services/aleo-service'
import { useCallback, useEffect, useState } from 'react'

type NetworkType = 'local' | 'testnet'

interface UseAleoProps {
    network?: NetworkType
    autoInit?: boolean
}

type ErrorWithMessage = Error | { message: string }

// Utility function to safely extract error messages
const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return (error as ErrorWithMessage).message
    }
    return 'Unknown error occurred'
}

export const useAleo = ({ network = 'local', autoInit = true }: UseAleoProps = {}) => {
    const [isInitialized, setIsInitialized] = useState(false)
    const [isInitializing, setIsInitializing] = useState(autoInit)
    const [error, setError] = useState<string | null>(null)
    const [privateKey, setPrivateKey] = useState<string | null>(null)

    // Initialize Aleo environment
    const initialize = useCallback(async () => {
        try {
            setIsInitializing(true)
            setError(null)
            const initialized = await AleoService.initializeAleo()

            if (initialized) {
                setIsInitialized(true)

                // Check for stored private key
                const storedKey = localStorage.getItem('aleoPrivateKey')
                if (storedKey) {
                    setPrivateKey(storedKey)
                }
            } else {
                setError('Failed to initialize Aleo environment')
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err))
        } finally {
            setIsInitializing(false)
        }
    }, [])

    // Create or update private key
    const createAccount = useCallback(() => {
        try {
            const newPrivateKey = AleoService.createPrivateKey()
            setPrivateKey(newPrivateKey)
            localStorage.setItem('aleoPrivateKey', newPrivateKey)
            return newPrivateKey
        } catch (err: unknown) {
            setError(getErrorMessage(err))
            return null
        }
    }, [])

    // Create a new game
    const createGame = useCallback(
        async (gameId: number, buyIn: number) => {
            if (!privateKey) {
                setError('No private key available')
                return null
            }

            try {
                setError(null)
                return await AleoService.createGame(privateKey, gameId, buyIn, network)
            } catch (err: unknown) {
                const errorMsg = getErrorMessage(err)
                setError(errorMsg || `Failed to create game ${gameId}`)
                return null
            }
        },
        [privateKey, network],
    )

    // Join an existing game
    const joinGame = useCallback(
        async (gameId: number) => {
            if (!privateKey) {
                setError('No private key available')
                return null
            }

            try {
                setError(null)
                return await AleoService.joinGame(privateKey, gameId, network)
            } catch (err: unknown) {
                const errorMsg = getErrorMessage(err)
                setError(errorMsg || `Failed to join game ${gameId}`)
                return null
            }
        },
        [privateKey, network],
    )

    // Place a bet
    const placeBet = useCallback(
        async (gameId: number, amount: number) => {
            if (!privateKey) {
                setError('No private key available')
                return null
            }

            try {
                setError(null)
                return await AleoService.placeBet(privateKey, gameId, amount, network)
            } catch (err: unknown) {
                const errorMsg = getErrorMessage(err)
                setError(errorMsg || `Failed to place bet in game ${gameId}`)
                return null
            }
        },
        [privateKey, network],
    )

    // Get game state
    const getGameState = useCallback(
        async (gameId: number) => {
            try {
                setError(null)
                return await AleoService.getGameState(gameId, network)
            } catch (err: unknown) {
                const errorMsg = getErrorMessage(err)
                setError(errorMsg || `Failed to get state for game ${gameId}`)
                return null
            }
        },
        [network],
    )

    // Get chips state
    const getChipsState = useCallback(
        async (gameId: number) => {
            try {
                setError(null)
                return await AleoService.getChipsState(gameId, network)
            } catch (err: unknown) {
                const errorMsg = getErrorMessage(err)
                setError(errorMsg || `Failed to get chips for game ${gameId}`)
                return null
            }
        },
        [network],
    )

    // Get cards state
    const getCardsState = useCallback(
        async (gameId: number) => {
            try {
                setError(null)
                return await AleoService.getCardsState(gameId, network)
            } catch (err: unknown) {
                const errorMsg = getErrorMessage(err)
                setError(errorMsg || `Failed to get cards for game ${gameId}`)
                return null
            }
        },
        [network],
    )

    // Auto-initialize if needed
    useEffect(() => {
        if (autoInit && !isInitialized && !isInitializing) {
            initialize()
        }
    }, [autoInit, initialize, isInitialized, isInitializing])

    return {
        isInitialized,
        isInitializing,
        error,
        privateKey,
        initialize,
        createAccount,
        createGame,
        joinGame,
        placeBet,
        getGameState,
        getChipsState,
        getCardsState,
    }
}

export default useAleo
