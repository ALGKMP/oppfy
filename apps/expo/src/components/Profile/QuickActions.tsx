import React from "react";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default_profile_picture.jpg";
import { Ban, Settings, Share } from "@tamagui/lucide-icons";
import { XStack } from "tamagui";

import type { RouterOutputs } from "@oppfy/api";

import { Button, useActionSheetController } from "~/components/ui";
import { useBlockUser } from "~/hooks/useBlockUser";
import useShare from "~/hooks/useShare";

type relationshipState =
  RouterOutputs["profile"]["getRelationshipStatesBetweenUsers"];

interface QuickActionsSelfProps {
  type: "self";
  userId: string;
  username: string;
  profilePictureUrl: string | null;
  isLoading: boolean;
}

interface QuickActionsOtherProps {
  type: "other";
  userId: string;
  username: string;
  profilePictureUrl: string | null;
  isLoading: boolean;
  relationshipState: relationshipState;
}

type QuickActionsProps = QuickActionsSelfProps | QuickActionsOtherProps;

const QuickActions = (props: QuickActionsProps) => {
  const router = useRouter();
  const actionSheet = useActionSheetController();
  const { shareProfile } = useShare();

  const {
    handleBlockUser,
    handleUnblockUser,
    isLoading: isBlockActionLoading,
  } = useBlockUser(props.userId);

  if (props.type === "self") {
    return (
      <XStack gap="$3" paddingBottom="$1">
        <Button
          icon={<Settings size={20} />}
          variant="outlined"
          size="$3.5"
          circular
          borderWidth={1.5}
          onPress={() => router.push("/(app)/(settings)")}
          disabled={props.isLoading}
          opacity={props.isLoading ? 0.5 : 1}
        />
      </XStack>
    );
  }

  const handleBlockAction = () => {
    void actionSheet.show({
      title: props.relationshipState?.isBlocked ? "Unblock User" : "Block User",
      subtitle: props.relationshipState?.isBlocked
        ? `Are you sure you want to unblock ${props.username}?`
        : `Are you sure you want to block ${props.username}?`,
      imageUrl: props.profilePictureUrl ?? DefaultProfilePicture,
      buttonOptions: [
        {
          text: props.relationshipState?.isBlocked ? "Unblock" : "Block",
          textProps: { color: "$red11" },
          onPress: props.relationshipState?.isBlocked
            ? handleUnblockUser
            : handleBlockUser,
        },
      ],
    });
  };

  return (
    <XStack gap="$3" paddingBottom="$1">
      <Button
        icon={<Share size={20} />}
        variant="outlined"
        size="$3.5"
        circular
        borderWidth={1.5}
        disabled={props.isLoading || props.relationshipState?.isBlocked}
        opacity={
          props.isLoading || props.relationshipState?.isBlocked ? 0.5 : 1
        }
        onPress={() => shareProfile(props.username)}
      />
      <Button
        icon={<Ban size={20} color="$red11" />}
        variant="outlined"
        size="$3.5"
        circular
        borderWidth={1.5}
        borderColor="$red11"
        disabled={props.isLoading || isBlockActionLoading}
        opacity={props.isLoading || isBlockActionLoading ? 0.5 : 1}
        onPress={handleBlockAction}
      />
    </XStack>
  );
};

export default QuickActions;
