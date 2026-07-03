import { ConnectButton } from "@rainbow-me/rainbowkit";

interface WalletButtonProps {
  className?: string;
  fullWidth?: boolean;
}

export default function WalletButton({ className = "", fullWidth = false }: WalletButtonProps) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        const baseClass = `flex items-center justify-center rounded-md font-bold text-sm whitespace-nowrap px-4 py-2.5 leading-none transition-opacity hover:opacity-90 ${
          fullWidth ? "w-full" : ""
        } ${className}`;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className={`${baseClass} bg-primary text-primary-foreground`}
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className={`${baseClass} bg-destructive text-destructive-foreground`}
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                <button
                  onClick={openAccountModal}
                  type="button"
                  className={`${baseClass} bg-primary text-primary-foreground`}
                >
                  {account.displayName}
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
