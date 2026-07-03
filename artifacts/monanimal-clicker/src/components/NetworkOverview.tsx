import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { getCharacterStage, formatNumber } from "@/lib/utils";

const HISTORY_SIZE = 30;

interface Metric {
  label: string;
  value: string;
  sub: string;
  color: string;
  history: number[];
}

function MiniChart({ history, color }: { history: number[]; color: string }) {
  const w = 100;
  const h = 36;
  const pad = 2;

  if (history.length < 2) return <div className="w-full h-9" />;

  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;

  const points = history.map((v, i) => {
    const x = pad + (i / (history.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const areaPoints = `${pad},${h} ${polyline} ${w - pad},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#grad-${color.replace("#", "")})`}
      />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1].split(",")[0]}
        cy={points[points.length - 1].split(",")[1]}
        r="2"
        fill={color}
      />
    </svg>
  );
}

export default function NetworkOverview() {
  const { state } = useGameState();
  const stage = getCharacterStage(state.characterLevel);

  const clicksHistoryRef = useRef<number[]>([]);
  const ppcHistoryRef = useRef<number[]>([]);
  const ppsHistoryRef = useRef<number[]>([]);
  const [, forceRender] = useState(0);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const push = (arr: number[], val: number) => {
        arr.push(val);
        if (arr.length > HISTORY_SIZE) arr.shift();
      };
      push(clicksHistoryRef.current, state.totalClicks);
      push(ppcHistoryRef.current, state.coinsPerClick);
      push(ppsHistoryRef.current, state.coinsPerSecond);
      forceRender(n => n + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [state.totalClicks, state.coinsPerClick, state.coinsPerSecond]);

  const rankLabel = stage.title.toUpperCase();

  const metrics: Metric[] = [
    {
      label: "ALL TIME CLICKS",
      value: formatNumber(state.totalClicks),
      sub: "Total clicks",
      color: "#85E6FF",
      history: [...clicksHistoryRef.current],
    },
    {
      label: "POINTS PER CLICK",
      value: formatNumber(state.coinsPerClick),
      sub: "Per click",
      color: "#6E54FF",
      history: [...ppcHistoryRef.current],
    },
    {
      label: "POINTS PER SECOND",
      value: formatNumber(state.coinsPerSecond),
      sub: "Passive income",
      color: "#FF8EE4",
      history: [...ppsHistoryRef.current],
    },
  ];

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="hidden lg:flex flex-col w-52 xl:w-60 flex-shrink-0 bg-black/40 backdrop-blur-md border-r border-white/5 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#6E54FF] animate-pulse" />
          <span className="text-[10px] font-black tracking-[0.25em] uppercase text-white/50">
            Network Overview
          </span>
        </div>
      </div>

      {/* Rank card */}
      <div className="mx-3 mt-3 mb-1 rounded-lg border border-white/10 bg-white/5 p-3 flex flex-col gap-1">
        <span className="text-[9px] tracking-[0.2em] uppercase text-white/40 font-bold">Current Rank</span>
        <motion.span
          key={rankLabel}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-black tracking-widest"
          style={{ color: stage.glowColor, textShadow: `0 0 12px ${stage.glowColor}60` }}
        >
          {rankLabel}
        </motion.span>
      </div>

      {/* Reset dialog */}
      <AnimatePresence>
        {showReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowReset(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#0E091C] border border-white/10 rounded-2xl p-6 max-w-xs w-full mx-4 flex flex-col items-center gap-5 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <span className="text-4xl">💀</span>
              <p className="text-white text-center text-sm font-semibold leading-relaxed">
                Too strong? Reset the progress and start the adventure again!
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowReset(false)}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem("monanimal-clicker-save-v2");
                    window.location.reload();
                  }}
                  className="flex-1 py-2 rounded-xl text-sm font-black text-white transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #6E54FF, #FF8EE4)" }}
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metric cards */}
      <div className="flex flex-col gap-2 px-3 py-2 flex-1">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-white/8 bg-white/[0.03] p-3 flex flex-col gap-1"
            style={{ borderColor: `${m.color}20` }}
          >
            <div className="flex items-end justify-between">
              <span className="text-[9px] tracking-[0.18em] uppercase font-bold text-white/40">{m.label}</span>
              <motion.span
                key={m.value}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="text-base font-black font-mono leading-none"
                style={{ color: m.color, textShadow: `0 0 8px ${m.color}50` }}
              >
                {m.value}
              </motion.span>
            </div>
            <MiniChart history={m.history} color={m.color} />
            <span className="text-[9px] text-white/25 font-mono">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* Reset button */}
      <div className="px-3 pb-4 mt-auto">
        <button
          onClick={() => setShowReset(true)}
          className="w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200 hover:brightness-110"
          style={{ background: "#E60000", color: "#fff" }}
        >
          Reset Progress
        </button>
      </div>
    </motion.div>
  );
}
