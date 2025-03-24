'use client'

import { usePokerWorker } from '@/components/providers/worker-provider'
import { useEffect } from 'react'

export default function GamePage() {
    const {
        isInitialized,
        isLoading,
        privateKey,
        connectionStatus,
        error,
        network,
        lastGameState,
        generateAccount,
        createGame,
        joinGame,
        setNetwork,
    } = usePokerWorker()

    useEffect(() => {
        if (!privateKey) {
            generateAccount()
        }
    }, [privateKey, generateAccount])

    if (!isInitialized) {
        return <div>Initializing poker worker...</div>
    }

    if (connectionStatus === 'error') {
        return (
            <div className='text-red-500'>
                Error: {error}
                <button
                    onClick={() => setNetwork(network === 'local' ? 'testnet' : 'local')}
                    className='ml-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'>
                    Switch to {network === 'local' ? 'testnet' : 'local'}
                </button>
            </div>
        )
    }

    return (
        <div className='p-4'>
            <div className='mb-4'>
                <h1 className='text-2xl font-bold'>Poker Game</h1>
                <p className='text-sm text-gray-600'>
                    Network: {network} | Status: {connectionStatus}
                </p>
                {privateKey && <p className='text-sm text-gray-600'>Private Key: {privateKey.substring(0, 10)}...</p>}
            </div>

            <div className='space-y-4'>
                <div>
                    <button
                        onClick={() => createGame(1)}
                        disabled={isLoading || !privateKey}
                        className='rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50'>
                        Create New Game
                    </button>
                </div>

                <div>
                    <button
                        onClick={() => joinGame(1)}
                        disabled={isLoading || !privateKey}
                        className='rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50'>
                        Join Game #1
                    </button>
                </div>

                {lastGameState && (
                    <div className='mt-4 rounded bg-gray-100 p-4'>
                        <h2 className='font-bold'>Last Game State:</h2>
                        <pre className='text-sm'>{JSON.stringify(lastGameState, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    )
}
