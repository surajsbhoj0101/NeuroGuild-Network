import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useAccount } from "wagmi";
import { emptyTokenBalances, getTokenBalances } from "../utils/getTokenBalances";

const TokenBalanceContext = createContext(null);

export const TokenBalanceProvider = ({ children }) => {
    const { isAuthentication } = useAuth();
    const { isConnected, address } = useAccount();
    const [balances, setBalances] = useState(emptyTokenBalances);

    useEffect(() => {
        let cancelled = false;

        const fetchBalances = async () => {
            if (!isConnected || !address) {
                if (!cancelled) setBalances(emptyTokenBalances);
                return;
            }

            const nextBalances = await getTokenBalances(address);
            if (!cancelled) setBalances(nextBalances);
        };

        if (!isAuthentication) return;

        fetchBalances();

        return () => {
            cancelled = true;
        };
    }, [isAuthentication, isConnected, address]);

    // No need for useMemo here – balances is stable until changed.
    return (
        <TokenBalanceContext.Provider value={balances}>
            {children}
        </TokenBalanceContext.Provider>
    );
};

// Custom hook for easy context consumption
export const useTokenBalance = () => {
    const context = useContext(TokenBalanceContext);
    if (context === null) {
        throw new Error("useTokenBalance must be used within a TokenBalanceProvider");
    }
    return context;
};