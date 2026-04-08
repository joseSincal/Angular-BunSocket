import { Component, inject, input } from '@angular/core';
import { ChartFormRow } from '../chart-form-row/chart-form-row';
import { Party } from '../../../types';
import { WebSocketConnectionService } from '../../../web-sockets/services/web-socket-connection.service';

@Component({
  selector: 'chart-form',
  imports: [ChartFormRow],
  templateUrl: './chart-form.html',
  styleUrl: './chart-form.css',
})
export class ChartForm {
  private readonly _webSocketService = inject(WebSocketConnectionService);
  public parties = input.required<Party[]>();

  incrementVotes(party: Party) {
    this._webSocketService.sendMessage({
      type: 'INCREMENT_VOTES',
      payload: { id: party.id },
    });
  }

  decrementVotes(party: Party) {
    this._webSocketService.sendMessage({
      type: 'DECREMENT_VOTES',
      payload: { id: party.id },
    });
  }

  deleteParty(party: Party) {
    this._webSocketService.sendMessage({
      type: 'DELETE_PARTY',
      payload: { id: party.id },
    });
  }

  updateParty(party: Party) {
    this._webSocketService.sendMessage({
      type: 'UPDATE_PARTY',
      payload: { ...party },
    });
  }

  private getRandomHexColor() {
    return (
      '#' +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0')
    );
  }

  addParty() {
    const color = this.getRandomHexColor();
    this._webSocketService.sendMessage({
      type: 'ADD_PARTY',
      payload: {
        name: 'Nuevo Partido',
        color: color + '33',
        borderColor: color,
        votes: 0,
      },
    });
  }
}
