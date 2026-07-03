import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { BUILDINGS, POWER_UPGRADES } from "@/lib/gameData";
import { formatNumber, cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ITEMS } from "@/assets/index";
import { Server, Zap, X } from "lucide-react";

const MAX_UPGRADE_LEVEL = 100;

interface UpgradeItem {
  id: string;
  name: string;
  icon?: string;
  baseCost: number;
  cps?: number;
  cpc?: number;
}

function UpgradeCard({
  item,
  owned,
  isMaxed,
  cost,
  canAfford,
  onBuy,
  statValue,
  statLabel,
}: {
  item: UpgradeItem;
  owned: number;
  isMaxed: boolean;
  cost: number;
  canAfford: boolean;
  onBuy: () => void;
  statValue: number;
  statLabel: string;
}) {
  return (
    <Card
      className={cn(
        "transition-all hover-elevate",
        isMaxed
          ? "opacity-50 cursor-not-allowed border-primary/30"
          : canAfford
          ? "cursor-pointer hover:border-primary/50"
          : "cursor-pointer opacity-70 grayscale-[0.3]"
      )}
      onClick={() => !isMaxed && canAfford && onBuy()}
    >
      <CardContent className="p-2 md:p-3 flex items-center gap-2 md:gap-3">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-muted/50 rounded-md border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
          {item.id in ITEMS ? (
            <img
              src={ITEMS[item.id as keyof typeof ITEMS]}
              alt={item.name}
              className="w-full h-full object-contain object-center"
              style={item.id === "ai_agent" ? { transform: "translateY(12%) scale(1.15)" } : undefined}
            />
          ) : (
            <span className="text-xl md:text-2xl">{item.icon}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm md:text-base font-bold truncate pr-2">{item.name}</h4>
            {isMaxed ? (
              <Badge className="font-mono text-[10px] md:text-xs bg-primary/20 text-primary border border-primary/40">MAX</Badge>
            ) : (
              <Badge variant={owned > 0 ? "default" : "outline"} className="font-mono text-[10px] md:text-xs">{owned}</Badge>
            )}
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground font-mono mt-0.5 md:mt-1">
            +{formatNumber(statValue)} {statLabel}
          </p>
          <p className={cn(
            "text-xs md:text-sm font-bold font-mono mt-0.5 md:mt-1",
            isMaxed ? "text-primary/50" : canAfford ? "text-accent" : "text-destructive"
          )}>
            {isMaxed ? "Max level reached" : `Cost: ${formatNumber(cost)}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UpgradeShop() {
  const { state, buyBuilding, buyPower, calculateUpgradeCost } = useGameState();
  const [openSheet, setOpenSheet] = useState<"buildings" | "power" | null>(null);

  const totalBuildings = BUILDINGS.reduce((s, b) => s + (state.upgrades[b.id] || 0), 0);
  const totalPower = POWER_UPGRADES.reduce((s, p) => s + (state.upgrades[p.id] || 0), 0);

  const sheetTitle = openSheet === "buildings" ? "Gadget" : "Click Power";
  const sheetIcon = openSheet === "buildings"
    ? <Server className="h-4 w-4 text-primary" />
    : <Zap className="h-4 w-4 text-accent" />;

  const renderCards = (type: "buildings" | "power") => {
    const items = type === "buildings" ? BUILDINGS : POWER_UPGRADES;
    const buyFn = type === "buildings" ? buyBuilding : buyPower;
    return items.map(item => {
      const owned = state.upgrades[item.id] || 0;
      const isMaxed = owned >= MAX_UPGRADE_LEVEL;
      const cost = calculateUpgradeCost(item.baseCost, owned);
      const canAfford = !isMaxed && state.coins >= cost;
      return (
        <UpgradeCard
          key={item.id}
          item={item}
          owned={owned}
          isMaxed={isMaxed}
          cost={cost}
          canAfford={canAfford}
          onBuy={() => buyFn(item.id)}
          statValue={type === "buildings" ? (item as any).cps : (item as any).cpc}
          statLabel={type === "buildings" ? "PPS" : "PPC"}
        />
      );
    });
  };

  return (
    <>
      {/* ── MOBILE: compact tab strip ── */}
      <div className="md:hidden h-full bg-card border-t border-border flex">
        {/* Infrastructure tab */}
        <button
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative",
            openSheet === "buildings" ? "bg-primary/10" : "hover:bg-muted/50"
          )}
          onClick={() => setOpenSheet(prev => prev === "buildings" ? null : "buildings")}
        >
          {openSheet === "buildings" && (
            <motion.div layoutId="tab-indicator-buildings" className="absolute top-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
          )}
          <Server className={cn("h-5 w-5", openSheet === "buildings" ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-[10px] font-bold uppercase tracking-wider", openSheet === "buildings" ? "text-primary" : "text-muted-foreground")}>
            Gadget
          </span>
        </button>

        <div className="w-px bg-border my-3" />

        {/* Click Power tab */}
        <button
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative",
            openSheet === "power" ? "bg-accent/10" : "hover:bg-muted/50"
          )}
          onClick={() => setOpenSheet(prev => prev === "power" ? null : "power")}
        >
          {openSheet === "power" && (
            <motion.div layoutId="tab-indicator-power" className="absolute top-0 left-2 right-2 h-0.5 bg-accent rounded-full" />
          )}
          <Zap className={cn("h-5 w-5", openSheet === "power" ? "text-accent" : "text-muted-foreground")} />
          <span className={cn("text-[10px] font-bold uppercase tracking-wider", openSheet === "power" ? "text-accent" : "text-muted-foreground")}>
            Click Power
          </span>
        </button>
      </div>

      {/* ── MOBILE: Bottom sheet overlay ── */}
      <AnimatePresence>
        {openSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenSheet(null)}
            />

            {/* Sheet */}
            <motion.div
              className="fixed bottom-16 left-0 right-0 z-50 md:hidden bg-card rounded-t-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: "72vh" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              {/* Sheet header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  {sheetIcon}
                  <span className="text-sm font-black uppercase tracking-widest text-foreground">
                    {sheetTitle}
                  </span>
                </div>
                <button
                  onClick={() => setOpenSheet(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Sheet cards */}
              <ScrollArea className="flex-1 px-4 py-3">
                <div className="flex flex-col gap-2 pb-4">
                  {renderCards(openSheet)}
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── DESKTOP: side panel with tabs (unchanged) ── */}
      <div className="hidden md:flex flex-col h-full bg-card border-l border-border w-full md:w-80 lg:w-96">
        <div className="p-3 md:p-4 border-b border-border flex items-center justify-center">
          <h2 className="text-base md:text-xl font-bold font-mono tracking-tight uppercase text-primary">Upgrades</h2>
        </div>

        <Tabs defaultValue="buildings" className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 p-1 m-1.5 md:p-2 md:m-2 bg-muted rounded-md h-auto">
            <TabsTrigger value="buildings" className="py-1.5 md:py-2 text-xs md:text-sm font-bold uppercase tracking-wider">Gadget</TabsTrigger>
            <TabsTrigger value="power" className="py-1.5 md:py-2 text-xs md:text-sm font-bold uppercase tracking-wider">Click Power</TabsTrigger>
          </TabsList>

          <TabsContent value="buildings" className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col">
            <ScrollArea className="flex-1 px-3 md:px-4">
              <div className="flex flex-col gap-2 md:gap-3 pb-4">
                {renderCards("buildings")}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="power" className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col">
            <ScrollArea className="flex-1 px-3 md:px-4">
              <div className="flex flex-col gap-2 md:gap-3 pb-4">
                {renderCards("power")}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
