import { useRouter } from "expo-router";
import { useSession } from "~/contexts/SessionContext";


// handle the profile routing shit
export const useRouteProfile = () => {
    const { user } = useSession();

    const router = useRouter();

    const routeProfile = ({userId, username}: {userId: string, username?: string}) => {
        if (user?.uid === userId) {
            router.push({
                pathname: "/self-profile",
            });
        }
        router.push({
            pathname: "/profile/[userId]",
            params: {
                userId: userId,
                username: username, 
            },
        });
    };

    return {
        routeProfile,
    };
}

