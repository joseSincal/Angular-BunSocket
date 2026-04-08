import type { Party } from '../../types';

export type ServerMessage =
  | {
      type: 'PARTIES_LIST';
      payload: Party[];
    }
  | {
      type: 'PARTY_ADDED';
      payload: Party;
    }
  | {
      type: 'PARTY_UPDATED';
      payload: Party;
    }
  | {
      type: 'PARTY_DELETED';
      payload: Party;
    }
  | {
      type: 'VOTES_UPDATED';
      payload: Party;
    }
  | {
      type: 'ERROR';
      payload: { error: string };
    };

export type ClientMessage =
  | {
      type: 'INCREMENT_VOTES';
      payload: { id: string };
    }
  | {
      type: 'DECREMENT_VOTES';
      payload: { id: string };
    }
  | {
      type: 'DELETE_PARTY';
      payload: { id: string };
    }
  | {
      type: 'UPDATE_PARTY';
      payload: Party;
    }
  | {
      type: 'ADD_PARTY';
      payload: Omit<Party, 'id'>;
    }
  | {
      type: 'GET_PARTIES';
      payload: {};
    };
