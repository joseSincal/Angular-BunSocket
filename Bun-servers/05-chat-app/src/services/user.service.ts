import { prisma } from '../prisma/db';
import type { Sender } from '../types/chat-message.types';

class UserService {
    // TODO: ConnectedUsers

    async getSenderById(userId: string): Promise<Sender | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) return null;

        return {
            id: user.id,
            email: user.email,
            name: user.name,
        };
    }
}

export const userService = new UserService();
