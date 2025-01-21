import React from "react";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { Ban, Send, Settings2 } from "@tamagui/lucide-icons";
import { XStack } from "tamagui";

import type { RouterOutputs } from "@oppfy/api";

import { Button, useActionSheetController } from "~/components/ui";
import { useBlockUser } from "~/hooks/useBlockUser";

type NetworkRelationships = RouterOutputs["profile"]["getNetworkRelationships"];

interface QuickActionsProps {
  userId?: string;
  username?: string;
  profilePictureUrl?: string | null;
  isLoading: boolean;
  networkRelationships?: NetworkRelationships;
}

const QuickActions = ({
  userId,
  username,
  profilePictureUrl,
  isLoading,
  networkRelationships,
}: QuickActionsProps) => {
  const router = useRouter();
  const actionSheet = useActionSheetController();

  const {
    handleBlockUser,
    handleUnblockUser,
    isLoading: isBlockActionLoading,
  } = useBlockUser(userId ?? "");

  if (!userId) {
    return (
      <XStack gap="$3" paddingBottom="$1">
        <Button
          icon={<Settings2 size={20} />}
          variant="outlined"
          size="$3.5"
          circular
          borderWidth={1.5}
          onPress={() => router.push("/(app)/(settings)")}
          disabled={isLoading}
          opacity={isLoading ? 0.5 : 1}
        />
      </XStack>
    );
  }

  const handleBlockAction = () => {
    void actionSheet.show({
      title: networkRelationships?.isTargetUserBlocked
        ? "Unblock User"
        : "Block User",
      subtitle: networkRelationships?.isTargetUserBlocked
        ? `Are you sure you want to unblock ${username}?`
        : `Are you sure you want to block ${username}?`,
      imageUrl: profilePictureUrl ?? DefaultProfilePicture,
      buttonOptions: [
        {
          text: networkRelationships?.isTargetUserBlocked ? "Unblock" : "Block",
          textProps: { color: "$red11" },
          onPress: networkRelationships?.isTargetUserBlocked
            ? handleUnblockUser
            : handleBlockUser,
        },
      ],
    });
  };

  return (
    <XStack gap="$3" paddingBottom="$1">
      <Button
        icon={<Send size={20} />}
        variant="outlined"
        size="$3.5"
        circular
        borderWidth={1.5}
        disabled={isLoading || networkRelationships?.isTargetUserBlocked}
        opacity={
          isLoading || networkRelationships?.isTargetUserBlocked ? 0.5 : 1
        }
      />
      <Button
        icon={<Ban size={20} color="$red11" />}
        variant="outlined"
        size="$3.5"
        circular
        borderWidth={1.5}
        borderColor="$red11"
        disabled={isLoading || isBlockActionLoading}
        opacity={isLoading || isBlockActionLoading ? 0.5 : 1}
        onPress={handleBlockAction}
      />
    </XStack>
  );
};

export default QuickActions;
