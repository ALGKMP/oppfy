import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "@tamagui/lucide-icons";
import {
  ScrollView,
  SizableText,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import { Header } from "~/components/Layouts";
import PostCard from "~/components/Post/PostCard";
import RecommendationCarousel from "~/components/RecommendationCarousel";
import { EmptyPlaceholder, Icon, ScreenView } from "~/components/ui";
import { api } from "~/utils/api";

const Post = () => {
  const router = useRouter();

  const { postId } = useLocalSearchParams<{ postId: string }>();

  const { data, isLoading: isPostLoading } = api.post.getPost.useQuery(
    { postId },
    { enabled: !!postId },
  );

  if (isPostLoading) {
    return (
      <ScreenView padding={0} scrollable>
        <YStack gap="$2">
          <Header
            title="Post"
            HeaderLeft={
              <Icon name="chevron-back" onPress={() => router.back()} blurred />
            }
          />

          <PostCard.Skeleton />
        </YStack>
      </ScreenView>
    );
  }

  if (!data) {
    return (
      <ScreenView padding={0}>
        <Header
          title="Post"
          HeaderLeft={
            <Icon name="chevron-back" onPress={() => router.back()} blurred />
          }
        />

        <View
          flex={1}
          justifyContent="center"
          alignItems="center"
          paddingBottom="$8"
        >
          <EmptyPlaceholder
            title="Post not found"
            subtitle="The post you are looking for does not exist"
          />
        </View>
      </ScreenView>
    );
  }

  return (
    <ScreenView padding={0} scrollable>
      <YStack gap="$2">
        <Header
          title="Post"
          HeaderLeft={
            <Icon name="chevron-back" onPress={() => router.back()} blurred />
          }
        />

        <PostCard
          postId={data.post.id}
          endpoint="single-post"
          createdAt={data.post.createdAt}
          caption={data.post.caption}
          author={{
            id: data.authorUserId,
            name: data.authorName ?? "",
            username: data.authorUsername ?? "",
            profilePictureUrl: data.authorProfilePictureUrl,
          }}
          recipient={{
            id: data.recipientUserId,
            name: data.recipientName ?? "",
            username: data.recipientUsername ?? "",
            profilePictureUrl: data.recipientProfilePictureUrl,
          }}
          media={{
            id: data.post.id,
            recipient: {
              id: data.recipientUserId,
              name: data.recipientName ?? "",
              username: data.recipientUsername ?? "",
              profilePictureUrl: data.recipientProfilePictureUrl,
            },
            type: data.post.mediaType,
            url: data.assetUrl,
            dimensions: {
              width: data.post.width,
              height: data.post.height,
            },
          }}
          stats={{
            likes: data.postStats.likes,
            comments: data.postStats.comments,
            hasLiked: data.hasLiked,
          }}
          isViewable={true}
        />

        <RecommendationCarousel paddingHorizontal="$2.5" />
      </YStack>
    </ScreenView>
  );
};

export default Post;
