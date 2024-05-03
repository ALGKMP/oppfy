import { eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

const notificationSettingRepository = {
    getNotificationSetting: async (notificationSettingId: number) => {
        const notificationSettings = await db
        .selectDistinct()
        .from(schema.notificationSetting)
        .where(eq(schema.notificationSetting.id, notificationSettingId));
        return notificationSettings[0];
    },
    
    updatePostsSetting: async (notificationSettingId: number, posts: boolean) => {
        await db
        .update(schema.notificationSetting)
        .set({ posts })
        .where(eq(schema.notificationSetting.id, notificationSettingId));
    },

    updateMentionsSetting: async (notificationSettingId: number, mentions: boolean) => {
        await db
        .update(schema.notificationSetting)
        .set({ mentions })
        .where(eq(schema.notificationSetting.id, notificationSettingId));
    },

    updateCommentsSetting: async (notificationSettingId: number, comments: boolean) => {
        await db
        .update(schema.notificationSetting)
        .set({ comments })
        .where(eq(schema.notificationSetting.id, notificationSettingId));
    },

    updateLikesSetting: async (notificationSettingId: number, likes: boolean) => {
        await db
        .update(schema.notificationSetting)
        .set({ likes })
        .where(eq(schema.notificationSetting.id, notificationSettingId));
    },

    updateFriendRequestsSetting: async (notificationSettingId: number, friendRequests: boolean) => {
        await db
        .update(schema.notificationSetting)
        .set({ friendRequests })
        .where(eq(schema.notificationSetting.id, notificationSettingId));
    }
};

export default notificationSettingRepository;
