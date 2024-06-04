import React from "react";
import { TouchableOpacity } from "react-native";
import { Paragraph, SizableText, Text, View, YStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const Inbox = () => {
  const { data: requestsCount } = api.request.countRequests.useQuery();

  return (
    <BaseScreenView>
      <TouchableOpacity>
        <View padding="$4" borderRadius="$6" backgroundColor="$gray2">
          <YStack>
            <SizableText size="$6" fontWeight="bold">
              Follow and Friend Requests
            </SizableText>
            <Paragraph theme="alt1">Approve or ignore these requests</Paragraph>
          </YStack>
        </View>
      </TouchableOpacity>
    </BaseScreenView>
  );
};

export default Inbox;
