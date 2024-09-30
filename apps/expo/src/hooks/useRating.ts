import { useCallback } from "react";
import { MMKV } from "react-native-mmkv";
import * as StoreReview from "expo-store-review";

const storage = new MMKV();

const LAST_REVIEW_REQUEST_KEY = "last_review_request";
const REVIEW_REQUESTED_COUNT_KEY = "review_requested_count";

const useStoreReview = () => {
  const promptForReview = useCallback(async () => {
    try {
      const lastRequestTime = storage.getNumber(LAST_REVIEW_REQUEST_KEY) ?? 0;
      const requestCount = storage.getNumber(REVIEW_REQUESTED_COUNT_KEY) ?? 0;
      const currentTime = Date.now();

      // Check if enough time has passed since the last request (e.g., 30 days)
      if (currentTime - lastRequestTime < 30 * 24 * 60 * 60 * 1000) {
        return false;
      }

      // Check if we've already requested too many times (e.g., max 3 times)
      if (requestCount >= 3) {
        return false;
      }

      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
        storage.set(LAST_REVIEW_REQUEST_KEY, currentTime);
        storage.set(REVIEW_REQUESTED_COUNT_KEY, requestCount + 1);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error prompting for review:", error);
      return false;
    }
  }, []);

  return { promptForReview };
};

export default useStoreReview;
