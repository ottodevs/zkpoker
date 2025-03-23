"use client";

import React, { FC } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";

export const WalletStatus: FC = () => {
  const { wallet, connected, connecting, publicKey } = useWallet();
  
  const shortAddress = publicKey 
    ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`
    : null;
  
  return (
    <div className="bg-gray-800/80 p-4 rounded text-white text-sm max-w-sm">
      <h3 className="text-lg font-bold border-b border-gray-700 pb-2 mb-3">Wallet Status</h3>
      <div className="space-y-2">
        <p>
          <span className="text-gray-400">Status:</span>{" "}
          {connecting ? (
            <span className="text-yellow-400">Connecting...</span>
          ) : connected ? (
            <span className="text-green-400">Connected</span>
          ) : (
            <span className="text-red-400">Disconnected</span>
          )}
        </p>
        {wallet && (
          <p>
            <span className="text-gray-400">Wallet:</span>{" "}
            <span>{wallet.adapter.name}</span>
          </p>
        )}
        {connected && publicKey && (
          <p>
            <span className="text-gray-400">Address:</span>{" "}
            <span className="font-mono">{shortAddress}</span>
          </p>
        )}
      </div>
    </div>
  );
}; 