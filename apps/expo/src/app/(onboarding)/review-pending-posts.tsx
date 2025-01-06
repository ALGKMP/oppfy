import React, { useCallback, useEffect, useState } from "react";
import { Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Button, H2, Paragraph, XStack, YStack } from "tamagui";

// import { PostPreview } from "~/components/post/PostPreview";
import { ScreenView, Spinner } from "~/components/ui";
import { useReviewPendingPosts } from "~/hooks/post/useReviewPendingPosts";

export default function ReviewPendingPosts() {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { reviewPendingPosts, isReviewing, pendingPosts } =
    useReviewPendingPosts();

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const result = await reviewPendingPosts(phoneNumber);
        if (!result.hadPendingPosts) {
          // No pending posts, skip to next screen
          router.replace("/user-info/welcome");
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading pending posts:", err);
        setError("Failed to load your pending posts. Please try again.");
        setIsLoading(false);
      }
    };

    void loadPosts();
  }, [phoneNumber, reviewPendingPosts, router]);

  const handleAcceptAll = useCallback(async () => {
    try {
      await reviewPendingPosts(phoneNumber);
      router.replace("/user-info/welcome");
    } catch (err) {
      console.error("Error accepting posts:", err);
      setError("Failed to accept posts. Please try again.");
    }
  }, [phoneNumber, reviewPendingPosts, router]);

  const handleSkip = useCallback(() => {
    router.replace("/user-info/welcome");
  }, [router]);

  if (isLoading || isReviewing) {
    return (
      <ScreenView justifyContent="center" alignItems="center">
        <YStack gap="$4" alignItems="center">
          <Spinner size="large" />
          <Paragraph>Loading your pending posts...</Paragraph>
        </YStack>
      </ScreenView>
    );
  }

  if (error) {
    return (
      <ScreenView justifyContent="center" alignItems="center">
        <YStack gap="$4" alignItems="center">
          <Paragraph color="$red10">{error}</Paragraph>
          <Button onPress={handleSkip}>Continue</Button>
        </YStack>
      </ScreenView>
    );
  }

  return (
    <ScreenView>
      <YStack gap="$6" flex={1}>
        <YStack gap="$2">
          <H2>Review Your Posts</H2>
          <Paragraph>
            Other users have shared photos of you. Review them before
            continuing.
          </Paragraph>
        </YStack>

{/*         <FlashList
          data={pendingPosts}
          renderItem={({ item }) => (
            <PostPreview post={item} author={item.author} />
          )}
          estimatedItemSize={300}
          contentContainerStyle={{ gap: 16 }}
        />
 */}
        <XStack gap="$4" justifyContent="flex-end">
          <Button variant="outlined" onPress={handleSkip}>
            Skip
          </Button>
          <Button onPress={handleAcceptAll}>Accept All</Button>
        </XStack>
      </YStack>
    </ScreenView>
  );
}
