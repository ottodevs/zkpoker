"use client";

import React, { FC, useCallback, useEffect } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { useWalletModal } from "@demox-labs/aleo-wallet-adapter-reactui";
import { Exo } from 'next/font/google';
import { WalletNotConnectedError, DecryptPermission, WalletAdapterNetwork, WalletConnectionError } from "@demox-labs/aleo-wallet-adapter-base";

const exo = Exo({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
});

interface ExtendedWindow extends Window {
  leoWallet?: unknown;
  leo?: unknown;
}

export const LeoConnectButton: FC = () => {
  const { wallet, connect, connecting, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  
  // Log wallet state changes
  useEffect(() => {
    const win = window as ExtendedWindow;
    console.log('Wallet state:', {
      connected,
      connecting,
      walletName: wallet?.adapter?.name,
      walletReadyState: wallet?.adapter?.readyState,
      windowLeoWallet: !!win.leoWallet,
      windowLeo: !!win.leo
    });
  }, [connected, connecting, wallet]);

  const handleClick = useCallback(async () => {
    try {
      if (connected) {
        await disconnect();
        return;
      }

      if (!wallet) {
        setVisible(true);
        return;
      }

      if (connecting) {
        console.log('Already connecting...');
        return;
      }

      try {
        // Connect with required parameters
        await connect(
          DecryptPermission.UponRequest, 
          WalletAdapterNetwork.Testnet,
          [] // Optional programs array
        );
        console.log('Connection successful');
      } catch (error) {
        // Handle specific connection errors
        if (error instanceof WalletConnectionError) {
          console.error('Connection error:', error.message);
          throw new WalletConnectionError(
            'Failed to connect to Leo Wallet',
            error
          );
        }
        throw error;
      }
    } catch (error) {
      console.error('Connection error:', error);
      if (error instanceof WalletNotConnectedError) {
        console.error('WalletNotConnectedError:', error.message);
        setVisible(true);
      } else if (error instanceof Error) {
        console.error('Other error:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          details: error
        });
        setVisible(true); // Show modal as fallback for any connection error
      }
    }
  }, [wallet, connect, connecting, connected, disconnect, setVisible]);

  return (
    <button 
      onClick={handleClick}
      disabled={connecting}
      className={`h-[48px] px-[12px] py-[10px] flex items-center gap-[10px] rounded-[8px] border-2 border-[rgba(142,255,196,0.7)] text-black font-bold cursor-pointer ${exo.className} ${connecting ? 'opacity-70' : ''}`}
      style={{
        background: 'linear-gradient(180deg, #4DF0B4 16.65%, #25976C 100%)'
      }}
    >
      {connecting ? 'CONNECTING...' : connected ? 'DISCONNECT' : 'CONNECT WALLET'}
    </button>
  );
}; 