import React from "react";
import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { Text, useTheme, XStack } from "tamagui";

import GridSuggestions from "~/components/GridSuggestions";
import { ScreenView } from "~/components/ui";
import { BaseScreenView } from "~/components/Views";

const RecommendationsPage = () => {
  const theme = useTheme();

  const handleBack = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <ScreenView scrollable>
      <GridSuggestions />
    </ScreenView>
  );
};

export default RecommendationsPage;
