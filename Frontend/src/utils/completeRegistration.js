import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

/**
 * Complete pending user registration
 * Call this before executing first meaningful user action
 * (posting job, applying to job, minting skill, etc.)
 */
export const completePendingRegistration = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/complete-registration`,
      {},
      { withCredentials: true }
    );

    if (response.data?.success) {
      console.log("Registration completed:", response.data.message);
      return { success: true, user: response.data.user };
    }
  } catch (error) {
    // If user is not pending or already registered, this is not an error
    if (error.response?.status === 200) {
      return { success: true };
    }

    console.error("Error completing registration:", error.message);
    throw new Error(
      error.response?.data?.message || "Failed to complete registration"
    );
  }
};

/**
 * Wrapper to ensure pending registration is completed before action
 * @param {Function} action - The action to perform after registration is complete
 * @param {Object} authState - Current auth state {isPending, isAuthentication}
 * @returns {Promise} Result of the action
 */
export const withRegistrationCheck = async (action, authState) => {
  // If user is in pending state, complete registration first
  if (authState?.isPending) {
    try {
      await completePendingRegistration();
      // After registration, re-authenticate to update auth state
      // The parent component should handle this
    } catch (error) {
      throw error;
    }
  }

  // Execute the action
  return action();
};
