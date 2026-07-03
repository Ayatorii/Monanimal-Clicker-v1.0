import { useAccount, useSignMessage } from "wagmi";
import { useState, useCallback, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export function useWalletAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("auth_token"),
  );
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = useCallback(
    async (walletAddress: string) => {
      setIsLoggingIn(true);
      try {
        const nonceRes = await fetch(`${API_URL}/api/auth/nonce`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress }),
        });
        const { message } = await nonceRes.json();

        const signature = await signMessageAsync({ message });

        const verifyRes = await fetch(`${API_URL}/api/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress, signature }),
        });
        const data = await verifyRes.json();

        if (data.token) {
          localStorage.setItem("auth_token", data.token);
          setToken(data.token);
        }
      } catch (err) {
        console.error("Wallet login failed:", err);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [signMessageAsync],
  );

  // Автоматически логинимся, как только кошелёк подключён и токена ещё нет
  useEffect(() => {
    if (isConnected && address && !token && !isLoggingIn) {
      login(address);
    }
  }, [isConnected, address, token, isLoggingIn, login]);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    setToken(null);
  }, []);

  return { token, isLoggingIn, logout };
}
