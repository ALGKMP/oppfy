import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";
import { Button, Image, Text, View } from "tamagui";

import { useSession } from "~/contexts/SessionsContext";
import { api } from "~/utils/api";

const Camera = () => {
  const [image, setImage] = useState("");
  const [contentLength, setContentLength] = useState(0);
  const [contentType, setContentType] = useState("image/jpeg");
  const mutation = api.media.createPresignedUrlWithClient.useMutation();

  const caption = "test caption";
  const tags = ["otherUserKey1", "otherUserKey2"];
  const userSession = useSession();

  const putMutation = useMutation(async (url: string) => {
    console.log("presigned url: ", url);

    console.log("Content-Length:" + contentLength);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Length": contentLength.toString(),
        // "Content-Type": "image/jpeg",
        // "x-amz-meta-user": userSession.user!.uid,
        // "x-amz-meta-caption": caption,
        // "x-amz-meta-tags": tags.join(",")
      },
      body: image,
    });
    console.log("status: ", response.status);
    console.log(response.headers);
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      aspect: [4, 3],
      quality: 1,
    });

    console.log("image data: ", result);

    if (
      result.assets?.[0]?.uri &&
      result.assets[0]?.type
    ) {
      setImage(result.assets[0].uri);
      setContentType(result.assets[0].type);
      setContentLength(new Blob([image]).size);
    } else {
      throw new Error("Image not found");
    }

    mutation.mutate({
      bucket: "myawsbucket-0xc3",
      key: "testKey123",
      uid: userSession.user!.uid,
      contentType: contentType,
      contentLength: contentLength,
      caption: caption,
      tags: tags,
    });

    if (mutation.isError) {
      console.log("mutation error: ", mutation.error);
    } else if (mutation.isSuccess) {
      putMutation.mutate(mutation.data);
    }
    console.log("Put request status: ", putMutation.status);
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
