import React from "react";
import { Calendar } from "@tamagui/lucide-icons";
import { XStack } from "tamagui";

import { TimeAgo } from "~/components/ui/TimeAgo";

interface JoinDatePillProps {
  createdAt?: Date;
}

const JoinDatePill = ({ createdAt }: JoinDatePillProps) => {
  if (!createdAt) return null;

  return (
    <XStack
      alignItems="center"
      gap="$2"
      opacity={0.9}
      backgroundColor="rgba(0,0,0,0.4)"
      paddingHorizontal="$3.5"
      paddingVertical="$2"
      borderRadius="$12"
    >
      <Calendar size={14} color="white" />
      <TimeAgo
        date={createdAt}
        color="white"
        fontSize="$2"
        fontWeight="700"
        prefix="Joined"
        format={({ value, unit }) => {
          const units = {
            second: "seconds",
            minute: "minutes",
            hour: "hours",
            day: "days",
            week: "weeks",
            month: "months",
            year: "years",
          } satisfies Record<string, string>;
          return `${value} ${value === 1 ? unit : units[unit]} ago`;
        }}
        updateInterval={60000} // Update every minute
      />
    </XStack>
  );
};

export default JoinDatePill;
