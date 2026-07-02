import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { BUILDINGS, POWER_UPGRADES, ACHIEVEMENTS } from "@/lib/gameData";
import {
  calculateCharacterLevel,
  formatNumber,
  getCharacterStage,
} from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
export interface GameState {
  coins: number;
  totalCoinsEarned: number;
  coinsPerClick: number;
  coinsPerSecond: number;
  characterLevel: number;
  totalClicks: number;
  upgrades: Record<string, number>;
  achievements: string[];
  lastSaveTime: number;
  darkMode: boolean;
  soundEnabled: boolean;
  maxComboDuration: number;
  energy: number;
  maxEnergy: number;
  energyLocked: boolean;
}

const DEFAULT_STATE: GameState = {
  coins: 0,
  totalCoinsEarned: 0,
  coinsPerClick: 1,
  coinsPerSecond: 0,
  characterLevel: 1,
  totalClicks: 0,
  upgrades: {},
  achievements: [],
  lastSaveTime: Date.now(),
  darkMode: true,
  soundEnabled: true,
  maxComboDuration: 0,
  energy: 1000,
  maxEnergy: 1000,
  energyLocked: false,
};

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<React.SetStateAction<GameState>>;
  handleClick: (multiplier?: number) => void;
  buyBuilding: (id: string) => void;
  buyPower: (id: string) => void;
  calculateUpgradeCost: (baseCost: number, owned: number) => number;
  resetGame: () => void;
  unseenAchievements: string[];
  clearUnseenAchievements: () => void;
  latestUnlocked: { id: string; name: string; icon: string } | null;
  dismissLatestUnlocked: () => void;
  updateMaxComboDuration: (seconds: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function useGameState() {
  const context = useContext(GameContext);
  if (!context)
    throw new Error("useGameState must be used within GameProvider");
  return context;
}

const OFFLINE_CAP_SECONDS = 6 * 60 * 60;

export function GameProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const offlineEarnedRef = React.useRef<number>(0);

  const [state, dispatch] = useState<GameState>(() => {
    const saved = localStorage.getItem("monanimal-clicker-save-v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const { equipment, ...rest } = parsed;
        const loadedState: GameState = { ...DEFAULT_STATE, ...rest };

        const cps: number = loadedState.coinsPerSecond ?? 0;
        const lastSave: number = loadedState.lastSaveTime ?? Date.now();
        const elapsedSec = Math.min(
          (Date.now() - lastSave) / 1000,
          OFFLINE_CAP_SECONDS,
        );
        const offlineCoins = Math.floor(cps * elapsedSec);

        // Offline energy regen
        const stage = getCharacterStage(loadedState.characterLevel ?? 1);
        const regenRate = stage.stage;
        const maxEnergy = loadedState.maxEnergy ?? 1000;
        const currentEnergy = loadedState.energy ?? maxEnergy;
        const offlineEnergy = Math.min(
          currentEnergy + regenRate * elapsedSec,
          maxEnergy,
        );
        const offlineEnergyLocked =
          (loadedState.energyLocked ?? false) && offlineEnergy < 5;

        if (offlineCoins > 0) {
          offlineEarnedRef.current = offlineCoins;
          return {
            ...loadedState,
            coins: loadedState.coins + offlineCoins,
            energy: offlineEnergy,
            energyLocked: offlineEnergyLocked,
          };
        }

        return {
          ...loadedState,
          energy: offlineEnergy,
          energyLocked: offlineEnergyLocked,
        };
      } catch (e) {
        return DEFAULT_STATE;
      }
    }
    return DEFAULT_STATE;
  });

  const [unseenAchievements, setUnseenAchievements] = useState<string[]>([]);
  const [latestUnlocked, setLatestUnlocked] = useState<{
    id: string;
    name: string;
    icon: string;
  } | null>(null);
  React.useEffect(() => {
    if (offlineEarnedRef.current > 0) {
      toast({
        title: "Welcome back!",
        description: `You earned ${formatNumber(offlineEarnedRef.current)} points while away.`,
        duration: 4000,
      });
      offlineEarnedRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recalculateStats = useCallback((currentState: GameState) => {
    let baseCps = 0;
    let baseCpc = 1;

    BUILDINGS.forEach((b) => {
      const owned = currentState.upgrades[b.id] || 0;
      baseCps += b.cps * owned;
    });

    POWER_UPGRADES.forEach((p) => {
      const owned = currentState.upgrades[p.id] || 0;
      baseCpc += p.cpc * owned;
    });

    const newLevel = calculateCharacterLevel(currentState.totalCoinsEarned);
    const newMaxEnergy = 1000 + (newLevel - 1) * 100;
    return {
      ...currentState,
      coinsPerSecond: baseCps,
      coinsPerClick: baseCpc,
      characterLevel: newLevel,
      maxEnergy: newMaxEnergy,
      energy: Math.min(currentState.energy ?? 1000, newMaxEnergy),
    };
  }, []);

  const handleClick = useCallback(
    (multiplier = 1) => {
      dispatch((prev) => {
        const energy = prev.energy ?? 0;
        const locked = prev.energyLocked ?? false;
        if (locked || energy <= 0) {
          return energy <= 0 ? { ...prev, energyLocked: true } : prev;
        }
        const earned = Math.ceil(prev.coinsPerClick * multiplier);
        const newEnergy = Math.max(0, energy - 1);
        const newState = {
          ...prev,
          coins: prev.coins + earned,
          totalCoinsEarned: prev.totalCoinsEarned + earned,
          totalClicks: prev.totalClicks + 1,
          energy: newEnergy,
          energyLocked: newEnergy <= 0,
        };
        return recalculateStats(newState);
      });
    },
    [recalculateStats],
  );

  const calculateUpgradeCost = (baseCost: number, owned: number) => {
    return Math.floor(baseCost * Math.pow(2, owned));
  };

  const MAX_UPGRADE_LEVEL = 100;

  const buyBuilding = useCallback(
    (id: string) => {
      dispatch((prev) => {
        const b = BUILDINGS.find((x) => x.id === id);
        if (!b) return prev;
        const owned = prev.upgrades[id] || 0;
        if (owned >= MAX_UPGRADE_LEVEL) return prev;
        const cost = calculateUpgradeCost(b.baseCost, owned);
        if (prev.coins < cost) return prev;
        return recalculateStats({
          ...prev,
          coins: prev.coins - cost,
          upgrades: { ...prev.upgrades, [id]: owned + 1 },
        });
      });
    },
    [recalculateStats],
  );

  const buyPower = useCallback(
    (id: string) => {
      dispatch((prev) => {
        const p = POWER_UPGRADES.find((x) => x.id === id);
        if (!p) return prev;
        const owned = prev.upgrades[id] || 0;
        if (owned >= MAX_UPGRADE_LEVEL) return prev;
        const cost = calculateUpgradeCost(p.baseCost, owned);
        if (prev.coins < cost) return prev;
        return recalculateStats({
          ...prev,
          coins: prev.coins - cost,
          upgrades: { ...prev.upgrades, [id]: owned + 1 },
        });
      });
    },
    [recalculateStats],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const stateToSave = {
        ...state,
        lastSaveTime: Date.now(),
      };
      try {
        localStorage.setItem(
          "monanimal-clicker-save-v2",
          JSON.stringify(stateToSave),
        );
      } catch (e) {
        // storage quota exceeded — silently ignore
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [state]);

  const resetGame = useCallback(() => {
    localStorage.removeItem("monanimal-clicker-save-v2");
    dispatch({ ...DEFAULT_STATE, lastSaveTime: Date.now() });
  }, []);

  const clearUnseenAchievements = useCallback(() => {
    setUnseenAchievements([]);
  }, []);

  const updateMaxComboDuration = useCallback((seconds: number) => {
    dispatch((prev) => {
      if (seconds > (prev.maxComboDuration ?? 0)) {
        return { ...prev, maxComboDuration: seconds };
      }
      return prev;
    });
  }, []);

  const dismissLatestUnlocked = useCallback(() => {
    setLatestUnlocked(null);
  }, []);

  // Achievement checker
  useEffect(() => {
    let changed = false;
    const newAchievements = [...state.achievements];
    const newlyUnlockedIds: string[] = [];

    ACHIEVEMENTS.forEach((a) => {
      if (!newAchievements.includes(a.id) && a.check(state)) {
        newAchievements.push(a.id);
        newlyUnlockedIds.push(a.id);
        changed = true;
      }
    });

    if (newlyUnlockedIds.length > 0) {
      setUnseenAchievements((prev) => [...prev, ...newlyUnlockedIds]);
      const last = ACHIEVEMENTS.find(
        (a) => a.id === newlyUnlockedIds[newlyUnlockedIds.length - 1],
      );
      if (last)
        setLatestUnlocked({ id: last.id, name: last.name, icon: last.icon });
    }

    if (changed) {
      dispatch((prev) => ({ ...prev, achievements: newAchievements }));
    }
  }, [
    state.coins,
    state.totalClicks,
    state.characterLevel,
    state.coinsPerSecond,
    state.upgrades,
    state.maxComboDuration,
  ]);

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        handleClick,
        buyBuilding,
        buyPower,
        calculateUpgradeCost,
        resetGame,
        unseenAchievements,
        clearUnseenAchievements,
        latestUnlocked,
        dismissLatestUnlocked,
        updateMaxComboDuration,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
