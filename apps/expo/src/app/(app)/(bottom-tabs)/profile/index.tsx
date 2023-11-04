import PFP from "@assets/pfp.png";
import { Button, Image, Separator, Text, View, XStack, YStack } from "tamagui";

const Profile = () => {
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

  return (
    <View flex={1} backgroundColor="black" paddingHorizontal="$5">
      <YStack space="$3">
        {/* <XStack justifyContent="space-between">
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
        </XStack> */}
        <XStack justifyContent="space-between" alignItems="center">
          <YStack space>
            <Text fontWeight="700" fontSize={20}>
              {user.name}
            </Text>
            <Text fontWeight="600" color="$gray11">
              {user.bio}
            </Text>

            <XStack space>
              <Button>Edit Profile</Button>
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
