import type { AleoDeployment, AleoTransaction, WalletName } from '@demox-labs/aleo-wallet-adapter-base'
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
} from '@demox-labs/aleo-wallet-adapter-base'
import type { LeoWallet } from '@demox-labs/aleo-wallet-adapter-leo'
import type { CreateEventRequestData, RecordsFilter } from '@puzzlehq/sdk'
import {
    connect,
    decrypt,
    disconnect,
    EventStatus,
    EventType,
    getEvent,
    getRecords,
    Network,
    requestCreateEvent,
    requestSignature,
} from '@puzzlehq/sdk'
import type { ConnectionWithAccountInfo, RecordWithPlaintext } from '@puzzlehq/sdk-core'
import { RecordStatus } from '@puzzlehq/types'

interface PuzzleWalletClient {
    puzzleWalletClient?: LeoWallet
}

export interface PuzzleWindow extends Window {
    aleo?: PuzzleWalletClient
}

declare const window: PuzzleWindow

export interface PuzzleWalletAdapterConfig {
    appName?: string
    isMobile?: boolean
    mobileWebviewUrl?: string
    appDescription?: string
    appIconURL?: string
}

export const PuzzleWalletName = 'Puzzle Wallet' as WalletName<'Puzzle Wallet'>

interface AleoRecord {
    owner: string | null
    program_id: string
    recordName: string
    spent: boolean
    plaintext: string
    ciphertext: string
    _id: string
    eventId?: string
    height: number
    timestamp: Date
    data: Record<string, unknown>
    microcredits?: number
    serialNumber?: string | null
    spentEventId?: string
    name?: string
}

interface SignatureResponse {
    signature: string | undefined
}

export class PuzzleWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = PuzzleWalletName
    icon =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQ4IDk2Qzc0LjUwOTcgOTYgOTYgNzQuNTA5NyA5NiA0OEM5NiAyMS40OTAzIDc0LjUwOTcgMCA0OCAwQzIxLjQ5MDMgMCAwIDIxLjQ5MDMgMCA0OEMwIDc0LjUwOTcgMjEuNDkwMyA5NiA0OCA5NloiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl8yXzExNykiLz4KPHBhdGggZD0iTTQ4IDg4QzY5Ljk4NjggODggODggNjkuOTg2OCA4OCA0OEM4OCAyNi4wMTMyIDY5Ljk4NjggOCA0OCA4QzI2LjAxMzIgOCA4IDI2LjAxMzIgOCA0OEM4IDY5Ljk4NjggMjYuMDEzMiA4OCA0OCA4OFoiIGZpbGw9InVybCgjcGFpbnQxX2xpbmVhcl8yXzExNykiLz4KPHBhdGggZD0iTTY4LjY5MTQgNDMuMzI0M0M2OC42OTE0IDQzLjMyNDMgNjYuOTIyOCA0Mi4wMjI4IDY1LjY1MzEgNDEuMzIyNkM2NC4zNTIzIDQwLjU5MTEgNjIuOTMzNyAzOS45NTMyIDYxLjQ4NDMgMzkuNDEyM0M1OS45ODgyIDM4Ljg1NTcgNTguNDM5OCAzOC40NTQ5IDU2Ljg3MTUgMzguMTQyQzU1LjIxMzQgMzcuODEwNiA1My41MjM1IDM3LjY0NTEgNTEuODMwOSAzNy42NDhDNTAuMTM4MyAzNy42NDUxIDQ4LjQ0ODQgMzcuODEwNiA0Ni43OTAzIDM4LjE0MkM0NS4yMjIgMzguNDU0OSA0My42NzM2IDM4Ljg1NTcgNDIuMTc3NSAzOS40MTIzQzQwLjcyODEgMzkuOTUzMiAzOS4zMDk1IDQwLjU5MTEgMzcuOTk5MyA0MS4zMjI2QzM2Ljc0MDMgNDIuMDIyOCAzNC45NzE3IDQzLjMyNDMgMzQuOTcxNyA0My4zMjQzQzM0Ljk3MTcgNDMuMzI0MyAzNi43NDAzIDQ0LjYyNTkgMzcuOTk5MyA0NS4zMjZDMzkuMzA5NSA0Ni4wNTc1IDQwLjcyODEgNDYuNjk1NCA0Mi4xNzc1IDQ3LjIzNjNDNDMuNjczNiA0Ny43OTI5IDQ1LjIyMiA0OC4xOTM3IDQ2Ljc5MDMgNDguNTA2NkM0OC40NDg0IDQ4LjgzOCA1MC4xMzgzIDQ5LjAwMzUgNTEuODMwOSA0OS4wMDA2QzUzLjUyMzUgNDkuMDAzNSA1NS4yMTM0IDQ4LjgzOCA1Ni44NzE1IDQ4LjUwNjZDNTguNDM5OCA0OC4xOTM3IDU5Ljk4ODIgNDcuNzkyOSA2MS40ODQzIDQ3LjIzNjNDNjIuOTMzNyA0Ni42OTU0IDY0LjM1MjMgNDYuMDU3NSA2NS42NTMxIDQ1LjMyNkM2Ni45MjI4IDQ0LjYyNTkgNjguNjkxNCA0My4zMjQzIDY4LjY5MTQgNDMuMzI0M1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik02OC42OTE0IDU0LjY3NTdDNjguNjkxNCA1NC42NzU3IDY2LjkyMjggNTMuMzc0MSA2NS42NTMxIDUyLjY3MzlDNjQuMzUyMyA1MS45NDI0IDYyLjkzMzcgNTEuMzA0NSA2MS40ODQzIDUwLjc2MzZDNTkuOTg4MiA1MC4yMDcgNTguNDM5OCA0OS44MDYyIDU2Ljg3MTUgNDkuNDkzM0M1NS4yMTM0IDQ5LjE2MTkgNTMuNTIzNSA0OC45OTY0IDUxLjgzMDkgNDguOTk5M0M1MC4xMzgzIDQ4Ljk5NjQgNDguNDQ4NCA0OS4xNjE5IDQ2Ljc5MDMgNDkuNDkzM0M0NS4yMjIgNDkuODA2MiA0My42NzM2IDUwLjIwNyA0Mi4xNzc1IDUwLjc2MzZDNDAuNzI4MSA1MS4zMDQ1IDM5LjMwOTUgNTEuOTQyNCAzNy45OTkzIDUyLjY3MzlDMzYuNzQwMyA1My4zNzQxIDM0Ljk3MTcgNTQuNjc1NyAzNC45NzE3IDU0LjY3NTdDMzQuOTcxNyA1NC42NzU3IDM2LjcQ0MDMgNTUuOTc3MiAzNy45OTkzIDU2LjY3NzRDMzkuMzA5NSA1Ny40MDg5IDQwLjcyODEgNTguMDQ2OCA0Mi4xNzc1IDU4LjU4NzdDNDMuNjczNiA1OS4xNDQzIDQ1LjIyMiA1OS41NDUxIDQ2Ljc5MDMgNTkuODU4QzQ4LjQ0ODQgNjAuMTg5NCA1MC4xMzgzIDYwLjM1NDkgNTEuODMwOSA2MC4zNTJDNTMuNTIzNSA2MC4zNTQ5IDU1LjIxMzQgNjAuMTg5NCA1Ni44NzE1IDU5Ljg1OEM1OC40Mzk4IDU5LjU0NTEgNTkuOTg4MiA1OS4xNDQzIDYxLjQ4NDMgNTguNTg3N0M2Mi45MzM3IDU4LjA0NjggNjQuMzUyMyA1Ny40MDg5IDY1LjY1MzEgNTYuNjc3NEM2Ni45MjI4IDU1Ljk3NzIgNjguNjkxNCA1NC42NzU3IDY4LjY5MTQgNTQuNjc1N1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik02OC42OTE0IDMyQzY4LjY5MTQgMzIgNjYuOTIyOCAzMC42OTg1IDY1LjY1MzEgMjkuOTk4M0M2NC4zNTIzIDI5LjI2NjggNjIuOTMzNyAyOC42Mjg5IDYxLjQ4NDMgMjguMDg4QzU5Ljk4ODIgMjcuNTMxNCA1OC40Mzk4IDI3LjEzMDYgNTYuODcxNSAyNi44MTc3QzU1LjIxMzQgMjYuNDg2MyA1My41MjM1IDI2LjMyMDggNTEuODMwOSAyNi4zMjM3QzUwLjEzODMgMjYuMzIwOCA0OC40NDg0IDI2LjQ4NjMgNDYuNzkwMyAyNi44MTc3QzQ1LjIyMiAyNy4xMzA2IDQzLjY3MzYgMjcuNTMxNCA0Mi4xNzc1IDI4LjA4OEM0MC43MjgxIDI4LjYyODkgMzkuMzA5NSAyOS4yNjY4IDM3Ljk5OTMgMjkuOTk4M0MzNi43NDAzIDMwLjY5ODUgMzQuOTcxNyAzMiAzNC45NzE3IDMyQzM0Ljk3MTcgMzIgMzYuNzQwMyAzMy4zMDE2IDM3Ljk5OTMgMzQuMDAxOEMzOS4zMDk1IDM0LjczMzMgNDAuNzI4MSAzNS4zNzEyIDQyLjE3NzUgMzUuOTEyMUM0My42NzM2IDM2LjQ2ODcgNDUuMjIyIDM2Ljg2OTUgNDYuNzkwMyAzNy4xODI0QzQ4LjQ0ODQgMzcuNTEzOCA1MC4xMzgzIDM3LjY3OTMgNTEuODMwOSAzNy42NzY0QzUzLjUyMzUgMzcuNjc5MyA1NS4yMTM0IDM3LjUxMzggNTYuODcxNSAzNy4xODI0QzU4LjQzOTggMzYuODY5NSA1OS45ODgyIDM2LjQ2ODcgNjEuNDgzNSAzNS45MTIxQzYyLjkzMzcgMzUuMzcxMiA2NC4zNTIzIDM0LjczMzMgNjUuNjUzMSAzNC4wMDE4QzY2LjkyMjggMzMuMzAxNiA2OC42OTE0IDMyIDY4LjY5MTQgMzJaIiBmaWxsPSJ3aGl0ZSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzJfMTE3IiB4MT0iNDgiIHkxPSIwIiB4Mj0iNDgiIHkyPSI5NiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMDBGRkE1Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzAwQjBGRiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfMl8xMTciIHgxPSI0OCIgeTE9IjgiIHgyPSI0OCIgeTI9Ijg4IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiMwMEZGQTUiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDBCMEZGIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+Cg=='
    readonly supportedTransactionVersions = null

    private _connecting: boolean
    private _dAppInfo: object
    private _wallet: ConnectionWithAccountInfo | undefined | null
    private _publicKey: string | null
    private _decryptPermission: string
    private _isMobile: boolean
    private _readyState: WalletReadyState =
        typeof window === 'undefined' || typeof document === 'undefined'
            ? WalletReadyState.Unsupported
            : WalletReadyState.NotDetected

    constructor({
        appName = 'sample',
        isMobile = false,
        mobileWebviewUrl,
        appIconURL,
        appDescription,
    }: PuzzleWalletAdapterConfig = {}) {
        console.log('mobileWebviewUrl', mobileWebviewUrl)
        super()
        this._dAppInfo = {
            name: appName,
            description: appDescription,
            iconUrl: appIconURL,
        }
        this._connecting = false
        this._wallet = null
        this._publicKey = null
        this._isMobile = isMobile
        this._decryptPermission = DecryptPermission.NoDecrypt

        if (this._readyState !== WalletReadyState.Unsupported) {
            scopePollingDetectionStrategy(() => {
                if (!!window?.aleo?.puzzleWalletClient) {
                    this._readyState = WalletReadyState.Installed
                    this.emit('readyStateChange', this._readyState)
                    return true
                }
                return false
            })
        }
    }

    get url() {
        if (this._isMobile) {
            let cbUUID = localStorage.getItem('cbUUID')
            if (cbUUID != null) {
                cbUUID = JSON.parse(cbUUID)
            }
            let questId = localStorage.getItem('questId')
            if (questId != null) {
                questId = JSON.parse(questId)
            }
            const url = cbUUID
                ? `https://${location.host}/quest/coinbase/${questId}?coinbase_uuid=${cbUUID}&next=${location.pathname}`
                : location.href
            return `https://app.puzzle.online/quest/browser?url=${encodeURIComponent(url)}`
        }
        return 'https://puzzle.online'
    }

    get publicKey() {
        return this._publicKey
    }

    get decryptPermission() {
        return this._decryptPermission
    }

    get connecting() {
        return this._connecting
    }

    get readyState() {
        return this._readyState
    }

    set readyState(readyState) {
        this._readyState = readyState
    }

    async decrypt(cipherText: string, tpk?: string, programId?: string, functionName?: string, index?: number) {
        console.log('decrypt', cipherText, tpk, programId, functionName, index)
        try {
            const wallet = this._wallet
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError()
            switch (this._decryptPermission) {
                case DecryptPermission.NoDecrypt:
                    throw new WalletDecryptionNotAllowedError()

                case DecryptPermission.UponRequest:
                case DecryptPermission.AutoDecrypt:
                case DecryptPermission.OnChainHistory: {
                    try {
                        const text = await decrypt({ ciphertexts: [cipherText] })
                        return text.plaintexts![0]
                    } catch (error: unknown) {
                        if (error instanceof WalletError) {
                            throw error
                        }
                        if (error instanceof Error) {
                            throw new WalletDecryptionError(error.message, error)
                        }
                        throw new WalletDecryptionError('Permission Not Granted', error)
                    }
                }
                default:
                    throw new WalletDecryptionError()
            }
        } catch (error: unknown) {
            this.emit(
                'error',
                error instanceof WalletError ? error : new WalletDecryptionError('Permission Not Granted', error),
            )
            throw error
        }
    }

    async requestRecords(program: string): Promise<AleoRecord[]> {
        try {
            const wallet = this._wallet
            if (!wallet || !this.publicKey) {
                throw new WalletNotConnectedError()
            }

            const filter: RecordsFilter = {
                programIds: [program],
                status: RecordStatus.Unspent,
            }

            let allRecords: AleoRecord[] = []
            let page = 0

            while (true) {
                const result = await getRecords({
                    address: this.publicKey,
                    filter,
                    page,
                    network: this._wallet?.network,
                })

                const records = result.records || []
                const mappedRecords = records.map((record: RecordWithPlaintext) => {
                    const recordData = typeof record.data === 'string' ? JSON.parse(record.data) : record.data
                    return {
                        owner: this.publicKey,
                        program_id: program,
                        recordName: record.name,
                        spent: false,
                        plaintext: record.plaintext || '',
                        ciphertext: record.ciphertext,
                        _id: record._id,
                        eventId: record.eventId,
                        height: record.height,
                        timestamp: record.timestamp,
                        data: recordData,
                        microcredits: record.microcredits,
                        serialNumber: record.serialNumber,
                        name: record.name,
                    } as AleoRecord
                })

                allRecords = allRecords.concat(mappedRecords)

                if (result.pageCount === page) {
                    break
                }

                page++
            }

            return allRecords
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.emit('error', new WalletRecordsError(error.message, error))
            } else {
                this.emit('error', new WalletRecordsError('Permission Not Granted', error))
            }
            throw error
        }
    }

    async requestTransaction(transaction: AleoTransaction): Promise<string> {
        try {
            const wallet = this._wallet
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError()

            try {
                const requestData: CreateEventRequestData = {
                    address: transaction.address,
                    type: EventType.Execute,
                    programId: transaction.transitions[0].program,
                    functionId: transaction.transitions[0].functionName,
                    fee: transaction.fee / 1000000,
                    inputs: transaction.transitions[0].inputs,
                }
                const result = await requestCreateEvent(requestData)
                if (result.error) {
                    throw new Error(result.error)
                }
                return result.eventId || ''
            } catch (error: unknown) {
                if (error instanceof Error) {
                    throw new WalletTransactionError(error.message, error)
                }
                throw new WalletTransactionError('Permission Not Granted', error)
            }
        } catch (error: unknown) {
            if (error instanceof WalletError) {
                this.emit('error', error)
            } else if (error instanceof Error) {
                this.emit('error', new WalletTransactionError(error.message, error))
            } else {
                this.emit('error', new WalletTransactionError('Transaction failed', error))
            }
            throw error
        }
    }

    async transactionStatus(transactionId: string): Promise<string> {
        try {
            const wallet = this._wallet
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError()
            try {
                const result = await getEvent({
                    id: transactionId,
                    address: this.publicKey,
                    network: this._wallet?.network,
                })
                return result.event
                    ? result.event.status == EventStatus.Settled
                        ? 'Finalized'
                        : result.event.status
                    : ''
            } catch (error: unknown) {
                if (error instanceof Error) {
                    throw new WalletTransactionError(error.message, error)
                }
                throw new WalletTransactionError('Permission Not Granted', error)
            }
        } catch (error: unknown) {
            if (error instanceof WalletError) {
                this.emit('error', error)
            } else if (error instanceof Error) {
                this.emit('error', new WalletTransactionError(error.message, error))
            } else {
                this.emit('error', new WalletTransactionError('Transaction failed', error))
            }
            throw error
        }
    }

    async requestRecordPlaintexts(program: string): Promise<AleoRecord[]> {
        return this.requestRecords(program)
    }

    async connect(decryptPermission: DecryptPermission, network: WalletAdapterNetwork): Promise<void> {
        try {
            if (this.connected || this.connecting) return
            if (this._readyState !== WalletReadyState.Installed && this._readyState !== WalletReadyState.Loadable)
                throw new WalletNotReadyError()

            this._connecting = true

            try {
                const n = network === WalletAdapterNetwork.MainnetBeta ? Network.AleoMainnet : Network.AleoTestnet
                const resp = await connect({
                    dAppInfo: this._dAppInfo,
                    permissions: {
                        programIds: {
                            [n]: [],
                        },
                    },
                })
                this._wallet = resp.connection
                if (this._wallet.network !== n) {
                    throw new Error('Network mismatch')
                }
                this._publicKey = this._wallet.address
                this.emit('connect', this._publicKey)
            } catch (error) {
                if (error instanceof Error) {
                    throw new WalletConnectionError(error.message, error)
                }
                throw new WalletConnectionError('Connection failed', error)
            }

            this._decryptPermission = decryptPermission
        } catch (error) {
            if (error instanceof WalletError) {
                this.emit('error', error)
            } else if (error instanceof Error) {
                this.emit('error', new WalletConnectionError(error.message, error))
            } else {
                this.emit('error', new WalletConnectionError('Connection failed', error))
            }
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
                await disconnect()
            } catch (error) {
                if (error instanceof Error) {
                    this.emit('error', new WalletDisconnectionError(error.message, error))
                } else {
                    this.emit('error', new WalletDisconnectionError('Disconnection failed', error))
                }
            }
        }

        this.emit('disconnect')
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            const wallet = this._wallet
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError()

            try {
                const messageString = new TextDecoder().decode(message)
                const signature = (await requestSignature({
                    message: messageString,
                })) as SignatureResponse
                return new TextEncoder().encode(signature.signature || '')
            } catch (error) {
                if (error instanceof Error) {
                    throw new WalletSignTransactionError(error.message, error)
                }
                throw new WalletSignTransactionError('Signature failed', error)
            }
        } catch (error) {
            if (error instanceof WalletError) {
                this.emit('error', error)
            } else if (error instanceof Error) {
                this.emit('error', new WalletSignTransactionError(error.message, error))
            } else {
                this.emit('error', new WalletSignTransactionError('Signature failed', error))
            }
            throw error
        }
    }

    async requestDeploy(_deployment: AleoDeployment): Promise<string> {
        throw new Error('Method not implemented.')
    }

    async requestExecution(_transaction: AleoTransaction): Promise<string> {
        throw new Error('Method not implemented.')
    }

    async requestBulkTransactions(_transactions: AleoTransaction[]): Promise<string[]> {
        throw new Error('Method not implemented.')
    }

    async getExecution(_transactionId: string): Promise<string> {
        throw new Error('Method not implemented.')
    }

    async requestTransactionHistory(_program: string): Promise<AleoRecord[]> {
        throw new Error('Method not implemented.')
    }
}
