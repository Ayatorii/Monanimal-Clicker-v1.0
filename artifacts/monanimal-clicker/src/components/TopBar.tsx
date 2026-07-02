import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trophy, Settings, X, RotateCcw } from "lucide-react";

interface TopBarProps {
  onShowAchievements: () => void;
}

export default function TopBar({ onShowAchievements }: TopBarProps) {
  const { state, dispatch, resetGame, unseenAchievements } = useGameState();
  const [showSettings, setShowSettings] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const hasUnseen = unseenAchievements.length > 0;

  const handleReset = () => {
    if (confirmReset) {
      resetGame();
      setConfirmReset(false);
      setShowSettings(false);
    } else {
      setConfirmReset(true);
    }
  };

  const handleOpenAchievements = () => {
    setShowSettings(false);
    onShowAchievements();
  };

  return (
    <>
      <div className="w-full bg-card/80 backdrop-blur-md border-b border-border z-10 shadow-sm">
        <div className="flex items-center pt-3 pb-1">
          {/* Left: Logo */}
          <div className="flex items-center gap-2 px-4 flex-shrink-0 lg:w-52 xl:w-60">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-[0_0_15px_rgba(110,84,255,0.5)]">
              M
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <h1 className="font-black text-lg md:text-xl tracking-tighter uppercase bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Monanimal
              </h1>
              <span className="text-[10px] font-mono text-white/70 tracking-widest">ALPHA 1.0.0</span>
            </div>
          </div>

          {/* Center: coins */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <motion.div
              key={Math.floor(state.coins / 100)}
              className="text-2xl md:text-3xl lg:text-5xl font-black font-mono tracking-tighter text-foreground drop-shadow-md"
            >
              {formatNumber(Math.floor(state.coins))}
            </motion.div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold mt-0.5">
              Points
            </span>
          </div>

          {/* Right: desktop controls */}
          <div className="hidden md:flex items-center gap-1 md:gap-2 px-4 flex-shrink-0 justify-end md:w-80 lg:w-96">
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={onShowAchievements}
                className="rounded-full shadow-sm hover:border-primary hover:text-primary transition-colors h-8 w-8 md:h-10 md:w-10"
              >
                <Trophy className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              {hasUnseen && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-background" />
              )}
            </div>
            <AnimatePresence mode="wait">
              {confirmReset ? (
                <motion.div
                  key="confirm-desktop"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-1"
                >
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleReset}
                    className="h-8 text-xs px-3"
                  >
                    Yes, Reset
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmReset(false)}
                    className="h-8 text-xs px-3"
                  >
                    Cancel
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="reset-desktop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmReset(true)}
                    className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Reset Progress"
                  >
                    <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: mobile gear button */}
          <div className="flex md:hidden items-center px-4 flex-shrink-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              {hasUnseen && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-background pointer-events-none" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile settings bottom sheet */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              className="fixed top-0 left-0 right-0 z-50 md:hidden bg-card border-b border-border rounded-b-2xl overflow-hidden"
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <span className="text-sm font-black uppercase tracking-widest text-primary">Settings</span>
                <button onClick={() => setShowSettings(false)} className="text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Items */}
              <div className="flex flex-col px-5 py-3 pb-5 gap-1">
                {/* Achievements */}
                <button
                  onClick={handleOpenAchievements}
                  className="flex items-center justify-between w-full py-3 border-b border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-foreground">Achievements</span>
                    {hasUnseen && (
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">›</span>
                </button>

                {/* Reset Progress */}
                <AnimatePresence mode="wait">
                  {confirmReset ? (
                    <motion.div
                      key="confirm-mobile"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="py-3 flex flex-col gap-2">
                        <p className="text-xs text-muted-foreground">All progress will be permanently deleted.</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleReset}
                            className="flex-1 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold"
                          >
                            Yes, Reset
                          </button>
                          <button
                            onClick={() => setConfirmReset(false)}
                            className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="reset-mobile"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setConfirmReset(true)}
                      className="flex items-center justify-between w-full py-3"
                    >
                      <div className="flex items-center gap-3">
                        <RotateCcw className="h-5 w-5" style={{ color: "#E60000" }} />
                        <span className="text-sm font-bold" style={{ color: "#E60000" }}>Reset Progress</span>
                      </div>
                      <span className="text-muted-foreground text-xs">›</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <p className="text-center text-[12px] text-white/60 font-mono pt-2">
                ALPHA 1.0.0
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
