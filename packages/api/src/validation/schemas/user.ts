import { z } from 'zod';
import { userId, name, username, dateOfBirth } from '../utils';

const userSchemas = {
    userId,
    updateName: z.object({
        name,
    }),
    updateUsername: z.object({
        username,
    }),
    updateDateOfBirth: z.object({
        dateOfBirth,
    }),
    userComplete: z.object({
        userId,
    }),
};

export default userSchemas
