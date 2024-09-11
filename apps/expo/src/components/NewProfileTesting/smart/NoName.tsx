// can you create a smart component using the ProfileHeader component and the useProfileData hook?
import { Href, useRouter } from "expo-router";

import ProfileheaderDetails from "../ui/ProfileHeader";
import type { ProfileHeaderDetailsProps } from "../ui/ProfileHeader";

interface NoNameProps extends ProfileHeaderDetailsProps {
    followingRoute: Href<string>;
    followersRoute: Href<string>;
}

const NoName: React.FC<NoNameProps> = ({
  loading,
  data,
  followingRoute,
  followersRoute,
}) => {
  const router = useRouter();

  const onFollowingPress = () => {
    router.push(followingRoute);
  };

  const onFollowersPress = () => {
    router.push(followersRoute);
  };

  return (
    <ProfileheaderDetails
      loading={loading}
      data={data}
      onFollowingPress={onFollowingPress}
      onFollowersPress={onFollowersPress}
    />
  );
};

export default NoName;
