import React from "react";
import { Spinner, View } from "tamagui";

const LoadingIndicatorOverlay = () => {
  return (
    <View
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor="black"
    >
      <Spinner size="large" color="$gray8" />
    </View>
  );
};

export default LoadingIndicatorOverlay;
