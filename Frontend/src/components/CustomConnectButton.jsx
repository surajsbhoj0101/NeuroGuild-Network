import { ConnectButton } from "@rainbow-me/rainbowkit";
const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
const robotoStyle = { fontFamily: 'Roboto, sans-serif' };
function CustomConnectButton() {
    return (
        <ConnectButton.Custom>
            {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
            }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                    <div
                        {...(!ready && {
                            "aria-hidden": true,
                            style: {
                                opacity: 0,
                                pointerEvents: "none",
                                userSelect: "none",
                            },
                        })}
                    >
                        {(() => {
                            if (!connected) {
                                // Before connecting
                                return (
                                    <button
                                        onClick={openConnectModal}
                                        style={orbitronStyle}
                                        className="px-4 py-2 bg-gradient-to-r font-semibold  from-[#1be4e0] to-blue-500 rounded-lg text-white tracking-widest hover:shadow-lg transition"
                                    >
                                        Connect Wallet
                                    </button>
                                );
                            }

                            if (chain.unsupported) {
                                // If wrong network
                                return (
                                    <button
                                        onClick={openChainModal}
                                        className="px-4 py-2 bg-red-600 rounded-lg text-white font-medium hover:bg-red-700 transition"
                                    >
                                        Wrong Network
                                    </button>
                                );
                            }


                            return (
                                <div className="flex items-center gap-3">
                                    {/* Network Button */}
                                    <button
                                    style={orbitronStyle}
                                        onClick={openChainModal}
                                        className="px-3 py-2 font-semibold tracking-wider
                                        bg-gradient-to-r from-[#1be4e0] to-[#14b8b5] 
                                        dark:from-[#0a184b] dark:to-[#10215f]
                                        hover:from-[#0ce4e0] hover:to-[#0aa0a0]
                                        dark:hover:from-[#0f245f] dark:hover:to-[#1b3d91]
                                        text-white rounded-lg text-sm 
                                        shadow-md dark:hover:shadow-[0_0_12px_3px_rgba(37,99,235,0.5)] hover:shadow-[0_0_10px_2px_rgba(27,228,224,0.6)]
                                        transition-all duration-300"
                                    >
                                        {chain.name}
                                    </button>

                                    {/* Account Button */}
                                    <button
                                        style={orbitronStyle}
                                        onClick={openAccountModal}
                                        className="px-3 py-2 
                                                bg-gradient-to-r from-[#2563eb] to-[#1e40af] tracking-wider
                                                dark:from-[#0a184b] dark:to-[#10215f]
                                                hover:from-[#1d4ed8] hover:to-[#1e3a8a]
                                                dark:hover:from-[#152d6a] dark:hover:to-[#1b3d91]
                                                text-white rounded-lg text-sm font-semibold
                                                shadow-md hover:shadow-[0_0_12px_3px_rgba(37,99,235,0.5)]
                                                transition-all duration-300"
                                    >
                                        {account.displayName}
                                        {account.displayBalance ? ` (${account.displayBalance})` : ""}
                                    </button>
                                </div>

                            );
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
}

export default CustomConnectButton;
