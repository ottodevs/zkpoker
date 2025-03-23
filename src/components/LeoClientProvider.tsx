"use client";

import React from 'react';
import { LeoWalletProvider } from './LeoWalletProvider';

export default function LeoClientProvider({ children }: { children: React.ReactNode }) {
  return <LeoWalletProvider>{children}</LeoWalletProvider>;
} 