import { useEffect } from "react";
import { useGlobalSearchParams } from "expo-router";
import { Text } from "tamagui";

import { BaseScreenView } from "~/components/Views";

const MediaOfThem = () => {
  const { profileId } = useGlobalSearchParams<{ profileId: string }>();

  useEffect(() => {
    console.log("MEDIA OF THEM FILE:", profileId);
  }, [profileId]);

  return (
    <BaseScreenView>
      <Text>Media of them</Text>
    </BaseScreenView>
  );
};

export default MediaOfThem;
