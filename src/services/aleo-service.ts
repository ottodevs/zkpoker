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
const logInit = (message: string) => console.log(`🚀 [Aleo-Init] ${message}`)
const logError = (message: string, error?: Error | unknown) => console.error(`❌ [Aleo-Error] ${message}`, error || '')
const logInfo = (message: string) => console.log(`ℹ️ [Aleo-Info] ${message}`)
const logAction = (action: string, message: string) => console.log(`🎮 [Aleo-${action}] ${message}`)

// Program name
const PROGRAM_NAME = 'mental_poker_trifecta.aleo'

// Environment settings
const ENDPOINTS = {
    local: 'http://localhost:3030',
    testnet: 'https://api.explorer.aleo.org/v1',
}

// Initialize Aleo
export const initializeAleo = async (): Promise<boolean> => {
    try {
        logInit('Initializing Aleo environment')
        await initThreadPool()
        logInit('Aleo environment initialized')
        return true
    } catch (error) {
        logError('Failed to initialize Aleo environment', error)
        return false
    }
}

// Create a new private key
export const createPrivateKey = (): string => {
    try {
        logAction('Key', 'Generating new private key')
        return new PrivateKey().to_string()
    } catch (error) {
        logError('Failed to create private key', error)
        throw error
    }
}

// Setup program manager
export const setupProgramManager = (privateKey: string, network: 'local' | 'testnet' = 'local'): ProgramManager => {
    try {
        const endpoint = ENDPOINTS[network]
        logInfo(`Setting up program manager for ${network} network at ${endpoint}`)

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

interface AleoExecuteResult {
    txId: string
    [key: string]: unknown
}

// Create a new game
export const createGame = async (
    privateKey: string,
    gameId: number,
    buyIn: number,
    network: 'local' | 'testnet' = 'local',
): Promise<AleoExecuteResult> => {
    try {
        logAction('Create', `Creating game with ID ${gameId} and buy-in ${buyIn}`)
        const programManager = setupProgramManager(privateKey, network)

        const result = await programManager.execute({
            programName: PROGRAM_NAME,
            functionName: 'create_game',
            inputs: [gameId.toString() + 'u32', buyIn.toString() + 'u64'],
            fee: 0.005, // Set an appropriate fee
            privateFee: false, // Required parameter
        })

        // Handle case where result is a string (error message)
        if (typeof result === 'string') {
            return {
                txId: 'error',
                error: result,
            }
        }

        return result as AleoExecuteResult
    } catch (error) {
        logError(`Failed to create game ${gameId}`, error)
        throw error
    }
}

// Join a game
export const joinGame = async (
    privateKey: string,
    gameId: number,
    network: 'local' | 'testnet' = 'local',
): Promise<AleoExecuteResult> => {
    try {
        logAction('Join', `Joining game with ID ${gameId}`)
        const programManager = setupProgramManager(privateKey, network)

        const result = await programManager.execute({
            programName: PROGRAM_NAME,
            functionName: 'join_game',
            inputs: [gameId.toString() + 'u32'],
            fee: 0.003, // Set an appropriate fee
            privateFee: false, // Required parameter
        })

        // Handle case where result is a string (error message)
        if (typeof result === 'string') {
            return {
                txId: 'error',
                error: result,
            }
        }

        return result as AleoExecuteResult
    } catch (error) {
        logError(`Failed to join game ${gameId}`, error)
        throw error
    }
}

// Place a bet
export const placeBet = async (
    privateKey: string,
    gameId: number,
    amount: number,
    network: 'local' | 'testnet' = 'local',
): Promise<AleoExecuteResult> => {
    try {
        logAction('Bet', `Placing bet of ${amount} in game ${gameId}`)
        const programManager = setupProgramManager(privateKey, network)

        const result = await programManager.execute({
            programName: PROGRAM_NAME,
            functionName: 'bet',
            inputs: [gameId.toString() + 'u32', amount.toString() + 'u16'],
            fee: 0.002, // Set an appropriate fee
            privateFee: false, // Required parameter
        })

        // Handle case where result is a string (error message)
        if (typeof result === 'string') {
            return {
                txId: 'error',
                error: result,
            }
        }

        return result as AleoExecuteResult
    } catch (error) {
        logError(`Failed to place bet in game ${gameId}`, error)
        throw error
    }
}

interface MappingResponse {
    [key: string]: string | number | boolean
}

// Get game state
export const getGameState = async (
    gameId: number,
    network: 'local' | 'testnet' = 'local',
): Promise<MappingResponse> => {
    try {
        logAction('State', `Getting state for game ${gameId}`)
        const endpoint = ENDPOINTS[network]
        const client = new AleoNetworkClient(endpoint)

        const result = await client.getProgramMappingValue(PROGRAM_NAME, 'games', gameId.toString() + 'u32')

        // Handle case where result is a string (error message)
        if (typeof result === 'string') {
            return { error: result } as MappingResponse
        }

        return result as MappingResponse
    } catch (error) {
        logError(`Failed to get state for game ${gameId}`, error)
        throw error
    }
}

// Get chips state
export const getChipsState = async (
    gameId: number,
    network: 'local' | 'testnet' = 'local',
): Promise<MappingResponse> => {
    try {
        logAction('Chips', `Getting chips for game ${gameId}`)
        const endpoint = ENDPOINTS[network]
        const client = new AleoNetworkClient(endpoint)

        const result = await client.getProgramMappingValue(PROGRAM_NAME, 'chips', gameId.toString() + 'u32')

        // Handle case where result is a string (error message)
        if (typeof result === 'string') {
            return { error: result } as MappingResponse
        }

        return result as MappingResponse
    } catch (error) {
        logError(`Failed to get chips for game ${gameId}`, error)
        throw error
    }
}

// Get cards state
export const getCardsState = async (
    gameId: number,
    network: 'local' | 'testnet' = 'local',
): Promise<MappingResponse> => {
    try {
        logAction('Cards', `Getting cards for game ${gameId}`)
        const endpoint = ENDPOINTS[network]
        const client = new AleoNetworkClient(endpoint)

        const result = await client.getProgramMappingValue(PROGRAM_NAME, 'cards', gameId.toString() + 'u32')

        // Handle case where result is a string (error message)
        if (typeof result === 'string') {
            return { error: result } as MappingResponse
        }

        return result as MappingResponse
    } catch (error) {
        logError(`Failed to get cards for game ${gameId}`, error)
        throw error
    }
}
