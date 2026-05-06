import { SERVER_CONFIG } from '../config/server-config';
import { prisma } from '../prisma/db';
import type { ChatMessage } from '../types/chat-message.types';

class ChatMessageService {
    //! Parte de mensajes grupales
    async sendGroupMessage(
        content: string,
        senderId: string,
        groupId?: string,
    ): Promise<ChatMessage> {
        if (!groupId) {
            const defaultGroup = await prisma.group.findFirst({
                where: {
                    name: SERVER_CONFIG.defaultChannelName,
                },
            });

            if (!defaultGroup) {
                throw new Error('Default group not found');
            }

            groupId = defaultGroup.id;
        }

        const sender = await prisma.user.findFirst({
            where: {
                id: senderId,
            },
        });

        if (!sender) {
            throw new Error('User not found');
        }

        const groupMessage = await prisma.groupMessage.create({
            data: {
                content,
                groupId,
                senderId,
            },
        });

        return {
            id: groupMessage.id,
            content: groupMessage.content,
            createdAt: groupMessage.createdAt.getTime(),
            groupId,
            sender: {
                id: senderId,
                email: sender.email,
                name: sender.name,
            },
        };
    }

    async getGroupMessages(groupId: string): Promise<ChatMessage[]> {
        const messages = await prisma.groupMessage.findMany({
            where: { groupId },
            include: {
                sender: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 30,
        });

        return messages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt.getTime(),
            groupId: msg.groupId,
            sender: {
                id: msg.sender.id,
                email: msg.sender.email,
                name: msg.sender.name,
            },
        }));
    }

    //! Parte de mensajes directos
}

export const chatMessageService = new ChatMessageService();
