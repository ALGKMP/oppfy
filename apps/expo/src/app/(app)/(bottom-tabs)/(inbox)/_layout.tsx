import { Stack } from "~/layouts";

const InboxLayout = () => (
  <Stack>
    <Stack.Screen
      name="index"
      options={{
        title: "Inbox",
      }}
    />

    <Stack.Screen
      name="requests"
      options={{
        title: "Requests",
      }}
    />

    <Stack.Screen name="profile" options={{ headerShown: false }} />
    <Stack.Screen name="self-profile" options={{ headerShown: false }} />
  </Stack>
);

export default InboxLayout;
