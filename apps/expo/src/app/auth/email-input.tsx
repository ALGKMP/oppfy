import {Button, Text, View} from 'tamagui';
import {useRouter} from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const EmailInput = () => {
    const router = useRouter();
    return (
      <View flex={1} backgroundColor={"$background"}>
        <Button onPress={() => router.push("/auth/pass-input")}>
            fjskl
        </Button>
      </View>
    )
}

export default EmailInput;

