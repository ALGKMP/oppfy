import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Circle, Paragraph, SizableText, View, XStack, YStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const Inbox = () => {
  const router = useRouter();

  const { data: requestsCount } = api.request.countRequests.useQuery();

  const totalRequestCount =
    (requestsCount?.followRequestCount ?? 0) +
    (requestsCount?.friendRequestCount ?? 0);

  const renderRequestCount = () =>
    totalRequestCount > 99 ? (
      <XStack>
        <SizableText size="$4" color="white" fontWeight="bold">
          99
        </SizableText>
        <SizableText size="$2">+</SizableText>
      </XStack>
    ) : (
      <SizableText size="$4" color="white" fontWeight="bold">
        {totalRequestCount}
      </SizableText>
    );

  return (
    <BaseScreenView scrollable>
      {totalRequestCount > 0 && (
        <TouchableOpacity onPress={() => router.navigate("/requests")}>
          <View padding="$4" borderRadius="$6" backgroundColor="$gray2">
            <YStack>
              <SizableText size="$6" fontWeight="bold">
                Follow and Friend Requests
              </SizableText>
              <Paragraph theme="alt1">
                Approve or ignore these requests
              </Paragraph>
            </YStack>
            <Circle
              size={totalRequestCount > 99 ? "$2.5" : "$2"}
              backgroundColor="$red9"
              style={styles.countContainer}
            >
              {renderRequestCount()}
            </Circle>
          </View>
        </TouchableOpacity>
      )}
    </BaseScreenView>
  );
};

const styles = StyleSheet.create({
  countContainer: {
    position: "absolute",
    top: -8,
    right: -8,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Inbox;
