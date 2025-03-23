'use client'

import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'
import type { FC } from 'react'

export const WalletStatus: FC = () => {
    const { publicKey, connected, connecting, wallet } = useWallet()

    const shortAddress = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}` : null

    return (
        <div className='max-w-sm rounded bg-gray-800/80 p-4 text-sm text-white'>
            <h3 className='mb-3 border-b border-gray-700 pb-2 text-lg font-bold'>Wallet Status</h3>
            <div className='space-y-2'>
                <p>
                    <span className='text-gray-400'>Status:</span>{' '}
                    {connecting ? (
                        <span className='text-yellow-400'>Connecting...</span>
                    ) : connected ? (
                        <span className='text-green-400'>Connected</span>
                    ) : (
                        <span className='text-red-400'>Disconnected</span>
                    )}
                </p>
                {connected && wallet && (
                    <p>
                        <span className='text-gray-400'>Wallet:</span> <span>{wallet.adapter.name}</span>
                    </p>
                )}
                {connected && publicKey && (
                    <p>
                        <span className='text-gray-400'>Address:</span>{' '}
                        <span className='font-mono'>{shortAddress}</span>
                    </p>
                )}
            </div>
        </div>
    )
}
