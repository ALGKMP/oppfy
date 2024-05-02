import PFP from "@assets/pfp.png";
import { Button, Image, Separator, Text, View, XStack, YStack } from "tamagui";
import { router } from 'expo-router';
import { api } from "~/utils/api";

const Profile = () => {

  const profile = api.profile.getProfileDetails.useQuery();
  console.log(profile.data);

  const user = {
    name: "Katerina Tess",
    bio: "It’s me Katerina I like to post on this app",
    friends: 23,
    followers: 680,
    following: 49,
  };

  const stats = [
    { name: "Friends", quantity: user.friends },
    { name: "Followers", quantity: user.followers },
    { name: "Following", quantity: user.following },
  ];

  const onPress = () => {
    router.push('/(app)/(bottom-tabs)/(top-tabs)/editProfile');
  }

  return (
    <View flex={1} backgroundColor="black" paddingHorizontal="$4">
      <YStack space="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <YStack space>
            <Text fontWeight="700" fontSize={20}>
              {user.name}
            </Text>
            <Text fontWeight="600" color="$gray11">
              {user.bio}
            </Text>

            <XStack space>
              <Button onPress={onPress}>Edit Profile</Button>
              <Button>Share Profile</Button>
            </XStack>
          </YStack>

          <Image source={PFP} width={70} height={70} borderRadius={35} />
        </XStack>

        <XStack justifyContent="space-between" space="$4">
          {stats.map((stat, index) => (
            <XStack key={index} alignItems="center" space={4}>
              <Text>{stat.name}</Text>
              <Text fontWeight="bold" fontSize="$5">
                {stat.quantity}
              </Text>
            </XStack>
          ))}
        </XStack>
      </YStack>

      <Separator borderColor="white" marginTop="$5" marginBottom="$2" />
    </View>
  );
};

export default Profile;
