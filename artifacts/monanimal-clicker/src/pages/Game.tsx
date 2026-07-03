import React, { useState } from "react";
import { useGameState, GameProvider } from "@/hooks/useGameState";
import { useGameLoop } from "@/hooks/useGameLoop";
import { usePreloadImages } from "@/hooks/usePreloadImages";
import TopBar from "@/components/TopBar";
import MonanimalCharacter from "@/components/MonanimalCharacter";
import UpgradeShop from "@/components/UpgradeShop";
import AchievementsModal from "@/components/AchievementsModal";
import { useWalletAuth } from "@/lib/useWalletAuth";
import { useCloudSync } from "@/hooks/useCloudSync";
import { useIsMobile } from "@/hooks/use-mobile";

function GameInner() {
  useGameLoop();
  usePreloadImages();
  const { state } = useGameState();
  const { token, isLoggingIn } = useWalletAuth();
  useCloudSync(token);
  const [showAchievements, setShowAchievements] = useState(false);
  const isMobile = useIsMobile();

  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-background text-foreground overflow-hidden font-sans relative">
      <AchievementsModal
        open={showAchievements}
        onOpenChange={setShowAchievements}
      />

      <div className="relative z-20">
        <TopBar onShowAchievements={() => setShowAchievements(true)} />
      </div>

      <div className={`flex flex-1 overflow-hidden relative z-10 ${isMobile ? "flex-col" : "flex-row"}`}>
        <div className="flex-1 relative flex flex-col overflow-hidden">
          <MonanimalCharacter />
        </div>

        <div
          className={`flex-shrink-0 z-20 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.2)] ${isMobile ? "h-16" : "h-full w-96"}`}
        >
          <UpgradeShop />
        </div>
      </div>
    </div>
  );
}

export default function Game() {
  return (
    <GameProvider>
      <GameInner />
    </GameProvider>
  );
}
