import React, { useCallback, useEffect, useRef, useState } from "react";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  SlideInDown,
  SlideOutUp,
  withSpring,
} from "react-native-reanimated";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { comment } from "node_modules/@oppfy/validators/src/shared";
import { Avatar, Button, Text, View } from "tamagui";
import { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

import BottomSheetWrapper from "./BottomSheetWrapper";

interface CommentsModalProps {
  postId: number;
  modalVisible: boolean;
  setModalVisible: (value: boolean) => void;
}

const CommentsTestBottomSheet = (props: CommentsModalProps) => {
  const { postId, modalVisible, setModalVisible } = props;
  const sheetRef = useRef<BottomSheet>(null);

  const [comments, setComments] = useState<
    z.infer<typeof sharedValidators.media.comment>[]
  >([
    {
      commentId: 1,
      userId: "796f6d5f-26c1-4f88-90fd-bb6c1bf5a9f3",
      username: "amandajones",
      profilePictureUrl: "https://placeimg.com/591/620/any",
      postId: 6,
      body: "Box size without various season pass. Everybody him player trade garden professor large. So kid leg laugh two subject.\nDifficult focus on role protect five large.",
      createdAt: new Date(),
    },
    {
      commentId: 2,
      userId: "d2bc0bec-f898-440c-bc71-8e4b2bf24fff",
      username: "carriesantos",
      profilePictureUrl: "https://placekitten.com/542/814",
      postId: 15,
      body: "Different arrive arm well kid seat really nothing. Call heavy move country pattern smile. Bring fall hard than against represent two type.",
      createdAt: new Date(),
    },
  ]);

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const addComment = useCallback(() => {
    const newComment = {
      commentId: comments.length + 1,
      userId: "d2bc0bec-f898-440c-bc71-8e4b2bf24fff",
      username: "carriesantos",
      profilePictureUrl:
        "https://media.discordapp.net/attachments/970814059635163221/1266901627529592852/image.png?ex=66a6d595&is=66a58415&hm=41eb9aed7b07b67b5325c33c2dc129ab0adca8181e16bcd4c3b141050c5c19c5&=&format=webp&quality=lossless&width=1228&height=676",
      postId: 15,
      body: "Different arrive arm well kid seat really nothing. Call heavy move country pattern smile. Bring fall hard than against represent two type.",
      createdAt: new Date(),
    };
    setComments((prevComments) => [newComment, ...prevComments]);
    // const newComments = [...comments, newComment];
    // setComments(newComments)
  }, [comments.length]);

  const MemoizedAvatar = React.memo(({ src }: { src: string }) => (
    <Avatar circular size="$4" flex={1}>
      <Avatar.Image accessibilityLabel="User Avatar" src={src} />
      <Avatar.Fallback backgroundColor="$blue10" />
    </Avatar>
  ));

  return (
    <BottomSheetWrapper
      sheetRef={sheetRef}
      modalVisible={modalVisible}
      onClose={closeModal}
      onOpen={openModal}
      snapPoints={["90%"]}
    >
      <View flex={1}>
        <Animated.FlatList
          data={comments}
          scrollEnabled={true}
          layout={LinearTransition}
          //   inverted={true}
          entering={FadeIn}
          itemLayoutAnimation={LinearTransition}
          exiting={FadeOut}
          keyExtractor={(item) => item.commentId.toString()}
          extraData={comments.length}
          renderItem={({ item }) => (
            // <Animated.View
            //   key={item.commentId}
            //     entering={FadeIn}
            //     exiting={FadeOut}
            //   //   layout={LinearTransition}
            //   onLayout={() => {
            //     console.log("Layout");
            //   }}
            //   style={{ flex: 1 }}
            // >
            <View flex={1} justifyContent="center" alignItems="center">
              <MemoizedAvatar src={item.profilePictureUrl} />
              <Text>{item.username}</Text>
              <Text>{item.body}</Text>
            </View>
            // </Animated.View>
          )}
        />
        <View flex={1} justifyContent="center" alignItems="center">
          <Button onPress={() => addComment()}>
            <Text>Add Comment</Text>
          </Button>
        </View>
      </View>
    </BottomSheetWrapper>
  );
};

export default CommentsTestBottomSheet;
