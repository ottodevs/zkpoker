'use client'

import PokerControl from '@/components/poker-control'
import soundService from '@/services/sound-service'
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Define types for our game state
interface Player {
    id: string
    position: number // Seat number (1-9)
    chips: number
    avatarIndex: number
    holeCards: string[] // e.g. ["Ah", "Kd"]
    currentBet: number
    status: 'active' | 'folded' | 'all-in' | 'waiting'
    isDealer: boolean
    isSmallBlind: boolean
    isBigBlind: boolean
}

// Chip values constants
const CHIP_VALUES = {
    RED: 10, // Small blind / lower value
    BLUE: 20, // Big blind / medium value
    YELLOW: 50, // Higher value
    GREEN: 100, // Highest value
}

interface GameState {
    // Table state
    players: Player[]
    pot: number
    sidePots: { amount: number; eligiblePlayers: string[] }[]
    communityCards: string[]
    dealerPosition: number
    blinds: { small: number; big: number }
    currentBettingRound: 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown' | null
    currentPlayerTurn: number | null
    gamePhase: 'waiting' | 'dealing' | 'betting' | 'showdown' | 'finished'
    minBet: number
    lastRaiseAmount: number
    deck: string[]
    // Track the human player's ID for perspective rendering
    humanPlayerId: string | null
    // Flag to track if this is a new betting round to prevent auto-advancing
    isNewBettingRound?: boolean
}

// Add new types for turns and player actions after the GameState interface
type PlayerAction = 'check' | 'call' | 'bet' | 'raise' | 'fold' | 'all-in'

// Crear una referencia al worker de Aleo
const aleoWorker =
    typeof window !== 'undefined'
        ? new Worker(new URL('@/lib/workers/poker-worker.ts', import.meta.url), { type: 'module' })
        : null

export default function PokerRoom() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PokerRoomContent />
        </Suspense>
    )
}

function PokerRoomContent() {
    const searchParams = useSearchParams()
    const { connected, publicKey } = useWallet() // Changed from useAccount to useWallet

    // Add references to the blockchain of Aleo
    const [_blockchainGameId, setBlockchainGameId] = useState<number | null>(null)
    const [_blockchainTxId, setBlockchainTxId] = useState<string | null>(null)
    const [_blockchainStatus, setBlockchainStatus] = useState<'idle' | 'creating' | 'joining' | 'error' | 'connected'>(
        'idle',
    )

    // Player data from URL params
    const [playerData, setPlayerData] = useState({
        avatarIndex: 0,
        chips: 2300,
        blinds: '100/200',
        gameType: 'cash', // Default to cash game
    })

    // Game state
    const [gameState, setGameState] = useState<GameState | null>(null)

    // Track available seats - wrapped in useMemo to prevent recreation on each render
    const availableSeats = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9], [])

    // Track game status with a more visible state
    const [gameStatus, setGameStatus] = useState<'initializing' | 'waiting' | 'ready' | 'playing' | 'finished'>(
        'initializing',
    )

    // Add state for game notifications
    const [gameNotification, setGameNotification] = useState<{
        message: string
        type: 'info' | 'success' | 'error' | null
    }>({
        message: '',
        type: null,
    })

    // Use a ref to track if initialization has occurred
    const hasInitialized = useRef(false)

    // Helper function to shuffle the deck
    const shuffleDeck = useCallback((deck: string[]): string[] => {
        const shuffled = [...deck]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
    }, [])

    // Initialize game with this player
    const initializeGame = useCallback(
        (playerId: string, position: number, chips: number, avatarIndex: number) => {
            // Function to create a new game on the blockchain
            const createBlockchainGame = async (privateKey: string) => {
                if (!aleoWorker || !connected) {
                    console.error('Cannot create game: Worker not initialized or wallet not connected')
                    return
                }

                try {
                    setBlockchainStatus('creating')
                    // Generate a unique game ID based on timestamp
                    const gameId = Date.now() % 100000 // Smaller number for the blockchain
                    console.log(`Creating blockchain game with ID: ${gameId}`)

                    // Send message to worker to create game
                    aleoWorker.postMessage({
                        type: 'create_game',
                        gameId,
                        privateKey,
                        buyIn: playerData.chips, // Use player's chips as buy-in
                    })
                } catch (error) {
                    console.error('Error creating blockchain game:', error)
                    setBlockchainStatus('error')
                    setGameNotification({
                        message: `Error creating game: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        type: 'error',
                    })
                }
            }

            console.log(`Initializing game with player ${playerId} sitting at position ${position}`)

            // Create game on blockchain if user is connected
            if (connected && publicKey) {
                // In a real case, we would get the private key in a secure way
                // Here we use a simplified demo
                const demoPrivateKey = 'APrivateKey1zkpG9Af9z5Ha4ejVyMCqVFXRKknFrhta1j8uuiP8ew4qzUHx'
                createBlockchainGame(demoPrivateKey)
            }

            // Use chip value constants for blinds
            const smallBlind = CHIP_VALUES.RED // Red chip
            const bigBlind = CHIP_VALUES.BLUE // Blue chip

            // Create initial deck (will be shuffled when game actually starts)
            const suits = ['h', 'd', 'c', 's'] // hearts, diamonds, clubs, spades
            const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
            const deck = suits.flatMap(suit => values.map(value => `${value}${suit}`))

            // Create new player
            const newPlayer: Player = {
                id: playerId,
                position,
                chips,
                avatarIndex,
                holeCards: [],
                currentBet: 0,
                status: 'waiting', // Player is waiting for the game to start
                isDealer: true, // First player is dealer by default (will rotate)
                isSmallBlind: false,
                isBigBlind: false,
            }

            // Create initial game state
            const initialGameState: GameState = {
                players: [newPlayer],
                pot: 0,
                sidePots: [],
                communityCards: [],
                dealerPosition: position,
                blinds: { small: smallBlind, big: bigBlind },
                currentBettingRound: null, // Not yet started
                currentPlayerTurn: null, // Not yet started
                gamePhase: 'waiting', // Waiting for more players
                minBet: bigBlind,
                lastRaiseAmount: 0,
                deck: shuffleDeck(deck),
                humanPlayerId: playerId, // Track the human player for perspective rendering
            }

            setGameState(initialGameState)
            return initialGameState
        },
        [connected, playerData.chips, publicKey, shuffleDeck],
    )

    /**
     * Start a new hand after the current one ends
     */
    const startNewHand = useCallback(
        (gameState: GameState) => {
            console.log('Starting a new hand...')
            console.log('Previous community cards:', gameState.communityCards)

            // Reset the game state but keep players at the table
            // Usando un deep copy para evitar problemas con referencias
            const newGameState = JSON.parse(JSON.stringify(gameState))

            // Reset game properties
            newGameState.pot = 0
            newGameState.sidePots = []
            newGameState.communityCards = []
            newGameState.currentBettingRound = null
            newGameState.currentPlayerTurn = null
            newGameState.gamePhase = 'waiting'

            console.log('After reset community cards:', newGameState.communityCards)

            // Reset all players' states
            newGameState.players.forEach((player: Player) => {
                player.holeCards = []
                player.currentBet = 0
                player.status = 'active'
            })

            // Rotate dealer, SB, BB positions for the next hand
            rotateTablePositions(newGameState)

            // Create and shuffle a fresh deck for the new hand
            const suits = ['h', 'd', 'c', 's'] // hearts, diamonds, clubs, spades
            const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
            const freshDeck = suits.flatMap(suit => values.map(value => `${value}${suit}`))
            newGameState.deck = shuffleDeck(freshDeck)

            // Update game state
            setGameState(newGameState)

            // Reset game notification
            setGameNotification({ message: '', type: null })

            // Start a new hand after a short delay
            setTimeout(() => {
                // Update game status
                setGameStatus('playing')

                // Deal cards to players
                dealHoleCards(newGameState)

                // Set current player turn (after big blind)
                setCurrentPlayerTurn(newGameState)

                // Update game phase and betting round
                newGameState.gamePhase = 'betting'
                newGameState.currentBettingRound = 'pre-flop'

                // Show notification for new hand
                setGameNotification({
                    message: 'New Hand Dealt',
                    type: 'info',
                })

                // Clear notification after a delay
                setTimeout(() => {
                    setGameNotification({ message: '', type: null })
                }, 2000)

                // Update game state
                setGameState({ ...newGameState })

                // AI action will be handled by the useEffect
            }, 1000)
        },
        [shuffleDeck],
    )

    /**
     * Handle the showdown phase (determine winner)
     */
    const handleShowdown = useCallback(
        (gameState: GameState): void => {
            console.log('Handling showdown...')

            // Show showdown notification
            setGameNotification({
                message: 'Showdown!',
                type: 'info',
            })

            // Get active players
            const activePlayers = gameState.players.filter(p => p.status === 'active' || p.status === 'all-in')

            if (activePlayers.length === 0) {
                console.error('No active players at showdown')
                return
            }

            // Calculate hand strength for each player
            const playerStrengths = activePlayers.map(player => {
                const handStrength = evaluateHandStrength(player.holeCards, gameState.communityCards)
                return { player, handStrength }
            })

            // Sort players by hand strength (highest first)
            playerStrengths.sort((a, b) => b.handStrength - a.handStrength)

            // The winner is the player with the highest hand strength
            const winner = playerStrengths[0].player
            const isHumanWinner = winner.id === gameState.humanPlayerId

            console.log(
                `Player ${winner.id} wins the pot of ${gameState.pot} with hand strength ${playerStrengths[0].handStrength}`,
            )

            // Award pot to winner
            winner.chips += gameState.pot

            // Play win sound
            soundService.playSfx('WIN')

            // Show winning notification after a short delay
            setTimeout(() => {
                setGameNotification({
                    message: isHumanWinner ? `You win ${gameState.pot} chips!` : `Opponent wins ${gameState.pot} chips`,
                    type: 'success',
                })

                // Set game as finished
                setGameStatus('finished')

                // Begin a new hand after a delay
                setTimeout(() => {
                    setGameNotification({ message: '', type: null })
                    startNewHand(gameState)
                }, 3000)
            }, 2000)
        },
        [startNewHand],
    )

    /**
     * Advance the game phase after a betting round ends
     */
    const advanceGamePhase = useCallback(
        (gameState: GameState): void => {
            // If game is not in betting phase, do nothing
            if (gameState.gamePhase !== 'betting') {
                console.log(`Cannot advance game phase: current phase is ${gameState.gamePhase}, not 'betting'`)
                return
            }

            console.log(`Advancing game phase from ${gameState.currentBettingRound}...`)

            // Add a flag to mark this as a new betting round
            // This will prevent immediate checking for round completion
            gameState.isNewBettingRound = true

            // Handle different betting rounds
            switch (gameState.currentBettingRound) {
                case 'pre-flop':
                    console.log('Pre-flop round complete, dealing flop...')
                    // Deal the flop (first three community cards)
                    dealFlop(gameState)
                    gameState.currentBettingRound = 'flop'
                    console.log("Flop dealt, betting round updated to 'flop'")
                    break

                case 'flop':
                    console.log('Flop round complete, dealing turn...')
                    // Deal the turn (fourth community card)
                    dealTurn(gameState)
                    gameState.currentBettingRound = 'turn'
                    console.log("Turn dealt, betting round updated to 'turn'")
                    break

                case 'turn':
                    console.log('Turn round complete, dealing river...')
                    // Deal the river (fifth community card)
                    dealRiver(gameState)
                    gameState.currentBettingRound = 'river'
                    console.log("River dealt, betting round updated to 'river'")
                    break

                case 'river':
                    console.log('River round complete, moving to showdown...')
                    // Move to showdown
                    gameState.gamePhase = 'showdown'
                    gameState.currentBettingRound = 'showdown'
                    console.log("Game phase updated to 'showdown'")
                    // Evaluate hands and determine the winner
                    handleShowdown(gameState)
                    break

                default:
                    console.error('Unknown betting round:', gameState.currentBettingRound)
            }

            // Reset bets for the new round if not at showdown
            if (gameState.currentBettingRound !== 'showdown') {
                resetBetsForNewRound(gameState)

                // Set the player after the dealer as the first to act in post-flop rounds
                const sortedPlayers = [...gameState.players].sort((a, b) => a.position - b.position)
                const dealerIndex = sortedPlayers.findIndex(p => p.isDealer)
                const firstToActIndex = (dealerIndex + 1) % sortedPlayers.length

                // Check if this player is still active
                if (sortedPlayers[firstToActIndex].status === 'active') {
                    gameState.currentPlayerTurn = sortedPlayers[firstToActIndex].position
                    console.log(`First player to act after dealer is at position ${gameState.currentPlayerTurn}`)
                } else {
                    // Find the next active player
                    gameState.currentPlayerTurn = getNextPlayerInTurn(
                        gameState,
                        sortedPlayers[firstToActIndex].position,
                    )
                    console.log(
                        `First player is not active, next active player is at position ${gameState.currentPlayerTurn}`,
                    )
                }
            }

            console.log(`Advanced to ${gameState.currentBettingRound}, turn: ${gameState.currentPlayerTurn}`)
        },
        [handleShowdown],
    )

    // Start a new hand in the game
    const startGame = useCallback(
        (currentGameState = gameState) => {
            if (!currentGameState || currentGameState.players.length < 2) {
                console.log('Cannot start game: need at least 2 players')
                return
            }

            console.log('Starting new game with', currentGameState.players.length, 'players')

            // Update game status to playing
            setGameStatus('playing')

            // Create a fresh copy of the game state to work with
            const newGameState = { ...currentGameState }

            // Shuffle the deck
            newGameState.deck = shuffleDeck([...newGameState.deck])

            // Assign dealer, small blind, big blind positions
            assignTablePositions(newGameState)

            // Deal two cards to each player
            dealHoleCards(newGameState)

            // Set the current player turn (after big blind)
            setCurrentPlayerTurn(newGameState)

            // Update game phase and betting round
            newGameState.gamePhase = 'betting'
            newGameState.currentBettingRound = 'pre-flop'

            // Update the game state
            setGameState(newGameState)

            console.log('Game started successfully!', newGameState)

            // We'll handle opponent AI action in a separate useEffect
        },
        [gameState, setGameStatus, shuffleDeck, setGameState],
    )

    // Add a simulated opponent for testing
    const addSimulatedOpponent = useCallback(
        (currentGameState = gameState) => {
            if (!currentGameState) {
                console.log('Cannot add opponent, game state not initialized')
                return
            }

            console.log('Adding simulated opponent...')

            // Find an empty seat different from the human player
            const playerPositions = new Set(currentGameState.players.map(p => p.position))
            const emptySeatPositions = availableSeats.filter(pos => !playerPositions.has(pos))

            if (emptySeatPositions.length === 0) {
                console.log('No empty seats available for simulated opponent')
                return
            }

            // Choose a seat across from the player if possible
            const opposingSeatIndex = Math.floor(Math.random() * emptySeatPositions.length)
            const opponentSeatNumber = emptySeatPositions[opposingSeatIndex]

            // Create bot player with random avatar and appropriate chips
            const botAvatarIndex = Math.floor(Math.random() * 5) // 0-4
            const botPlayer: Player = {
                id: `bot_${Date.now()}`,
                position: opponentSeatNumber,
                chips: currentGameState.players[0].chips, // Match human player's chips
                avatarIndex: botAvatarIndex,
                holeCards: [],
                currentBet: 0,
                status: 'waiting',
                isDealer: false,
                isSmallBlind: false,
                isBigBlind: false,
            }

            console.log(`Adding simulated opponent at seat ${opponentSeatNumber} with avatar ${botAvatarIndex}`)

            // Update game state with new player
            const updatedGameState = {
                ...currentGameState,
                players: [...currentGameState.players, botPlayer],
            }

            setGameState(updatedGameState)

            // Wait for the DOM to update and opponent to be visually rendered
            setGameStatus('ready')

            // Check if opponent is visually seated
            console.log('Opponent added to game state, waiting for visual rendering...')
            setTimeout(() => {
                console.log('Checking if players are ready to start game...')
                if (updatedGameState && updatedGameState.players.length >= 2) {
                    console.log('Two players seated and visible! The game can now start.')
                    // Only start the game once we know the opponent is visually rendered
                    startGame(updatedGameState)
                }
            }, 1500)
        },
        [gameState, availableSeats, setGameState, setGameStatus, startGame],
    )

    // Auto-seat the player in an available seat
    const autoSeatPlayer = useCallback(
        (avatarIndex: number, chips: number) => {
            // Generate a player ID
            const playerId = `player_${Date.now()}`

            // Always seat player at position 9 (bottom center) for consistent UI
            const seatNumber = 9

            console.log(`Auto-seating player at seat ${seatNumber}`)

            // Initialize game with this player
            const initialGameState = initializeGame(playerId, seatNumber, chips, avatarIndex)

            // Add a visual waiting state
            setGameStatus('waiting')

            // After initialization, we could add a simulated opponent for testing
            // This would be handled by the server in a real multiplayer game
            console.log('Waiting for opponent to join...')
            setTimeout(() => {
                // We need to pass the initialGameState to make sure we have a game state even if component re-renders
                addSimulatedOpponent(initialGameState)
            }, 2000) // Increased delay to 2 seconds for better visual experience
        },
        [initializeGame, setGameStatus, addSimulatedOpponent],
    )

    // Parse URL parameters on load and auto-initialize the game
    useEffect(() => {
        // Only run this once to prevent multiple initializations
        if (hasInitialized.current) {
            return
        }

        // Initialize table music and sounds
        soundService.preloadGameSounds()
        if (soundService.isMusicEnabled()) {
            soundService.playMusic('TABLE')
        }

        if (searchParams) {
            const avatarIndex = parseInt(searchParams.get('avatar') || '0', 10)
            const chips = parseInt(searchParams.get('chips') || '2300', 10)
            const blinds = searchParams.get('blinds') || '100/200'
            const gameType = searchParams.get('gameType') || 'cash'

            console.log('Poker room received params:', { avatarIndex, chips, blinds, gameType })
            console.log('Avatar should be:', `/avatar${avatarIndex + 1}.png`)

            setPlayerData({
                avatarIndex,
                chips,
                blinds,
                gameType,
            })

            // Auto-initialize game with the player in a random seat
            // In a real game, this would be coordinated with the server
            autoSeatPlayer(avatarIndex, chips)

            // Mark as initialized
            hasInitialized.current = true
        }

        // Cleanup music when component unmounts
        return () => {
            soundService.stopMusic()
        }
    }, [searchParams, autoSeatPlayer])

    // Initial configuration of the Aleo worker
    useEffect(() => {
        if (!aleoWorker) return

        // Initialize the worker
        aleoWorker.postMessage({ type: 'init' })

        // Listen to messages from the worker
        aleoWorker.onmessage = event => {
            console.log('Worker message:', event.data)

            if (event.data.type === 'init') {
                console.log('Worker initialized')
            } else if (event.data.type === 'create_game') {
                if (event.data.status === 'created') {
                    setBlockchainStatus('connected')
                    setBlockchainGameId(event.data.gameId)
                    setBlockchainTxId(event.data.txId)
                    console.log(`Game created on blockchain with ID: ${event.data.gameId} and txID: ${event.data.txId}`)

                    // Here we could start the game in the UI
                    setGameNotification({
                        message: `Game created on blockchain! ID: ${event.data.gameId}`,
                        type: 'success',
                    })
                } else {
                    setBlockchainStatus('error')
                    console.error('Error creating game on blockchain:', event.data.error)
                    setGameNotification({
                        message: `Error creating game: ${event.data.error || 'Unknown error'}`,
                        type: 'error',
                    })
                }
            } else if (event.data.type === 'join_game') {
                if (event.data.status === 'joined') {
                    setBlockchainStatus('connected')
                    setBlockchainGameId(event.data.gameId)
                    setBlockchainTxId(event.data.txId)
                    console.log(`Joined game on blockchain with ID: ${event.data.gameId} and txID: ${event.data.txId}`)

                    // Here we could update the UI to show that the user joined the game
                    setGameNotification({
                        message: `Joined game on blockchain! ID: ${event.data.gameId}`,
                        type: 'success',
                    })
                } else {
                    setBlockchainStatus('error')
                    console.error('Error joining game on blockchain:', event.data.error)
                    setGameNotification({
                        message: `Error joining game: ${event.data.error || 'Unknown error'}`,
                        type: 'error',
                    })
                }
            }
            // More handlers for other game actions...
        }

        return () => {
            if (aleoWorker) {
                aleoWorker.terminate()
            }
        }
    }, [])

    // Check wallet connection before starting
    useEffect(() => {
        if (!connected && publicKey) {
            console.log('Wallet not connected. Please connect your wallet to play.')
            setGameNotification({
                message: 'Please connect your wallet to play',
                type: 'error',
            })
        }
    }, [connected, publicKey])

    // Mark the function as planned but not fully implemented
    const _joinBlockchainGame = async (gameId: number, privateKey: string) => {
        if (!aleoWorker || !connected) {
            console.error('Cannot join game: Worker not initialized or wallet not connected')
            return
        }

        try {
            setBlockchainStatus('joining')
            console.log(`Joining blockchain game with ID: ${gameId}`)

            // Send message to worker to join game
            aleoWorker.postMessage({
                type: 'join_game',
                gameId,
                privateKey,
            })
        } catch (error) {
            console.error('Error joining blockchain game:', error)
            setBlockchainStatus('error')
            setGameNotification({
                message: `Error joining game: ${error instanceof Error ? error.message : 'Unknown error'}`,
                type: 'error',
            })
        }
    }

    // Assign dealer, small blind, and big blind positions
    const assignTablePositions = (gameState: GameState) => {
        // Reset all player positions
        gameState.players.forEach(player => {
            player.isDealer = false
            player.isSmallBlind = false
            player.isBigBlind = false
            player.status = 'active' // All players are active at start of hand
        })

        // Sort players by position for easier assignment
        const sortedPlayers = [...gameState.players].sort((a, b) => a.position - b.position)

        // Find the dealer player index in the sorted array
        let dealerIndex = 0 // Default to first player for initial game

        // If we have a dealer position already set, use it
        if (gameState.dealerPosition !== undefined) {
            // Find the player with the dealer position in the sorted array
            dealerIndex = sortedPlayers.findIndex(p => p.position === gameState.dealerPosition)

            // If not found (should not happen), use first player
            if (dealerIndex === -1) {
                dealerIndex = 0
                console.warn('Could not find dealer position, defaulting to first player')
            }
        }

        // Assign dealer button
        sortedPlayers[dealerIndex].isDealer = true
        gameState.dealerPosition = sortedPlayers[dealerIndex].position
        console.log(`Dealer assigned to player at seat ${sortedPlayers[dealerIndex].position}`)

        // Assign small blind (next player after dealer)
        const sbIndex = (dealerIndex + 1) % sortedPlayers.length
        sortedPlayers[sbIndex].isSmallBlind = true

        // Collect small blind
        const sbAmount = gameState.blinds.small
        sortedPlayers[sbIndex].chips -= sbAmount
        sortedPlayers[sbIndex].currentBet = sbAmount
        gameState.pot += sbAmount
        console.log(`Small blind (${sbAmount}) collected from player at seat ${sortedPlayers[sbIndex].position}`)
        console.log(
            `Player at seat ${sortedPlayers[sbIndex].position} now has ${sortedPlayers[sbIndex].chips} chips and currentBet = ${sortedPlayers[sbIndex].currentBet}`,
        )

        // Assign big blind (next player after small blind)
        const bbIndex = (sbIndex + 1) % sortedPlayers.length
        sortedPlayers[bbIndex].isBigBlind = true

        // Collect big blind
        const bbAmount = gameState.blinds.big
        sortedPlayers[bbIndex].chips -= bbAmount
        sortedPlayers[bbIndex].currentBet = bbAmount
        gameState.pot += bbAmount
        console.log(`Big blind (${bbAmount}) collected from player at seat ${sortedPlayers[bbIndex].position}`)
        console.log(
            `Player at seat ${sortedPlayers[bbIndex].position} now has ${sortedPlayers[bbIndex].chips} chips and currentBet = ${sortedPlayers[bbIndex].currentBet}`,
        )

        console.log(
            `Assigned positions: Dealer=seat ${sortedPlayers[dealerIndex].position}, SB=seat ${sortedPlayers[sbIndex].position}, BB=seat ${sortedPlayers[bbIndex].position}`,
        )
        console.log(`Collected blinds: SB=${sbAmount}, BB=${bbAmount}, Total pot=${gameState.pot}`)
    }

    // Deal two hole cards to each player
    const dealHoleCards = (gameState: GameState) => {
        // Reset all hole cards
        gameState.players.forEach(player => {
            player.holeCards = []
        })

        // Play card shuffling sound
        soundService.playSfx('CARD_DEAL')

        // Sort players by position for clockwise dealing
        const sortedPlayers = [...gameState.players].sort((a, b) => a.position - b.position)

        // Get dealer index
        const dealerIndex = sortedPlayers.findIndex(p => p.isDealer)

        // Deal first card to each player starting from small blind
        for (let i = 0; i < sortedPlayers.length; i++) {
            const playerIndex = (dealerIndex + 1 + i) % sortedPlayers.length
            const card = gameState.deck.pop()
            if (card) {
                sortedPlayers[playerIndex].holeCards.push(card)
            }
        }

        // Deal second card to each player starting from small blind
        for (let i = 0; i < sortedPlayers.length; i++) {
            const playerIndex = (dealerIndex + 1 + i) % sortedPlayers.length
            const card = gameState.deck.pop()
            if (card) {
                sortedPlayers[playerIndex].holeCards.push(card)
            }
        }

        // Log the cards dealt to each player (for debugging)
        gameState.players.forEach(player => {
            console.log(`Player ${player.id} at seat ${player.position} received cards: ${player.holeCards.join(', ')}`)
        })
    }

    // Set the current player turn after dealer positions are assigned
    const setCurrentPlayerTurn = (gameState: GameState) => {
        // Find the player after the big blind
        const sortedPlayers = [...gameState.players].sort((a, b) => a.position - b.position)
        const bbIndex = sortedPlayers.findIndex(p => p.isBigBlind)
        const nextPlayerIndex = (bbIndex + 1) % sortedPlayers.length

        // Set the current player turn to the player after the big blind
        gameState.currentPlayerTurn = sortedPlayers[nextPlayerIndex].position

        console.log(`Current player turn: ${gameState.currentPlayerTurn} (seat number)`)
    }

    // Helper function to convert card value to SVG file path
    const getCardImagePath = (card: string) => {
        if (!card) return null

        // Convert card value to file path format
        // Format: '2h' -> '2h.svg', 'Kd' -> '13d.svg', etc.
        let cardValue = card.slice(0, -1) // Get value without suit
        const suit = card.slice(-1).toLowerCase() // Get suit (last character)

        // Convert face cards to numbers for file naming
        if (cardValue === 'J' || cardValue === 'j') cardValue = '11'
        else if (cardValue === 'Q' || cardValue === 'q') cardValue = '12'
        else if (cardValue === 'K' || cardValue === 'k') cardValue = '13'
        // Ace can stay as "A" since that's how the files are named

        return `/images/cards/${cardValue}${suit}.svg`
    }

    /**
     * Process player actions (check, call, bet, raise, fold)
     */
    const processPlayerAction = (action: string) => {
        console.log(`Processing player action: ${action}`)

        if (!gameState) return

        // Find the human player (assume always at position 5)
        const player = gameState.players.find(p => p.id === gameState.humanPlayerId)

        if (!player) {
            console.error('Player not found')
            return
        }

        // Check if it's the player's turn
        if (!isPlayerTurn(gameState, player.id)) {
            console.log('Not your turn!')
            return
        }

        // Get valid actions and check if the action is valid
        const validActions = getValidActions(gameState)

        // Verify the action is valid - handle special case for all_in
        let actionType = action.includes('_') ? action.split('_')[0] : action

        // Map "all_in" to "all-in" (the format expected by the validation)
        if (actionType === 'all_in') {
            actionType = 'all-in'
        }

        // Handle the case where player tries to bet when raise is required
        if (actionType === 'bet' && !validActions.includes('bet') && validActions.includes('raise')) {
            console.log('Converting bet action to raise action since bet is not valid but raise is')
            actionType = 'raise'
            // Also update the full action for processing
            if (action.startsWith('bet_')) {
                action = 'raise_' + action.split('_')[1]
            } else {
                action = 'raise'
            }
        }

        if (!validActions.includes(actionType as PlayerAction)) {
            console.log(`Invalid action: ${action}. Valid actions are: ${validActions.join(', ')}`)
            return
        }

        console.log(`Executing valid action: ${action}`)

        // Process different actions
        if (action === 'call') {
            handleCallAction(gameState, player)

            // Update game state after action
            const updatedGameState = advanceTurn(gameState)
            setGameState(updatedGameState)
        } else if (action === 'check') {
            handleCheckAction(gameState, player)

            // Update game state after action
            const updatedGameState = advanceTurn(gameState)
            setGameState(updatedGameState)
        } else if (action === 'fold') {
            handleFoldAction(gameState, player)

            // No need to call advanceTurn here as it's handled in handleFoldAction
            // to properly check for game-ending conditions
        } else if (action === 'bet') {
            // Default bet amount (minimum bet)
            handleBetAction(gameState, player, gameState.blinds.big)

            // Update game state after action
            const updatedGameState = advanceTurn(gameState)
            setGameState(updatedGameState)
        } else if (action.startsWith('bet_')) {
            // Handle bet with specified amount
            const betAmount = parseInt(action.split('_')[1], 10)
            if (!isNaN(betAmount)) {
                handleBetAction(gameState, player, betAmount)

                // Update game state after action
                const updatedGameState = advanceTurn(gameState)
                setGameState(updatedGameState)
            }
        } else if (action === 'raise') {
            // Default raise amount (minimum raise)
            handleBetAction(gameState, player, gameState.minBet * 2)

            // Update game state after action
            const updatedGameState = advanceTurn(gameState)
            setGameState(updatedGameState)
        } else if (action.startsWith('raise_')) {
            // Handle raise with specified amount
            const raiseAmount = parseInt(action.split('_')[1], 10)
            if (!isNaN(raiseAmount)) {
                handleBetAction(gameState, player, raiseAmount)

                // Update game state after action
                const updatedGameState = advanceTurn(gameState)
                setGameState(updatedGameState)
            }
        } else if (action === 'all-in' || action.startsWith('all_in_')) {
            // Handle all-in action - bet all remaining chips
            const allInAmount = action.startsWith('all_in_') ? parseInt(action.split('_')[2], 10) : player.chips

            if (!isNaN(allInAmount)) {
                console.log(`Processing all-in with ${allInAmount} chips`)
                handleBetAction(gameState, player, allInAmount)
                player.status = 'all-in'

                // Update game state after action
                const updatedGameState = advanceTurn(gameState)
                setGameState(updatedGameState)
            }
        }
        // Handle other actions like raise, etc.
        // ... existing code ...
    }

    /**
     * Advance to the next player's turn
     */
    const advanceToNextPlayer = useCallback(
        (gameState: GameState) => {
            // Get the next player in turn
            const nextPlayerPosition = getNextPlayerInTurn(gameState, gameState.currentPlayerTurn)

            console.log(
                `advanceToNextPlayer called, current player: ${gameState.currentPlayerTurn}, next player: ${nextPlayerPosition}`,
            )

            // If there's no next player (all folded or all-in), end the round
            if (nextPlayerPosition === null) {
                console.log('No next player found, ending betting round and advancing game phase')
                // End current betting round and advance to next phase
                advanceGamePhase(gameState)
                return
            }

            // Set the next player as the current turn
            gameState.currentPlayerTurn = nextPlayerPosition
            console.log(`Turn advanced to player at position ${nextPlayerPosition}`)
        },
        [advanceGamePhase],
    )

    /**
     * Handle the "call" action
     */
    const handleCallAction = useCallback(
        (gameState: GameState, player: Player) => {
            console.log('Processing call action...')
            console.log(`Player current bet: ${player.currentBet}, chips: ${player.chips}`)

            // Play call sound
            soundService.playSfx('CALL')

            // Clear the new betting round flag since a player has acted
            gameState.isNewBettingRound = false

            // Find the highest bet at the table
            const highestBet = Math.max(...gameState.players.map(p => p.currentBet))
            console.log(`Highest bet at table: ${highestBet}`)

            // Calculate how much more the player needs to add to call
            const amountToCall = highestBet - player.currentBet
            console.log(`Amount needed to call: ${amountToCall}`)

            // Check if player has enough chips to call
            if (player.chips < amountToCall) {
                console.error(`Not enough chips to call. Need ${amountToCall} but only have ${player.chips}`)
                return
            }

            console.log(`Player calls ${amountToCall} (total bet will be ${player.currentBet + amountToCall})`)

            // Deduct the call amount from player's chips
            player.chips -= amountToCall

            // Add the call amount to player's current bet
            player.currentBet += amountToCall

            // Add the call amount to the pot
            gameState.pot += amountToCall

            console.log(`Call processed. Player now has ${player.chips} chips and current bet of ${player.currentBet}`)
            console.log(`New pot total: ${gameState.pot}`)

            // Check if betting round is complete after this call
            if (isBettingRoundComplete(gameState)) {
                console.log('After call, betting round is complete!')
                advanceGamePhase(gameState)
            } else {
                // Advance to the next player only if betting round isn't complete
                advanceToNextPlayer(gameState)
            }

            // Update the game state
            setGameState({ ...gameState })
        },
        [advanceGamePhase, advanceToNextPlayer],
    )

    /**
     * Handle the "check" action
     */
    const handleCheckAction = useCallback(
        (gameState: GameState, player: Player) => {
            console.log('Processing check action...')

            // Play check sound
            soundService.playSfx('CHECK')

            // Clear the new betting round flag since a player has acted
            gameState.isNewBettingRound = false

            // Verify that the player can check (no bets or player has matched the highest bet)
            const highestBet = Math.max(...gameState.players.map(p => p.currentBet))

            if (highestBet > player.currentBet) {
                console.error(`Cannot check, there's a bet to call: ${highestBet}`)
                return
            }

            console.log(`Player checks (current bet: ${player.currentBet})`)

            // Check if betting round is complete after this check
            if (isBettingRoundComplete(gameState)) {
                console.log('After check, betting round is complete!')
                advanceGamePhase(gameState)
            } else {
                // Advance to the next player only if betting round isn't complete
                advanceToNextPlayer(gameState)
            }

            // Update the game state
            setGameState({ ...gameState })
        },
        [advanceGamePhase, advanceToNextPlayer],
    )

    /**
     * Handle the "fold" action
     */
    const handleFoldAction = useCallback(
        (gameState: GameState, player: Player) => {
            console.log('Processing fold action...')

            // Play fold sound
            soundService.playSfx('FOLD')

            // Clear the new betting round flag since a player has acted
            gameState.isNewBettingRound = false

            // Mark the player as folded
            player.status = 'folded'
            console.log(`Player ${player.id} folded`)

            // Show fold notification
            const isHuman = player.id === gameState.humanPlayerId
            setGameNotification({
                message: isHuman ? 'You folded' : `Opponent folded`,
                type: 'info',
            })

            // In a heads-up game (2 players) or when only one active player remains,
            // immediately award the pot and start a new hand
            const activePlayers = gameState.players.filter(p => p.status === 'active' || p.status === 'all-in')
            console.log(`Active players remaining: ${activePlayers.length}`)

            // If there's only one active player left or this is a heads-up game and someone folded
            if (activePlayers.length === 1 || gameState.players.length === 2) {
                // The remaining active player wins the pot
                const winner = activePlayers[0]
                const isHumanWinner = winner.id === gameState.humanPlayerId
                console.log(`Player ${winner.id} wins by default (opponent folded)`)

                // Award the pot to the winner
                winner.chips += gameState.pot
                console.log(`Awarding pot of ${gameState.pot} to player ${winner.id}`)

                // Show winning notification
                setGameNotification({
                    message: isHumanWinner ? `You win ${gameState.pot} chips!` : `Opponent wins ${gameState.pot} chips`,
                    type: 'success',
                })

                // Show temporary winning message
                setGameStatus('finished')

                // Begin a new hand after a delay
                setTimeout(() => {
                    // Clear notification before starting new hand
                    setGameNotification({ message: '', type: null })
                    startNewHand(gameState)
                }, 3000)

                return
            }

            // If more than one active player and not a heads-up game, advance to the next player
            advanceToNextPlayer(gameState)

            // Update the game state
            setGameState({ ...gameState })

            // Clear notification after 3 seconds
            setTimeout(() => {
                setGameNotification({ message: '', type: null })
            }, 3000)
        },
        [advanceToNextPlayer, startNewHand],
    )

    /**
     * Rotate table positions (dealer, small blind, big blind)
     */
    const rotateTablePositions = (gameState: GameState) => {
        console.log('Rotating table positions for a new hand...')

        // Find current dealer with position or index
        let currentDealerIndex = -1

        // First try to find by isDealer flag
        currentDealerIndex = gameState.players.findIndex(p => p.isDealer)

        // If not found, try to find by dealerPosition
        if (currentDealerIndex === -1 && gameState.dealerPosition !== null) {
            currentDealerIndex = gameState.players.findIndex(p => p.position === gameState.dealerPosition)
        }

        // If still not found, default to first player
        if (currentDealerIndex === -1) {
            console.warn('Could not find current dealer, defaulting to first player')
            currentDealerIndex = 0
        }

        console.log(
            `Current dealer found at index ${currentDealerIndex}, position ${gameState.players[currentDealerIndex].position}`,
        )

        // Reset all positions
        gameState.players.forEach(p => {
            p.isDealer = false
            p.isSmallBlind = false
            p.isBigBlind = false
        })

        // Rotate dealer to next player (clockwise)
        const nextDealerIndex = (currentDealerIndex + 1) % gameState.players.length
        gameState.players[nextDealerIndex].isDealer = true
        gameState.dealerPosition = gameState.players[nextDealerIndex].position

        // Set small blind and big blind
        const sbIndex = (nextDealerIndex + 1) % gameState.players.length
        const bbIndex = (sbIndex + 1) % gameState.players.length

        gameState.players[sbIndex].isSmallBlind = true
        gameState.players[bbIndex].isBigBlind = true

        console.log(
            `Rotated positions: Dealer at seat ${gameState.players[nextDealerIndex].position}, SB at ${gameState.players[sbIndex].position}, BB at ${gameState.players[bbIndex].position}`,
        )
    }

    /**
     * Handle the "bet" action
     */
    const handleBetAction = useCallback(
        (gameState: GameState, player: Player, amount: number) => {
            console.log(`Processing bet/raise action with amount: ${amount}...`)

            // Play bet/chip sound
            soundService.playSfx('BET')

            // Clear the new betting round flag since a player has acted
            gameState.isNewBettingRound = false

            // Verify the player has enough chips
            if (player.chips < amount) {
                console.error(`Not enough chips to bet ${amount}. Only have ${player.chips}`)
                return
            }

            // Ensure bet is at least the minimum bet
            if (amount < gameState.minBet) {
                console.log(
                    `Bet amount (${amount}) is less than minimum bet (${gameState.minBet}), increasing to minimum`,
                )
                amount = gameState.minBet
            }

            console.log(`Player bets ${amount}`)

            // Deduct bet from player's chips
            player.chips -= amount

            // Add bet to player's current bet
            player.currentBet += amount

            // Add bet to the pot
            gameState.pot += amount

            // Update last raise amount
            gameState.lastRaiseAmount = amount

            console.log(`Bet processed. Player now has ${player.chips} chips and current bet of ${player.currentBet}`)
            console.log(`New pot total: ${gameState.pot}`)

            // Check if betting round is complete (shouldn't be after a bet, but check anyway)
            if (isBettingRoundComplete(gameState)) {
                console.log('After bet, betting round is complete!')
                advanceGamePhase(gameState)
            } else {
                // Advance to the next player
                advanceToNextPlayer(gameState)
            }

            // Update the game state
            setGameState({ ...gameState })
        },
        [advanceGamePhase, advanceToNextPlayer],
    )

    // Track which seat is being hovered
    const [hoveredSeat, setHoveredSeat] = useState<number | null>(null)

    // Track if player's cards are visible (for testing purposes)
    const [playerCardsVisible, setPlayerCardsVisible] = useState(true)

    // Function to handle seat click - updated to call handlePlayerJoinSeat
    const handleSeatClick = (seatNumber: number) => {
        console.log(`Clicked on seat ${seatNumber}`)
        handlePlayerJoinSeat(seatNumber)
    }

    // Function to get the human player's hole cards
    const getHumanPlayerCards = () => {
        if (!gameState || !gameState.humanPlayerId) return null

        const humanPlayer = gameState.players.find(p => p.id === gameState.humanPlayerId)
        if (!humanPlayer || humanPlayer.holeCards.length < 2) return null

        return {
            card1: getCardImagePath(humanPlayer.holeCards[0]),
            card2: getCardImagePath(humanPlayer.holeCards[1]),
        }
    }

    // Return early if page is still loading
    const { card1, card2 } = getHumanPlayerCards() || { card1: null, card2: null }

    // Log when playerData changes
    useEffect(() => {
        console.log('Player data updated:', playerData)
        console.log('Rendering PokerControl with avatarIndex:', playerData.avatarIndex)
    }, [playerData])

    // Function to handle a player joining a specific seat (for manual seat selection)
    const handlePlayerJoinSeat = (seatNumber: number) => {
        console.log(`Player joining seat ${seatNumber}`)

        // This would be used for manually joining a seat
        // But we're now auto-seating players when they arrive
        if (gameState) {
            console.log('Game already initialized. Player already seated.')
            return
        }

        // Generate a temporary player ID (would come from authentication in a real app)
        const playerId = `player_${Date.now()}`

        // Initialize game with the player in the selected seat
        initializeGame(playerId, seatNumber, playerData.chips, playerData.avatarIndex)
    }

    // Updated Empty Seat component to show actual player cards when occupied
    const EmptySeat = ({ seatNumber }: { seatNumber: number }) => {
        // Check if this seat is occupied
        const isOccupied = gameState?.players.some(player => player.position === seatNumber) || false

        // For perspective rendering, we want to know if this is the human player's seat
        const isHumanPlayer =
            gameState?.players.some(
                player => player.position === seatNumber && player.id === gameState.humanPlayerId,
            ) || false

        // Get the player at this seat (if any)
        const playerAtSeat = gameState?.players.find(player => player.position === seatNumber)

        // Determine if cards should be shown face up (during showdown)
        const showFaceUpCards = gameState?.gamePhase === 'showdown' && playerAtSeat?.status !== 'folded'

        // Log seat status for debugging
        if (isOccupied) {
            console.log(`Seat ${seatNumber} is occupied by ${isHumanPlayer ? 'human player' : 'opponent'}`)
        }

        // Only show hover effects for empty seats
        const isHovered = !isOccupied && hoveredSeat === seatNumber

        // Create a separate mouse handler for each seat
        const handleMouseEnter = (e: React.MouseEvent) => {
            // Prevent event bubbling
            e.stopPropagation()
            if (!isOccupied) {
                setHoveredSeat(seatNumber)
            }
        }

        const handleMouseLeave = (e: React.MouseEvent) => {
            // Prevent event bubbling
            e.stopPropagation()
            // Only set to null if this is the currently hovered seat
            if (hoveredSeat === seatNumber) {
                setHoveredSeat(null)
            }
        }

        // If this is the human player's seat, we don't render anything here
        // as the player will be shown at the bottom center via the PokerControl component
        if (isHumanPlayer) {
            console.log(`Not rendering seat ${seatNumber} because it's the human player's seat`)
            return null
        }

        // If a player is seated here, show their avatar and cards (face down)
        if (isOccupied && playerAtSeat) {
            console.log(`Rendering opponent at seat ${seatNumber} with avatar ${playerAtSeat.avatarIndex}`)
            return (
                <div className='relative'>
                    {/* Container for avatar and cards */}
                    <div className='relative'>
                        {/* Player avatar */}
                        <Image
                            src='/images/table/opponent-ring.svg'
                            alt='Player'
                            width={80}
                            height={80}
                            priority
                            style={{ height: 'auto' }}
                        />
                        <div className='absolute top-[10px] left-[10px] h-[60px] w-[60px] overflow-hidden rounded-full'>
                            <Image
                                src={`/images/avatars/avatar${playerAtSeat.avatarIndex + 1}.png`}
                                alt={`Player ${seatNumber}`}
                                width={60}
                                height={60}
                                className='h-full w-full object-cover'
                                priority
                                unoptimized={true}
                                style={{ height: 'auto' }}
                            />
                        </div>

                        {/* Player's cards */}
                        {gameState?.gamePhase !== 'waiting' &&
                            gameStatus === 'playing' &&
                            playerAtSeat.holeCards.length > 0 && (
                                <div className='absolute top-[30px] left-[10px] z-20'>
                                    <div className='relative flex -space-x-10'>
                                        {/* Show cards face up during showdown, face down otherwise */}
                                        {showFaceUpCards ? (
                                            <>
                                                <Image
                                                    src={getCardImagePath(playerAtSeat.holeCards[0]) || ''}
                                                    alt='Card 1'
                                                    width={80}
                                                    height={120}
                                                    priority
                                                    className='scale-[1.1] -rotate-15 transition-transform duration-500'
                                                    style={{ height: 'auto' }}
                                                />
                                                <Image
                                                    src={getCardImagePath(playerAtSeat.holeCards[1]) || ''}
                                                    alt='Card 2'
                                                    width={80}
                                                    height={120}
                                                    priority
                                                    className='scale-[1.1] rotate-15 transition-transform duration-500'
                                                    style={{ height: 'auto' }}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <Image
                                                    src='/images/table/cards/backofcard.png'
                                                    alt='Card Back'
                                                    width={80}
                                                    height={120}
                                                    priority
                                                    className='scale-[0.55] -rotate-15 transition-transform duration-300'
                                                    style={{ height: 'auto' }}
                                                />
                                                <Image
                                                    src='/images/table/cards/backofcard.png'
                                                    alt='Card Back'
                                                    width={80}
                                                    height={120}
                                                    priority
                                                    className='scale-[0.55] rotate-15 transition-transform duration-300'
                                                    style={{ height: 'auto' }}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>

                    {/* Debug seat number */}
                    <div className='absolute -bottom-6 w-full text-center'>
                        <span className='rounded bg-black/70 px-2 py-1 text-xs text-white'>Seat {seatNumber}</span>
                    </div>
                </div>
            )
        }

        // Otherwise, render an empty seat
        return (
            <div
                className='relative cursor-pointer'
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleSeatClick(seatNumber)}
                style={{
                    pointerEvents: 'auto',
                    touchAction: 'none',
                    position: 'relative',
                    zIndex: isHovered ? 30 : 10,
                }}>
                <Image
                    src='/images/table/empty-seat.svg'
                    alt='Empty Seat'
                    width={80}
                    height={80}
                    className={`transition-transform duration-150 ${isHovered ? 'scale-110' : 'scale-100'}`}
                    priority
                    style={{ height: 'auto' }}
                />
                <div
                    className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${isHovered ? 'opacity-100' : 'opacity-70'}`}>
                    <span className='text-center text-xs font-bold text-white'>
                        EMPTY
                        <br />
                        SEAT {seatNumber}
                    </span>
                </div>
                {isHovered && (
                    <div className='pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 transform rounded bg-black/80 px-2 py-1 text-xs whitespace-nowrap text-white'>
                        Click to sit here
                    </div>
                )}
            </div>
        )
    }

    // Add a useEffect to log game status changes
    useEffect(() => {
        console.log('Game status changed:', gameStatus)
    }, [gameStatus])

    // Add a useEffect to log players in the game state
    useEffect(() => {
        if (gameState) {
            console.log('Game state updated. Current players:', gameState.players)
            console.log('Current game phase:', gameState.gamePhase)
            if (gameState.players.length >= 2) {
                console.log('Both players seated! Human player ID:', gameState.humanPlayerId)
                console.log('Player 1 position:', gameState.players[0].position)
                console.log('Player 2 position:', gameState.players[1].position)
            }
        }
    }, [gameState])

    // Add useEffect to debug card dealing
    useEffect(() => {
        if (gameState && gameStatus === 'playing') {
            console.log('Cards should be visible now - Game phase:', gameState.gamePhase)

            const humanPlayer = gameState.players.find(p => p.id === gameState.humanPlayerId)
            if (humanPlayer && humanPlayer.holeCards.length === 2) {
                console.log("Human player's cards:", humanPlayer.holeCards)
                console.log('Card 1 image path:', getCardImagePath(humanPlayer.holeCards[0]))
                console.log('Card 2 image path:', getCardImagePath(humanPlayer.holeCards[1]))
            } else {
                console.log('Human player has no cards yet or not found')
            }
        }
    }, [gameStatus, gameState])

    // Add helper function to get dealer button position for each seat
    const getDealerButtonPosition = (seatNumber: number) => {
        const positions: { [key: number]: { top: string; left: string } } = {
            1: { top: 'calc(65% - 20px)', left: 'calc(28% - 30px)' },
            2: { top: 'calc(52% - 20px)', left: 'calc(15% - 20px)' },
            3: { top: 'calc(40% - 20px)', left: 'calc(18% - 0px)' },
            4: { top: 'calc(37% - 20px)', left: 'calc(28% - 0px)' },
            5: { top: 'calc(37% - 20px)', left: 'calc(66% - 0px)' },
            6: { top: 'calc(39% - 20px)', left: 'calc(77% - 0px)' },
            7: { top: 'calc(52% - 17px)', left: 'calc(82% + 0px)' },
            8: { top: 'calc(65% - 20px)', left: 'calc(69% + 30px)' },
            9: { top: 'calc(65% - 20px)', left: 'calc(45% + 40px)' },
        }

        return positions[seatNumber] || { top: '0', left: '0' }
    }

    // Helper function to get chip position for each seat (for blinds and bets)
    const getChipPosition = (seatNumber: number, type: 'blind' | 'bet' = 'blind') => {
        // Positions for blind chips (small blind and big blind)
        const blindPositions: { [key: number]: { top: string; left: string } } = {
            1: { top: 'calc(60% + 20px)', left: 'calc(23% + 15px)' },
            2: { top: 'calc(37% + 21px)', left: 'calc(6% + 28px)' },
            3: { top: 'calc(20% + 20px)', left: 'calc(11% + 30px)' },
            4: { top: 'calc(12% + 22px)', left: 'calc(25% + 28px)' },
            5: { top: 'calc(12% + 22px)', left: 'calc(68% - 22px)' },
            6: { top: 'calc(17% + 20px)', left: 'calc(83% - 30px)' },
            7: { top: 'calc(40% + 14px)', left: 'calc(89% - 24px)' },
            8: { top: 'calc(58% + 26px)', left: 'calc(73% - 5px)' },
            9: { top: 'calc(65% + 20px)', left: 'calc(50% - 10px)' },
        }

        // Positions for regular bet chips (slightly closer to center)
        const betPositions: { [key: number]: { top: string; left: string } } = {
            1: { top: 'calc(40% + 20px)', left: 'calc(30% + 0px)' },
            2: { top: 'calc(25% + 21px)', left: 'calc(16% + 20px)' },
            3: { top: 'calc(15% + 20px)', left: 'calc(26% + 30px)' },
            4: { top: 'calc(22% + 22px)', left: 'calc(35% + 20px)' },
            5: { top: 'calc(22% + 22px)', left: 'calc(58% + 0px)' },
            6: { top: 'calc(17% + 20px)', left: 'calc(69% + 0px)' },
            7: { top: 'calc(30% + 14px)', left: 'calc(79% + 0px)' },
            8: { top: 'calc(45% + 26px)', left: 'calc(65% + 5px)' },
            9: { top: 'calc(45% + 20px)', left: 'calc(45% + 0px)' },
        }

        // Return position based on type
        const positions = type === 'blind' ? blindPositions : betPositions
        return positions[seatNumber] || { top: '0', left: '0' }
    }

    /**
     * Get the next player in turn order (clockwise)
     * Skips players who have folded or are all-in
     */
    const getNextPlayerInTurn = (gameState: GameState, currentPosition: number | null): number | null => {
        if (!gameState || gameState.players.length < 2) {
            console.log('getNextPlayerInTurn: No game state or not enough players')
            return null
        }

        // Sort players by position for clockwise order
        const sortedPlayers = [...gameState.players].sort((a, b) => a.position - b.position)

        // If no current position, start with player after big blind
        if (currentPosition === null) {
            const bbIndex = sortedPlayers.findIndex(p => p.isBigBlind)
            if (bbIndex === -1) return sortedPlayers[0].position
            return sortedPlayers[(bbIndex + 1) % sortedPlayers.length].position
        }

        // Find the current player's index
        const currentIndex = sortedPlayers.findIndex(p => p.position === currentPosition)
        if (currentIndex === -1) {
            console.error('Current player position not found:', currentPosition)
            return sortedPlayers[0].position // Fallback to first player
        }

        // Find the next active player (not folded or all-in)
        let nextIndex = (currentIndex + 1) % sortedPlayers.length
        let loopCount = 0

        // Loop through players until we find an active one or have checked all players
        while (loopCount < sortedPlayers.length) {
            const nextPlayer = sortedPlayers[nextIndex]

            // Only active players can take their turn
            if (nextPlayer.status === 'active') {
                console.log(`Next player found at position ${nextPlayer.position} (status: ${nextPlayer.status})`)
                return nextPlayer.position
            }

            console.log(`Skipping player at position ${nextPlayer.position} (status: ${nextPlayer.status})`)

            // Move to the next player
            nextIndex = (nextIndex + 1) % sortedPlayers.length
            loopCount++
        }

        // If all players are inactive (folded/all-in), return null to end the round
        console.log('No active players found, returning null to end the round')
        return null
    }

    /**
     * Check if the current betting round is complete
     * A betting round is complete when all active players have either:
     * 1. Called the highest bet, or
     * 2. Folded
     */
    const isBettingRoundComplete = (gameState: GameState): boolean => {
        if (!gameState) return false

        console.log('Checking if betting round is complete...')

        // Get the highest bet at the table
        const highestBet = Math.max(...gameState.players.map(p => p.currentBet))
        console.log(`Highest bet at table: ${highestBet}`)

        // Count how many players can act
        const playersWhoCanAct = gameState.players.filter(p => p.status === 'active' || p.status === 'all-in').length

        // For rounds after pre-flop, require all active players to have had a chance to act
        if (gameState.currentBettingRound !== 'pre-flop' && highestBet === 0) {
            // If all active players have had a chance to act (by checking), then the round is complete
            // We track this by checking if we've returned to the first player who acted in this round

            // If we've made a full circle through all active players and everyone has checked,
            // then the round is complete
            if (playersWhoCanAct <= 1) {
                // Only one player left, round is complete
                console.log('Only one player can act, betting round is complete')
                return true
            }

            // If we're back to the first player who acted in this round, and everyone has checked,
            // then the round is complete
            if (!gameState.isNewBettingRound && gameState.currentPlayerTurn === gameState.humanPlayerId) {
                // We've made a full circle through all active players
                console.log('All players have checked, betting round is complete')
                return true
            }

            console.log(
                `No betting activity in ${gameState.currentBettingRound} round yet, checking if all players have acted`,
            )
        }

        // Check each active player
        for (const player of gameState.players) {
            // Skip folded players
            if (player.status === 'folded') continue

            // Skip all-in players
            if (player.status === 'all-in') continue

            // If an active player hasn't matched the highest bet, round isn't complete
            if (player.status === 'active' && player.currentBet !== highestBet) {
                console.log(
                    `Player ${player.id} at position ${player.position} has bet ${player.currentBet}, which doesn't match highest bet ${highestBet}`,
                )
                return false
            }
        }

        // If we're here, all active players have acted and matched the highest bet (or folded)
        console.log('All active players have matched the highest bet or folded - betting round is complete!')
        return true
    }

    // Add debug logging to advanceTurn
    const advanceTurn = (gameState: GameState): GameState => {
        // Create a copy of the game state
        const newGameState = { ...gameState }

        console.log('advanceTurn called, current betting round:', newGameState.currentBettingRound)
        console.log('Current player turn:', newGameState.currentPlayerTurn)

        // If this is a new betting round, clear the flag and don't check for completion
        if (newGameState.isNewBettingRound) {
            console.log('This is a new betting round, not checking for completion yet')
            newGameState.isNewBettingRound = false
            return newGameState
        }

        // Check if betting round is complete before advancing to next player
        if (isBettingRoundComplete(newGameState)) {
            console.log('Betting round is complete, advancing game phase...')
            advanceGamePhase(newGameState)
            return newGameState
        }

        // Get the next player in turn
        const nextPlayerPosition = getNextPlayerInTurn(newGameState, newGameState.currentPlayerTurn)
        console.log('Next player position:', nextPlayerPosition)

        // If there's no next player (all folded or all-in), end the round
        if (nextPlayerPosition === null) {
            console.log('No next player, ending current betting round and advancing game phase')
            // End current betting round and advance to next phase
            advanceGamePhase(newGameState)
            return newGameState
        }

        // Set the next player as the current turn
        newGameState.currentPlayerTurn = nextPlayerPosition
        console.log(`Turn advanced to player at position ${nextPlayerPosition}`)

        return newGameState
    }

    /**
     * Get valid actions for the current player
     */
    const getValidActions = useCallback((gameState: GameState): PlayerAction[] => {
        if (!gameState || gameState.currentPlayerTurn === null) {
            return []
        }

        const currentPlayer = gameState.players.find(p => p.position === gameState.currentPlayerTurn)
        if (!currentPlayer) return []

        const validActions: PlayerAction[] = ['fold']

        // Find the highest bet at the table
        const highestBet = Math.max(...gameState.players.map(p => p.currentBet))

        // If no one has bet yet or player has matched the highest bet, they can check
        if (highestBet === 0 || currentPlayer.currentBet === highestBet) {
            validActions.push('check')
        }

        // If there's a bet to call and player has enough chips
        if (highestBet > currentPlayer.currentBet && currentPlayer.chips > highestBet - currentPlayer.currentBet) {
            validActions.push('call')
        }

        // If player has enough chips to bet or raise
        if (currentPlayer.chips > 0) {
            // If no bet yet, player can bet
            if (highestBet === 0) {
                validActions.push('bet')
            }
            // If there's already a bet, player can raise if they have enough chips
            else if (currentPlayer.chips > highestBet - currentPlayer.currentBet + gameState.minBet) {
                validActions.push('raise')
            }
        }

        // All-in is always an option if player has chips
        if (currentPlayer.chips > 0) {
            validActions.push('all-in')
        }

        return validActions
    }, [])

    /**
     * Simulate actions for the AI opponent
     */
    const simulateOpponentAction = useCallback(() => {
        if (!gameState) return

        // Get the current player's ID
        const currentPlayer = gameState.players.find(p => p.position === gameState.currentPlayerTurn)

        // Make sure it's a bot player's turn (not the human player)
        if (!currentPlayer || currentPlayer.id === gameState.humanPlayerId) {
            console.log("Not opponent's turn, skipping AI action")
            return
        }

        console.log('Simulating opponent action...')
        console.log('Current betting round:', gameState.currentBettingRound)
        console.log('Current player status:', currentPlayer.status)
        console.log('Current player position:', currentPlayer.position)
        console.log('Current player bet:', currentPlayer.currentBet)

        // Clear the new betting round flag when AI acts
        gameState.isNewBettingRound = false

        // Add a small delay to make it feel more natural
        setTimeout(() => {
            // Get valid actions for the opponent
            const validActions = getValidActions(gameState)
            console.log('Valid actions for opponent:', validActions)

            // Basic AI logic - randomly choose an action from valid ones
            // In a real game, this would be more sophisticated based on hand strength
            if (validActions.length === 0) {
                console.log('No valid actions for opponent')
                return
            }

            // Simple probabilities for different actions
            const actionProbabilities: Record<PlayerAction, number> = {
                'check': 0.7, // 70% chance to check if possible
                'call': 0.6, // 60% chance to call if possible
                'fold': 0.2, // 20% chance to fold
                'bet': 0.4, // 40% chance to bet if possible
                'raise': 0.3, // 30% chance to raise if possible
                'all-in': 0.1, // 10% chance to go all-in
            }

            // Sort actions by preference/probability
            const sortedActions = validActions.sort(
                (a, b) => (actionProbabilities[b] || 0) - (actionProbabilities[a] || 0),
            )

            // Choose most preferred action with some randomness
            const randomFactor = Math.random()
            let chosenAction: PlayerAction

            if (randomFactor < 0.7) {
                // 70% of time, choose most preferred action
                chosenAction = sortedActions[0]
            } else if (randomFactor < 0.9) {
                // 20% of time, choose second most preferred action (if available)
                chosenAction = sortedActions.length > 1 ? sortedActions[1] : sortedActions[0]
            } else {
                // 10% of time, choose random action
                const randomIndex = Math.floor(Math.random() * sortedActions.length)
                chosenAction = sortedActions[randomIndex]
            }

            console.log(`Opponent chose action: ${chosenAction}`)

            // Execute the chosen action
            if (chosenAction === 'check') {
                handleCheckAction(gameState, currentPlayer)

                // Log current betting round after action
                console.log(`Current betting round after check: ${gameState.currentBettingRound}`)

                // Check if this action completed the betting round
                if (gameState.currentPlayerTurn !== currentPlayer.position) {
                    // If it's now another player's turn, check if it's the human
                    const nextPlayer = gameState.players.find(p => p.position === gameState.currentPlayerTurn)
                    if (nextPlayer && nextPlayer.id === gameState.humanPlayerId) {
                        console.log("It's now the human player's turn")
                    } else {
                        // Continue simulating AI actions for the next player
                        console.log('Continuing AI simulation for next opponent')
                        simulateOpponentAction()
                    }
                }
            } else if (chosenAction === 'call') {
                handleCallAction(gameState, currentPlayer)

                // Log current betting round after action
                console.log(`Current betting round after call: ${gameState.currentBettingRound}`)

                // Check if this action completed the betting round
                if (gameState.currentPlayerTurn !== currentPlayer.position) {
                    // If it's now another player's turn, check if it's the human
                    const nextPlayer = gameState.players.find(p => p.position === gameState.currentPlayerTurn)
                    if (nextPlayer && nextPlayer.id === gameState.humanPlayerId) {
                        console.log("After call action, it's now the human player's turn")
                    } else {
                        // Continue simulating AI actions for the next player
                        console.log('After call action, continuing AI simulation for next opponent')
                        simulateOpponentAction()
                    }
                }
            } else if (chosenAction === 'fold') {
                // Use the handleFoldAction function for consistency
                handleFoldAction(gameState, currentPlayer)

                // Check if the game is still in progress (not everyone folded)
                if (gameState.currentPlayerTurn !== null) {
                    // If the next player is the human, don't continue simulating
                    const nextPlayer = gameState.players.find(p => p.position === gameState.currentPlayerTurn)
                    if (nextPlayer && nextPlayer.id !== gameState.humanPlayerId) {
                        // Continue simulating next AI player
                        simulateOpponentAction()
                    }
                }
            } else if (chosenAction === 'bet') {
                // Simple betting logic - bet 2x the big blind
                const betAmount = gameState.blinds.big * 2

                // Use the proper handleBetAction function instead of manual code
                handleBetAction(gameState, currentPlayer, betAmount)

                // Log current betting round after action
                console.log(`Current betting round after bet: ${gameState.currentBettingRound}`)

                // Check if this action completed the betting round
                if (gameState.currentPlayerTurn !== currentPlayer.position) {
                    // If it's now another player's turn, check if it's the human
                    const nextPlayer = gameState.players.find(p => p.position === gameState.currentPlayerTurn)
                    if (nextPlayer && nextPlayer.id === gameState.humanPlayerId) {
                        console.log("After bet action, it's now the human player's turn")
                    } else {
                        // Continue simulating AI actions for the next player
                        console.log('After bet action, continuing AI simulation for next opponent')
                        simulateOpponentAction()
                    }
                }
            } else {
                console.log(`Action ${chosenAction} not implemented for AI yet`)

                // Default to check/call if action not implemented
                if (validActions.includes('check')) {
                    handleCheckAction(gameState, currentPlayer)
                } else if (validActions.includes('call')) {
                    handleCallAction(gameState, currentPlayer)
                }

                // Log current betting round after action
                console.log(`Current betting round after default action: ${gameState.currentBettingRound}`)

                // Check if this action completed the betting round
                if (gameState.currentPlayerTurn !== currentPlayer.position) {
                    // If it's now another player's turn, check if it's the human
                    const nextPlayer = gameState.players.find(p => p.position === gameState.currentPlayerTurn)
                    if (nextPlayer && nextPlayer.id === gameState.humanPlayerId) {
                        console.log("After default action, it's now the human player's turn")
                    } else {
                        // Continue simulating AI actions for the next player
                        console.log('After default action, continuing AI simulation for next opponent')
                        simulateOpponentAction()
                    }
                }
            }
        }, 1500) // 1.5 second delay for more natural feel
    }, [gameState, getValidActions, handleCheckAction, handleCallAction, handleFoldAction, handleBetAction])

    /**
     * For a real poker game, this would evaluate hand strength
     * This is a placeholder for a full poker hand evaluator
     */
    const evaluateHandStrength = (holeCards: string[], communityCards: string[]): number => {
        // This is a simplified placeholder
        // In a real implementation, this would determine hand ranks (pair, flush, etc.)
        // and return a numeric score

        // Count face value cards for a very primitive evaluation
        const allCards = [...holeCards, ...communityCards]
        const aces = allCards.filter(card => card.startsWith('A')).length
        const kings = allCards.filter(card => card.startsWith('K')).length
        const queens = allCards.filter(card => card.startsWith('Q')).length

        // Add some randomness for variety while giving weight to high cards
        const baseStrength = Math.random() * 500
        const highCardBonus = aces * 100 + kings * 50 + queens * 25

        return baseStrength + highCardBonus
    }

    /**
     * Reset all players' bets for a new betting round
     */
    const resetBetsForNewRound = (gameState: GameState): void => {
        console.log(
            'Resetting bets for new round. Current bets:',
            gameState.players.map(p => p.currentBet),
        )

        gameState.players.forEach((player: Player) => {
            player.currentBet = 0
        })

        // Reset the minimum bet to the big blind
        gameState.minBet = gameState.blinds.big
        gameState.lastRaiseAmount = 0

        console.log(
            'Bets reset for new round. Current bets:',
            gameState.players.map(p => p.currentBet),
        )
    }

    /**
     * Deal the flop (first three community cards)
     */
    const dealFlop = (gameState: GameState): void => {
        // Burn a card first (standard poker procedure)
        gameState.deck.pop()

        // Play card flip sound
        soundService.playSfx('CARD_DEAL')

        // Asegurarnos de que comienza con un array limpio de cartas si estamos en el flop
        // Esto garantiza que no se está acumulando cartas de manos anteriores
        if (gameState.communityCards.length > 0) {
            console.warn('Community cards array not empty before dealing flop. Resetting...')
            gameState.communityCards = []
        }

        // Deal three cards to the community
        for (let i = 0; i < 3; i++) {
            const card = gameState.deck.pop()
            if (card) {
                gameState.communityCards.push(card)
            }
        }

        console.log('Dealt flop:', gameState.communityCards)
        console.log('Total community cards after flop:', gameState.communityCards.length)

        // Show notification for the flop
        setGameNotification({
            message: 'The Flop',
            type: 'info',
        })

        // Clear notification after a delay
        setTimeout(() => {
            setGameNotification({ message: '', type: null })
        }, 2000)
    }

    /**
     * Deal the turn (fourth community card)
     */
    const dealTurn = (gameState: GameState): void => {
        // Burn a card first (standard poker procedure)
        gameState.deck.pop()

        // Play card flip sound
        soundService.playSfx('CARD_FLIP')

        // Deal the turn card
        const card = gameState.deck.pop()
        if (card) {
            // Verificamos que no exceda el límite esperado para el turn (4 cartas: 3 del flop + 1 del turn)
            if (gameState.communityCards.length < 4) {
                gameState.communityCards.push(card)
            } else {
                console.warn('Already have 4 community cards, not adding more turn cards')
                // Si ya hay 4 cartas, reemplazamos la cuarta (por si acaso)
                gameState.communityCards[3] = card
            }
        }

        console.log('Dealt turn:', gameState.communityCards[3])
        console.log('Total community cards after turn:', gameState.communityCards.length)

        // Show notification for the turn
        setGameNotification({
            message: 'The Turn',
            type: 'info',
        })

        // Clear notification after a delay
        setTimeout(() => {
            setGameNotification({ message: '', type: null })
        }, 2000)
    }

    /**
     * Deal the river (fifth community card)
     */
    const dealRiver = (gameState: GameState): void => {
        // Burn a card first (standard poker procedure)
        gameState.deck.pop()

        // Play card flip sound
        soundService.playSfx('CARD_FLIP')

        // Deal the river card
        const card = gameState.deck.pop()
        if (card) {
            // Nos aseguramos que no se exceda de 5 cartas comunitarias
            if (gameState.communityCards.length < 5) {
                gameState.communityCards.push(card)
            } else {
                console.warn('Already have 5 community cards, not adding more')
                // Si ya hay 5 cartas, reemplazamos la última (por si acaso)
                gameState.communityCards[4] = card
            }
        }

        console.log('Dealt river:', gameState.communityCards[4])
        console.log('Total community cards:', gameState.communityCards.length)

        // Show notification for the river
        setGameNotification({
            message: 'The River',
            type: 'info',
        })

        // Clear notification after a delay
        setTimeout(() => {
            setGameNotification({ message: '', type: null })
        }, 2000)
    }

    /**
     * Check if it's a player's turn
     */
    const isPlayerTurn = useCallback((gameState: GameState, playerId: string): boolean => {
        if (!gameState || gameState.currentPlayerTurn === null) return false

        const player = gameState.players.find(p => p.id === playerId)
        if (!player) return false

        return player.position === gameState.currentPlayerTurn
    }, [])

    // Function to handle button actions from the UI
    const handleAction = (action: string) => {
        console.log(`Player action: ${action}`)

        // Process the player action
        switch (action) {
            case 'stand':
                // Handle player standing up (leaving the table)
                setGameState(null)
                console.log('Player stood up from table')
                break

            case 'toggleCards':
                // Toggle card visibility for testing
                setPlayerCardsVisible(prev => !prev)
                console.log('Toggled card visibility:', !playerCardsVisible)
                break

            case 'call':
            case 'check':
            case 'fold':
                // Handle simple poker actions
                processPlayerAction(action)

                // After player action, check if it's now the opponent's turn
                setTimeout(() => {
                    if (gameState && gameState.currentPlayerTurn !== null) {
                        const currentPlayer = gameState.players.find(p => p.position === gameState.currentPlayerTurn)
                        if (currentPlayer && currentPlayer.id !== gameState.humanPlayerId) {
                            simulateOpponentAction()
                        }
                    }
                }, 500) // Small delay before opponent action
                break

            case 'bet':
            case 'raise':
            case 'all-in':
                // Handle betting actions
                processPlayerAction(action)

                // After player action, check if it's now the opponent's turn
                setTimeout(() => {
                    if (gameState && gameState.currentPlayerTurn !== null) {
                        const currentPlayer = gameState.players.find(p => p.position === gameState.currentPlayerTurn)
                        if (currentPlayer && currentPlayer.id !== gameState.humanPlayerId) {
                            simulateOpponentAction()
                        }
                    }
                }, 500) // Small delay before opponent action
                break

            default:
                if (action.startsWith('bet_')) {
                    // This is when the user clicks the BET button with a specific amount
                    const betAmount = parseInt(action.split('_')[1], 10)
                    if (!isNaN(betAmount) && betAmount > 0) {
                        console.log(`Processing bet of ${betAmount}`)
                        processPlayerAction(action)

                        // Check if it's now the opponent's turn
                        setTimeout(() => {
                            if (gameState && gameState.currentPlayerTurn !== null) {
                                const currentPlayer = gameState.players.find(
                                    p => p.position === gameState.currentPlayerTurn,
                                )
                                if (currentPlayer && currentPlayer.id !== gameState.humanPlayerId) {
                                    simulateOpponentAction()
                                }
                            }
                        }, 500)
                    } else {
                        // Just updating the bet amount in UI, not processing action yet
                        console.log(`Bet amount updated to ${betAmount} - waiting for BET button click`)
                    }
                } else if (action.startsWith('raise_')) {
                    // This is when the user clicks the RAISE button with a specific amount
                    const raiseAmount = parseInt(action.split('_')[1], 10)
                    if (!isNaN(raiseAmount) && raiseAmount > 0) {
                        console.log(`Processing raise of ${raiseAmount}`)
                        processPlayerAction(action)

                        // Check if it's now the opponent's turn
                        setTimeout(() => {
                            if (gameState && gameState.currentPlayerTurn !== null) {
                                const currentPlayer = gameState.players.find(
                                    p => p.position === gameState.currentPlayerTurn,
                                )
                                if (currentPlayer && currentPlayer.id !== gameState.humanPlayerId) {
                                    simulateOpponentAction()
                                }
                            }
                        }, 500)
                    } else {
                        // Just updating the raise amount in UI, not processing action yet
                        console.log(`Raise amount updated to ${raiseAmount} - waiting for RAISE button click`)
                    }
                } else if (action.startsWith('all_in_')) {
                    processPlayerAction(action)

                    // Check for opponent's turn after all-in
                    setTimeout(() => {
                        if (gameState && gameState.currentPlayerTurn !== null) {
                            const currentPlayer = gameState.players.find(
                                p => p.position === gameState.currentPlayerTurn,
                            )
                            if (currentPlayer && currentPlayer.id !== gameState.humanPlayerId) {
                                simulateOpponentAction()
                            }
                        }
                    }, 500)
                } else {
                    console.log('Action not implemented:', action)
                }
        }
    }

    // Add a useEffect to update playerData when gameState changes
    useEffect(() => {
        if (gameState && gameState.humanPlayerId) {
            // Find the human player
            const humanPlayer = gameState.players.find(p => p.id === gameState.humanPlayerId)
            if (humanPlayer) {
                // Update playerData with the current chips from gameState
                setPlayerData(prevData => ({
                    ...prevData,
                    chips: humanPlayer.chips,
                }))
                console.log('Updated player chips in UI to:', humanPlayer.chips)
            }
        }
    }, [gameState])

    // Add a function to update UI based on valid actions
    const updateActionButtons = useCallback(() => {
        if (!gameState || !gameState.humanPlayerId) return

        const isHumanTurn = isPlayerTurn(gameState, gameState.humanPlayerId)
        const validActions = getValidActions(gameState)

        console.log('Current turn:', isHumanTurn ? 'Human player' : 'CPU player')
        console.log('Valid actions:', validActions)

        // In a real implementation, this would enable/disable buttons
        // based on the valid actions
    }, [gameState, isPlayerTurn, getValidActions])

    // Call this whenever gameState changes
    useEffect(() => {
        if (gameState) {
            updateActionButtons()
        }
    }, [gameState, updateActionButtons])

    // Add a function to determine if there's an existing bet higher than blinds
    const hasExistingBet = useCallback((gameState: GameState | null): boolean => {
        if (!gameState) return false

        // Get highest bet at the table
        const highestBet = Math.max(...gameState.players.map(p => p.currentBet))

        // Check if highest bet is higher than the big blind
        return highestBet > gameState.blinds.big
    }, [])

    // Add a useEffect to handle AI opponent actions when it's their turn
    useEffect(() => {
        // Skip if no game state or not in playing phase
        if (!gameState || gameState.gamePhase !== 'betting') return

        // Get the current player's turn
        const currentPlayer = gameState.players.find(p => p.position === gameState.currentPlayerTurn)

        // If it's an opponent's turn, trigger AI action after a short delay
        if (currentPlayer && currentPlayer.id !== gameState.humanPlayerId) {
            const timeoutId = setTimeout(() => {
                console.log('AI turn detected, triggering opponent action...')
                simulateOpponentAction()
            }, 1000)

            // Clean up timeout if component unmounts or gameState changes
            return () => clearTimeout(timeoutId)
        }
    }, [gameState, simulateOpponentAction])

    return (
        <div
            className='relative min-h-screen w-full overflow-hidden'
            style={{
                backgroundImage: "url('/images/lobby/pokerback-ground.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
                height: '100vh',
                width: '100vw',
            }}>
            {/* Game status indicator for debugging */}
            <div className='absolute top-5 right-[120px] z-50 rounded-lg bg-black/70 px-4 py-2 text-white'>
                Status: {gameStatus} {gameState && `(Players: ${gameState.players.length})`}
            </div>

            {/* Game notification */}
            {gameNotification.type && (
                <div
                    className={`animate-fade-in-down absolute top-20 left-1/2 z-50 -translate-x-1/2 transform rounded-lg px-6 py-3 text-xl font-bold text-white ${
                        gameNotification.type === 'success'
                            ? 'bg-green-600/90'
                            : gameNotification.type === 'error'
                              ? 'bg-red-600/90'
                              : 'bg-blue-600/90' // info
                    }`}>
                    {gameNotification.message}
                </div>
            )}

            {/* Game information - only shown for tournaments */}
            {playerData.gameType === 'tournament' && (
                <div className='absolute top-5 left-5 inline-flex w-[162px] flex-col items-start justify-center gap-2 rounded-[35px] bg-gradient-to-b from-[#21516f] to-[#153f59] p-6 outline-[5px] outline-offset-[-5px] outline-[#3c5e6d]'>
                    <div className="justify-start self-stretch font-['Exo'] text-base font-bold text-white">BLINDS</div>
                    <div className="justify-start self-stretch font-['Exo'] text-2xl font-bold text-white">
                        {playerData.blinds}
                    </div>
                    <div className="justify-start self-stretch font-['Exo'] text-base font-bold text-white">TIME</div>
                    <div className="justify-start self-stretch font-['Exo'] text-2xl font-bold text-white">9:41</div>
                </div>
            )}

            {/* Poker table - positioned 100px above the control panel */}
            <div className='absolute bottom-[415px] left-1/2 -translate-x-1/2 transform'>
                <div
                    className='poker-table-container relative'
                    style={{ minWidth: '1047px', width: '1047px', height: 'auto' }}>
                    <Image
                        src='/images/table/poker-table.svg'
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

                    {/* Pot display in the middle of the table */}
                    {gameState && gameState.pot > 0 && (
                        <div className='absolute top-[-15%] left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 transform'>
                            <div className='flex items-center rounded-full bg-white px-4 py-2 text-black'>
                                <span className='mr-2 font-bold'>POT:</span>
                                <span className='text-xl font-bold'>{gameState.pot}</span>
                            </div>
                        </div>
                    )}

                    {/* Community cards on the table */}
                    {gameState && gameState.communityCards.length > 0 && (
                        <div className='absolute top-[40%] left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 transform'>
                            {gameState.communityCards.length > 5 && (
                                <div className='absolute -top-8 left-1/2 -translate-x-1/2 transform rounded bg-red-500/80 px-2 py-1 text-xs text-white'>
                                    Warning: {gameState.communityCards.length} cards (should be max 5)
                                </div>
                            )}
                            <div className='flex justify-center' style={{ gap: '12px' }}>
                                {/* Solo mostrar hasta 5 cartas máximo */}
                                {gameState.communityCards.slice(0, 5).map((card, index) => (
                                    <div key={`community-card-${index}`} className='w-[75px]'>
                                        <Image
                                            src={getCardImagePath(card) || ''}
                                            alt={`Card ${index + 1}`}
                                            width={75}
                                            height={110}
                                            priority
                                            unoptimized={true}
                                            style={{ height: 'auto', width: 'auto' }}
                                            className='rounded-md'
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Waiting for players message */}
                    {(gameStatus === 'waiting' || gameStatus === 'ready') && (
                        <div className='absolute top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 transform'>
                            <div className='flex flex-col items-center rounded-xl bg-black/80 px-8 py-6 text-white'>
                                <div className='mb-4 animate-pulse'>
                                    <svg
                                        className='h-10 w-10 animate-spin text-white'
                                        xmlns='http://www.w3.org/2000/svg'
                                        fill='none'
                                        viewBox='0 0 24 24'>
                                        <circle
                                            className='opacity-25'
                                            cx='12'
                                            cy='12'
                                            r='10'
                                            stroke='currentColor'
                                            strokeWidth='4'
                                        />
                                        <path
                                            className='opacity-75'
                                            fill='currentColor'
                                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                        />
                                    </svg>
                                </div>
                                <div className="font-['Exo'] text-2xl font-bold">
                                    {gameStatus === 'waiting'
                                        ? 'Waiting for players...'
                                        : 'Player found! Starting game...'}
                                </div>
                                <div className='mt-2 text-gray-300'>
                                    {gameStatus === 'waiting' ? 'Looking for an opponent' : 'Dealing cards...'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Seat positions around the table - numbered counterclockwise */}
                    {/* Bottom left - Seat 1 */}
                    <div className='absolute bottom-[-15%] left-[20%]'>
                        <EmptySeat seatNumber={1} />
                    </div>

                    {/* Lower left - Seat 2 */}
                    <div className='absolute bottom-[42%] left-[-10%]'>
                        <EmptySeat seatNumber={2} />
                    </div>

                    {/* Middle left - Seat 3 */}
                    <div className='absolute top-[-30%] left-[-4%] translate-x-1/2 transform'>
                        <EmptySeat seatNumber={3} />
                    </div>

                    {/* Upper left - Seat 4 */}
                    <div className='absolute top-[-40%] left-[25%]'>
                        <EmptySeat seatNumber={4} />
                    </div>

                    {/* Top left - Seat 5 */}
                    <div className='absolute top-[-40%] right-[25%] -translate-x-1/2 transform'>
                        <EmptySeat seatNumber={5} />
                    </div>

                    {/* Top right - Seat 6 */}
                    <div className='absolute top-[-30%] right-[7%] translate-x-1/2 transform'>
                        <EmptySeat seatNumber={6} />
                    </div>

                    {/* Upper right - Seat 7 */}
                    <div className='absolute top-[30%] right-[-10%]'>
                        <EmptySeat seatNumber={7} />
                    </div>

                    {/* Lower right - Seat 8 */}
                    <div className='absolute right-[20%] bottom-[-15%]'>
                        <EmptySeat seatNumber={8} />
                    </div>

                    {/* Bottom right (player position) - Seat 9 */}
                    <div className='absolute bottom-[-15%] left-1/2 translate-x-[25%] transform'>
                        <EmptySeat seatNumber={9} />
                    </div>
                </div>

                {/* Mock Dealer Buttons and Chips for Positioning */}
                <div className='absolute inset-0'>
                    {/* Dealer button and blinds visualization */}
                    {gameState?.players.map(player => (
                        <React.Fragment key={player.id}>
                            {/* Dealer button */}
                            {player.isDealer && (
                                <div
                                    className='absolute z-30'
                                    style={{
                                        top: getDealerButtonPosition(player.position).top,
                                        left: getDealerButtonPosition(player.position).left,
                                    }}>
                                    <Image
                                        src='/images/table/chips/dealer-chip.svg'
                                        alt='Dealer'
                                        width={40}
                                        height={40}
                                        priority
                                        style={{ height: 'auto' }}
                                    />
                                </div>
                            )}

                            {/* All player bets and blinds with chip visualization */}
                            {player.currentBet > 0 && (
                                <div
                                    className='absolute z-30'
                                    style={{
                                        // Use different positions for blinds vs regular bets
                                        top:
                                            player.isSmallBlind || player.isBigBlind
                                                ? getChipPosition(player.position, 'blind').top
                                                : getChipPosition(player.position, 'bet').top,
                                        left:
                                            player.isSmallBlind || player.isBigBlind
                                                ? getChipPosition(player.position, 'blind').left
                                                : getChipPosition(player.position, 'bet').left,
                                    }}>
                                    <div className='relative'>
                                        {/* Stack of chips with the top chip showing the bet amount */}
                                        <div className='relative'>
                                            {/* Bottom chip (if bet is large enough) */}
                                            {player.currentBet >= CHIP_VALUES.BLUE * 2 && (
                                                <Image
                                                    src={
                                                        player.currentBet >= CHIP_VALUES.GREEN
                                                            ? '/images/table/chips/green-chip.svg'
                                                            : '/images/table/chips/blue-chip.svg'
                                                    }
                                                    alt='Bottom Chip'
                                                    width={40}
                                                    height={40}
                                                    priority
                                                    className='absolute -bottom-1 -left-1'
                                                    style={{ height: 'auto', width: 'auto' }}
                                                />
                                            )}

                                            {/* Main chip */}
                                            <Image
                                                src={
                                                    player.currentBet >= CHIP_VALUES.GREEN
                                                        ? '/images/table/chips/green-chip.svg'
                                                        : player.currentBet >= CHIP_VALUES.YELLOW
                                                          ? '/yellow-chip.svg'
                                                          : player.currentBet >= CHIP_VALUES.BLUE
                                                            ? '/blue-chip.svg'
                                                            : '/red-chip.svg'
                                                }
                                                alt={
                                                    player.isSmallBlind
                                                        ? 'Small Blind'
                                                        : player.isBigBlind
                                                          ? 'Big Blind'
                                                          : 'Bet'
                                                }
                                                width={40}
                                                height={40}
                                                priority
                                                style={{ height: 'auto', width: 'auto' }}
                                            />
                                        </div>

                                        {/* Bet amount label */}
                                        <div className='absolute -top-5 left-1/2 z-10 -translate-x-1/2 transform'>
                                            <div className='rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-bold whitespace-nowrap text-white'>
                                                {player.currentBet}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Back to lobby link */}
            <Link href='/' className='absolute top-5 right-5 rounded-lg bg-gray-800/80 px-4 py-2 text-white'>
                Back to Lobby
            </Link>

            {/* Player's cards - positioned above the user avatar in the control panel */}
            <div className='absolute bottom-[276px] left-1/2 z-10 flex -translate-x-1/2 transform'>
                {playerCardsVisible && gameState && gameStatus === 'playing' && (
                    <>
                        {card1 ? (
                            <div className='relative -mr-8 -rotate-6'>
                                <Image
                                    src={card1}
                                    alt='First Card'
                                    width={106}
                                    height={155}
                                    priority
                                    unoptimized={true}
                                    style={{ height: 'auto' }}
                                />
                            </div>
                        ) : (
                            <div className='relative -mr-8 -rotate-6'>
                                <div className='flex h-[155px] w-[106px] items-center justify-center rounded-lg bg-gray-800'>
                                    <span className='text-gray-500'>Waiting...</span>
                                </div>
                            </div>
                        )}

                        {card2 ? (
                            <div className='relative rotate-6'>
                                <Image
                                    src={card2}
                                    alt='Second Card'
                                    width={106}
                                    height={155}
                                    priority
                                    unoptimized={true}
                                    style={{ height: 'auto' }}
                                />
                            </div>
                        ) : (
                            <div className='relative rotate-6'>
                                <div className='flex h-[155px] w-[106px] items-center justify-center rounded-lg bg-gray-800'>
                                    <span className='text-gray-500'>Waiting...</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Poker Controls */}
            <PokerControl
                onAction={handleAction}
                playerChips={playerData.chips}
                avatarIndex={playerData.avatarIndex}
                existingBet={hasExistingBet(gameState)}
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

            {/* Add CSS for transitions */}
            <style jsx global>{`
                .poker-table-container {
                    transition: all 0.8s ease-in-out;
                }

                .game-transition-out {
                    opacity: 0.6;
                    transform: scale(0.95);
                }

                .game-transition-in {
                    opacity: 1;
                    transform: scale(1);
                    transition: all 0.8s ease-in-out;
                }

                @keyframes fade-in-scale {
                    0% {
                        opacity: 0.6;
                        transform: scale(0.95);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes fade-out-scale {
                    0% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    100% {
                        opacity: 0.6;
                        transform: scale(0.95);
                    }
                }
            `}</style>
        </div>
    )
}
