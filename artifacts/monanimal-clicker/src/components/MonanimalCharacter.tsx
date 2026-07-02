import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { useGameState } from "@/hooks/useGameState";
import { useIsMobile } from "@/hooks/use-mobile";
import { getCharacterStage, formatNumber, getLevelXpInfo } from "@/lib/utils";
import { CHARACTERS, ENVIRONMENTS_PC, ENVIRONMENTS_MOBILE, ITEMS } from "@/assets/index";

interface FloatingClick {
  id: number;
  x: number;
  y: number;
  amount: number;
  color: string;
}

export default function MonanimalCharacter() {
  const { state, handleClick, latestUnlocked, dismissLatestUnlocked, updateMaxComboDuration } = useGameState();
  const isMobile = useIsMobile();
  const stageData = getCharacterStage(state.characterLevel);
  const [clicks, setClicks] = useState<FloatingClick[]>([]);
  const [rankFlash, setRankFlash] = useState(false);
  const [popupAch, setPopupAch] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const prevStageRef = useRef(stageData.stage);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comboStartRef = useRef<number | null>(null);
  const lastClickRef = useRef<number>(0);
  const comboResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const COMBO_RESET_MS = 2000;

  const COMBO_LEVELS = [
    { threshold: 20, multiplier: 1.4, color: "#FFAE45", label: "x1.4" },
    { threshold: 10, multiplier: 1.3, color: "#FF8EE4", label: "x1.3" },
    { threshold: 5,  multiplier: 1.2, color: "#3b82f6", label: "x1.2" },
  ];

  const getComboLevel = (durationSec: number) =>
    COMBO_LEVELS.find(c => durationSec >= c.threshold) ?? null;

  const currentComboLevel = comboMultiplier > 1
    ? COMBO_LEVELS.find(c => c.multiplier === comboMultiplier) ?? null
    : null;

  // Cleanup combo timer on unmount
  useEffect(() => {
    return () => {
      if (comboResetTimerRef.current) clearTimeout(comboResetTimerRef.current);
    };
  }, []);

  // Show popup when new achievement unlocks (mobile + desktop)
  useEffect(() => {
    if (latestUnlocked) {
      setPopupAch(latestUnlocked);
      dismissLatestUnlocked();
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
      popupTimerRef.current = setTimeout(() => setPopupAch(null), 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestUnlocked]);

  // Clear timer only on unmount
  useEffect(() => {
    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, []);

  const activeStage = stageData;

  useEffect(() => {
    if (stageData.stage !== prevStageRef.current) {
      prevStageRef.current = stageData.stage;
      setRankFlash(true);
      const t = setTimeout(() => setRankFlash(false), 900);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [stageData.stage]);

  const noEnergy = (state.energyLocked ?? false) || (state.energy ?? 0) <= 0;

  const onInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX: number, clientY: number;
    if ("touches" in e) {
      e.preventDefault(); // prevent synthetic click firing after touchstart (would double-count)
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    if (noEnergy) return;

    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? clientX - rect.left : clientX;
    const y = rect ? clientY - rect.top : clientY;

    // Combo tracking
    const now = Date.now();
    if (now - lastClickRef.current > COMBO_RESET_MS) {
      comboStartRef.current = now;
    }
    lastClickRef.current = now;

    const comboDurationSec = comboStartRef.current !== null
      ? (now - comboStartRef.current) / 1000
      : 0;
    const level = getComboLevel(comboDurationSec);
    const mult = level ? level.multiplier : 1;
    setComboMultiplier(mult);

    // Schedule combo reset if user stops clicking
    if (comboResetTimerRef.current) clearTimeout(comboResetTimerRef.current);
    comboResetTimerRef.current = setTimeout(() => {
      if (comboStartRef.current !== null) {
        const finalDuration = (Date.now() - comboStartRef.current) / 1000;
        updateMaxComboDuration(finalDuration);
      }
      comboStartRef.current = null;
      setComboMultiplier(1);
    }, COMBO_RESET_MS);

    const earned = Math.ceil(state.coinsPerClick * mult);
    const clickColor = level ? level.color : "#ffffff";
    setClicks(prev => [...prev, { id: Date.now() + Math.random(), x, y, amount: earned, color: clickColor }]);
    handleClick(mult);
  };

  const handleAnimationComplete = (id: number) => {
    setClicks(prev => prev.filter(c => c.id !== id));
  };

  const ownedItems = Object.entries(state.upgrades)
    .filter(([, qty]) => (qty as number) > 0)
    .map(([id]) => id)
    .filter(id => id in ITEMS);

  const charImg = CHARACTERS[activeStage.characterKey];
  const bgImgPC = ENVIRONMENTS_PC[activeStage.bgKey];
  const bgImgMobile = ENVIRONMENTS_MOBILE[activeStage.bgKey];

  const CHARACTER_Y_OFFSETS: Record<string, number> = {
    recruit:   90,
    builder:   90,
    engineer:  90,
    validator: 90,
    explorer:  90,
    founder:   90,
  };
  const charYOffset = CHARACTER_Y_OFFSETS[activeStage.characterKey] ?? 0;

  const CHARACTER_SIZES: Record<string, { mobile: string; desktop: string }> = {
    recruit:   { mobile: "w-[220px] h-[220px]", desktop: "md:w-[340px] md:h-[340px]" },
    builder:   { mobile: "w-[230px] h-[230px]", desktop: "md:w-[350px] md:h-[350px]" },
    engineer:  { mobile: "w-[230px] h-[230px]", desktop: "md:w-[355px] md:h-[355px]" },
    validator: { mobile: "w-[240px] h-[240px]", desktop: "md:w-[360px] md:h-[360px]" },
    explorer:  { mobile: "w-[245px] h-[245px]", desktop: "md:w-[365px] md:h-[365px]" },
    founder:   { mobile: "w-[250px] h-[250px]", desktop: "md:w-[375px] md:h-[375px]" },
  };
  const charSize = CHARACTER_SIZES[activeStage.characterKey] ?? CHARACTER_SIZES.recruit;
  const charClassName = `${charSize.mobile} ${charSize.desktop} object-contain`;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none">
      {/* ENVIRONMENT BACKGROUND — true crossfade */}
      <AnimatePresence mode="sync">
        <motion.div
          key={activeStage.bgKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
        >
          {/* Mobile image */}
          <img
            src={bgImgMobile}
            alt={activeStage.title + " environment"}
            className="md:hidden w-full h-full object-cover"
            style={activeStage.bgTransformMobile ? { transform: activeStage.bgTransformMobile } : undefined}
            draggable={false}
          />
          {/* Desktop image */}
          <img
            src={bgImgPC}
            alt={activeStage.title + " environment"}
            className="hidden md:block w-full h-full object-cover"
            style={activeStage.bgTransformPC ? { transform: activeStage.bgTransformPC } : undefined}
            draggable={false}
          />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* RANK-UP FLASH */}
      <AnimatePresence>
        {rankFlash && (
          <motion.div
            key="rank-flash"
            className="absolute inset-0 z-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{ background: `radial-gradient(ellipse at center, ${stageData.glowColor}55 0%, transparent 70%)` }}
          />
        )}
      </AnimatePresence>

      {/* LEVEL / TITLE BADGE + XP BAR */}
      {(() => {
        const xp = getLevelXpInfo(state.totalCoinsEarned);
        return (
          <>
            {/* Mobile: full-width rectangular strip at top */}
            <div className="md:hidden absolute top-0 left-0 right-0 z-20 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-sm border-b border-white/10 px-4 pt-2 pb-1.5 flex flex-col gap-1.5 w-full">
                {/* XP row */}
                <div className="flex flex-row items-center gap-3">
                  <span className="text-xs font-bold tracking-[0.2em] uppercase whitespace-nowrap flex-shrink-0" style={{ color: activeStage.glowColor }}>
                    LVL {state.characterLevel}
                  </span>
                  <span className="text-[10px] text-white/50 uppercase font-mono whitespace-nowrap flex-shrink-0">{activeStage.title}</span>
                  <div className="flex-1 h-1.5 bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full"
                      style={{ background: activeStage.glowColor }}
                      animate={{ width: `${Math.min(xp.pct * 100, 100)}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-white/60 whitespace-nowrap flex-shrink-0">
                    {formatNumber(xp.currentXp)}/{formatNumber(xp.neededXp)}
                  </span>
                </div>
                {/* Energy row */}
                <div className="flex flex-row items-center gap-2">
                  <Zap className="w-3 h-3 flex-shrink-0" style={{ color: "#FFAE45" }} />
                  <div className="flex-1 h-1.5 bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full"
                      style={{ background: "#FFAE45" }}
                      animate={{ width: `${Math.min(((state.energy ?? 1000) / (state.maxEnergy ?? 1000)) * 100, 100)}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-[9px] font-mono whitespace-nowrap flex-shrink-0" style={{ color: "#FFAE45" }}>
                    {Math.floor(state.energy ?? 1000)}/{state.maxEnergy ?? 1000}
                  </span>
                </div>
                {/* Stats row — mobile */}
                <div className="flex flex-row items-center justify-center gap-4 pt-0.5">
                  <span className="text-[10px] font-mono text-white/70">
                    pts/click — <span className="text-white font-bold">{formatNumber(state.coinsPerClick)}</span>
                  </span>
                  <span className="text-white/30 text-[10px]">·</span>
                  <span className="text-[10px] font-mono text-white/70">
                    pts/sec — <span className="text-white font-bold">{formatNumber(Math.floor(state.coinsPerSecond))}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile: achievement popup */}
            <div className="md:hidden absolute left-3 right-3 z-30 pointer-events-none flex justify-end" style={{ top: "82px" }}>
              <AnimatePresence>
                {popupAch && (
                  <motion.div
                    key={"mob-" + popupAch.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md border border-red-500/60 rounded-lg px-3 py-2 shadow-lg">
                      <span className="text-xl leading-none">{popupAch.icon}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-400 leading-none">Achievement Unlocked</span>
                        <span className="text-[13px] font-bold text-white truncate leading-snug mt-0.5">{popupAch.name}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop: achievement popup — top-right of character area, below strip */}
            <div className="hidden md:block absolute right-4 z-30 pointer-events-none" style={{ top: "78px" }}>
              <AnimatePresence mode="wait">
                {popupAch && (
                  <motion.div
                    key={"desk-" + popupAch.id}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }}
                    exit={{ opacity: 0, y: -8, transition: { duration: 0.3, ease: "easeIn" } }}
                  >
                    <div className="flex items-center gap-2.5 bg-black/85 backdrop-blur-md border border-red-500/70 rounded-xl px-3.5 py-2.5 shadow-2xl min-w-[200px] max-w-[260px]">
                      <span className="text-2xl leading-none flex-shrink-0">{popupAch.icon}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] font-black uppercase tracking-[0.22em] text-red-400 leading-none">Achievement Unlocked</span>
                        <span className="text-sm font-bold text-white truncate leading-snug mt-1">{popupAch.name}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop: full-width strip (same style as mobile) */}
            <div className="hidden md:block absolute top-0 left-0 right-0 z-20 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-sm border-b border-white/10 px-5 pt-2 pb-1.5 flex flex-col gap-1.5 w-full">
                {/* XP row */}
                <div className="flex flex-row items-center gap-3">
                  <span className="text-xs font-bold tracking-[0.2em] uppercase whitespace-nowrap flex-shrink-0" style={{ color: activeStage.glowColor }}>
                    LVL {state.characterLevel}
                  </span>
                  <span className="text-[10px] text-white/50 uppercase font-mono whitespace-nowrap flex-shrink-0">{activeStage.title}</span>
                  <div className="flex-1 h-1.5 bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full"
                      style={{ background: activeStage.glowColor }}
                      animate={{ width: `${Math.min(xp.pct * 100, 100)}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-white/60 whitespace-nowrap flex-shrink-0">
                    {formatNumber(xp.currentXp)}/{formatNumber(xp.neededXp)}
                  </span>
                </div>
                {/* Energy row */}
                <div className="flex flex-row items-center gap-2">
                  <Zap className="w-3 h-3 flex-shrink-0" style={{ color: "#FFAE45" }} />
                  <div className="flex-1 h-1.5 bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full"
                      style={{ background: "#FFAE45" }}
                      animate={{ width: `${Math.min(((state.energy ?? 1000) / (state.maxEnergy ?? 1000)) * 100, 100)}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-[9px] font-mono whitespace-nowrap flex-shrink-0" style={{ color: "#FFAE45" }}>
                    {Math.floor(state.energy ?? 1000)}/{state.maxEnergy ?? 1000}
                  </span>
                </div>
                {/* Stats row — desktop */}
                <div className="flex flex-row items-center justify-center gap-6 pt-0.5">
                  <span className="text-[11px] font-mono text-white/70">
                    pts/click — <span className="text-white font-bold">{formatNumber(state.coinsPerClick)}</span>
                  </span>
                  <span className="text-white/30 text-[11px]">·</span>
                  <span className="text-[11px] font-mono text-white/70">
                    pts/sec — <span className="text-white font-bold">{formatNumber(Math.floor(state.coinsPerSecond))}</span>
                  </span>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* LEFT COLUMN: Smartphone, Laptop, GPU */}
      {/* Mobile spheres: w-12 (48px). Character 220-250px wide → left edge ~81-96px from center.
          Positions keep sphere right-edge safely left of character: row1=2%, row2=3%, row3=3% */}
      {ownedItems.includes("smartphone") && (
        <motion.div
          className="absolute z-10 pointer-events-none flex items-center justify-center rounded-full w-[64px] h-[64px] md:w-[118px] md:h-[118px]"
          style={{
            top: "28%", left: isMobile ? "12%" : "20%",
            background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.26) 60%, rgba(255,255,255,0.18) 100%)",
            border: "1px solid rgba(255,255,255,0.45)",
            boxShadow: `0 4px 24px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 16px 2px ${activeStage.glowColor}30`,
            backdropFilter: "blur(2px)",
          }}
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          <img src={ITEMS.smartphone} alt="Smartphone" className="w-[52px] h-[52px] md:w-[100px] md:h-[100px] object-contain" style={{ filter: `drop-shadow(0 0 8px ${activeStage.glowColor})` }} />
        </motion.div>
      )}
      {ownedItems.includes("laptop") && (
        <motion.div
          className="absolute z-10 pointer-events-none flex items-center justify-center rounded-full w-[64px] h-[64px] md:w-[118px] md:h-[118px]"
          style={{
            top: "52%", left: isMobile ? "calc(12% - 20px)" : "calc(8% - 20px)",
            background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.26) 60%, rgba(255,255,255,0.18) 100%)",
            border: "1px solid rgba(255,255,255,0.45)",
            boxShadow: `0 4px 24px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 16px 2px ${activeStage.glowColor}30`,
            backdropFilter: "blur(2px)",
          }}
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.4 }}
        >
          <img src={ITEMS.laptop} alt="Laptop" className="w-[52px] h-[52px] md:w-[100px] md:h-[100px] object-contain" style={{ filter: `drop-shadow(0 0 8px ${activeStage.glowColor})`, transform: isMobile ? undefined : "translateX(-5px) translateY(3px)" }} />
        </motion.div>
      )}
      {ownedItems.includes("gpu") && (
        <motion.div
          className="absolute z-10 pointer-events-none flex items-center justify-center rounded-full w-[64px] h-[64px] md:w-[118px] md:h-[118px]"
          style={{
            top: "73%", left: isMobile ? "12%" : "16%",
            background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.26) 60%, rgba(255,255,255,0.18) 100%)",
            border: "1px solid rgba(255,255,255,0.45)",
            boxShadow: `0 4px 24px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 16px 2px ${activeStage.glowColor}30`,
            backdropFilter: "blur(2px)",
          }}
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.8 }}
        >
          <img src={ITEMS.gpu} alt="GPU" className="w-[52px] h-[52px] md:w-[100px] md:h-[100px] object-contain" style={{ filter: `drop-shadow(0 0 8px ${activeStage.glowColor})` }} />
        </motion.div>
      )}

      {/* RIGHT COLUMN: AI Agent, Validator Node, Data Center */}
      {ownedItems.includes("ai_agent") && (
        <motion.div
          className="absolute z-10 pointer-events-none flex items-center justify-center rounded-full w-[64px] h-[64px] md:w-[118px] md:h-[118px]"
          style={{
            top: "28%", right: isMobile ? "12%" : "20%",
            background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.26) 60%, rgba(255,255,255,0.18) 100%)",
            border: "1px solid rgba(255,255,255,0.45)",
            boxShadow: `0 4px 24px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 16px 2px ${activeStage.glowColor}30`,
            backdropFilter: "blur(2px)",
          }}
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut", delay: 0.2 }}
        >
          <img src={ITEMS.ai_agent} alt="AI Agent" className="w-[52px] h-[52px] md:w-[100px] md:h-[100px] object-contain" style={{ filter: `drop-shadow(0 0 8px ${activeStage.glowColor})`, transform: isMobile ? "translateY(4px)" : "translateY(14px)" }} />
        </motion.div>
      )}
      {ownedItems.includes("validator_node") && (
        <motion.div
          className="absolute z-10 pointer-events-none flex items-center justify-center rounded-full w-[64px] h-[64px] md:w-[118px] md:h-[118px]"
          style={{
            top: "52%", right: isMobile ? "calc(12% - 20px)" : "calc(10% - 20px)",
            background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.26) 60%, rgba(255,255,255,0.18) 100%)",
            border: "1px solid rgba(255,255,255,0.45)",
            boxShadow: `0 4px 24px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 16px 2px ${activeStage.glowColor}30`,
            backdropFilter: "blur(2px)",
          }}
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut", delay: 0.6 }}
        >
          <img src={ITEMS.validator_node} alt="Validator Node" className="w-[52px] h-[52px] md:w-[115px] md:h-[115px] object-contain" style={{ filter: `drop-shadow(0 0 8px ${activeStage.glowColor})` }} />
        </motion.div>
      )}
      {ownedItems.includes("data_center") && (
        <motion.div
          className="absolute z-10 pointer-events-none flex items-center justify-center rounded-full w-[64px] h-[64px] md:w-[118px] md:h-[118px]"
          style={{
            top: "73%", right: isMobile ? "12%" : "18%",
            background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.26) 60%, rgba(255,255,255,0.18) 100%)",
            border: "1px solid rgba(255,255,255,0.45)",
            boxShadow: `0 4px 24px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 16px 2px ${activeStage.glowColor}30`,
            backdropFilter: "blur(2px)",
          }}
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1 }}
        >
          <img src={ITEMS.data_center} alt="Data Center" className="w-[52px] h-[52px] md:w-[100px] md:h-[100px] object-contain" style={{ filter: `drop-shadow(0 0 8px ${activeStage.glowColor})` }} />
        </motion.div>
      )}

      {/* CLICKABLE CHARACTER IMAGE */}
      <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ paddingTop: charYOffset }}>
        <motion.div
          className={`relative touch-manipulation ${noEnergy ? "cursor-not-allowed" : "cursor-pointer"}`}
          onClick={onInteraction}
          onTouchStart={onInteraction}
          data-testid="character-click-area"
          style={{
            filter: noEnergy
              ? "drop-shadow(0 0 8px #555) grayscale(0.6) brightness(0.6)"
              : `drop-shadow(0 0 24px ${activeStage.glowColor}60)`,
            transition: "filter 0.3s ease",
          }}
          whileTap={noEnergy ? {} : { scale: 1.05 }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={activeStage.characterKey}
              src={charImg}
              alt={activeStage.title + " Monanimal"}
              className={charClassName}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              whileTap={{ scale: 1.05 }}
              transition={{ duration: 0.5, ease: "backOut" }}
              draggable={false}
            />
          </AnimatePresence>

          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-40 h-8 rounded-full blur-xl pointer-events-none"
            style={{ background: activeStage.glowColor, opacity: 0.3 }}
          />
        </motion.div>
      </div>

      {/* COMBO MULTIPLIER INDICATOR — above character */}
      <div className="absolute inset-0 z-[25] pointer-events-none flex items-center justify-center">
        <AnimatePresence>
          {currentComboLevel && (
            <motion.div
              key={currentComboLevel.label}
              className="absolute"
              style={{ top: isMobile ? "calc(22% - 25px)" : "calc(18% - 25px)" }}
              initial={{ opacity: 0, scale: 0.77, y: -8 }}
              animate={{ opacity: 1, scale: 1.1, y: 0 }}
              exit={{ opacity: 0, scale: 0.77, y: -8 }}
              transition={{ duration: 0.25, ease: "backOut" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-[28px] md:text-[30px] tracking-tight leading-none"
                  style={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontWeight: 800,
                    color: currentComboLevel.color,
                    WebkitTextStroke: "2px #000",
                    paintOrder: "stroke fill",
                    filter: `drop-shadow(0 0 8px ${currentComboLevel.color})`,
                  }}
                >
                  {currentComboLevel.label}
                </span>
                <span
                  className="text-[15px] md:text-[17px] font-bold uppercase tracking-widest text-white leading-none"
                  style={{
                    WebkitTextStroke: "1.5px #000",
                    paintOrder: "stroke fill",
                  }}
                >
                  COMBO
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FLOATING +N CLICK NUMBERS */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        <AnimatePresence>
          {clicks.map(click => (
            <motion.div
              key={click.id}
              initial={{ opacity: 1, y: click.y, scale: 0.9 }}
              animate={{ opacity: 0, y: click.y - 80, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              onAnimationComplete={() => handleAnimationComplete(click.id)}
              className="absolute font-black text-2xl pointer-events-none"
              style={{
                top: 0,
                left: click.x,
                transform: "translateX(-50%)",
                color: click.color,
                textShadow: click.color === "#ffffff"
                  ? "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
                  : `0 0 10px ${click.color}, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000`,
              }}
            >
              +{formatNumber(click.amount)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* EVOLUTION TIMELINE (bottom strip) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-1 pb-2 pointer-events-none">
        {[
          { key: "recruit",  label: "Recruit",   min: 1 },
          { key: "builder",  label: "Builder",   min: 10 },
          { key: "engineer", label: "Engineer",  min: 25 },
          { key: "validator",label: "Validator", min: 50 },
          { key: "explorer", label: "Explorer",  min: 75 },
          { key: "founder",  label: "Founder",   min: 100 },
        ].map((s) => {
          const isActive = stageData.characterKey === s.key;
          const isUnlocked = state.characterLevel >= s.min;
          return (
            <div key={s.key} className="flex flex-col items-center gap-0.5">
              <img
                src={CHARACTERS[s.key as keyof typeof CHARACTERS]}
                alt={s.label}
                className="w-[27px] h-[27px] md:w-9 md:h-9 object-contain rounded-full"
                style={{
                  filter: isActive
                    ? `drop-shadow(0 0 6px ${stageData.glowColor}) brightness(1.2)`
                    : isUnlocked ? "brightness(0.9)" : "grayscale(1) brightness(0.4)",
                  border: isActive ? `2px solid ${stageData.glowColor}` : "2px solid transparent",
                  borderRadius: "50%",
                }}
              />
              <div
                className="text-[7px] font-bold tracking-widest uppercase hidden md:block"
                style={{ color: isActive ? stageData.glowColor : isUnlocked ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
