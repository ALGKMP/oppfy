import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import type { Notification } from "expo-notifications";
import { useRouter } from "expo-router";
import type { z } from "zod";

import type { sharedValidators } from "@oppfy/validators";

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
            pathname: "/(search)/profile/[profileId]",
            params: { profileId: entityId },
          });
      }
    };

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) {
        return;
      }
      redirect(response.notification);
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
