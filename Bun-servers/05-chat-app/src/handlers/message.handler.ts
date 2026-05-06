import { messageSchema } from '../schemas/websocket-message.schema';
import type { HandleResult, WebSocketData } from '../types';
import { createErrorResponse } from './error.handlers';
import { handleSendGroupMessage } from './group-message.handlers';

//! General Handler o controlador general
export const handleMessage = async (
    message: string,
    webSocketData: WebSocketData,
): Promise<HandleResult> => {
    try {
        const jsonData = JSON.parse(message);
        const parsedResult = messageSchema.safeParse(jsonData);

        if (!parsedResult.success) {
            console.log(parsedResult.error);
            const errorMessage = parsedResult.error.issues
                .map((issue) => issue.message)
                .join(', ');

            return createErrorResponse(`Validation error ${errorMessage}`);
        }

        const { type, payload } = parsedResult.data;

        switch (type) {
            case 'SEND_GROUP_MESSAGE':
                const groupMessage = await handleSendGroupMessage({
                    content: payload.content,
                    senderId: webSocketData.userId,
                    groupId: payload.groupId,
                });
                return {
                    personal: [groupMessage],
                    broadcast: [groupMessage],
                };

            default:
                return createErrorResponse(
                    `Type message not implemented: ${type}`,
                );
        }
    } catch (error) {
        console.log([error]);
        return createErrorResponse(
            `Validation error - Message is not a JSON Object`,
        );
    }
};
