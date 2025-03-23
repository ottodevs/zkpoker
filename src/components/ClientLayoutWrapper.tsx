"use client";

import React from 'react';
import LeoClientProvider from './LeoClientProvider';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <LeoClientProvider>{children}</LeoClientProvider>;
} 