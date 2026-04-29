import {
    messageSchema,
    type MessageParsed,
} from '../schemas/websocket-message.schema';
import { ticketQueueService } from '../services/ticket-queue.service';
import type { ClientMessage, HandleResult, ServerMessage } from '../types';
import type { TicketPrefix } from '../types/ticket';

const createErrorMessage = (error: string): ServerMessage => {
    return {
        type: 'ERROR',
        payload: { error: error },
    };
};

//! Handlers específicos
export const createEmptyResponse = (): HandleResult => {
    return {
        personal: [],
        broadcast: [],
    };
};

export const createQueueStateMessage = (): ServerMessage => {
    return {
        type: 'QUEUE_STATE',
        payload: {
            state: ticketQueueService.getState(),
        },
    };
};

export const createResetQueueMessage = (): ServerMessage => {
    ticketQueueService.reset();
    return createQueueStateMessage();
};

export const createNewTicketMessage = (
    isPreferential: boolean,
): ServerMessage => {
    const prefix: TicketPrefix = isPreferential ? 'P' : 'A';
    const newTicket = ticketQueueService.createTicket(prefix);

    return {
        type: 'TICKET_CREATED',
        payload: {
            ticket: newTicket,
        },
    };
};

export const createNextTicketAssignedMessage = (
    deskNumber: number,
    forceNormalTicket: boolean,
): ServerMessage => {
    const assignedTicket = ticketQueueService.assignNextTicket(
        deskNumber,
        forceNormalTicket,
    );

    if (assignedTicket) {
        return {
            type: 'NEXT_TICKET_ASSIGNED',
            payload: {
                ticket: assignedTicket,
            },
        };
    } else {
        return {
            type: 'QUEUE_EMPTY',
        };
    }
};

//! General Handler o controlador general
export const handleMessage = (message: string): HandleResult => {
    try {
        const jsonData = JSON.parse(message);
        const parsedResult = messageSchema.safeParse(jsonData);

        const response = createEmptyResponse();

        if (!parsedResult.success) {
            const errorMessage = parsedResult.error.issues
                .map((issue) => issue.message)
                .join(', ');

            response.personal.push(
                createErrorMessage(`Validation error: ${errorMessage}`),
            );

            return response;
        }

        const parsed = parsedResult.data;

        switch (parsed.type) {
            case 'CREATE_TICKET':
                const ticketMessage = createNewTicketMessage(
                    parsed.payload.isPreferential,
                );
                response.personal.push(ticketMessage);
                response.personal.push(createQueueStateMessage());
                response.broadcast.push(createQueueStateMessage());
                return response;

            case 'GET_STATE':
                const stateMessage = createQueueStateMessage();
                response.personal.push(stateMessage);
                return response;

            case 'REQUEST_NEXT_TICKET':
                const { deskNumber, forceNormalTicket } = parsed.payload;
                const nextTicketMessage = createNextTicketAssignedMessage(
                    deskNumber,
                    forceNormalTicket,
                );

                response.personal.push(nextTicketMessage);
                response.personal.push(createQueueStateMessage());
                response.broadcast.push(createQueueStateMessage());
                return response;

            case 'RESET_QUEUE':
                const resetMessage = createResetQueueMessage();
                response.personal.push(resetMessage);
                response.broadcast.push(resetMessage);
                return response;

            default:
                response.personal.push(
                    createErrorMessage(`Unknown message type: ${type}`),
                );
                return response;
        }
    } catch (error) {
        return {
            personal: [
                createErrorMessage(
                    `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                ),
            ],
            broadcast: [],
        };
    }
};
