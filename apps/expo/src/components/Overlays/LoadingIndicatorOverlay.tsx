import React from "react";
import { Spinner } from "tamagui";

import { BaseScreenView } from "../Views";

const LoadingIndicatorOverlay = () => {
  return (
    <BaseScreenView alignItems="center" justifyContent="center">
      <Spinner size="large" color="$gray8" />
    </BaseScreenView>
  );
};

export default LoadingIndicatorOverlay;
