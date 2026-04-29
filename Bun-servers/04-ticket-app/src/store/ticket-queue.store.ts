import type { QueueMessageState } from '../types/queue-message-state';
import type { Ticket, TicketPrefix } from '../types/ticket';
import { formatTicketId } from '../utils/format-ticket-id';

const DEFAULT_RECENTLY_SERVE_LIMIT = 8;

interface QueueStoreState {
    lastTicketNumbers: {
        A: number;
        P: number;
    };
    pending: {
        normal: Ticket[];
        preferential: Ticket[];
    };
    activeByDesk: Record<number, Ticket | undefined>;
    recentlyServed: Ticket[];
}

export class TicketQueueStore {
    private state: QueueStoreState = {
        activeByDesk: {},
        lastTicketNumbers: {
            A: 0,
            P: 0,
        },
        pending: {
            normal: [],
            preferential: [],
        },
        recentlyServed: [],
    };

    getState(): QueueMessageState {
        const { lastTicketNumbers, pending, activeByDesk, recentlyServed } =
            this.state;

        return {
            lastTicketNumbers,
            pendingTotal: {
                normal: pending.normal.length,
                preferential: pending.preferential.length,
                combined: pending.normal.length + pending.preferential.length,
            },
            activeByDesk,
            recentlyServed,
        };
    }

    reset() {
        this.state = {
            activeByDesk: {},
            lastTicketNumbers: {
                A: 0,
                P: 0,
            },
            pending: {
                normal: [],
                preferential: [],
            },
            recentlyServed: [],
        };
    }

    createTicket(prefix: TicketPrefix): Ticket {
        const validPrefix = ['A', 'P'].includes(prefix);

        if (!validPrefix) {
            throw new Error(`invalid prefix: ${prefix}. Must be 'A' or 'P'`);
        }

        let currentNumber = this.state.lastTicketNumbers[prefix] ?? 0;
        if (currentNumber >= 999) {
            currentNumber = 0;
        }

        const nextNumber = currentNumber + 1;
        this.state.lastTicketNumbers[prefix] = nextNumber;

        const newTicket: Ticket = {
            id: formatTicketId(prefix, nextNumber),
            prefix,
            number: nextNumber,
            deskNumber: undefined,
            createdAt: Date.now(),
            servedAt: undefined,
        };

        if (prefix === 'P') {
            this.state.pending.preferential.push(newTicket);
        } else {
            this.state.pending.normal.push(newTicket);
        }

        return newTicket;
    }

    assignNextTicket(deskNumber: number, forceNormalTicket: boolean) {
        let ticket: Ticket | undefined = undefined;

        if (forceNormalTicket) {
            ticket = this.state.pending.normal.shift();
        }

        ticket ??= this.state.pending.preferential.shift();
        ticket ??= this.state.pending.normal.shift();

        if (!ticket) return undefined;

        ticket.deskNumber = deskNumber;
        ticket.servedAt = Date.now();

        this.state.activeByDesk[deskNumber] = ticket;
        this._pushRecentlyServed(ticket);

        return ticket;
    }

    private _pushRecentlyServed(ticket: Ticket): void {
        this.state.recentlyServed.unshift(ticket);

        if (this.state.recentlyServed.length > DEFAULT_RECENTLY_SERVE_LIMIT) {
            this.state.recentlyServed = this.state.recentlyServed.slice(
                0,
                DEFAULT_RECENTLY_SERVE_LIMIT,
            );
        }
    }
}
