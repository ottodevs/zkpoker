import {
    BaseMessageSignerWalletAdapter,
    DecryptPermission,
    scopePollingDetectionStrategy,
    WalletAdapterNetwork,
    WalletConnectionError,
    WalletDecryptionError,
    WalletDecryptionNotAllowedError,
    WalletDisconnectionError,
    WalletError,
    WalletNotConnectedError,
    WalletNotReadyError,
    WalletReadyState,
    WalletRecordsError,
    WalletSignTransactionError,
    WalletTransactionError,
    type AleoDeployment,
    type AleoTransaction,
    type WalletName,
} from '@demox-labs/aleo-wallet-adapter-base'

interface LeoWindow extends Window {
    leo?: {
        experimentalSuggestChain: (chainInfo: unknown) => Promise<void>
        enable: (chainIds: string | string[]) => Promise<void>
        on: (eventName: string, callback: unknown) => void
        removeListener: (eventName: string, callback: unknown) => void
        getOfflineSigner: (chainId: string) => unknown
        getKey: (chainId: string) => Promise<{ bech32Address: string; pubKey: Uint8Array }>
        isLeoWallet: boolean
    }
}

declare const window: LeoWindow

export interface LeoWalletAdapterConfig {
    appName: string
}

export const LeoWalletName = 'Leo Wallet' as WalletName<'Leo Wallet'>

export class LeoWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = LeoWalletName
    url = 'https://www.leo.app/'
    icon =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQ4IDk2Qzc0LjUwOTcgOTYgOTYgNzQuNTA5NyA5NiA0OEM5NiAyMS40OTAzIDc0LjUwOTcgMCA0OCAwQzIxLjQ5MDMgMCAwIDIxLjQ5MDMgMCA0OEMwIDc0LjUwOTcgMjEuNDkwMyA5NiA0OCA5NloiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl8yXzExNykiLz4KPHBhdGggZD0iTTQ4IDg4QzY5Ljk4NjggODggODggNjkuOTg2OCA4OCA0OEM4OCAyNi4wMTMyIDY5Ljk4NjggOCA0OCA4QzI2LjAxMzIgOCA4IDI2LjAxMzIgOCA0OEM4IDY5Ljk4NjggMjYuMDEzMiA4OCA0OCA4OFoiIGZpbGw9InVybCgjcGFpbnQxX2xpbmVhcl8yXzExNykiLz4KPHBhdGggZD0iTTY4LjY5MTQgNDMuMzI0M0M2OC42OTE0IDQzLjMyNDMgNjYuOTIyOCA0Mi4wMjI4IDY1LjY1MzEgNDEuMzIyNkM2NC4zNTIzIDQwLjU5MTEgNjIuOTMzNyAzOS45NTMyIDYxLjQ4NDMgMzkuNDEyM0M1OS45ODgyIDM4Ljg1NTcgNTguNDM5OCAzOC40NTQ5IDU2Ljg3MTUgMzguMTQyQzU1LjIxMzQgMzcuODEwNiA1My41MjM1IDM3LjY0NTEgNTEuODMwOSAzNy42NDhDNTAuMTM4MyAzNy42NDUxIDQ4LjQ0ODQgMzcuODEwNiA0Ni43OTAzIDM4LjE0MkM0NS4yMjIgMzguNDU0OSA0My42NzM2IDM4Ljg1NTcgNDIuMTc3NSAzOS40MTIzQzQwLjcyODEgMzkuOTUzMiAzOS4zMDk1IDQwLjU5MTEgMzcuOTk5MyA0MS4zMjI2QzM2Ljc0MDMgNDIuMDIyOCAzNC45NzE3IDQzLjMyNDMgMzQuOTcxNyA0My4zMjQzQzM0Ljk3MTcgNDMuMzI0MyAzNi43NDAzIDQ0LjYyNTkgMzcuOTk5MyA0NS4zMjZDMzkuMzA5NSA0Ni4wNTc1IDQwLjcyODEgNDYuNjk1NCA0Mi4xNzc1IDQ3LjIzNjNDNDMuNjczNiA0Ny43OTI5IDQ1LjIyMiA0OC4xOTM3IDQ2Ljc5MDMgNDguNTA2NkM0OC40NDg0IDQ4LjgzOCA1MC4xMzgzIDQ5LjAwMzUgNTEuODMwOSA0OS4wMDA2QzUzLjUyMzUgNDkuMDAzNSA1NS4yMTM0IDQ4LjgzOCA1Ni44NzE1IDQ4LjUwNjZDNTguNDM5OCA0OC4xOTM3IDU5Ljk4ODIgNDcuNzkyOSA2MS40ODQzIDQ3LjIzNjNDNjIuOTMzNyA0Ni42OTU0IDY0LjM1MjMgNDYuMDU3NSA2NS42NTMxIDQ1LjMyNkM2Ni45MjI4IDQ0LjYyNTkgNjguNjkxNCA0My4zMjQzIDY4LjY5MTQgNDMuMzI0M1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik02OC42OTE0IDU0LjY3NTdDNjguNjkxNCA1NC42NzU3IDY2LjkyMjggNTMuMzc0MSA2NS42NTMxIDUyLjY3MzlDNjQuMzUyMyA1MS45NDI0IDYyLjkzMzcgNTEuMzA0NSA2MS40ODQzIDUwLjc2MzZDNTkuOTg4MiA1MC4yMDcgNTguNDM5OCA0OS44MDYyIDU2Ljg3MTUgNDkuNDkzM0M1NS4yMTM0IDQ5LjE2MTkgNTMuNTIzNSA0OC45OTY0IDUxLjgzMDkgNDguOTk5M0M1MC4xMzgzIDQ4Ljk5NjQgNDguNDQ4NCA0OS4xNjE5IDQ2Ljc5MDMgNDkuNDkzM0M0NS4yMjIgNDkuODA2MiA0My42NzM2IDUwLjIwNyA0Mi4xNzc1IDUwLjc2MzZDNDAuNzI4MSA1MS4zMDQ1IDM5LjMwOTUgNTEuOTQyNCAzNy45OTkzIDUyLjY3MzlDMzYuNzQwMyA1My4zNzQxIDM0Ljk3MTcgNTQuNjc1NyAzNC45NzE3IDU0LjY3NTdDMzQuOTcxNyA1NC42NzU3IDM2Ljc0MDMgNTUuOTc3MiAzNy45OTkzIDU2LjY3NzRDMzkuMzA5NSA1Ny40MDg5IDQwLjcyODEgNTguMDQ2OCA0Mi4xNzc1IDU4LjU4NzdDNDMuNjczNiA1OS4xNDQzIDQ1LjIyMiA1OS41NDUxIDQ2Ljc5MDMgNTkuODU4QzQ4LjQ0ODQgNjAuMTg5NCA1MC4xMzgzIDYwLjM1NDkgNTEuODMwOSA2MC4zNTJDNTMuNTIzNSA2MC4zNTQ5IDU1LjIxMzQgNjAuMTg5NCA1Ni44NzE1IDU5Ljg1OEM1OC40Mzk4IDU5LjU0NTEgNTkuOTg4MiA1OS4xNDQzIDYxLjQ4NDMgNTguNTg3N0M2Mi45MzM3IDU4LjA0NjggNjQuMzUyMyA1Ny40MDg5IDY1LjY1MzEgNTYuNjc3NEM2Ni45MjI4IDU1Ljk3NzIgNjguNjkxNCA1NC42NzU3IDY4LjY5MTQgNTQuNjc1N1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik02OC42OTE0IDMyQzY4LjY5MTQgMzIgNjYuOTIyOCAzMC42OTg1IDY1LjY1MzEgMjkuOTk4M0M2NC4zNTIzIDI5LjI2NjggNjIuOTMzNyAyOC42Mjg5IDYxLjQ4NDMgMjguMDg4QzU5Ljk4ODIgMjcuNTMxNCA1OC40Mzk4IDI3LjEzMDYgNTYuODcxNSAyNi44MTc3QzU1LjIxMzQgMjYuNDg2MyA1My41MjM1IDI2LjMyMDggNTEuODMwOSAyNi4zMjM3QzUwLjEzODMgMjYuMzIwOCA0OC40NDg0IDI2LjQ4NjMgNDYuNzkwMyAyNi44MTc3QzQ1LjIyMiAyNy4xMzA2IDQzLjY3MzYgMjcuNTMxNCA0Mi4xNzc1IDI4LjA4OEM0MC43MjgxIDI4LjYyODkgMzkuMzA5NSAyOS4yNjY4IDM3Ljk5OTMgMjkuOTk4M0MzNi43NDAzIDMwLjY5ODUgMzQuOTcxNyAzMiAzNC45NzE3IDMyQzM0Ljk3MTcgMzIgMzYuNzQwMyAzMy4zMDE2IDM3Ljk5OTMgMzQuMDAxOEMzOS4zMDk1IDM0LjczMzMgNDAuNzI4MSAzNS4zNzEyIDQyLjE3NzUgMzUuOTEyMUM0My42NzM2IDM2LjQ2ODcgNDUuMjIyIDM2Ljg2OTUgNDYuNzkwMyAzNy4xODI0QzQ4LjQ0ODQgMzcuNTEzOCA1MC4xMzgzIDM3LjY3OTMgNTEuODMwOSAzNy42NzY0QzUzLjUyMzUgMzcuNjc5MyA1NS4yMTM0IDM3LjUxMzggNTYuODcxNSAzNy4xODI0QzU4LjQzOTggMzYuODY5NSA1OS45ODgyIDM2LjQ2ODcgNjEuNDgzNSAzNS45MTIxQzYyLjkzMzcgMzUuMzcxMiA2NC4zNTIzIDM0LjczMzMgNjUuNjUzMSAzNC4wMDE4QzY2LjkyMjggMzMuMzAxNiA2OC42OTE0IDMyIDY4LjY5MTQgMzJaIiBmaWxsPSJ3aGl0ZSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzJfMTE3IiB4MT0iNDgiIHkxPSIwIiB4Mj0iNDgiIHkyPSI5NiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMDBGRkE1Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzAwQjBGRiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfMl8xMTciIHgxPSI0OCIgeTE9IjgiIHgyPSI0OCIgeTI9Ijg4IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiMwMEZGQTUiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDBCMEZGIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+Cg=='
    readonly supportedTransactionVersions = null

    private _connecting: boolean
    private _wallet: LeoWindow['leo'] | null
    private _publicKey: string | null
    private _decryptPermission: DecryptPermission
    private _network: WalletAdapterNetwork
    private _readyState: WalletReadyState =
        typeof window === 'undefined' || typeof document === 'undefined'
            ? WalletReadyState.Unsupported
            : WalletReadyState.NotDetected

    constructor(_config: LeoWalletAdapterConfig) {
        super()
        this._connecting = false
        this._wallet = null
        this._publicKey = null
        this._decryptPermission = DecryptPermission.NoDecrypt
        this._network = WalletAdapterNetwork.Testnet

        if (this._readyState !== WalletReadyState.Unsupported) {
            scopePollingDetectionStrategy(() => {
                if (window?.leo?.isLeoWallet) {
                    this._readyState = WalletReadyState.Installed
                    this.emit('readyStateChange', this._readyState)
                    return true
                }
                return false
            })
        }
    }

    get publicKey(): string | null {
        return this._publicKey
    }

    get connecting(): boolean {
        return this._connecting
    }

    get readyState(): WalletReadyState {
        return this._readyState
    }

    get decryptPermission(): DecryptPermission {
        return this._decryptPermission
    }

    get network(): WalletAdapterNetwork {
        return this._network
    }

    async connect(decryptPermission: DecryptPermission, network: WalletAdapterNetwork): Promise<void> {
        try {
            if (this.connected || this.connecting) return
            if (this._readyState !== WalletReadyState.Installed) throw new WalletNotReadyError()

            this._connecting = true

            const wallet = window.leo
            if (!wallet) throw new WalletNotReadyError()

            try {
                await wallet.enable('testnet')
            } catch (error) {
                throw new WalletConnectionError((error as Error).message, error as Error)
            }

            this._wallet = wallet
            this._publicKey = 'dummy_public_key' // Replace with actual public key retrieval
            this._decryptPermission = decryptPermission
            this._network = network

            this.emit('connect', this._publicKey)
        } catch (error) {
            this.emit(
                'error',
                error instanceof WalletError ? error : new WalletConnectionError('Connection failed', error),
            )
            throw error
        } finally {
            this._connecting = false
        }
    }

    async disconnect(): Promise<void> {
        const wallet = this._wallet
        if (wallet) {
            this._wallet = null
            this._publicKey = null

            try {
                // Add actual disconnect logic here
            } catch (error) {
                this.emit('error', new WalletDisconnectionError((error as Error).message, error as Error))
            }
        }

        this.emit('disconnect')
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            const wallet = this._wallet
            if (!wallet) throw new WalletNotConnectedError()

            try {
                // Add actual signing logic here
                return message // Placeholder
            } catch (error) {
                throw new WalletSignTransactionError((error as Error).message, error as Error)
            }
        } catch (error) {
            this.emit(
                'error',
                error instanceof WalletError ? error : new WalletSignTransactionError('Signing failed', error),
            )
            throw error
        }
    }

    async decrypt(
        _cipherText: string,
        _tpk?: string,
        _programId?: string,
        _functionName?: string,
        _index?: number,
    ): Promise<string> {
        try {
            const wallet = this._wallet
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError()

            switch (this._decryptPermission) {
                case DecryptPermission.NoDecrypt:
                    throw new WalletDecryptionNotAllowedError()
                case DecryptPermission.UponRequest:
                case DecryptPermission.AutoDecrypt:
                case DecryptPermission.OnChainHistory:
                    try {
                        // Add actual decryption logic here
                        return _cipherText // Placeholder
                    } catch (error) {
                        throw new WalletDecryptionError((error as Error).message, error as Error)
                    }
                default:
                    throw new WalletDecryptionError()
            }
        } catch (error) {
            this.emit(
                'error',
                error instanceof WalletError ? error : new WalletDecryptionError('Decryption failed', error),
            )
            throw error
        }
    }

    async requestRecords(_program: string): Promise<Record<string, unknown>[]> {
        try {
            const wallet = this._wallet
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError()

            try {
                // Add actual record request logic here
                return [] // Placeholder
            } catch (error) {
                throw new WalletRecordsError((error as Error).message, error as Error)
            }
        } catch (error) {
            this.emit(
                'error',
                error instanceof WalletError ? error : new WalletRecordsError('Record request failed', error),
            )
            throw error
        }
    }

    async requestTransaction(_transaction: AleoTransaction): Promise<string> {
        try {
            const wallet = this._wallet
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError()

            try {
                // Add actual transaction request logic here
                return '' // Placeholder
            } catch (error) {
                throw new WalletTransactionError((error as Error).message, error as Error)
            }
        } catch (error) {
            this.emit(
                'error',
                error instanceof WalletError ? error : new WalletTransactionError('Transaction failed', error),
            )
            throw error
        }
    }

    async requestDeploy(_deployment: AleoDeployment): Promise<string> {
        try {
            const wallet = this._wallet
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError()

            try {
                // Add actual deployment request logic here
                return '' // Placeholder
            } catch (error) {
                throw new WalletTransactionError((error as Error).message, error as Error)
            }
        } catch (error) {
            this.emit(
                'error',
                error instanceof WalletError ? error : new WalletTransactionError('Deployment failed', error),
            )
            throw error
        }
    }

    async requestExecution(transaction: AleoTransaction): Promise<string> {
        return this.requestTransaction(transaction)
    }

    async requestBulkTransactions(_transactions: AleoTransaction[]): Promise<string[]> {
        try {
            const wallet = this._wallet
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError()

            try {
                // Add actual bulk transaction request logic here
                return [] // Placeholder
            } catch (error) {
                throw new WalletTransactionError((error as Error).message, error as Error)
            }
        } catch (error) {
            this.emit(
                'error',
                error instanceof WalletError ? error : new WalletTransactionError('Bulk transaction failed', error),
            )
            throw error
        }
    }

    async getExecution(_transactionId: string): Promise<string> {
        try {
            const wallet = this._wallet
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError()

            try {
                // Add actual execution status request logic here
                return '' // Placeholder
            } catch (error) {
                throw new WalletTransactionError((error as Error).message, error as Error)
            }
        } catch (error) {
            this.emit(
                'error',
                error instanceof WalletError ? error : new WalletTransactionError('Get execution failed', error),
            )
            throw error
        }
    }

    async requestTransactionHistory(_program: string): Promise<Record<string, unknown>[]> {
        try {
            const wallet = this._wallet
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError()

            try {
                // Add actual transaction history request logic here
                return [] // Placeholder
            } catch (error) {
                throw new WalletRecordsError((error as Error).message, error as Error)
            }
        } catch (error) {
            this.emit(
                'error',
                error instanceof WalletError ? error : new WalletRecordsError('Transaction history failed', error),
            )
            throw error
        }
    }

    async transactionStatus(_transactionId: string): Promise<string> {
        try {
            const wallet = this._wallet
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError()

            try {
                // Add actual transaction status request logic here
                return '' // Placeholder
            } catch (error) {
                throw new WalletTransactionError((error as Error).message, error as Error)
            }
        } catch (error) {
            this.emit(
                'error',
                error instanceof WalletError ? error : new WalletTransactionError('Transaction status failed', error),
            )
            throw error
        }
    }

    async requestRecordPlaintexts(_program: string): Promise<Record<string, unknown>[]> {
        return this.requestRecords(_program)
    }
}
