import React, { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Button, H2, Paragraph, XStack, YStack } from "tamagui";

import { PostPreview } from "~/components/post/PostPreview";
import { ScreenView, Spinner } from "~/components/ui";
import { usePendingPostsManager } from "~/hooks/post/usePendingPostsManager";

export default function PendingPostsReview() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { pendingPosts, isLoadingPosts, acceptPosts, skipPosts } =
    usePendingPostsManager();

  const handleAcceptAll = useCallback(async () => {
    if (!pendingPosts?.[0]) return;

    setIsProcessing(true);
    try {
      const success = await acceptPosts(pendingPosts[0].pendingUserId);
      if (success) {
        router.replace("/(app)/(bottom-tabs)/(home)");
      } else {
        setError("Failed to accept posts. Please try again.");
      }
    } catch (err) {
      console.error("Error accepting posts:", err);
      setError("Failed to accept posts. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [pendingPosts, acceptPosts, router]);

  const handleSkip = useCallback(async () => {
    if (!pendingPosts?.[0]) return;

    setIsProcessing(true);
    try {
      const success = await skipPosts(pendingPosts[0].pendingUserId);
      if (success) {
        router.replace("/(app)/(bottom-tabs)/(home)");
      } else {
        setError("Failed to skip posts. Please try again.");
      }
    } catch (err) {
      console.error("Error skipping posts:", err);
      setError("Failed to skip posts. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [pendingPosts, skipPosts, router]);

  if (isLoadingPosts || isProcessing) {
    return (
      <ScreenView justifyContent="center" alignItems="center">
        <YStack gap="$4" alignItems="center">
          <Spinner size="large" />
          <Paragraph>
            {isLoadingPosts ? "Loading your pending posts..." : "Processing..."}
          </Paragraph>
        </YStack>
      </ScreenView>
    );
  }

  if (!pendingPosts?.length) {
    router.replace("/(app)/(bottom-tabs)/(home)");
    return null;
  }

  return (
    <ScreenView>
      <YStack gap="$6" flex={1}>
        <YStack gap="$2">
          <H2>Review Your Posts</H2>
          <Paragraph>
            Other users have shared {pendingPosts.length} photo
            {pendingPosts.length !== 1 ? "s" : ""} of you. Review them before
            continuing.
          </Paragraph>
        </YStack>

        {error && (
          <Paragraph color="$red10" textAlign="center">
            {error}
          </Paragraph>
        )}

        <FlashList
          data={pendingPosts}
          renderItem={({ item }) => (
            <PostPreview post={item} author={item.author} />
          )}
          estimatedItemSize={300}
          contentContainerStyle={{ gap: 16 }}
        />

        <XStack gap="$4" justifyContent="flex-end">
          <Button variant="outlined" onPress={handleSkip}>
            Skip for Now
          </Button>
          <Button onPress={handleAcceptAll}>Accept All</Button>
        </XStack>
      </YStack>
    </ScreenView>
  );
}
