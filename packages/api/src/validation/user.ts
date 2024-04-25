import { z } from 'zod';

const userId = z.string().min(1);

export const updateNameSchema = z.object({
    name: z.string().min(1),
});

export const updateUsernameSchema = z.object({
    username: z.string().min(1),
})

export const updateDateOfBirthSchema = z.object({
    dateOfBirth: z.date()
});

export const userCompleteSchema = z.object({
    userId,
});

