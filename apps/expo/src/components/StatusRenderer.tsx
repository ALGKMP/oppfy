import React from "react";

interface StatusRendererProps<T> {
  data: T | null | undefined;
  error?: boolean;
  loadingComponent: React.ReactNode | null;
  errorComponent?: React.ReactNode | null;
  successComponent: (data: T) => React.ReactNode | null;
}

function StatusRenderer<T>(
  props: StatusRendererProps<T>,
): React.ReactNode | null {
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
