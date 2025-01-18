import React from "react";

import GridSuggestions from "~/components/GridSuggestions";
import { ScreenView } from "~/components/ui";

const RecommendationsPage = () => {
  return (
    <ScreenView scrollable>
      <GridSuggestions />
    </ScreenView>
  );
};

export default RecommendationsPage;
