import { useAccount, useSignMessage } from "wagmi";
import { useState, useCallback, useEffect, useRef } from "react";

// api-server is reverse-proxied at the "/api" path on this same origin (see
// artifacts/api-server/.replit-artifact/artifact.toml). Always call it via a
// relative path — never a separate host/port/domain — so this works
// unchanged in the dev preview, the published deployment, and any custom
// domain, without needing a VITE_API_URL override.
const API_URL = "";

export function useWalletAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("auth_token"),
  );
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Prevents infinite retry loop when the user rejects/cancels the signature
  // prompt. Reset when the wallet address changes (new account) or disconnects.
  const loginBlockedRef = useRef(false);

  // Reset the block whenever the connected address changes so a fresh wallet
  // connection always gets a new login attempt.
  const prevAddressRef = useRef<string | undefined>(undefined);
  if (address !== prevAddressRef.current) {
    prevAddressRef.current = address;
    loginBlockedRef.current = false;
  }

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
        // Block auto-retry until the wallet address changes; without this,
        // setIsLoggingIn(false) in finally would immediately re-trigger the
        // effect and create an infinite nonce-request loop on rejection.
        loginBlockedRef.current = true;
      } finally {
        setIsLoggingIn(false);
      }
    },
    [signMessageAsync],
  );

  // Автоматически логинимся, как только кошелёк подключён и токена ещё нет
  useEffect(() => {
    if (isConnected && address && !token && !isLoggingIn && !loginBlockedRef.current) {
      login(address);
    }
  }, [isConnected, address, token, isLoggingIn, login]);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    setToken(null);
  }, []);

  return { token, isLoggingIn, logout };
}
