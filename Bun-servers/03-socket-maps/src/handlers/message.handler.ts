import {
    messageSchema,
    type ClientMovePayload,
    type ClientRegisterPayload,
} from '../schemas/websocket-message.schema';
import { clientsService } from '../services/clients.service';
import type { OutgoingWsMessage } from '../types';

interface HandlerResult {
    personal: OutgoingWsMessage[];
    broadcast: OutgoingWsMessage[];
}

const createErrorResponse = (error: string): OutgoingWsMessage => {
    return {
        type: 'ERROR',
        payload: { error: error },
    };
};

//! Handlers específicos
export const handleGetClients = (): HandlerResult => {
    return {
        personal: [
            {
                type: 'CLIENTS_STATE',
                payload: clientsService.getAllClients(),
            },
        ],
        broadcast: [],
    };
};

export const handleClientRegister = (
    clientId: string,
    payload: ClientRegisterPayload,
): HandlerResult => {
    const newClient = clientsService.registerClient(payload);

    if ('error' in newClient) {
        return {
            personal: [createErrorResponse(newClient.error)],
            broadcast: [],
        };
    }

    return {
        personal: [
            {
                type: 'WELCOME',
                payload: newClient,
            },
            {
                type: 'CLIENTS_STATE',
                payload: clientsService
                    .getAllClients()
                    .filter((client) => client.clientId !== clientId),
            },
        ],
        broadcast: [
            {
                type: 'CLIENT_JOINED',
                payload: newClient,
            },
        ],
    };
};

export const handleClientMove = (
    clientId: string,
    payload: ClientMovePayload,
): HandlerResult => {
    const updatedClient = clientsService.clientMoved(clientId, payload);

    if ('error' in updatedClient) {
        return {
            personal: [createErrorResponse(updatedClient.error)],
            broadcast: [],
        };
    }

    return {
        personal: [],
        broadcast: [
            {
                type: 'CLIENT_MOVED',
                payload: updatedClient,
            },
        ],
    };
};

export const handleClientLeft = (clientId: string): HandlerResult => {
    const clientRemoved = clientsService.removeClient(clientId);

    if (clientRemoved) {
        return {
            personal: [],
            broadcast: [
                {
                    type: 'CLIENT_LEFT',
                    payload: { clientId },
                },
            ],
        };
    }

    return {
        personal: [],
        broadcast: [],
    };
};

//! General Handler o controlador general
export const handleMessage = (
    clientId: string,
    rawMessage: string,
): HandlerResult => {
    try {
        const jsonData: unknown = JSON.parse(rawMessage);
        const parsedResult = messageSchema.safeParse(jsonData);

        if (!parsedResult.success) {
            console.log(parsedResult.error);
            const errorMessage = parsedResult.error.issues
                .map((issue) => issue.message)
                .join(', ');

            return {
                broadcast: [],
                personal: [
                    createErrorResponse(`Validation error: ${errorMessage}`),
                ],
            };
        }

        const { type, payload } = parsedResult.data;

        switch (type) {
            case 'GET_CLIENTS':
                return handleGetClients();

            case 'CLIENT_REGISTER':
                return handleClientRegister(clientId, payload);

            case 'CLIENT_MOVE':
                return handleClientMove(clientId, payload);

            case 'CLIENT_LEFT':
                return handleClientLeft(clientId);

            default:
                return {
                    broadcast: [],
                    personal: [
                        createErrorResponse(`Unknown error type: ${type}`),
                    ],
                };
        }
    } catch (error) {
        console.log({ error });
        return {
            broadcast: [],
            personal: [
                createErrorResponse(
                    `Unknown error found: ${error instanceof Error ? error.message : String(error)}`,
                ),
            ],
        };
    }
};
