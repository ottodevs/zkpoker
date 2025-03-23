"use client";

import React, { FC, ReactNode, useMemo, useEffect } from "react";
import { WalletProvider } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletModalProvider } from "@demox-labs/aleo-wallet-adapter-reactui";
import { LeoWalletAdapter } from "@demox-labs/aleo-wallet-adapter-leo";
import {
  DecryptPermission,
  WalletAdapterNetwork,
  WalletReadyState,
  WalletError
} from "@demox-labs/aleo-wallet-adapter-base";

// Import default styles
import "@demox-labs/aleo-wallet-adapter-reactui/styles.css";

interface LeoWalletProviderProps {
  children: ReactNode;
}

interface ExtendedWindow extends Window {
  leoWallet?: unknown;
  leo?: unknown;
}

export const LeoWalletProvider: FC<LeoWalletProviderProps> = ({ children }) => {
  // Initialize wallet adapter without network parameter
  const wallets = useMemo(
    () => [
      new LeoWalletAdapter({
        appName: "ZK Poker"
      }),
    ],
    []
  );

  // Check if Leo wallet is available in window
  useEffect(() => {
    const checkWallet = () => {
      const win = window as ExtendedWindow;
      if (win.leoWallet || win.leo) {
        console.log('Leo wallet detected in window:', {
          leoWallet: !!win.leoWallet,
          leo: !!win.leo,
          readyState: wallets[0].readyState
        });
      } else {
        console.log('Leo wallet not found in window');
      }
    };
    
    checkWallet();
    // Check again after a short delay to ensure extension has time to inject
    const timeoutId = setTimeout(checkWallet, 1000);
    return () => clearTimeout(timeoutId);
  }, [wallets]);

  const onError = (error: WalletError) => {
    console.error('Wallet error:', error);
    // Log the actual error details
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
      // Log any additional properties
      console.error('Full error object:', JSON.stringify(error, null, 2));
    }
  };

  return (
    <WalletProvider
      wallets={wallets}
      onError={onError}
      decryptPermission={DecryptPermission.UponRequest}
      network={WalletAdapterNetwork.Testnet}
      autoConnect
    >
      <WalletModalProvider>
        {children}
      </WalletModalProvider>
    </WalletProvider>
  );
}; 