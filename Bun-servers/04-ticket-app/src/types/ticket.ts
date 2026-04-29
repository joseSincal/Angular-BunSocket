export type TicketPrefix = 'A' | 'P';

export interface Ticket {
    id: string; // A-001, P-001
    prefix: TicketPrefix;
    number: number;
    deskNumber: number | undefined;
    createdAt: number;
    servedAt: number | undefined;
}
