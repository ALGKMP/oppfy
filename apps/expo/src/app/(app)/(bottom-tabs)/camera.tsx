import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";
import { Button, Image, View } from "tamagui";

import { useSession } from "~/contexts/SessionsContext";
import { api } from "~/utils/api";

const Camera = () => {
  const [image, setImage] = useState("");
  const [contentLength, setContentLength] = useState(0);
  const [contentType, setContentType] = useState("");
  const mutation = api.post.createPresignedUrlForPost.useMutation();

  const session = useSession();

  const caption = "test caption";
  const userId = session.user!.uid;

  const putMutation = useMutation(async (url: string) => {
    if (!image) return;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": contentType, // Use the dynamically set content type
        "Content-Length": contentLength.toString(), // Use the dynamically set content length
      },
      body: await (await fetch(image)).blob(), // Convert the image URI to a blob
    });

    console.log("status: ", response.status);
  });

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
      setContentType(type);
      setContentLength(size);

      mutation.mutate({
        author: userId, 
        recipient: userId,
        caption: caption,
        contentType: type,
        contentLength: size,
      }, {
        onSuccess: (url) => {
          // Use the URL from the successful mutation to upload the image
          console.log("url: ", url)
          putMutation.mutate(url);
        }
      });
    }
    else {
      console.log("shits broken on the camera page 1")
    }
  };

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
    </View>
  );
};

export default Camera;
