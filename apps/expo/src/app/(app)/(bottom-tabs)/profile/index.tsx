import PFP from "@assets/pfp.png";
import { Button, Image, Separator, Text, View, XStack, YStack } from "tamagui";

const Profile = () => {
  const testUser = {
    name: "Katerina Tess",
    bio: "It’s me Katerina I like to post on this app",
    friends: 23,
    followers: 680,
    following: 49,
  };

  const stats = [
    { name: "Friends", quantity: testUser.friends },
    { name: "Followers", quantity: testUser.followers },
    { name: "Following", quantity: testUser.following },
  ];

  return (
    <View flex={1} backgroundColor="$backgroundStrong" paddingHorizontal="$5">
      <YStack space="$3">
        <XStack justifyContent="space-between">
          <Image source={PFP} width={70} height={70} borderRadius={35} />

          <XStack alignItems="center" space="$4">
            {stats.map((stat, index) => (
              <View key={index} alignItems="center">
                <Text fontWeight="bold" fontSize="$5">
                  {stat.quantity}
                </Text>
                <Text>{stat.name}</Text>
              </View>
            ))}
          </XStack>
        </XStack>

        <View flexDirection="column" marginVertical={10}>
          <Text fontWeight="bold">{testUser.name}</Text>
          <Text>{testUser.bio}</Text>
        </View>

        <XStack space="$3">
          <Button flex={1} height="$2.5" backgroundColor="white" color="black">
            Edit Profile
          </Button>
          <Button flex={1} height="$2.5" backgroundColor="white" color="black">
            Share Profile
          </Button>
        </XStack>
      </YStack>
      <Separator borderColor="white" marginTop="$5" marginBottom="$2" />
    </View>
  );
};

export default Profile;
