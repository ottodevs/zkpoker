'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { DecryptPermission, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base'
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'
import type { FC, ReactNode } from 'react'
import { useCallback, useMemo, useState } from 'react'

interface Props {
    children: ReactNode
    decryptPermission: DecryptPermission
    network: WalletAdapterNetwork
    programs: string[]
}

export const WalletModalProvider: FC<Props> = ({ children, decryptPermission, network, programs }) => {
    const { wallet, connect, connecting, connected } = useWallet()
    const [isOpen, setIsOpen] = useState(false)

    const handleConnect = useCallback(async () => {
        try {
            if (wallet) {
                await connect(decryptPermission, network, programs)
            }
        } catch (error) {
            console.error(error)
        }
    }, [wallet, connect, decryptPermission, network, programs])

    const buttonText = useMemo(() => {
        if (connecting) return 'Connecting...'
        if (connected) return 'Connected'
        return 'Connect Wallet'
    }, [connecting, connected])

    return (
        <>
            {children}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Connect Wallet</DialogTitle>
                        <DialogDescription>Connect your wallet to start using the application</DialogDescription>
                    </DialogHeader>
                    <Button onClick={handleConnect} disabled={connecting || connected}>
                        {buttonText}
                    </Button>
                </DialogContent>
            </Dialog>
        </>
    )
}

WalletModalProvider.displayName = 'WalletModalProvider'
