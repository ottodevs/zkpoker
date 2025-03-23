import {
    Account,
    AleoKeyProvider,
    AleoNetworkClient,
    initThreadPool,
    NetworkRecordProvider,
    PrivateKey,
    ProgramManager,
} from '@provablehq/sdk'

// Console logging with emojis for better debugging
const logInit = (message: string) => console.log(`🚀 [Worker-Init] ${message}`)
const logError = (message: string, error?: Error | unknown) =>
    console.error(`❌ [Worker-Error] ${message}`, error || '')
const logInfo = (message: string) => console.log(`ℹ️ [Worker-Info] ${message}`)
const logAction = (action: string, message: string) => console.log(`🎮 [Worker-${action}] ${message}`)

// Program and network configuration
const PROGRAM_NAME = 'mental_poker_trifecta.aleo'
const ENDPOINTS = {
    local: 'http://localhost:3030',
    testnet: 'https://api.explorer.aleo.org/v1',
}

// Default network (will be configurable through messages)
let currentNetwork: 'local' | 'testnet' = 'local'

// For error handling
type ErrorWithMessage = Error | { message: string }

// Get error message from unknown error
const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return (error as ErrorWithMessage).message
    }
    return 'Unknown error occurred'
}

// Type for execution results
interface ExecutionResult {
    txId: string
    [key: string]: unknown
}

// Initialization function
async function initialize() {
    try {
        logInit('Initializing worker thread pool...')
        await initThreadPool()
        logInit('Worker initialized successfully!')
        self.postMessage({ type: 'init', result: 'Worker initialized' })
    } catch (error) {
        logError('Error initializing worker', error)
        self.postMessage({ type: 'error', result: 'Failed to initialize worker' })
    }
}

// Setup program manager
function setupProgramManager(privateKey: string): ProgramManager {
    try {
        const endpoint = ENDPOINTS[currentNetwork]
        logInfo(`Setting up program manager for ${currentNetwork} network at ${endpoint}`)

        const account = new Account({ privateKey })

        const networkClient = new AleoNetworkClient(endpoint)
        const keyProvider = new AleoKeyProvider()
        keyProvider.useCache(true)

        const recordProvider = new NetworkRecordProvider(account, networkClient)

        const programManager = new ProgramManager(endpoint, keyProvider, recordProvider)

        programManager.setAccount(account)

        return programManager
    } catch (error) {
        logError('Failed to setup program manager', error)
        throw error
    }
}

// Generate a private key for the account
function getPrivateKey(): string | null {
    try {
        logAction('Key', 'Generating new private key')
        return new PrivateKey().to_string()
    } catch (error) {
        logError('Error generating private key', error)
        return null
    }
}

// Create a new game
async function createGame(gameId: number, privateKey: string, buyIn: number = 100) {
    try {
        logAction('Create', `Creating game with ID: ${gameId} and buy-in: ${buyIn}`)
        const programManager = setupProgramManager(privateKey)

        const result = (await programManager.execute({
            programName: PROGRAM_NAME,
            functionName: 'create_game',
            inputs: [gameId.toString() + 'u32', buyIn.toString() + 'u64'],
            fee: 0.005, // Set an appropriate fee
            privateFee: false, // Required parameter
        })) as ExecutionResult

        logAction('Create', `Game ${gameId} created successfully: ${JSON.stringify(result)}`)

        return {
            gameId,
            status: 'created',
            txId: result.txId,
            creator: programManager.account?.address().to_string(),
        }
    } catch (error) {
        logError(`Error creating game ${gameId}`, error)
        return {
            gameId,
            status: 'error',
            error: 'Failed to create game',
            details: getErrorMessage(error),
        }
    }
}

// Join an existing game
async function joinGame(gameId: number, privateKey: string) {
    try {
        logAction('Join', `Joining game with ID: ${gameId}`)
        const programManager = setupProgramManager(privateKey)

        const result = (await programManager.execute({
            programName: PROGRAM_NAME,
            functionName: 'join_game',
            inputs: [gameId.toString() + 'u32'],
            fee: 0.003, // Set an appropriate fee
            privateFee: false, // Required parameter
        })) as ExecutionResult

        logAction('Join', `Joined game ${gameId} successfully: ${JSON.stringify(result)}`)

        return {
            gameId,
            status: 'joined',
            txId: result.txId,
            player: programManager.account?.address().to_string(),
        }
    } catch (error) {
        logError(`Error joining game ${gameId}`, error)
        return {
            gameId,
            status: 'error',
            error: 'Failed to join game',
            details: getErrorMessage(error),
        }
    }
}

// Place a bet in the game
async function placeBet(gameId: number, amount: number, privateKey: string) {
    try {
        logAction('Bet', `Placing bet of ${amount} in game ${gameId}`)
        const programManager = setupProgramManager(privateKey)

        const result = (await programManager.execute({
            programName: PROGRAM_NAME,
            functionName: 'bet',
            inputs: [gameId.toString() + 'u32', amount.toString() + 'u16'],
            fee: 0.002, // Set an appropriate fee
            privateFee: false, // Required parameter
        })) as ExecutionResult

        logAction('Bet', `Bet of ${amount} placed in game ${gameId} successfully: ${JSON.stringify(result)}`)

        return {
            gameId,
            amount,
            status: 'bet_placed',
            txId: result.txId,
            player: programManager.account?.address().to_string(),
        }
    } catch (error) {
        logError(`Error placing bet in game ${gameId}`, error)
        return {
            gameId,
            status: 'error',
            error: 'Failed to place bet',
            details: getErrorMessage(error),
        }
    }
}

// Get game state
async function getGameState(gameId: number) {
    try {
        logAction('State', `Getting state for game ${gameId}`)
        const endpoint = ENDPOINTS[currentNetwork]
        const client = new AleoNetworkClient(endpoint)

        const result = await client.getProgramMappingValue(PROGRAM_NAME, 'games', gameId.toString() + 'u32')

        return {
            gameId,
            status: 'state_retrieved',
            state: result,
        }
    } catch (error) {
        logError(`Error getting state for game ${gameId}`, error)
        return {
            gameId,
            status: 'error',
            error: 'Failed to get game state',
            details: getErrorMessage(error),
        }
    }
}

// Get chips state
async function getChipsState(gameId: number) {
    try {
        logAction('Chips', `Getting chips for game ${gameId}`)
        const endpoint = ENDPOINTS[currentNetwork]
        const client = new AleoNetworkClient(endpoint)

        const result = await client.getProgramMappingValue(PROGRAM_NAME, 'chips', gameId.toString() + 'u32')

        return {
            gameId,
            status: 'chips_retrieved',
            chips: result,
        }
    } catch (error) {
        logError(`Error getting chips for game ${gameId}`, error)
        return {
            gameId,
            status: 'error',
            error: 'Failed to get chips state',
            details: getErrorMessage(error),
        }
    }
}

// Get cards state
async function getCardsState(gameId: number) {
    try {
        logAction('Cards', `Getting cards for game ${gameId}`)
        const endpoint = ENDPOINTS[currentNetwork]
        const client = new AleoNetworkClient(endpoint)

        const result = await client.getProgramMappingValue(PROGRAM_NAME, 'cards', gameId.toString() + 'u32')

        return {
            gameId,
            status: 'cards_retrieved',
            cards: result,
        }
    } catch (error) {
        logError(`Error getting cards for game ${gameId}`, error)
        return {
            gameId,
            status: 'error',
            error: 'Failed to get cards state',
            details: getErrorMessage(error),
        }
    }
}

// Initialize the worker
initialize().catch(error => {
    logError('Failed to initialize worker', error)
    self.postMessage({ type: 'error', result: 'Failed to initialize worker' })
})

// Handle messages from the main thread
self.onmessage = async function (e) {
    try {
        const { action, data } = e.data
        logInfo(`Received action: ${action}`)

        // Configure network if specified
        if (data && data.network && (data.network === 'local' || data.network === 'testnet')) {
            currentNetwork = data.network
            logInfo(`Network set to ${currentNetwork}`)
        }

        switch (action) {
            case 'set_network':
                if (data.network && (data.network === 'local' || data.network === 'testnet')) {
                    currentNetwork = data.network
                    logInfo(`Network set to ${currentNetwork}`)
                    self.postMessage({ type: 'network', result: currentNetwork })
                } else {
                    self.postMessage({ type: 'error', result: 'Invalid network specified' })
                }
                break

            case 'get_key':
                const privateKey = getPrivateKey()
                if (privateKey) {
                    logAction('Key', `Generated key: ${privateKey.substring(0, 10)}...`)
                    self.postMessage({ type: 'key', result: privateKey })
                } else {
                    logError('Failed to generate private key')
                    self.postMessage({ type: 'error', result: 'Failed to generate private key' })
                }
                break

            case 'create_game':
                const createResult = await createGame(data.gameId, data.privateKey, data.buyIn)
                logAction('Create', `Game creation result: ${JSON.stringify(createResult).substring(0, 100)}...`)
                self.postMessage({ type: 'create_game', result: createResult })
                break

            case 'join_game':
                const joinResult = await joinGame(data.gameId, data.privateKey)
                logAction('Join', `Game join result: ${JSON.stringify(joinResult).substring(0, 100)}...`)
                self.postMessage({ type: 'join_game', result: joinResult })
                break

            case 'place_bet':
                const betResult = await placeBet(data.gameId, data.amount, data.privateKey)
                logAction('Bet', `Bet result: ${JSON.stringify(betResult).substring(0, 100)}...`)
                self.postMessage({ type: 'place_bet', result: betResult })
                break

            case 'get_game_state':
                const stateResult = await getGameState(data.gameId)
                logAction('State', `Game state result: ${JSON.stringify(stateResult).substring(0, 100)}...`)
                self.postMessage({ type: 'game_state', result: stateResult })
                break

            case 'get_chips_state':
                const chipsResult = await getChipsState(data.gameId)
                logAction('Chips', `Chips state result: ${JSON.stringify(chipsResult).substring(0, 100)}...`)
                self.postMessage({ type: 'chips_state', result: chipsResult })
                break

            case 'get_cards_state':
                const cardsResult = await getCardsState(data.gameId)
                logAction('Cards', `Cards state result: ${JSON.stringify(cardsResult).substring(0, 100)}...`)
                self.postMessage({ type: 'cards_state', result: cardsResult })
                break

            default:
                logError(`Unknown action: ${action}`)
                self.postMessage({ type: 'error', result: `Unknown action: ${action}` })
        }
    } catch (error) {
        logError(`Error handling action ${e.data?.action || 'unknown'}`, error)
        self.postMessage({ type: 'error', result: `Error handling action: ${getErrorMessage(error)}` })
    }
}
