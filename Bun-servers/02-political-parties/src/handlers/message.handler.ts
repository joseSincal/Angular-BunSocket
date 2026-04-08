import {
    messageSchema,
    type MessageParsed,
} from '../schemas/websocket-message.schema';
import { partyService } from '../services/party.service';
import type { WebSocketMessage, WebSocketResponse } from '../types';

const createErrorResponse = (error: string): WebSocketResponse => {
    return {
        type: 'ERROR',
        payload: { error },
    };
};

// Handlers específicos
const handleAddParty = (
    payload: MessageParsed['payload'],
): WebSocketResponse => {
    if (!payload?.name || !payload?.color || !payload?.borderColor) {
        return createErrorResponse('Name, color or borderColor are required');
    }

    const newParty = partyService.add(
        payload.name,
        payload.color,
        payload.borderColor,
    );

    return {
        type: 'PARTY_ADDED',
        payload: newParty,
    };
};

export const handleGetParties = (): WebSocketResponse => {
    return {
        type: 'PARTIES_LIST',
        payload: partyService.getAll(),
    };
};

const handleUpdateParty = (
    payload: MessageParsed['payload'],
): WebSocketResponse => {
    if (!payload?.id) {
        return createErrorResponse('Party ID is required');
    }

    const updatedParty = partyService.update(payload.id, {
        name: payload.name,
        color: payload.color,
        borderColor: payload.borderColor,
        votes: payload.votes,
    });

    if (!updatedParty) {
        return createErrorResponse(`Party with ID ${payload.id} not found`);
    }

    return {
        type: 'PARTY_UPDATED',
        payload: updatedParty,
    };
};

const handleDeleteParty = (
    payload: MessageParsed['payload'],
): WebSocketResponse => {
    if (!payload?.id) {
        return createErrorResponse('Party ID is required');
    }

    const deleted = partyService.delete(payload.id);
    if (!deleted) {
        return createErrorResponse(
            `Party with ID ${payload.id} not found or cant be deleted`,
        );
    }

    return {
        type: 'PARTY_DELETED',
        payload: {
            id: payload.id,
        },
    };
};

const handleIncrementVotes = (
    payload: MessageParsed['payload'],
): WebSocketResponse => {
    if (!payload?.id) {
        return createErrorResponse('Party ID is required');
    }

    const party = partyService.incrementVotes(payload.id);
    if (!party) {
        return createErrorResponse(
            `Party with ID ${payload.id} not found or cant be updated`,
        );
    }

    return {
        type: 'VOTES_UPDATED',
        payload: party,
    };
};

const handleDecrementVotes = (
    payload: MessageParsed['payload'],
): WebSocketResponse => {
    if (!payload?.id) {
        return createErrorResponse('Party ID is required');
    }

    const party = partyService.decrementVotes(payload.id);
    if (!party) {
        return createErrorResponse(
            `Party with ID ${payload.id} not found or cant be updated`,
        );
    }

    return {
        type: 'VOTES_UPDATED',
        payload: party,
    };
};

//! General Handler o controlador general
export const handleMessage = (message: string): WebSocketResponse => {
    try {
        const jsonData: WebSocketMessage = JSON.parse(message);
        const parsedResult = messageSchema.safeParse(jsonData);

        if (!parsedResult.success) {
            console.log(parsedResult.error);
            const errorMessage = parsedResult.error.issues
                .map((issue) => issue.message)
                .join(', ');
            return createErrorResponse(
                `Invalid message format: ${errorMessage}`,
            );
        }

        const { type, payload } = parsedResult.data;

        switch (type) {
            case 'ADD_PARTY':
                return handleAddParty(payload);

            case 'DECREMENT_VOTES':
                return handleDecrementVotes(payload);

            case 'DELETE_PARTY':
                return handleDeleteParty(payload);

            case 'GET_PARTIES':
                return handleGetParties();

            case 'INCREMENT_VOTES':
                return handleIncrementVotes(payload);

            case 'UPDATE_PARTY':
                return handleUpdateParty(payload);

            default:
                return createErrorResponse(`Unknown message type: ${type}`);
        }
    } catch (error) {
        return createErrorResponse('Validation error');
    }
};
