import React from "react";

import { Spinner } from "./Spinner";
import { View } from "./Views";

export const LoadingIndicatorOverlay = () => {
  return (
    <View
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="$backgroundTransparent"
      alignItems="center"
      justifyContent="center"
      zIndex={999999}
    >
      <Spinner size="large" color="$gray8" />
    </View>
  );
};
