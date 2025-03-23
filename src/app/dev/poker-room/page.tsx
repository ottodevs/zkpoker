'use client'

import PokerControl from '@/components/PokerControl'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

// Console logging with emojis for better debugging
const logInit = (message: string) => console.log(`🚀 [Room-Init] ${message}`)
const logError = (message: string, error?: Error | unknown) => console.error(`❌ [Room-Error] ${message}`, error || '')
const logInfo = (message: string) => console.log(`ℹ️ [Room-Info] ${message}`)
const logAction = (action: string, message: string) => console.log(`🎮 [Room-${action}] ${message}`)

// Type definitions
interface GameInfo {
    gameId: number
    status: string
    txId?: string
    creator?: string
    joined?: Record<string, unknown>
}

interface _ChipsState {
    player1: number
    player2: number
    player3: number
    player1_bet: number
    player2_bet: number
    player3_bet: number
}

interface _PlayerState {
    [key: number]: { address: string; chips: number } | null
}

export default function PokerRoom() {
    const searchParams = useSearchParams()
    const gameId = parseInt(searchParams.get('gameId') || '1', 10)
    const isCreator = searchParams.get('creator') === 'true'

    const [account, setAccount] = useState<string | null>(null)
    const [gameState, setGameState] = useState<{
        playerTurn: number // 1, 2, or 3
        playerCards: [string, string] // Card codes like "Ad", "Kc"
        communityCards: string[] // Array of card codes
        pot: number
        playerChips: number
        betAmount: number
        isPlayerTurn: boolean
    }>({
        playerTurn: 1,
        playerCards: ['Ad', 'Jd'], // Default starting cards for display
        communityCards: [],
        pot: 0,
        playerChips: 1000,
        betAmount: 0,
        isPlayerTurn: true,
    })
    const [isLoading, setIsLoading] = useState<boolean>(false)

    // Track which seat is being hovered
    const [hoveredSeat, setHoveredSeat] = useState<number | null>(null)
    const [players, setPlayers] = useState<{ [key: number]: { address: string; chips: number } | null }>({
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
        6: null,
        7: null,
        8: null,
    })

    const workerRef = useRef<Worker | null>(null)
    const [network, setNetwork] = useState<'local' | 'testnet'>('local')
    const [loadingState, setLoadingState] = useState<string | null>(null)
    const [gameInfo, setGameInfo] = useState<GameInfo | null>(null)
    const [fetchInterval, setFetchInterval] = useState<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Initialize the worker
        logInit(`Initializing poker room for game ${gameId}, creator: ${isCreator}`)

        if (typeof window !== 'undefined') {
            try {
                logInit('Creating worker')
                // Create the worker using a simple JS file for compatibility
                workerRef.current = new Worker(new URL('../pokerWorker.js', import.meta.url))

                workerRef.current.onmessage = event => {
                    const { type, result } = event.data
                    logInfo(`Received worker response: ${type}`)

                    if (type === 'init') {
                        logInit(`Worker initialized: ${result}`)

                        // Set network (local for development, testnet for production)
                        const isLocal = window.location.hostname === 'localhost'
                        const networkToUse = isLocal ? 'local' : 'testnet'
                        setNetwork(networkToUse)

                        if (workerRef.current) {
                            logAction('Network', `Setting network to ${networkToUse}`)
                            workerRef.current.postMessage({
                                action: 'set_network',
                                data: { network: networkToUse },
                            })
                        }
                    } else if (type === 'network') {
                        logAction('Network', `Network set to ${result}`)
                    } else if (type === 'key') {
                        logAction('Account', `Generated key: ${result.substring(0, 10)}...`)
                        setAccount(result)
                        localStorage.setItem('aleoPrivateKey', result)

                        if (isCreator) {
                            // If we're the creator, create the game
                            setLoadingState('Creating game...')
                            workerRef.current?.postMessage({
                                action: 'create_game',
                                data: {
                                    gameId,
                                    privateKey: result,
                                    buyIn: 100,
                                    network,
                                },
                            })
                        }
                    } else if (type === 'create_game') {
                        setLoadingState(null)
                        logAction('Game', `Game created: ${JSON.stringify(result).substring(0, 100)}...`)
                        setGameInfo(result)

                        // Start periodic fetching of game state
                        startGameStateFetching(gameId)

                        // If we're the creator, mark seat 1 as taken
                        if (isCreator) {
                            logAction('Game', 'Creator taking seat 1')
                            setPlayers(prev => ({
                                ...prev,
                                1: { address: 'You (Player 1)', chips: 1000 },
                            }))
                        }
                    } else if (type === 'join_game') {
                        setLoadingState(null)
                        logAction('Game', `Game joined: ${JSON.stringify(result).substring(0, 100)}...`)

                        // Ensure proper typing when updating gameInfo with joined status
                        setGameInfo(prevState => {
                            if (!prevState)
                                return {
                                    gameId,
                                    status: 'joined',
                                    joined: result as Record<string, unknown>,
                                }
                            return {
                                ...prevState,
                                joined: result as Record<string, unknown>,
                            }
                        })

                        // Start periodic fetching of game state if not already fetching
                        if (!fetchInterval) {
                            startGameStateFetching(gameId)
                        }
                    } else if (type === 'place_bet') {
                        setIsLoading(false)
                        // Update game state based on bet result
                        logAction('Bet', `Placed bet of ${result.amount}`)
                        setGameState(prev => ({
                            ...prev,
                            pot: prev.pot + result.amount,
                            playerChips: prev.playerChips - result.amount,
                            isPlayerTurn: false,
                        }))
                    } else if (type === 'game_state') {
                        logAction('State', `Received game state: ${JSON.stringify(result).substring(0, 100)}...`)
                        handleGameStateUpdate(result)
                    } else if (type === 'chips_state') {
                        logAction('Chips', `Received chips state: ${JSON.stringify(result).substring(0, 100)}...`)
                        handleChipsStateUpdate(result)
                    } else if (type === 'cards_state') {
                        logAction('Cards', `Received cards state: ${JSON.stringify(result).substring(0, 100)}...`)
                        handleCardsStateUpdate(result)
                    } else if (type === 'error') {
                        setIsLoading(false)
                        setLoadingState(null)
                        logError(`Worker error: ${result.error || result}`)
                        alert(`Error: ${result.error || result}`)
                    }
                }

                // Get stored account or create a new one
                const storedKey = localStorage.getItem('aleoPrivateKey')
                if (storedKey) {
                    logAction('Account', 'Using stored private key')
                    setAccount(storedKey)

                    if (isCreator) {
                        // If we're the creator and have a stored key, create the game
                        setLoadingState('Creating game...')
                        workerRef.current.postMessage({
                            action: 'create_game',
                            data: {
                                gameId,
                                privateKey: storedKey,
                                buyIn: 100,
                                network,
                            },
                        })
                    } else {
                        // If we're not the creator, check the game state
                        startGameStateFetching(gameId)
                    }
                } else {
                    // Generate a new key
                    logAction('Account', 'Generating new private key')
                    workerRef.current.postMessage({ action: 'get_key' })
                }
            } catch (error) {
                logError('Error creating worker', error)
                alert('Failed to initialize the game. Please check the console for details.')
            }
        }

        return () => {
            if (workerRef.current) {
                logInfo('Terminating worker')
                workerRef.current.terminate()
            }

            if (fetchInterval) {
                clearInterval(fetchInterval)
            }
        }
    }, [isCreator, gameId])

    // Start periodic fetching of game state
    const startGameStateFetching = (gameId: number) => {
        if (fetchInterval) {
            clearInterval(fetchInterval)
        }

        // Fetch initial state
        fetchGameState(gameId)

        // Set up interval to fetch every 5 seconds
        const interval = setInterval(() => {
            fetchGameState(gameId)
        }, 5000)

        setFetchInterval(interval)
    }

    // Fetch game state from the blockchain
    const fetchGameState = (gameId: number) => {
        if (!workerRef.current) return

        logAction('Fetch', `Fetching game state for game ${gameId}`)

        // Fetch game state
        workerRef.current.postMessage({
            action: 'get_game_state',
            data: {
                gameId,
                network,
            },
        })

        // Fetch chips state
        workerRef.current.postMessage({
            action: 'get_chips_state',
            data: {
                gameId,
                network,
            },
        })

        // Fetch cards state
        workerRef.current.postMessage({
            action: 'get_cards_state',
            data: {
                gameId,
                network,
            },
        })
    }

    // Handle game state update from the blockchain
    const handleGameStateUpdate = (result: { error?: string; state?: Record<string, string> }) => {
        if (result.error) {
            logError(`Error getting game state: ${result.error}`)
            return
        }

        if (!result.state) {
            logInfo('Game state not found')
            return
        }

        // Parse and update the game state
        const state = result.state

        // Update players based on addresses in the game
        try {
            // ... example parsing logic (implement based on actual structure)
            const player1Address = state.player1
            const player2Address = state.player2
            const player3Address = state.player3

            const currentStateValue = parseInt(state.state, 10)

            setPlayers(prev => {
                const newPlayers = { ...prev }

                if (
                    player1Address &&
                    player1Address !== 'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc'
                ) {
                    newPlayers[1] = {
                        address:
                            account && isAddressMatch(player1Address, account)
                                ? 'You (Player 1)'
                                : `Player 1 (${truncateAddress(player1Address)})`,
                        chips: 1000, // Will be updated from chips state
                    }
                }

                if (
                    player2Address &&
                    player2Address !== 'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc'
                ) {
                    newPlayers[2] = {
                        address:
                            account && isAddressMatch(player2Address, account)
                                ? 'You (Player 2)'
                                : `Player 2 (${truncateAddress(player2Address)})`,
                        chips: 1000, // Will be updated from chips state
                    }
                }

                if (
                    player3Address &&
                    player3Address !== 'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc'
                ) {
                    newPlayers[3] = {
                        address:
                            account && isAddressMatch(player3Address, account)
                                ? 'You (Player 3)'
                                : `Player 3 (${truncateAddress(player3Address)})`,
                        chips: 1000, // Will be updated from chips state
                    }
                }

                return newPlayers
            })

            // Update turn information
            const isPlayerTurn = determineIfPlayerTurn(currentStateValue, account as string, state)

            setGameState(prev => ({
                ...prev,
                playerTurn: determinePlayerTurn(currentStateValue),
                isPlayerTurn: isPlayerTurn,
            }))
        } catch (error) {
            logError('Error parsing game state', error)
        }
    }

    // Handle chips state update from the blockchain
    const handleChipsStateUpdate = (result: { error?: string; chips?: Record<string, string> }) => {
        if (result.error || !result.chips) {
            return
        }

        try {
            const chips = result.chips

            // Update player chips
            const player1Chips = parseInt(chips.player1, 10)
            const player2Chips = parseInt(chips.player2, 10)
            const player3Chips = parseInt(chips.player3, 10)

            // Calculate pot from bets
            const player1Bet = parseInt(chips.player1_bet, 10)
            const player2Bet = parseInt(chips.player2_bet, 10)
            const player3Bet = parseInt(chips.player3_bet, 10)
            const totalPot = player1Bet + player2Bet + player3Bet

            // Update players chips
            setPlayers(prev => {
                const newPlayers = { ...prev }

                if (newPlayers[1]) {
                    newPlayers[1] = { ...newPlayers[1], chips: player1Chips }
                }

                if (newPlayers[2]) {
                    newPlayers[2] = { ...newPlayers[2], chips: player2Chips }
                }

                if (newPlayers[3]) {
                    newPlayers[3] = { ...newPlayers[3], chips: player3Chips }
                }

                return newPlayers
            })

            // Update game state
            setGameState(prev => {
                // Determine which player the current user is to set their chips
                let playerChips = prev.playerChips

                // This is simplistic - in a real implementation, determine which player the current user is
                if (isPlayerOne(account as string, gameInfo)) {
                    playerChips = player1Chips
                } else if (isPlayerTwo(account as string, gameInfo)) {
                    playerChips = player2Chips
                } else if (isPlayerThree(account as string, gameInfo)) {
                    playerChips = player3Chips
                }

                return {
                    ...prev,
                    pot: totalPot,
                    playerChips: playerChips,
                }
            })
        } catch (error) {
            logError('Error parsing chips state', error)
        }
    }

    // Handle cards state update from the blockchain
    const handleCardsStateUpdate = (result: { error?: string; cards?: Record<string, unknown> }) => {
        if (result.error || !result.cards) {
            return
        }

        try {
            const cards = result.cards

            // Process player cards - in real implementation these would be decrypted for viewing
            const playerCards: [string, string] = ['Ad', 'Jd'] // Default

            // Process community cards
            const flopCards = cards.flop ? parseCardsFromChain(cards.flop) : []
            const turnCard = cards.turn ? parseCardFromChain(cards.turn) : null
            const riverCard = cards.river ? parseCardFromChain(cards.river) : null

            const communityCards = [...flopCards, ...(turnCard ? [turnCard] : []), ...(riverCard ? [riverCard] : [])]

            // Update game state with cards
            setGameState(prev => ({
                ...prev,
                playerCards,
                communityCards,
            }))
        } catch (error) {
            logError('Error parsing cards state', error)
        }
    }

    // Function to handle joining the game
    const handleJoinGame = () => {
        if (!account) {
            alert('No account found. Please refresh the page to create an account.')
            return
        }

        if (!workerRef.current) {
            logError('Worker not initialized yet')
            return
        }

        setLoadingState('Joining game...')
        logAction('Join', `Sending join request for game ${gameId}`)

        // Join game via the worker
        workerRef.current.postMessage({
            action: 'join_game',
            data: {
                gameId,
                privateKey: account,
                network,
            },
        })
    }

    // Helper function to truncate Aleo address
    const truncateAddress = (address: string): string => {
        if (!address) return ''
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    }

    // Helper function to check if an address matches the current user
    const isAddressMatch = (_address: string, _privateKey: string): boolean => {
        // In a real implementation, we would derive the address from the private key and compare
        // For now, we'll assume the function exists
        // placeholder implementation
        return false
    }

    // Helper function to determine the current player's turn based on state
    const determinePlayerTurn = (stateValue: number): number => {
        // Map state values to player turns
        // This is a simplified example - implement based on actual game rules
        if (stateValue >= 5 && stateValue <= 7) {
            return stateValue - 4 // States 5, 6, 7 correspond to players 1, 2, 3
        } else if (stateValue >= 11 && stateValue <= 13) {
            return stateValue - 10 // States 11, 12, 13 correspond to players 1, 2, 3
        } else if (stateValue >= 17 && stateValue <= 19) {
            return stateValue - 16 // States 17, 18, 19 correspond to players 1, 2, 3
        } else if (stateValue >= 23 && stateValue <= 25) {
            return stateValue - 22 // States 23, 24, 25 correspond to players 1, 2, 3
        }

        return 1 // Default to player 1
    }

    // Helper function to determine if it's the current player's turn
    const determineIfPlayerTurn = (
        stateValue: number,
        privateKey: string,
        gameState: Record<string, unknown>,
    ): boolean => {
        // This is a simplified example - implement based on actual game rules
        const playerTurn = determinePlayerTurn(stateValue)

        // Determine which player the current user is
        const isPlayer1 = isPlayerOne(privateKey, gameState)
        const isPlayer2 = isPlayerTwo(privateKey, gameState)
        const isPlayer3 = isPlayerThree(privateKey, gameState)

        return (playerTurn === 1 && isPlayer1) || (playerTurn === 2 && isPlayer2) || (playerTurn === 3 && isPlayer3)
    }

    // Helper functions to determine which player the current user is
    const isPlayerOne = (_privateKey: string, _gameState: unknown): boolean => {
        // In a real implementation, check if the address derived from the private key matches player1
        return isCreator // Simplified for this example
    }

    const isPlayerTwo = (_privateKey: string, _gameState: unknown): boolean => {
        // Check if player 2
        return false // Placeholder
    }

    const isPlayerThree = (_privateKey: string, _gameState: unknown): boolean => {
        // Check if player 3
        return false // Placeholder
    }

    // Helper function to parse card values from the chain
    const parseCardsFromChain = (_cards: unknown): string[] => {
        // This would involve decrypting and formatting the cards from the chain
        // For now, return placeholder cards
        return ['Ah', 'Kh', 'Qh']
    }

    const parseCardFromChain = (_card: unknown): string => {
        // This would involve decrypting and formatting the card from the chain
        // For now, return a placeholder card
        return 'Jh'
    }

    // Function to handle poker actions
    const handleAction = (action: string) => {
        if (!account) {
            alert('No account found. Please refresh the page to create an account.')
            return
        }

        if (!workerRef.current) {
            logError('Worker not initialized yet')
            return
        }

        if (action.startsWith('bet_')) {
            const amount = parseInt(action.split('_')[1], 10)
            setIsLoading(true)
            logAction('Bet', `Sending bet of ${amount} to worker`)

            // Place bet via the worker
            workerRef.current.postMessage({
                action: 'place_bet',
                data: {
                    gameId,
                    amount,
                    privateKey: account,
                    network,
                },
            })
        } else if (action === 'fold') {
            // Handle fold action
            logAction('Fold', 'Player folded')
            setGameState(prev => ({
                ...prev,
                isPlayerTurn: false,
            }))

            // In the real implementation, we would send a fold transaction
        } else if (action === 'check') {
            // Handle check action (bet of 0)
            logAction('Check', 'Player checked')
            setIsLoading(true)

            workerRef.current.postMessage({
                action: 'place_bet',
                data: {
                    gameId,
                    amount: 0,
                    privateKey: account,
                    network,
                },
            })
        }
    }

    // Function to handle seat click
    const handleSeatClick = (seatNumber: number) => {
        // If seat is already taken, don't do anything
        if (players[seatNumber]) {
            logInfo(`Seat ${seatNumber} is already taken`)
            return
        }

        if (!account) {
            alert('No account found. Please refresh the page to create an account.')
            return
        }

        // In this simplified implementation, we'll map seat numbers to player positions
        // Seats 1, 2, 3 are for players 1, 2, 3
        if (seatNumber >= 1 && seatNumber <= 3) {
            // If this is seat 1 and we're not the creator, we can't take it
            if (seatNumber === 1 && !isCreator) {
                alert('Seat 1 is reserved for the game creator.')
                return
            }

            // Check if we're trying to join as a player when the game is already full or we're already in
            const playerSeats = Object.entries(players)
                .filter(([_, player]) => player !== null)
                .map(([seat]) => parseInt(seat))

            if (playerSeats.length >= 3) {
                alert('The game is already full with 3 players.')
                return
            }

            // Check if we're already seated
            if (playerSeats.some(seat => players[seat]?.address.startsWith('You'))) {
                alert('You are already seated at the table.')
                return
            }

            // Join the game if we're not the creator
            if (!isCreator) {
                handleJoinGame()
            }

            // Immediately update UI to show the player is seated
            setPlayers(prev => ({
                ...prev,
                [seatNumber]: {
                    address: `You (Player ${seatNumber})`,
                    chips: 1000,
                },
            }))

            logAction('Seat', `Player took seat ${seatNumber}`)
        } else {
            alert('Only seats 1-3 are available for players in this game.')
        }
    }

    // Empty seat component with hover effect
    const EmptySeat = ({ seatNumber }: { seatNumber: number }) => {
        const isHovered = hoveredSeat === seatNumber
        const isTaken = players[seatNumber] !== null

        if (isTaken) {
            return (
                <div className='relative'>
                    <Image src='/opponent-ring.svg' alt='Player' width={80} height={80} />
                    <div className='absolute top-[10px] left-[10px] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-blue-600'>
                        <span className='text-xs font-bold text-white'>{seatNumber}</span>
                    </div>
                </div>
            )
        }

        return (
            <div
                className='group relative cursor-pointer'
                onMouseEnter={() => setHoveredSeat(seatNumber)}
                onMouseLeave={() => setHoveredSeat(null)}
                onClick={() => handleSeatClick(seatNumber)}>
                <Image
                    src='/empty-seat.svg'
                    alt='Empty Seat'
                    width={80}
                    height={80}
                    className={`transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`}
                />
                <div
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-70'}`}>
                    <span className='text-center text-xs font-bold text-white'>
                        EMPTY
                        <br />
                        SEAT
                    </span>
                </div>
                {isHovered && (
                    <div className='absolute -top-8 left-1/2 -translate-x-1/2 transform rounded bg-black/80 px-2 py-1 text-xs whitespace-nowrap text-white'>
                        Click to sit here
                    </div>
                )}
            </div>
        )
    }

    return (
        <div
            className='relative min-h-screen w-full overflow-hidden'
            style={{
                backgroundImage: "url('/pokerback-ground.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
                height: '100vh',
                width: '100vw',
            }}>
            {/* Game information */}
            <div className='absolute top-5 left-5 inline-flex w-[162px] flex-col items-start justify-center gap-2 rounded-[35px] bg-gradient-to-b from-[#21516f] to-[#153f59] p-6 outline-[5px] outline-offset-[-5px] outline-[#3c5e6d]'>
                <div className="justify-start self-stretch font-['Exo'] text-base font-bold text-white">GAME ID</div>
                <div className="justify-start self-stretch font-['Exo'] text-2xl font-bold text-white">{gameId}</div>
                <div className="justify-start self-stretch font-['Exo'] text-base font-bold text-white">BLINDS</div>
                <div className="justify-start self-stretch font-['Exo'] text-2xl font-bold text-white">100/200</div>
                <div className="justify-start self-stretch font-['Exo'] text-base font-bold text-white">POT</div>
                <div className="justify-start self-stretch font-['Exo'] text-2xl font-bold text-white">
                    ${gameState.pot}
                </div>
            </div>

            {/* Poker table - positioned 100px above the control panel */}
            <div className='absolute bottom-[415px] left-1/2 -translate-x-1/2 transform'>
                <div className='poker-table-container relative' style={{ minWidth: '1047px', width: '1047px' }}>
                    <Image
                        src='/poker-table.svg'
                        alt='Poker Table'
                        width={1047}
                        height={534}
                        priority
                        style={{
                            width: '100%',
                            height: 'auto',
                            maxWidth: '100%',
                        }}
                        className='poker-table'
                    />

                    {/* Center pot display */}
                    {gameState.pot > 0 && (
                        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-lg bg-black/50 px-4 py-2'>
                            <div className='text-xl font-bold text-white'>${gameState.pot}</div>
                        </div>
                    )}

                    {/* Community cards */}
                    {gameState.communityCards.length > 0 && (
                        <div className='absolute top-[40%] left-1/2 flex -translate-x-1/2 -translate-y-1/2 transform gap-2'>
                            {gameState.communityCards.map((card, index) => (
                                <div key={index} className='relative'>
                                    <Image
                                        src={`/cards/${card}.svg`}
                                        alt={`Card ${index + 1}`}
                                        width={75}
                                        height={110}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Seat positions around the table */}
                    {/* Top row - 3 seats horizontally */}
                    <div className='absolute top-[-40%] left-1/2 -translate-x-1/2 transform'>
                        <EmptySeat seatNumber={1} />
                    </div>

                    <div className='absolute top-[-40%] left-[calc(40%-122px)] -translate-x-1/2 transform'>
                        <EmptySeat seatNumber={2} />
                    </div>

                    <div className='absolute top-[-40%] right-[calc(40%-122px)] translate-x-1/2 transform'>
                        <EmptySeat seatNumber={3} />
                    </div>

                    {/* Left side seats */}
                    <div className='absolute -top-[76px] left-[2%]'>
                        <EmptySeat seatNumber={4} />
                    </div>

                    <div className='absolute bottom-[40%] left-[-10%]'>
                        <EmptySeat seatNumber={5} />
                    </div>

                    {/* Bottom row */}
                    <div className='absolute bottom-[-15%] left-[10%]'>
                        <EmptySeat seatNumber={6} />
                    </div>

                    {/* Right side seats */}
                    <div className='absolute right-[10%] bottom-[-15%]'>
                        <EmptySeat seatNumber={7} />
                    </div>

                    <div className='absolute right-[2%] bottom-[100%]'>
                        <EmptySeat seatNumber={8} />
                    </div>
                </div>
            </div>

            {/* Back to lobby button */}
            <Link
                href='/'
                className='absolute top-5 right-5 rounded-full bg-blue-700 px-4 py-2 text-white hover:bg-blue-800'>
                Back to Lobby
            </Link>

            {/* Loading indicator */}
            {(isLoading || loadingState) && (
                <div className='absolute top-1/2 left-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 transform flex-col items-center justify-center gap-4 rounded-lg bg-black/80 p-6'>
                    <div className='h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500' />
                    <div className='font-semibold text-white'>{loadingState || 'Processing...'}</div>
                </div>
            )}

            {/* Player's cards - positioned above the user avatar in the control panel */}
            <div className='absolute bottom-[276px] left-1/2 z-10 flex -translate-x-1/2 transform'>
                <div className='relative -mr-8 -rotate-6'>
                    <Image src={`/cards/${gameState.playerCards[0]}.svg`} alt='Card 1' width={106} height={155} />
                </div>
                <div className='relative rotate-6'>
                    <Image src={`/cards/${gameState.playerCards[1]}.svg`} alt='Card 2' width={106} height={155} />
                </div>
            </div>

            {/* Poker Controls */}
            <PokerControl
                onAction={handleAction}
                playerChips={gameState.playerChips}
                minBet={100}
                isPlayerTurn={gameState.isPlayerTurn}
                isLoading={isLoading}
            />

            {/* Add styles to handle responsive behavior */}
            <style jsx global>{`
                @media (max-width: 1274px) {
                    .poker-table-container {
                        width: 100% !important;
                        min-width: 0 !important;
                    }
                }
            `}</style>
        </div>
    )
}
