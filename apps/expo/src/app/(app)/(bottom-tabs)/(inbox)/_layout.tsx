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
  </Stack>
);

export default InboxLayout;
