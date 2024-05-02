import React, { useState } from "react";
import { FlatList, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button, Image, View } from "tamagui";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from '@tanstack/react-query';


import { useSession } from "~/contexts/SessionContext";
import { api } from "~/utils/api";
import { sharedValidators } from "@acme/validators";
import { z } from "zod";

const Camera = () => {
  const [image, setImage] = useState("");
  const queryClient = useQueryClient(); // Get the query client
  const session = useSession();
  const userId = session.user!.uid;

  // Query for posts
  const {
    data: postData,
    isLoading,
    isError,
    error,
  } = api.post.userPosts.useQuery();

  const deletePost = api.post.deletePost.useMutation();
  const mutation = api.post.createPresignedUrlForPost.useMutation();

  const putMutation = useMutation(async (url: string) => {
    if (!image) return;

    const response = await fetch(url, {
      method: "PUT",
      body: await (await fetch(image)).blob(),
    });

    if (!response.ok) {
      console.log(response);
      return;
    }

    console.log("status: ", response.status);

    // Invalidate and refetch posts after successful image upload
    await queryClient.invalidateQueries(['userPosts']);
  });


  if (isLoading) {
    return <Text>Loading posts...</Text>;
  }

  if (isError) {
    return <Text>Error loading posts: {error.message}</Text>;
  }

  let posts;
  try {
    posts = sharedValidators.media.userPosts.parse(postData);
    console.log(posts)
  } catch (zodError) {
    console.error(zodError);
    return <Text>Error parsing posts data.</Text>;
  }

  const getPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!status) {
      alert('Sorry, we need camera roll permissions to make this work!');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await getPermissions();
    if (!hasPermission) return;
    console.log("here 1")
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      aspect: [4, 3],
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

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
      }, {
        onSuccess: (url) => {
          console.log("url: ", url);
          putMutation.mutate(url);
        }
      });
    }
    else {
      console.log("shits broken on the camera page 1")
    }
  };

  const RenderItem = ({ id, authorsId, authorsUsername, friendsId, friendsUsername, caption, url }: z.infer<typeof sharedValidators.media.post>) => (
    <View style={{
      flexDirection: "column",  // Changed from 'row' to 'column'
      alignItems: "center",    // Align items centrally for a neater look
      justifyContent: "flex-start",
      padding: 10,
    }}>
      <Image source={{ uri: url }} style={{ width: 100, height: 100 }} />
      <Text className="bg-white" style={{ marginTop: 10 }}>Author: {authorsUsername}</Text> 
      <Text>Friend: {friendsUsername}</Text>                          
      <Text style={{ marginBottom: 10 }}>Caption: {caption}</Text> 
      <Button onPress={() => deletePost.mutate({ postId: id })}>
        Delete
      </Button>
    </View>
  );
  

  return (
    <View flex={1} backgroundColor="black" paddingHorizontal="$4" justifyContent="center">
      <Button onPress={pickImage}>Pick an image from camera roll</Button>
      {image && (
        <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />
      )}
      <FlatList
        data={posts}
        renderItem={({ item }) => <RenderItem {...item} />}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
};

export default Camera;
