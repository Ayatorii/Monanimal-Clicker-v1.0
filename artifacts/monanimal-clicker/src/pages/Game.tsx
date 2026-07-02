import React, { useState } from "react";
import { useGameState, GameProvider } from "@/hooks/useGameState";
import { useGameLoop } from "@/hooks/useGameLoop";
import { usePreloadImages } from "@/hooks/usePreloadImages";
import TopBar from "@/components/TopBar";
import MonanimalCharacter from "@/components/MonanimalCharacter";
import UpgradeShop from "@/components/UpgradeShop";
import AchievementsModal from "@/components/AchievementsModal";

function GameInner() {
  useGameLoop();
  usePreloadImages();
  const { state } = useGameState();
  const [showAchievements, setShowAchievements] = useState(false);

  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-background text-foreground overflow-hidden font-sans relative">
      <div
        className="combo-screen-glow fixed inset-y-0 left-0 w-28 md:w-48 z-40 pointer-events-none"
        style={{ background: "linear-gradient(to right, var(--combo-glow-color, transparent), transparent)" }}
      />
      <div
        className="combo-screen-glow fixed inset-y-0 right-0 w-28 md:w-48 z-40 pointer-events-none"
        style={{ background: "linear-gradient(to left, var(--combo-glow-color, transparent), transparent)" }}
      />
      <AchievementsModal open={showAchievements} onOpenChange={setShowAchievements} />

      <div className="relative z-20">
        <TopBar onShowAchievements={() => setShowAchievements(true)} />
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row relative z-10">
        <div className="flex-1 relative flex flex-col overflow-hidden">
          <MonanimalCharacter />
        </div>

        <div className="h-16 md:h-full md:w-80 lg:w-96 flex-shrink-0 z-20 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.2)]">
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
