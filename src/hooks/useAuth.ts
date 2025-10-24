import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState } from 'react';

interface User {
  wallet_address: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
}

export function useAuth() {
  const { connected, publicKey } = useWallet();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const login = async () => {
      if (connected && publicKey) {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              wallet_address: publicKey.toString(),
            }),
          });

          if (!response.ok) {
            throw new Error('Login failed');
          }

          const { user } = await response.json();
          setUser(user);
          console.log('Login successful:', user);
        } catch (error) {
          console.error('Error logging in:', error);
        }
      } else {
        setUser(null);
      }
    };

    login();
  }, [connected, publicKey]);

  return {
    isAuthenticated: connected && !!publicKey,
    walletAddress: publicKey?.toString(),
    user,
  };
}
