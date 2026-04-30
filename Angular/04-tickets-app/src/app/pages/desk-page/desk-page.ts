import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  OnDestroy,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { WebSocketService } from '../../web-sockets/services/websocket.service';
import { Ticket } from '../../types';
import { TicketService } from '../../services/ticket.service';

@Component({
  selector: 'app-desk-page',
  imports: [RouterModule],
  templateUrl: './desk-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeskPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly websocketService = inject(WebSocketService);
  private readonly ticketService = inject(TicketService);

  protected readonly deskId = computed(() => {
    const routeDeskNumber = this.route.snapshot.paramMap.get('deskNumber') ?? '1';
    const parsedDeskNumber = +routeDeskNumber;
    return Number.isFinite(parsedDeskNumber) && parsedDeskNumber > 0 ? parsedDeskNumber : 1;
  });

  protected readonly queueCount = computed(() => this.ticketService.queueCount());
  // protected readonly currentTicketId = signal<string | null>(null); // null
  protected readonly currentTicketId = linkedSignal<string | null>(() => {
    const deskId = this.deskId();
    const lastTicket = this.ticketService.activeByDesk()[deskId];
    return lastTicket?.id || null;
  });
  protected readonly recentTickets = signal<Ticket[]>([]);

  protected readonly canTakeNextTicket = computed(() => this.queueCount() > 0);
  protected readonly canFinishAttention = computed(() => this.currentTicketId() !== null);

  private readonly onMessage$ = this.websocketService.onMessage.subscribe((message) => {
    if (message.type === 'NEXT_TICKET_ASSIGNED') {
      if (message.payload.ticket) {
        this.recentTickets.update((prev) => [message.payload.ticket!, ...prev].slice(0, 8));
      }
      this.currentTicketId.set(message.payload.ticket?.id || null);
    }
  });

  ngOnDestroy(): void {
    this.onMessage$.unsubscribe();
  }

  public takeNextTicket(forceNormalTicket: boolean) {
    this.websocketService.sendMessage({
      type: 'REQUEST_NEXT_TICKET',
      payload: {
        deskNumber: this.deskId(),
        forceNormalTicket,
      },
    });
  }
}
