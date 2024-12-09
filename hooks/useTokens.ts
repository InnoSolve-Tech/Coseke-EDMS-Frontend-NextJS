"use client";

import { useState, useEffect } from 'react';
import { getTokenBalance } from '@/lib/web3';

const TOKENS = {
  PTK: {
    address: "YOUR_TOKEN_ADDRESS",
    name: "Platform Token",
    symbol: "PTK",
    decimals: 18
  },
  USDC: {
    address: "USDC_TOKEN_ADDRESS",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6
  }
};

export function useTokens(walletAddress: string | null) {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!walletAddress) return;
      
      try {
        const newBalances: Record<string, string> = {};
        
        for (const [symbol, token] of Object.entries(TOKENS)) {
          const balance = await getTokenBalance(token.address, walletAddress);
          newBalances[symbol] = balance;
        }
        
        setBalances(newBalances);
      } catch (error) {
        console.error('Failed to fetch token balances:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [walletAddress]);

  return { tokens: TOKENS, balances, isLoading };
}