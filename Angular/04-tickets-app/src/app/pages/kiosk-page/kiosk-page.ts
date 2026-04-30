import { Component, inject, OnDestroy, signal } from '@angular/core';
import { ElderlyCoupleIcon } from '../../icons/elderly-couple.icon';
import { PersonIcon } from '../../icons/person.icon';
import { PregnantIcon } from '../../icons/pregnant.icon';
import { WheelChairIcon } from '../../icons/wheel-chair.icon';
import { WebSocketService } from '../../web-sockets/services/websocket.service';
import { TicketPrefix } from '../../types';

@Component({
  selector: 'app-kiosk-page',
  imports: [ElderlyCoupleIcon, PersonIcon, PregnantIcon, WheelChairIcon],
  templateUrl: './kiosk-page.html',
})
export class KioskPage implements OnDestroy {
  private readonly websocketService = inject(WebSocketService);

  protected readonly isTicketModalOpen = signal(false);
  protected readonly ticketNumber = signal<string | null>(null);

  private readonly onMessage$ = this.websocketService.onMessage.subscribe((message) => {
    if (message.type === 'TICKET_CREATED') {
      this.ticketNumber.set(message.payload.ticket.id);
      this.isTicketModalOpen.set(true);
    }
  });

  public getTicketNumber(prefix: TicketPrefix): void {
    this.websocketService.sendMessage({
      type: 'CREATE_TICKET',
      payload: {
        isPreferential: prefix === 'P',
      },
    });
  }

  protected closeTicketModal(): void {
    this.isTicketModalOpen.set(false);
    this.ticketNumber.set(null);
  }

  public ngOnDestroy(): void {
    this.onMessage$.unsubscribe();
  }
}
