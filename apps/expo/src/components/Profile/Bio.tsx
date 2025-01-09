import React from "react";
import { Text } from "tamagui";

interface BioProps {
  bio: string | null | undefined;
  isLoading: boolean;
}

const Bio = ({ bio, isLoading }: BioProps) => {
  if (!bio) return null;

  return (
    <Text
      fontSize="$4"
      color="$color"
      opacity={isLoading ? 0.5 : 0.8}
      lineHeight={22}
    >
      {bio}
    </Text>
  );
};

export default Bio;
