import { BrowserProvider, Contract, formatUnits } from "ethers";
import { GovernanceToken } from "../abis/GovernanceToken";

const erc20BalanceAbi = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const defaultBalances = {
  usdc: "--",
  governance: "--",
};

const formatTokenBalance = (value, decimals) => {
  const formatted = Number(formatUnits(value, decimals));
  if (!Number.isFinite(formatted)) return "--";
  if (formatted === 0) return "0";
  if (formatted < 0.01) return "<0.01";
  if (formatted >= 1000) {
    return formatted.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }
  return formatted.toLocaleString(undefined, {
    minimumFractionDigits: formatted < 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
};

export const getTokenBalances = async (address) => {
  const USDC_ADDRESS =
    import.meta.env.VITE_USDC_ADDRESS || import.meta.env.VITE_ERC20USDC_ADDRESS;
  const GOVERNANCE_TOKEN_ADDRESS = import.meta.env.VITE_GOVERNANCETOKEN_ADDRESS;

  if (
    !address ||
    !USDC_ADDRESS ||
    !GOVERNANCE_TOKEN_ADDRESS ||
    typeof window === "undefined" ||
    !window.ethereum
  ) {
    return defaultBalances;
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const usdcContract = new Contract(USDC_ADDRESS, erc20BalanceAbi, provider);
    const governanceContract = new Contract(
      GOVERNANCE_TOKEN_ADDRESS,
      GovernanceToken,
      provider
    );

    const [
      usdcBalance,
      usdcDecimals,
      governanceBalance,
      governanceDecimals,
    ] = await Promise.all([
      usdcContract.balanceOf(address),
      usdcContract.decimals(),
      governanceContract.balanceOf(address),
      governanceContract.decimals(),
    ]);

    return {
      usdc: formatTokenBalance(usdcBalance, usdcDecimals),
      governance: formatTokenBalance(governanceBalance, governanceDecimals),
    };
  } catch (error) {
    console.error("Failed to fetch token balances:", error);
    return defaultBalances;
  }
};

export const emptyTokenBalances = defaultBalances;
