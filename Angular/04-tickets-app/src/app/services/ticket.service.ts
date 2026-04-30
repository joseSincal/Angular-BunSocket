import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { WebSocketService } from '../web-sockets/services/websocket.service';
import { QueueMessageState } from '../web-sockets/types';

@Injectable({
  providedIn: 'root',
})
export class TicketService implements OnDestroy {
  private readonly websocketService = inject(WebSocketService);
  private readonly ticketState = signal<QueueMessageState | null>(null);

  readonly queueCount = computed(() => this.ticketState()?.pendingTotal.combined ?? 0);
  readonly activeByDesk = computed(() => this.ticketState()?.activeByDesk || {});
  readonly recentTickets = computed(() => this.ticketState()?.recentlyServed || []);

  private readonly onMessage$ = this.websocketService.onMessage.subscribe((message) => {
    if (message.type === 'QUEUE_STATE') {
      this.ticketState.set(message.payload.state);
    }
  });

  ngOnDestroy(): void {
    this.onMessage$.unsubscribe();
  }
}
