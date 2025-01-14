import { TouchableOpacity } from "react-native";
import { useRouter, withLayoutContext } from "expo-router";
import type {
  ParamListBase,
  StackNavigationState,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type {
  NativeStackNavigationEventMap,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { Text } from "tamagui";

import { Header } from "~/components/Headers";

const { Navigator } = createNativeStackNavigator();

const DefaultHeaderLeft = ({ canGoBack }: { canGoBack?: boolean }) => {
  const router = useRouter();

  if (!canGoBack) return null;

  return (
    <TouchableOpacity hitSlop={10} onPress={() => router.back()}>
      <ChevronLeft />
    </TouchableOpacity>
  );
};

const CustomNavigator = ({ children, ...rest }: any) => {
  return (
    <Navigator
      {...rest}
      screenOptions={{
        ...rest.screenOptions,
        header: ({ navigation, route, options }) => (
          <Header
            HeaderLeft={
              options.headerLeft?.({
                canGoBack: navigation.canGoBack(),
                tintColor: options.headerTintColor,
              }) ?? <DefaultHeaderLeft canGoBack={navigation.canGoBack()} />
            }
            HeaderTitle={
              typeof options.headerTitle === "function" ? (
                options.headerTitle({
                  children: options.title ?? "",
                  tintColor: options.headerTintColor,
                })
              ) : (
                <Text fontSize="$5" fontWeight="bold">
                  {options.title ?? route.name}
                </Text>
              )
            }
            HeaderRight={options.headerRight?.({
              canGoBack: navigation.canGoBack(),
              tintColor: options.headerTintColor,
            })}
          />
        ),
      }}
    >
      {children}
    </Navigator>
  );
};

const Stack = withLayoutContext<
  NativeStackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(CustomNavigator);

export { Stack };
