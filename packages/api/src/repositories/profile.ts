// src/repositories/ProfileRepository.ts
import { eq } from "drizzle-orm";
import { db, schema } from "@acme/db";

class ProfileRepository {
    // Static method to create a profile
    static async createProfile() {
        const result = await db.insert(schema.profile).values({});
        return result[0].insertId; // Assuming the ID is returned upon creation
    }

    // Static method to retrieve a profile by its ID
    static async getProfile(profileId: number) {
        const profiles = await db
            .select()
            .from(schema.profile)
            .where(eq(schema.profile.id, profileId));
        return profiles.length > 0 ? profiles[0] : null;
    }

    // Static method to update the name of a profile
    static async updateProfileName(profileId: number, newName: string) {
        await db
            .update(schema.profile)
            .set({ name: newName })
            .where(eq(schema.profile.id, profileId));
    }

    // Static method to update the date of birth of a profile
    static async updateProfileDateOfBirth(profileId: number, newDateOfBirth: Date) {
        await db
            .update(schema.profile)
            .set({ dateOfBirth: newDateOfBirth })
            .where(eq(schema.profile.id, profileId));
    }

    // Static method to delete a profile
    static async deleteProfile(profileId: number) {
        await db.delete(schema.profile).where(eq(schema.profile.id, profileId));
    }
}

export default ProfileRepository;
