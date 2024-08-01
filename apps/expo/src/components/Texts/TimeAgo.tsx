import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { GetProps, ThemeName } from "tamagui";
import { SizableText } from "tamagui";

type TimeUnit =
  | "second"
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year";

interface TimeFormat {
  value: number;
  unit: TimeUnit;
}

type SizableTextProps = GetProps<typeof SizableText>;

interface TimeAgoProps extends Omit<SizableTextProps, "children"> {
  date: Date | string | number;
  theme?: ThemeName | null | undefined;
  format?: (timeFormat: TimeFormat) => string;
  updateInterval?: number;
}

const DEFAULT_UPDATE_INTERVAL = 1000;

const TimeAgo = ({
  date,
  theme = "alt1",
  format,
  updateInterval = DEFAULT_UPDATE_INTERVAL,
  ...textProps
}: TimeAgoProps) => {
  const [timeAgo, setTimeAgo] = useState<TimeFormat>({
    value: 0,
    unit: "second",
  });

  const updateTimeAgo = useCallback(() => {
    setTimeAgo(calculateTimeAgo(date));
  }, [date]);

  useEffect(() => {
    updateTimeAgo();
    const timer = setInterval(updateTimeAgo, updateInterval);
    return () => clearInterval(timer);
  }, [updateTimeAgo, updateInterval]);

  const formattedTime = useMemo(() => {
    return format ? format(timeAgo) : defaultFormatTime(timeAgo);
  }, [timeAgo, format]);

  return (
    <SizableText theme={theme} {...textProps}>
      {formattedTime}
    </SizableText>
  );
};

const calculateTimeAgo = (date: Date | string | number): TimeFormat => {
  const now = new Date().getTime();
  const past = new Date(date).getTime();
  const elapsed = now - past;

  const units: [number, TimeUnit][] = [
    [365 * 24 * 60 * 60 * 1000, "year"],
    [30 * 24 * 60 * 60 * 1000, "month"],
    [7 * 24 * 60 * 60 * 1000, "week"],
    [24 * 60 * 60 * 1000, "day"],
    [60 * 60 * 1000, "hour"],
    [60 * 1000, "minute"],
    [1000, "second"],
  ];

  for (const [ms, unit] of units) {
    const value = Math.floor(elapsed / ms);
    if (value >= 1) {
      return { value, unit };
    }
  }

  return { value: 0, unit: "second" };
};

const defaultFormatTime = ({ value, unit }: TimeFormat): string => {
  if (value === 0 && unit === "second") return "now";
  return `${value}${unit.charAt(0)}`;
};

export default React.memo(TimeAgo);
