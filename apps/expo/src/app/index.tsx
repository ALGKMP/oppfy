import React, { useEffect } from "react";
import { Redirect } from "expo-router";
import { Text } from "tamagui";

import { api } from "~/utils/api";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionsContext";

const Index = () => {
  const { isSignedIn, isLoading, signOut } = useSession();
  const { permissions } = usePermissions();
  const allPermissions = Object.values(permissions).every((p) => p === true);

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return isSignedIn ? (
    <Redirect href="profile" />
  ) : (
    <Redirect href="phone-number" />
  );
};

export default Index;
