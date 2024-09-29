import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import debounce from "lodash/debounce";
import { Button, SizableText, XStack, YStack } from "tamagui";

import { Skeleton } from "~/components/Skeletons";
import StatusRenderer from "../StatusRenderer";

interface SuggestionCardProps {
  loading: boolean;
  imageUrl?: string;
  username?: string;
  reason?: string;
  onFollow?: () => void;
  onDismiss?: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  loading,
  imageUrl,
  username,
  reason,
  onFollow,
  onDismiss,
}) => {
  const debouncedOnFollow = useMemo(
    () => onFollow && debounce(onFollow, 300),
    [onFollow],
  );

  const debouncedOnDismiss = useMemo(
    () => onDismiss && debounce(onDismiss, 300),
    [onDismiss],
  );

  return (
    <XStack
      alignItems="center"
      paddingVertical="$2"
      paddingHorizontal="$3"
      gap="$3"
    >
      <StatusRenderer
        data={!loading && imageUrl ? imageUrl : undefined}
        loadingComponent={<Skeleton circular size={44} />}
        successComponent={(url) => (
          <Image
            source={url}
            style={{ width: 44, height: 44, borderRadius: 22 }}
          />
        )}
      />

      <YStack flex={1} space="$1">
        <StatusRenderer
          data={!loading && username ? username : undefined}
          loadingComponent={<Skeleton width={80} height={18} radius={4} />}
          successComponent={(name) => (
            <SizableText fontWeight="bold" size="$3">
              {name}
            </SizableText>
          )}
        />

        <StatusRenderer
          data={!loading && reason ? reason : undefined}
          loadingComponent={<Skeleton width={120} height={16} radius={4} />}
          successComponent={(text) => (
            <SizableText theme="alt1" size="$2">
              {text}
            </SizableText>
          )}
        />
      </YStack>

      <YStack alignItems="flex-end" space="$2">
        <StatusRenderer
          data={!loading ? "Follow" : undefined}
          loadingComponent={<Skeleton width={70} height={30} radius={6} />}
          successComponent={() => (
            <Button
              size="$3"
              theme="blue"
              onPress={debouncedOnFollow}
              disabled={loading}
            >
              Follow
            </Button>
          )}
        />

        <TouchableOpacity onPress={debouncedOnDismiss} disabled={loading}>
          <SizableText size="$2" theme="alt1">
            Dismiss
          </SizableText>
        </TouchableOpacity>
      </YStack>
    </XStack>
  );
};

export default React.memo(SuggestionCard);