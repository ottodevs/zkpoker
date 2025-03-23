/**
 * Utility functions for consistent logging with emojis across the application
 */

// System initialization logs
export const logInit = (message: string) => console.log(`🚀 [Init] ${message}`)

// Error logs
export const logError = (message: string, error?: Error | unknown) =>
    console.error(`❌ [Error] ${message}`, error || '')

// Information logs
export const logInfo = (message: string) => console.log(`ℹ️ [Info] ${message}`)

// Warning logs
export const logWarning = (message: string) => console.log(`⚠️ [Warning] ${message}`)

// Success logs
export const logSuccess = (message: string) => console.log(`✅ [Success] ${message}`)

// Action logs with context
export const logAction = (context: string, message: string) => console.log(`🎮 [${context}] ${message}`)

// Wallet logs
export const logWallet = (message: string) => console.log(`👛 [Wallet] ${message}`)

// Transaction logs
export const logTransaction = (message: string) => console.log(`💸 [Transaction] ${message}`)

// Game logs
export const logGame = (message: string) => console.log(`🎲 [Game] ${message}`)

// Player logs
export const logPlayer = (message: string) => console.log(`👤 [Player] ${message}`)

// Card logs
export const logCards = (message: string) => console.log(`🃏 [Cards] ${message}`)

// Bet logs
export const logBet = (message: string) => console.log(`💰 [Bet] ${message}`)

// Network logs
export const logNetwork = (message: string) => console.log(`🌐 [Network] ${message}`)

// Worker logs
export const logWorker = (message: string) => console.log(`🔄 [Worker] ${message}`)
