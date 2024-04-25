import { z } from 'zod';

const userId = z.string().min(1);

export const createUserSchema = z.object({
    userId,
});

export const getUserSchema = z.object({
    userId,
});

export const deleteUserSchema = z.object({
    userId,
});

export const updateUserSchema = z.object({
    userId,
    username: z.string().min(1),
});

