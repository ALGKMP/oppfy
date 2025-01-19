import { Stack } from "~/components/Layouts/Navigation";

const InboxLayout = () => (
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="index"
      options={{
        title: "Inbox",
        headerShown: true,
      }}
    />

    <Stack.Screen
      name="requests"
      options={{
        title: "Requests",
        headerShown: true,
      }}
    />
  </Stack>
);

export default InboxLayout;
