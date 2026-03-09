import { Contract } from "ethers";
import { GovernanceToken } from "../abis/GovernanceToken";

export const delegateOther = async (signer, addressOfThatUser) => {};

export const delegateSelf = async (signer) => {
  try {
    const GOVERNANCE_TOKEN_ADDRESS = import.meta.env
      .VITE_GOVERNANCETOKEN_ADDRESS;

    const governanceContract = new Contract(
      GOVERNANCE_TOKEN_ADDRESS,
      GovernanceToken,
      signer,
    );

    const address = await signer.getAddress();

    const tx = await governanceContract.delegate(address);

    await tx.wait();

    console.log("Delegation successful:", tx.hash);
    return {
        isSuccess: true
    }
  } catch (error) {
    console.error("Delegation failed:", error);
    throw error;
  }
};
