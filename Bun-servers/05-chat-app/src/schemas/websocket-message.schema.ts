import { z } from 'zod';

export const messageSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('SEND_GROUP_MESSAGE'),
        payload: z.object({
            groupId: z.string().optional(), // Usare el default chat id
            content: z.string('Content is required'),
        }),
    }),

    z.object({
        type: z.literal('SEND_DIRECT_MESSAGE'),
        payload: z.object({
            receiverId: z.string('Receiver ID is required'),
            content: z.string('Content is required'),
        }),
    }),

    z.object({
        type: z.literal('GET_GROUP_MESSAGES'),
        payload: z.object({
            groupId: z.string('Group ID is required'),
        }),
    }),

    z.object({
        type: z.literal('GET_DIRECT_MESSAGES'),
        payload: z.object({
            receiverId: z.string('Receiver ID is required'),
        }),
    }),
]);
