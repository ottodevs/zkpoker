// Generic Worker module declarations
declare module '*.worker.ts' {
    class WebpackWorker extends Worker {
        constructor()
    }
    export default WebpackWorker
}

declare module '*.worker.js' {
    class WebpackWorker extends Worker {
        constructor()
    }
    export default WebpackWorker
}

declare module '*.worker' {
    class WebpackWorker extends Worker {
        constructor()
    }
    export default WebpackWorker
}

declare module 'worker-loader!*' {
    class WebpackWorker extends Worker {
        constructor()
    }
    export default WebpackWorker
}

// Allow importing worker files directly with TS
declare module '*/worker-poker.ts' {
    const content: Worker
    export default content
}

// Define the basic structure of a message sent to the worker
interface WorkerMessage {
    action: string
    data?: Record<string, unknown>
}

// Define the basic structure of a response from the worker
interface WorkerResponse {
    type: string
    result: unknown
}

// Define the shape of data sent to the poker worker
type GameInputData = {
    gameId: number
    privateKey: string
    buyIn?: number
    amount?: number
    network?: 'local' | 'testnet'
}

// Specific Poker Worker Messages
interface PokerWorkerMessage extends WorkerMessage {
    action:
        | 'get_key'
        | 'create_game'
        | 'join_game'
        | 'place_bet'
        | 'set_network'
        | 'get_game_state'
        | 'get_chips_state'
        | 'get_cards_state'
    data?: GameInputData
}

// Response data types from poker worker
type GameResponseData = {
    gameId: number
    status: string
    txId?: string
    creator?: string
    player?: string
    amount?: number
    error?: string
    details?: unknown
    state?: Record<string, unknown>
    chips?: Record<string, unknown>
    cards?: Record<string, unknown>
}

// Specific Poker Worker Responses
interface PokerWorkerResponse extends WorkerResponse {
    type:
        | 'init'
        | 'key'
        | 'create_game'
        | 'join_game'
        | 'place_bet'
        | 'error'
        | 'network'
        | 'game_state'
        | 'chips_state'
        | 'cards_state'
    result: string | GameResponseData
}

// Poker Worker module declarations
declare module '*/worker-poker.ts' {
    export default class Worker {
        constructor()
        onmessage: (event: MessageEvent<PokerWorkerResponse>) => void
        postMessage: (message: PokerWorkerMessage) => void
        terminate: () => void
    }
}

declare module '*/pokerWorker.js' {
    export default class Worker {
        constructor()
        onmessage: (event: MessageEvent<PokerWorkerResponse>) => void
        postMessage: (message: PokerWorkerMessage) => void
        terminate: () => void
    }
}

// Game types
interface GameState {
    id: number
    players: Player[]
    communityCards: string[]
    pot: number
    currentTurn: number
    status: 'waiting' | 'playing' | 'ended'
    blinds: {
        small: number
        big: number
    }
}

interface Player {
    address: string
    chips: number
    cards?: [string, string]
    isFolded?: boolean
    isAllIn?: boolean
    currentBet?: number
    seat: number
}
