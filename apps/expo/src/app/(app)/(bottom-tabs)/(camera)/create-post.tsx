import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as VideoThumbnails from "expo-video-thumbnails";
import { ArrowBigLeft, ArrowBigRight } from "@tamagui/lucide-icons";
import { Button, useTheme, View, XStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";

const CreatePost = () => {
  const { uri, type } = useLocalSearchParams<{
    uri: string;
    type: "photo" | "video";
  }>();

  const theme = useTheme();
  const router = useRouter();

  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    const generateThumbnail = async () => {
      const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(
        uri ?? "",
      );
      setThumbnail(thumbnailUri);
    };

    if (type === "video") {
      void generateThumbnail();
    }
  }, [type, uri]);

  return (
    <BaseScreenView
      paddingBottom={0}
      paddingHorizontal={0}
      safeAreaEdges={["bottom"]}
      bottomSafeAreaStyle={{
        backgroundColor: theme.gray2.val,
      }}
    >
      <View flex={1}>
        <Image source={{ uri: thumbnail ?? uri }} style={styles.media} />
      </View>

      <XStack
        paddingTop="$4"
        paddingHorizontal="$4"
        justifyContent="space-evenly"
        backgroundColor={"$gray2"}
        borderTopLeftRadius={36}
        borderTopRightRadius={36}
        gap="$4"
      >
        <Button
          flex={1}
          size={"$5"}
          borderRadius="$8"
          icon={ArrowBigLeft}
          onPress={() => router.back()}
        >
          Back
        </Button>

        <Button
          flex={2}
          size={"$5"}
          borderRadius="$8"
          iconAfter={ArrowBigRight}
          onPress={() => null}
        >
          Continue
        </Button>
      </XStack>
    </BaseScreenView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
  },
  media: {
    flex: 1,
    maxWidth: 140,
    maxHeight: 200,
    borderRadius: 24,
  },
});

export default CreatePost;
