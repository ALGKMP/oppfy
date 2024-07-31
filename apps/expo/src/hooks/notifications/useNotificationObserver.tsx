import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import type { Notification } from "expo-notifications";
import { useRouter } from "expo-router";
import type { z } from "zod";

import type { sharedValidators } from "@oppfy/validators";

import { api } from "~/utils/api";

type EntityData = z.infer<typeof sharedValidators.notifications.entityData>;

const useNotificationObserver = () => {
  const router = useRouter();
  const utils = api.useUtils();

  useEffect(() => {
    let isMounted = true;

    const redirect = (notification: Notification) => {
      const { entityId, entityType } = notification.request.content
        .data as EntityData;

      switch (entityType) {
        case "profile":
          router.navigate({
            pathname: "/(home)/profile/[userId]",
            params: { userId: entityId },
          });
          break;
        case "post":
          router.navigate({
            pathname: "/(home)/post/[postId]",
            params: { postId: entityId },
          });
          break;
        case "comment":
          router.navigate({
            pathname: "/(home)/post/[postId]",
            params: { postId: entityId },
          });
          break;
      }
    };

    const invalidateData = (notification?: Notification) => {
      if (notification) {
        const { entityId, entityType } = notification.request.content
          .data as EntityData;
        if (entityType === "profile") {
          void utils.profile.getFullProfileOther.invalidate({
            userId: entityId,
          });
        }
      }
      void utils.request.countRequests.invalidate();
      void utils.notifications.paginateNotifications.invalidate();
    };

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) {
        return;
      }
      redirect(response.notification);
      invalidateData(response.notification);
    });

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        redirect(response.notification);
        invalidateData(response.notification);
      });

    // Add a new listener for received notifications
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        invalidateData(notification);
      },
    );

    // Invalidate data initially
    invalidateData();

    return () => {
      isMounted = false;
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, [
    router,
    utils.profile.getFullProfileOther,
    utils.notifications.paginateNotifications,
    utils.request.countRequests,
  ]);
};
export default useNotificationObserver;
