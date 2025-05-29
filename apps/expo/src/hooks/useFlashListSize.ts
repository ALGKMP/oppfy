import { Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getToken } from "tamagui";

interface UseFlashListSizeOptions {
    /** Expected number of items in the list */
    estimatedItemCount?: number;
    /** Average height of each item in pixels */
    averageItemHeight?: number;
    /** Height of search input/header components */
    headerHeight?: number;
    /** Height of section headers */
    sectionHeaderHeight?: number;
    /** Number of section headers */
    sectionHeaderCount?: number;
    /** Additional bottom padding */
    extraBottomPadding?: number;
}

export const useFlashListSize = (options: UseFlashListSizeOptions = {}) => {
    const insets = useSafeAreaInsets();

    const {
        estimatedItemCount = 12,
        averageItemHeight = 85,
        headerHeight = 50,
        sectionHeaderHeight = 60,
        sectionHeaderCount = 2,
        extraBottomPadding = 50,
    } = options;

    // Calculate more accurate list size based on screen dimensions and content
    const screenDimensions = Dimensions.get("window");
    const padding = getToken("$4", "space") as number;
    const availableWidth = screenDimensions.width - padding * 2;

    // Estimate height based on typical content:
    // - Search input/header: configurable
    // - Header margin: ~12px  
    // - Section headers: configurable count × height
    // - Items: estimated count × average height
    // - Bottom padding and safe area: configurable + insets
    const estimatedContentHeight =
        headerHeight +
        12 +
        sectionHeaderCount * sectionHeaderHeight +
        estimatedItemCount * averageItemHeight +
        extraBottomPadding +
        insets.bottom;

    const estimatedListSize = {
        height: Math.min(estimatedContentHeight, screenDimensions.height),
        width: availableWidth,
    };

    return {
        estimatedListSize,
        screenDimensions,
        availableWidth,
        estimatedContentHeight,
    };
}; 