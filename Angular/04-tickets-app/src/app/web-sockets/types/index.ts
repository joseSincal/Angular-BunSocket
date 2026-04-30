import { Ticket } from '../../types';

export interface QueueMessageState {
  lastTicketNumbers: {
    A: number;
    P: number;
  };
  pendingTotal: {
    normal: number;
    preferential: number;
    combined: number;
  };
  activeByDesk: Record<number, Ticket | undefined>;
  recentlyServed: Ticket[]; // últimos 8
}

export type ClientMessage =
  | {
      type: 'GET_STATE';
    }
  | {
      type: 'CREATE_TICKET';
      payload: { isPreferential: boolean };
    }
  | {
      type: 'REQUEST_NEXT_TICKET';
      payload: { deskNumber: number; forceNormalTicket: boolean };
    }
  | { type: 'RESET_QUEUE' };

export type ServerMessage =
  | {
      type: 'ERROR';
      payload: {
        error: string;
      };
    }
  | {
      type: 'TICKET_CREATED';
      payload: {
        ticket: Ticket;
      };
    }
  | {
      type: 'NEXT_TICKET_ASSIGNED';
      payload: {
        ticket?: Ticket;
      };
    }
  | {
      type: 'QUEUE_EMPTY';
    }
  | {
      type: 'QUEUE_STATE';
      payload: { state: QueueMessageState };
    };
