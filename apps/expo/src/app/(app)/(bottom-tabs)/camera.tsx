import React, { useEffect, useState } from "react";
import { Button, Image, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";

import { api } from "~/utils/api";

const Camera = () => {
  const [image, setImage] = useState("");
  const mutation = api.media.createPresignedUrlWithClient.useMutation();

  const putMutation = useMutation(async (url: string) => {
    console.log("presigned url: ", url);
    console.log("Sending image to S3");

    console.log("Content-Length: ", new Blob([image]).size.toString());
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Length": new Blob([image]).size.toString(),
      },
      body: image,
    });
    console.log(response.status);
  });

  
  const pickImage = async () => {

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      aspect: [4, 3],
      quality: 1,
    });

    console.log("image data: ", result);

    if (result.assets != undefined && result.assets[0]?.uri) {
      setImage(result.assets[0].uri);
    }

    mutation.mutate({
      bucket: "myawsbucket-0xc3",
      key: "testKey123",
      caption: "test caption",
      tags: ["otherUserKey1, otherUserKey2"],
    });

    if (mutation.isError) {
      console.log("mutation error: ", mutation.error);
    } else if (mutation.isSuccess) {
      putMutation.mutate(mutation.data);
    }
    console.log("Put request status: ", putMutation.status);
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Button title="Pick an image from camera roll" onPress={pickImage} />
      {image && (
        <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />
      )}
    </View>
  );
};
export default Camera;
