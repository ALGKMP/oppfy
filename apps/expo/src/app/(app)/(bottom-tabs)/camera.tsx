import React, { useState } from "react";
import { FlatList, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button, Image, View } from "tamagui";

import { useSession } from "~/contexts/SessionContext";
import { api } from "~/utils/api";
import { sharedValidators } from "@acme/validators";

const Camera = () => {
  const [image, setImage] = useState("");
  const session = useSession();
  const userId = session.user!.uid;

  const {
    data: postData,
    isLoading,
    isError,
    error,
  } = api.post.usersPosts.useQuery();

  if (isLoading) {
    return <Text>Loading posts...</Text>;
  }

  if (isError) {
    return <Text>Error loading posts: {error.message}</Text>;
  }

  let posts;
  try {
    posts = sharedValidators.media.userPosts.parse(postData);
  } catch (zodError) {
    console.error(zodError);
    return <Text>Error parsing posts data.</Text>;
  }

  const deletePost = api.post.deletePost.useMutation();
  const mutation = api.post.createPresignedUrlForPost.useMutation();


  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      aspect: [4, 3],
      quality: 1,
    });

    if (result.canceled) return;

    if (result.assets[0]?.uri && result.assets[0]?.mimeType) {
      const uri = result.assets[0].uri;
      const type = result.assets[0].mimeType;
      const blob = await (await fetch(uri)).blob();
      const size = blob.size;

      setImage(uri);

      mutation.mutate({
        friend: userId,
        caption: "w's in the chat",
        contentType: type,
        contentLength: size,
      });
    }
  };

    interface ItemProps {
      id: number;
      url: string;
    }

    const RenderItem = (item: ItemProps) => (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 10,
        }}
      >
        <Button onPress={pickImage}>Pick an image from camera roll</Button>
        <Image source={{ uri: item.url }} style={{ width: 100, height: 100 }} />
        <Button onPress={() => deletePost.mutate({ postId: item.id })}>
          Delete
        </Button>
      </View>
    );

    return (
      <View
        flex={1}
        backgroundColor="black"
        paddingHorizontal="$4"
        justifyContent="center"
      >
        <Button onPress={pickImage}>Pick an image from camera roll</Button>
        {image && (
          <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />
        )}
        <FlatList
          data={posts}
          renderItem={({ item }) => <RenderItem id={item.id} url={item.url} />}
        />
      </View>
    );
  };

export default Camera;
