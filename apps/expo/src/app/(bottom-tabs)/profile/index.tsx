
import PFP from "@assets/pfp.png";
import { Button, Image, Separator, Text, View, XStack, YStack } from "tamagui";

const Profile = () => {
  const testUser = {
    name: "John Doe",
    bio: "It’s me Katerina I like to post on this app",
    friends: 129,
    followers: 3900,
    following: 1050,
  };

    const stats = [
        {name: "Friends", quantity: testUser.friends},
        {name:"Follwers", quantity: testUser.followers},
        {name: "Following", quantity: testUser.following}
    ]

    return(
         <View flex={1} backgroundColor="black">
            <View alignItems="center" margin={14}>
                {/* Stats */}
                <YStack space={2} marginBottom={5}>
                    <XStack space={2} marginBottom={1} flex={1} alignItems="center" maxHeight={150}>
                        <Image source={PFP} borderRadius={50} marginBottom={10} marginRight={20}/>
                        <View flexDirection="row" justifyContent="space-between" maxWidth="100%">
                            {stats.map((stat, index) => {
                                return(
                                    <View key={index} marginRight={10} alignItems="center">
                                        <Text >{stat.name}</Text>
                                        <Text fontWeight="bold">{stat.quantity}</Text>
                                    </View>
                                )
                            })}
                        </View>
                    </XStack>
                    
                    <View flexDirection="column" marginBottom={5}>
                        {/* Name */}
                        <Text fontWeight="bold">{testUser.name}</Text>

            {/* Bio */}
            <Text>{testUser.bio}</Text>
          </View>

                    {/* Buttons */}
                    <View flexDirection="row" justifyContent="space-between" marginTop={10}>
                        <Button
                        height={35}
                        backgroundColor="white"
                        borderRadius={10}
                        width="48%"
                        color="black"
                        >
                            Edit Profile
                        </Button>

                        <Button
                        height={35}
                        backgroundColor="white"
                        borderRadius={10}
                        width="48%"
                        color="black"
                        >
                            Share Profile
                        </Button>
                    </View>
                </YStack>
                <Separator alignSelf="stretch" borderColor="white"/>
            </View>
        </View>
    )
}

export default Profile;
