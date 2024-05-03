import { eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

const notificationSettingRepository = {
    getNotificationSettings: async (notificationSettingId: number) => {
        const notificationSettings = await db
        .selectDistinct()
        .from(schema.notificationSetting)
        .where(eq(schema.notificationSetting.id, notificationSettingId));
        return notificationSettings[0];
    },

    updateNotificationSetting: async(notificationSettingId: number, key: keyof typeof schema.notificationSetting, newValue: boolean) => {
        await db
        .update(schema.notificationSetting)
        .set({ [key]: newValue })
        .where(eq(schema.notificationSetting.id, notificationSettingId));
    },
};

export default notificationSettingRepository;
