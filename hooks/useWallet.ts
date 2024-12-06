"use client";

import { useState, useEffect } from 'react';
import { getProvider, connectWallet, getBalance } from '@/lib/web3';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      const { address } = await connectWallet();
      setAddress(address);
      const balance = await getBalance(address);
      setBalance(balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const provider = getProvider();
    if (provider && address) {
      provider.on('block', async () => {
        const balance = await getBalance(address);
        setBalance(balance);
      });
    }

    return () => {
      if (provider) {
        provider.removeAllListeners();
      }
    };
  }, [address]);

  return { address, balance, connect, isConnecting, error };
}