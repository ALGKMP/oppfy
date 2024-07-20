import { Slot, Stack } from "expo-router";
import type {
  HeaderBackButtonProps,
  NativeStackHeaderProps,
} from "@react-navigation/native-stack/src/types";
import { Text, useTheme } from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";

type HeaderProps = NativeStackHeaderProps;

const ProfileLayout = () => {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        // header: (props) => <Header {...props} />, // So this bitch makes it so the header doesn't look like shit rn
        headerShown: false,
        contentStyle: { backgroundColor: theme.background.val }, // this bitch sets the color for wtv the fuck idek
      }}
    >
      <Stack.Screen
        name="[profile-id]"
        options={
          {
            // headerShown: false,
            // header: () => null,
            // headerRight: () => (
            //   <View>
            //     <Pressable onPress={() => console.log("THING CLICKED")}>
            //       {({ pressed }) => (
            //         <MoreHorizontal style={{ opacity: pressed ? 0.5 : 1 }} />
            //       )}
            //     </Pressable>
            //   </View>
          }
        }
      />
    </Stack>
  );
};

const Header = ({ navigation, options }: HeaderProps) => (
  <BaseHeader
    HeaderLeft={
      options.headerLeft
        ? options.headerLeft({
            canGoBack: navigation.canGoBack(),
            tintColor: options.headerTintColor,
          })
        : undefined
    }
    HeaderTitle={
      typeof options.headerTitle === "function" ? (
        options.headerTitle({
          children: options.title ?? "",
          tintColor: options.headerTintColor,
        })
      ) : options.title ? (
        <Text fontSize="$5" fontWeight="bold">
          {options.title}
        </Text>
      ) : null
    }
    HeaderRight={
      options.headerRight
        ? options.headerRight({
            canGoBack: navigation.canGoBack(),
            tintColor: options.headerTintColor,
          })
        : undefined
    }
  />
);

export default ProfileLayout;
