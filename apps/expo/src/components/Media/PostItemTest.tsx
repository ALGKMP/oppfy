import React from "react";
import { TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Heart, Send } from "@tamagui/lucide-icons";
import { Avatar, SizableText, View, XStack, YStack } from "tamagui";
import type z from "zod";

import type { sharedValidators } from "@oppfy/validators";

import ImagePost from "./ImagePost";
import VideoPost from "./VideoPost";

type Post = z.infer<typeof sharedValidators.media.post>;

interface PostItemProps {
  post: Post;
  isSelfPost: boolean;
  isViewable: boolean;
}

const PostItem = (props: PostItemProps) => {
  const { post, isSelfPost, isViewable } = props;
  // const [isExpanded, setIsExpanded] = useState(false);
  return (
    <View
      flex={1}
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      borderRadius={20}
      marginBottom="$2"
    >
      <XStack
        flex={1}
        // margin="$2"
        padding="$2.5"
        width="100%"
        justifyContent="space-between"
        alignContent="center"
      >
        <XStack gap="$2.5">
          <TouchableOpacity onPress={() => null}>
            <Image
              source={post.recipientProfilePicture}
              style={{ width: 30, height: 30, borderRadius: 15 }}
            />
          </TouchableOpacity>
          <YStack gap="$0.5" justifyContent="center">
            <TouchableOpacity onPress={() => null}>
              <SizableText
                size="$2"
                lineHeight={14}
                margin={0}
                padding={0}
                shadowRadius={3}
                shadowOpacity={0.5}
                fontWeight="bold"
              >
                {post.recipientUsername ?? "@RecipientUsername"}
              </SizableText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                null;
              }}
            >
              <XStack gap="$1.5" alignItems="center">
                <SizableText
                  size="$2"
                  lineHeight={15}
                  marginTop={0}
                  padding={0}
                >
                  📸
                </SizableText>
                <SizableText size="$1" lineHeight={15}>
                  posted by
                </SizableText>

                <SizableText
                  size="$2"
                  lineHeight={15}
                  fontWeight="bold"
                  color="$blue9"
                >
                  {post.authorUsername ?? "@AuthorUsername"}
                </SizableText>
              </XStack>
            </TouchableOpacity>
          </YStack>
        </XStack>
      </XStack>

      <View
        width="100%"
        aspectRatio={Math.max(post.width / post.height, 9 / 12)}
      >
        {post.mediaType === "image" ? (
          <ImagePost postId={post.postId} imageUrl={post.imageUrl}>
            <View></View>
          </ImagePost>
        ) : (
          <VideoPost
            videoSource={post.imageUrl}
            isViewable={isViewable}
            isMuted={true}
            setIsMuted={() => true}
          >
            <View></View>
          </VideoPost>
        )}
      </View>
      {/* Under Post */}
      <View flex={1} alignSelf="stretch" padding="$2.5" paddingTop="$3">
        <XStack gap="$4" alignItems="center" marginBottom="$2">
          {/* Like Button */}
          <TouchableOpacity onPress={() => null}>
            <Heart
              size={24}
              padding="$3"
              color={true ? "red" : "$gray12"}
              fill="red"
              fillOpacity={true ? 1 : 0}
            />
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            onPress={() => null} // TODO: Add loading spinner on this
            // setIsShareModalVisible(true)}
          >
            <Send size={28} color="$gray12" marginLeft="$-1" />
          </TouchableOpacity>
        </XStack>

        {/* Likes Count */}
        {5 > 0 && (
          <TouchableOpacity>
            <SizableText size="$3" fontWeight="bold" marginBottom="$1">
              {9 > 0 ? `${3} ${1 === 1 ? "like" : "likes"}` : ""}
            </SizableText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
export default PostItem;
