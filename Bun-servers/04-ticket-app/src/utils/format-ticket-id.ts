import type { TicketPrefix } from '../types/ticket';

export const formatTicketId = (prefix: TicketPrefix, number: number) => {
    return `${prefix}-${number.toString().padStart(3, '0')}`;
};
