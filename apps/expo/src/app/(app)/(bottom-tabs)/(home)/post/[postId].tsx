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
import { useSession } from "~/contexts/SessionContext";
import { api } from "~/utils/api";

const Post = () => {
  const router = useRouter();

  const { postId } = useLocalSearchParams<{ postId: string }>();

  const { data: post, isLoading: isPostLoading } = api.post.getPost.useQuery(
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

  if (!post) {
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
          postId={post.postId}
          endpoint="single-post"
          createdAt={post.createdAt}
          caption={post.caption}
          author={{
            id: post.authorId,
            name: post.authorName ?? "",
            username: post.authorUsername ?? "",
            profilePictureUrl: post.authorProfilePicture,
          }}
          recipient={{
            id: post.recipientId,
            name: post.recipientName ?? "",
            username: post.recipientUsername ?? "",
            profilePictureUrl: post.recipientProfilePicture,
          }}
          media={{
            id: post.postId,
            recipient: {
              id: post.recipientId,
              name: post.recipientName ?? "",
              username: post.recipientUsername ?? "",
              profilePictureUrl: post.recipientProfilePicture,
            },
            type: post.mediaType,
            url: post.imageUrl,
            dimensions: {
              width: post.width,
              height: post.height,
            },
          }}
          stats={{
            likes: post.likesCount,
            comments: post.commentsCount,
            hasLiked: post.hasLiked,
          }}
          isViewable={true}
        />

        <RecommendationCarousel paddingHorizontal="$2.5" />
      </YStack>
    </ScreenView>
  );
};

export default Post;
