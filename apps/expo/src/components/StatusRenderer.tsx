import React from "react";

interface StatusRendererProps<T> {
  data: T | null | undefined;
  error?: boolean;
  loadingComponent: React.ReactNode;
  errorComponent?: React.ReactNode;
  successComponent: (data: T) => React.ReactElement;
}

function StatusRenderer<T>(
  props: StatusRendererProps<T>,
): React.ReactElement | null {
  const { data, error, loadingComponent, errorComponent, successComponent } =
    props;

  if (error) {
    return <>{errorComponent}</>;
  }

  if (data === null || data === undefined) {
    return <>{loadingComponent}</>;
  }

  return <>{successComponent(data)}</>;
}

export default StatusRenderer;
