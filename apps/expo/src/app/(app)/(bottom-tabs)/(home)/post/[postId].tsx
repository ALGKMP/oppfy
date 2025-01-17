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

import PostItem from "~/components/Media/PostItem";
import { useSession } from "~/contexts/SessionContext";
import { api } from "~/utils/api";

// Define a type for your route segments
// const Post = () => {
//   const { user } = useSession();
//   const router = useRouter();
//   const insets = useSafeAreaInsets();

//   const params = useLocalSearchParams<{ postId: string }>();

//   const rawPostId = params.postId ?? "";
//   const postId = parseInt(rawPostId);

//   const { data: post, isLoading: isPostLoading } = api.post.getPost.useQuery(
//     { postId: postId }, // Use nullish coalescing for fallback
//     { enabled: !isNaN(postId) },
//   );

//   const { data: isFollowing, isLoading: isFollowingLoading } =
//     api.follow.isFollowingSelf.useQuery(
//       { userId: post?.recipientId ?? "" },
//       { enabled: !!post?.recipientId }, // Enable only if recipientId is defined
//     );

//   const follow = api.follow.followUser.useMutation();

//   if (isPostLoading || isFollowingLoading) {
//     return (
//       <View flex={1} bg="black" justifyContent="center" alignItems="center">
//         <Spinner />
//       </View>
//     );
//   }
//   const isSelfPost = post?.authorId === user?.uid;

//   if (!post) {
//     return (
//       <View bg="black" flex={1} justifyContent="center" alignItems="center">
//         <Text>Post not found</Text>
//       </View>
//     );
//   }

//   return (
//     <BaseScreenView padding={0} top={insets.top}>
//       <ScrollView>
//         <XStack
//           paddingVertical="$2"
//           paddingHorizontal="$4"
//           alignItems="center"
//           justifyContent="space-between"
//           backgroundColor="$background"
//         >
//           {router.canGoBack() ? (
//             <View minWidth="$2" alignItems="flex-start">
//               <TouchableOpacity
//                 onPress={() => {
//                   void router.back();
//                 }}
//               >
//                 <ChevronLeft />
//               </TouchableOpacity>
//             </View>
//           ) : (
//             <View minWidth="$2" alignItems="flex-start" />
//           )}

//           <YStack alignItems="center">
//             <SizableText size="$3" fontWeight="bold" color="$gray10">
//               {post.recipientUsername?.toUpperCase()}
//             </SizableText>
//             <Text fontSize="$5" fontWeight="bold">
//               Post
//             </Text>
//           </YStack>

//           {!isFollowing ? (
//             <View minWidth="$2" alignItems="flex-end">
//               <TouchableOpacity
//                 onPress={() => follow.mutate({ userId: post.recipientId })}
//               >
//                 <Text fontWeight="bold">Follow</Text>
//               </TouchableOpacity>
//             </View>
//           ) : (
//             <View minWidth="$2" alignItems="flex-end" />
//           )}
//         </XStack>
//         <PostItem post={post} isSelfPost={isSelfPost} isViewable={true} />
//       </ScrollView>
//     </BaseScreenView>
//   );
// };

const Post = () => {
  return <View></View>;
};

export default Post;
