import { useEffect, useRef } from "react";
import { useGameState } from "@/hooks/useGameState";

// api-server is reverse-proxied at the "/api" path on this same origin (see
// artifacts/api-server/.replit-artifact/artifact.toml). Always call it via a
// relative path — never a separate host/port/domain — so this works
// unchanged in the dev preview, the published deployment, and any custom
// domain, without needing a VITE_API_URL override.
const API_URL = "";

export function useCloudSync(token: string | null) {
  const { state, dispatch } = useGameState();
  const hasHydrated = useRef(false);

  // Один раз при входе — подтягиваем сохранённый в облаке прогресс
  useEffect(() => {
    if (!token || hasHydrated.current) return;
    hasHydrated.current = true;

    fetch(`${API_URL}/api/player/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((player) => {
        if (player?.gameState) {
          dispatch((prev) => ({ ...prev, ...player.gameState }));
        }
      })
      .catch((err) => console.error("Failed to load cloud save:", err));
  }, [token, dispatch]);

  // Debounced автосейв в облако
  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      fetch(`${API_URL}/api/player/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gameState: state }),
      }).catch((err) => console.error("Cloud sync failed:", err));
    }, 3000);
    return () => clearTimeout(timer);
  }, [token, state]);
}
