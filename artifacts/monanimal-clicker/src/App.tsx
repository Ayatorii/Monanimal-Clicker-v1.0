import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Game from "@/pages/Game";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi";

const rainbowKitTheme = darkTheme({
  accentColor: "hsl(252, 100%, 71%)",
  accentColorForeground: "white",
  borderRadius: "medium",
  overlayBlur: "small",
});
rainbowKitTheme.colors.connectButtonBackground = "hsl(240, 10%, 12%)";
rainbowKitTheme.colors.connectButtonInnerBackground = "hsl(240, 10%, 12%)";
rainbowKitTheme.colors.connectButtonText = "white";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Game} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowKitTheme} locale="en">
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
