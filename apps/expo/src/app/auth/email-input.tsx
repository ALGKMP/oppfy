import {Button, Text} from 'tamagui';
import {useRouter} from 'expo-router';

const EmailInput = () => {
    const router = useRouter();
    return (
        <Button marginTop={100} onPress={() => router.push("/auth/pass-input")}>
            fjskl
        </Button>
    )
}

export default EmailInput;

