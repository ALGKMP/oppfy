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

export interface TimeFormat {
  value: number;
  unit: TimeUnit;
}

type SizableTextProps = GetProps<typeof SizableText>;

interface TimeAgoProps extends Omit<SizableTextProps, "children"> {
  date: Date | string | number;
  theme?: ThemeName | null | undefined;
  format?: (timeFormat: TimeFormat) => string;
  updateInterval?: number;
  prefix?: string;
  suffix?: string;
}

const DEFAULT_UPDATE_INTERVAL = 1000;

export const TimeAgo = ({
  date,
  theme = "alt1",
  format,
  updateInterval = DEFAULT_UPDATE_INTERVAL,
  prefix = "",
  suffix = "",
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
    const time = format ? format(timeAgo) : defaultFormatTime(timeAgo);
    const trimmedPrefix = prefix.trim();
    const trimmedSuffix = suffix.trim();

    const prefixWithSpace = trimmedPrefix ? `${trimmedPrefix} ` : "";
    const suffixWithSpace = trimmedSuffix ? ` ${trimmedSuffix}` : "";

    return `${prefixWithSpace}${time}${suffixWithSpace}`;
  }, [timeAgo, format, prefix, suffix]);

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

  const unitAbbreviations: Record<TimeUnit, string> = {
    second: "sec",
    minute: "min",
    hour: "hr",
    day: "d",
    week: "w",
    month: "mo",
    year: "yr",
  };

  // Add pluralization for values greater than 1
  const abbreviation = unitAbbreviations[unit];
  const plural = value > 1 ? "s" : "";

  // Only add plural to certain units
  const shouldPluralize = ["sec", "min", "hr", "yr"].includes(abbreviation);

  return `${value}${abbreviation}${shouldPluralize ? plural : ""}`;
};
