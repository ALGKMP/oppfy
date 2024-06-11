import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Notification } from "expo-notifications";
import { router, useRouter } from "expo-router";
import { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

type EntityData = z.infer<typeof sharedValidators.notifications.entityData>;

const useNotificationObserver = () => {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const redirect = (notification: Notification) => {
      const { entityId, entityType } = notification.request.content
        .data as EntityData;

      switch (entityType) {
        case "profile":
          router.navigate({
            pathname: "/(search)/profile/[profile-id]",
            params: { profileId: entityId },
          });
      }
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) {
        return;
      }
      redirect(response?.notification);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirect(response.notification);
      },
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
};

export default useNotificationObserver;
