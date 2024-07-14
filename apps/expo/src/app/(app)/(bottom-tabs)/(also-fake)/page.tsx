import { TouchableOpacity } from "react-native-gesture-handler";
import { useRouter, useSegments } from "expo-router";
import { Text, View } from "tamagui";

import { useSession } from "~/contexts/SessionContext";

const Page = () => {
  const segments = useSegments();
  const router = useRouter();
  const { user } = useSession();
  console.log(user?.uid);
  return (
    <View>
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: `/(fake-connections)/${user?.uid}/some-test-shit`,
            params: {
              userId: user?.uid,
            },
          })
        }
      >
        <Text>also-fake</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          router.navigate(`${segments[2]}/more-shit/page`);
        }}
      >
        <Text>More Fake Shit</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Page;
