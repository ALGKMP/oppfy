import React, { useEffect, useState} from "react";
import { Text, View, Button, Image, Platform } from "react-native";
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { api } from "~/utils/api";


const Camera = () => {

  const [image, setImage] = useState<string>();
  const mutation = api.media.postImage.useMutation();

  const getPermissionAsync = async () => {
    // Only ask for permission if the device is an iOS device, since 
    // permissions for accessing the camera roll on Android are automatically granted according to chatgpt
    if (Platform.OS === 'ios') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return false;
      }
    }
    return true;
  }

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const hasPermission = await getPermissionAsync();
    if (!hasPermission) return;


    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (result != undefined && !result.canceled) {
      setImage(result.assets[0]?.uri.toString());
    }

    mutation.mutate({bucket: "myawsbucket-0xc3", key: "testKey123", caption: "test caption", tags: ["otherUserKey"]});
    if (mutation.isError) {
      console.log(mutation.error)
    }
    else if (mutation.isSuccess) {
      console.log("mutation data: ", mutation.data)
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button title="Pick an image from camera roll" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}
    </View>
  );
}
export default Camera;
