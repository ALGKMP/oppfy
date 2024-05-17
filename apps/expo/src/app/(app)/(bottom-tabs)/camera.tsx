import { useState } from "react";
import { Alert, Button, Image, StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { api } from "~/utils/api";

export default function ImagePickerExample() {
  const [image, setImage] = useState<string>();

  const uploadVideo = api.post.createMuxVideoPresignedUrl.useMutation();

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      const uri = result.assets[0]!.uri;
      setImage(uri);

      try {
        const uploadUrl = await uploadVideo.mutateAsync();
        console.log(uploadUrl);
        if (!uploadUrl || !image) {
          Alert.alert("Error", "Failed to get presigned URL");
          return;
        }
        const response = await uploadToMux(uri, uploadUrl);

        if (response.ok) {
          Alert.alert("Success", "Video uploaded successfully");
        } else {
          Alert.alert("Error", "Failed to upload video");
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to get presigned URL");
      }
    }
  };

  const uploadToMux = async (uri: string, uploadUrl: string) => {
    const blob = await getImageBlob(uri);
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": blob.type, // Adjust the MIME type if necessary
      },
      body: blob,
    });

    return response;
  };

  const getImageBlob = async (uri: string) => {
    // Fetch the image data
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  return (
    <View style={styles.container}>
      <Button title="Pick an image from camera roll" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={styles.image} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 200,
    height: 200,
  },
});
