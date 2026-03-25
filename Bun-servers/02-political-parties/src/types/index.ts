export interface PoliticalParty {
    id: string;
    name: string;
    color: string;
    borderColor: string;
    votes: number;
}

export interface WebSocketMessage {
    type: MessageType;
    payload: unknown;
}

// TODO: MessagePayload

export type MessageType =
    | 'GET_PARTIES'
    | 'ADD_PARTY'
    | 'UPDATE_PARTY'
    | 'DELETE_PARTY'
    | 'INCREMENT_VOTES'
    | 'DECREMENT_VOTES';

export interface WebSocketResponse {
    type: ResponseType;
    payload: unknown;
}
// TODO: ResponsePayload

export type ResponseType =
    | 'PARTIES_LIST'
    | 'PARTY_ADDED'
    | 'PARTY_UPDATED'
    | 'PARTY_DELETED'
    | 'VOTES_UPDATED'
    | 'ERROR';

export interface WebSocketData {
    clientId: string;
}
