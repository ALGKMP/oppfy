import React from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Paragraph, SizableText, Text, View, YStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const Inbox = () => {
  const router = useRouter();

  const { data: requestsCount } = api.request.countRequests.useQuery();

  const totalRequestCount =
    (requestsCount?.followRequestCount ?? 0) +
    (requestsCount?.friendRequestCount ?? 0);

  return (
    <BaseScreenView>
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
          </View>
        </TouchableOpacity>
      )}
    </BaseScreenView>
  );
};

export default Inbox;
