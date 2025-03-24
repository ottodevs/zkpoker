'use client'

import { useEffect, useRef, useState } from 'react'

// Console logging with emojis for better debugging
const logInit = (message: string) => console.log(`🚀 [Lobby-Init] ${message}`)
const logError = (message: string, error?: unknown) => console.error(`❌ [Lobby-Error] ${message}`, error || '')
const logInfo = (message: string) => console.log(`ℹ️ [Lobby-Info] ${message}`)
const logAction = (action: string, message: string) => console.log(`🎮 [Lobby-${action}] ${message}`)

interface ProgramInfo {
    id: string
    bytecode: string
    functions: Record<string, unknown>
    [key: string]: unknown
}

export default function Home() {
    const [account, setAccount] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [games, setGames] = useState<Array<{ id: number; blinds: string; players: string }>>([
        { id: 1, blinds: '5/10', players: '0/3' },
    ])
    const [newGameId, setNewGameId] = useState<number>(2) // Start with ID 2 since we have a default game
    const [txStatus, setTxStatus] = useState<string | null>(null)
    const [txId, setTxId] = useState<string | null>(null)
    const [programInfo, setProgramInfo] = useState<ProgramInfo | null>(null)
    const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
    const [connectionError, setConnectionError] = useState<string | null>(null)

    const workerRef = useRef<Worker | null>(null)

    useEffect(() => {
        // Initialize the worker
        logInit('Initializing the poker page')
        if (typeof window !== 'undefined') {
            logInit('Creating worker')
            try {
                // Create the worker
                workerRef.current = new Worker(new URL('./worker.ts', import.meta.url))

                // Set loading state while initializing
                setIsLoading(true)
                setConnectionStatus('checking')

                workerRef.current.onmessage = event => {
                    const { type, result } = event.data
                    logInfo(`Received worker response: ${type}`)

                    if (type === 'privateKey') {
                        logAction('Account', `Key generated: ${result.substring(0, 10)}...`)
                        setAccount(result)
                        setIsLoading(false)
                        localStorage.setItem('pokerPrivateKey', result)
                        logInfo(`Account set: ${result.substring(0, 10)}...`)
                    } else if (type === 'createGame') {
                        setIsLoading(false)

                        // Check if result is an error message
                        if (typeof result === 'string' && result.startsWith('Error:')) {
                            logError(`Error creating game: ${result}`)
                            alert(result)
                            return
                        }

                        logAction('Game', `Created game with transaction ID: ${result.tx_id}`)
                        setTxId(result.tx_id)

                        // Add the new game to our list
                        setGames(prevGames => [
                            ...prevGames,
                            {
                                id: newGameId,
                                blinds: '5/10',
                                players: '1/3',
                            },
                        ])

                        // Si el resultado es simulado, mostrar un mensaje
                        if (result.simulated) {
                            setConnectionStatus('error')
                            setConnectionError(
                                `Operación simulada debido a problemas con la cadena local. TX ID: ${result.tx_id}`,
                            )
                        }
                    } else if (type === 'joinGame') {
                        setIsLoading(false)

                        // Check if result is an error message
                        if (typeof result === 'string' && result.startsWith('Error:')) {
                            logError(`Error joining game: ${result}`)
                            alert(result)
                            return
                        }

                        logAction('Game', `Joined game with transaction ID: ${result.tx_id}`)
                        setTxId(result.tx_id)

                        // Si el resultado es simulado, mostrar un mensaje
                        if (result.simulated) {
                            setConnectionStatus('error')
                            setConnectionError(
                                `Operación simulada debido a problemas con la cadena local. TX ID: ${result.tx_id}`,
                            )
                        }
                    } else if (type === 'transaction') {
                        logAction('Transaction', `Status: ${JSON.stringify(result).substring(0, 100)}...`)
                        setTxStatus(JSON.stringify(result, null, 2))
                    } else if (type === 'program') {
                        if (typeof result === 'string' && result.startsWith('Error:')) {
                            logError(`Error fetching program: ${result}`)
                            setConnectionStatus('error')
                            setConnectionError(result.replace('Error: ', ''))
                            setProgramInfo(null)
                        } else {
                            logAction('Program', `Got program info`)
                            setProgramInfo(result)
                            setConnectionStatus('connected')
                            setConnectionError(null)
                        }
                    } else if (type === 'error') {
                        setIsLoading(false)
                        logError(`Worker error: ${result}`)

                        // Si hay error de conexión
                        if (result.includes('conectar') || result.includes('500')) {
                            setConnectionStatus('error')
                            setConnectionError(result)
                        }

                        alert(`Error: ${result}`)

                        // If it was a key generation error, try again
                        if (result.includes('private key')) {
                            setTimeout(() => {
                                generateAccount()
                            }, 1000)
                        }
                    }
                }

                // Initialize account if we have a stored key
                const storedKey = localStorage.getItem('pokerPrivateKey')
                if (storedKey) {
                    logAction('Account', 'Using stored private key')
                    setAccount(storedKey)
                    setIsLoading(false)
                    logInfo(`Stored account set: ${storedKey.substring(0, 10)}...`)
                } else {
                    logAction('Account', 'No stored key, generating new one')
                    // Small delay to ensure worker is fully initialized
                    setTimeout(() => {
                        generateAccount()
                    }, 500)
                }

                // Get program info after a brief delay
                setTimeout(() => {
                    getProgram()
                }, 1000)
            } catch (error) {
                logError('Error creating worker', error)
                setIsLoading(false)
                setConnectionStatus('error')
                setConnectionError('Error initializing worker')
                alert('Failed to initialize the game. Please check the console for details.')
            }
        }

        return () => {
            if (workerRef.current) {
                logInfo('Terminating worker')
                workerRef.current.terminate()
            }
        }
    }, [newGameId])

    const generateAccount = () => {
        if (!workerRef.current) {
            logError('Worker not initialized yet')
            return
        }

        // Clear current account while generating
        setAccount(null)
        setIsLoading(true)

        logAction('Account', 'Requesting new private key')
        workerRef.current.postMessage({ action: 'getPrivateKey' })
    }

    const getProgram = () => {
        if (!workerRef.current) {
            logError('Worker not initialized yet')
            return
        }

        setConnectionStatus('checking')
        logAction('Program', 'Requesting program info')
        workerRef.current.postMessage({ action: 'getProgram' })
    }

    const checkTransaction = () => {
        if (!workerRef.current || !txId) {
            logError('Worker not initialized or no transaction ID')
            return
        }

        logAction('Transaction', `Checking status for: ${txId}`)
        workerRef.current.postMessage({
            action: 'getTransactionStatus',
            params: {
                txId: txId,
            },
        })
    }

    const createNewGame = () => {
        if (!account) {
            logError('Account is null or undefined when creating game')
            alert('Please wait for your account to be generated')
            // Try to regenerate the account
            generateAccount()
            return
        }

        if (!workerRef.current) {
            logError('Worker not initialized yet')
            return
        }

        setIsLoading(true)
        logAction('Game', `Creating new game with ID: ${newGameId}`)
        // Create a new game with our current account
        workerRef.current.postMessage({
            action: 'createGame',
            params: {
                gameId: newGameId,
                privateKey: account,
            },
        })

        // Increment for next game ID
        setNewGameId(prevId => prevId + 1)
    }

    const joinGame = (gameId: number) => {
        if (!account) {
            alert('Please wait for your account to be generated')
            return
        }

        if (!workerRef.current) {
            logError('Worker not initialized yet')
            return
        }

        setIsLoading(true)
        logAction('Game', `Joining game with ID: ${gameId}`)

        // In a real implementation we would get the actual deck data from the game state
        const mockDeckData =
            '[[1u128, 2u128, 3u128, 4u128, 5u128, 6u128, 7u128, 8u128, 9u128, 10u128, 11u128, 12u128, 13u128, 14u128, 15u128, 16u128, 17u128, 18u128, 19u128, 20u128, 21u128, 22u128, 23u128, 24u128, 25u128, 26u128], [27u128, 28u128, 29u128, 30u128, 31u128, 32u128, 33u128, 34u128, 35u128, 36u128, 37u128, 38u128, 39u128, 40u128, 41u128, 42u128, 43u128, 44u128, 45u128, 46u128, 47u128, 48u128, 49u128, 50u128, 51u128, 52u128]]'

        // Join the selected game
        workerRef.current.postMessage({
            action: 'joinGame',
            params: {
                gameId,
                privateKey: account,
                deckData: mockDeckData,
            },
        })
    }

    return (
        <div
            className='flex min-h-screen flex-col items-center justify-center'
            style={{
                backgroundImage: "url('/pokerback-ground.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}>
            <div className='w-full max-w-lg rounded-xl bg-black/70 p-8 text-white'>
                <h1 className='mb-4 text-center text-4xl font-bold'>ZK Poker Demo</h1>

                {/* Estado de la conexión */}
                <div
                    className={`mb-4 rounded-lg p-2 text-center text-sm ${
                        connectionStatus === 'connected'
                            ? 'bg-green-800/80 text-green-200'
                            : connectionStatus === 'error'
                              ? 'bg-red-800/80 text-red-200'
                              : 'bg-yellow-800/80 text-yellow-200'
                    }`}>
                    {connectionStatus === 'connected' && <span>✅ Conectado a la cadena local</span>}
                    {connectionStatus === 'checking' && <span>⏳ Verificando conexión a la cadena local...</span>}
                    {connectionStatus === 'error' && (
                        <div>
                            <span>❌ Error de conexión</span>
                            {connectionError && <p className='mt-1 text-xs'>{connectionError}</p>}
                            <button
                                onClick={getProgram}
                                className='mt-2 rounded bg-blue-600 px-2 py-1 text-xs hover:bg-blue-700'>
                                Reintentar
                            </button>
                        </div>
                    )}
                </div>

                {account ? (
                    <div className='mb-6 overflow-hidden rounded-lg bg-gray-800/80 p-3'>
                        <div className='mb-1 flex items-center justify-between'>
                            <p className='text-sm text-gray-400'>Your Account:</p>
                            <button
                                onClick={generateAccount}
                                className='rounded bg-blue-600 px-2 py-1 text-xs hover:bg-blue-700'>
                                Generate New
                            </button>
                        </div>
                        <p className='overflow-hidden text-xs overflow-ellipsis text-gray-300'>{account}</p>
                    </div>
                ) : (
                    <div className='mb-6 overflow-hidden rounded-lg bg-gray-800/80 p-3'>
                        <div className='flex items-center justify-between'>
                            <p className='text-sm text-gray-400'>Generating account...</p>
                            <button
                                onClick={generateAccount}
                                className='rounded bg-blue-600 px-2 py-1 text-xs hover:bg-blue-700'>
                                Generate Now
                            </button>
                        </div>
                        {isLoading && <p className='mt-2 text-sm text-gray-300'>Please wait...</p>}
                    </div>
                )}

                <div className='space-y-6'>
                    <div className='rounded-lg bg-gray-800/80 p-4'>
                        <h2 className='mb-2 text-2xl font-semibold'>Available Tables</h2>

                        {games.length > 0 ? (
                            games.map(game => (
                                <div
                                    key={game.id}
                                    className='mb-2 flex items-center justify-between rounded border border-gray-600 p-3'>
                                    <div>
                                        <div className='font-medium'>Texas Holdem</div>
                                        <div className='text-sm text-gray-400'>
                                            Game ID: {game.id} - Blinds: {game.blinds} - Players: {game.players}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => joinGame(game.id)}
                                        className='rounded bg-blue-600 px-4 py-2 hover:bg-blue-700 disabled:bg-gray-600'
                                        disabled={isLoading || !account || connectionStatus !== 'connected'}>
                                        Join
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className='text-gray-400'>No tables available. Create one below!</p>
                        )}
                    </div>

                    {txId && (
                        <div className='rounded-lg bg-gray-800/80 p-4'>
                            <h2 className='mb-2 text-xl font-semibold'>Transaction</h2>
                            <p className='text-sm break-all text-gray-300'>{txId}</p>
                            <button
                                onClick={checkTransaction}
                                className='mt-2 rounded bg-purple-600 px-4 py-1 text-sm hover:bg-purple-700'>
                                Check Status
                            </button>
                            {txStatus && (
                                <div className='mt-2 rounded-lg bg-gray-900 p-2'>
                                    <p className='overflow-auto text-xs text-gray-300' style={{ maxHeight: '100px' }}>
                                        {txStatus}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {programInfo && (
                        <div className='rounded-lg bg-gray-800/80 p-4'>
                            <h2 className='mb-2 text-xl font-semibold'>Program Info</h2>
                            <p className='overflow-auto text-xs text-gray-300' style={{ maxHeight: '100px' }}>
                                {JSON.stringify(programInfo, null, 2)}
                            </p>
                        </div>
                    )}

                    <div className='text-center'>
                        <button
                            className='rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-500'
                            onClick={createNewGame}
                            disabled={isLoading || !account || connectionStatus !== 'connected'}>
                            {isLoading
                                ? 'Processing...'
                                : connectionStatus !== 'connected'
                                  ? 'Esperando conexión...'
                                  : account
                                    ? 'Create New Table'
                                    : 'Waiting for Account...'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
