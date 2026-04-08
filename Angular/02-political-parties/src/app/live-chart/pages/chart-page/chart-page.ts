import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { BarChart } from '../../components/bar-chart/bar-chart';
import { ChartForm } from '../../components/chart-form/chart-form';
import { WebSocketConnectionService } from '../../../web-sockets/services/web-socket-connection.service';
import { Subscription } from 'rxjs';
import { Party } from '../../../types';
import { ChartData } from 'chart.js';

@Component({
  selector: 'app-chart-page',
  imports: [BarChart, ChartForm],
  templateUrl: './chart-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartPage implements OnInit, OnDestroy {
  public websSocketService = inject(WebSocketConnectionService);
  public onMessageSubscription: Subscription | null = null;

  protected parties = signal<Party[]>([]);
  protected chartData = computed<ChartData<'bar'>>(() => ({
    labels: this.parties().map((party) => party.name),
    datasets: [
      {
        label: 'Votos',
        data: this.parties().map((party) => party.votes),
        backgroundColor: this.parties().map((party) => party.color),
        borderColor: this.parties().map((party) => party.borderColor),
        borderWidth: 3,
        borderRadius: 10,
      },
    ],
  }));

  ngOnInit(): void {
    this.onMessageSubscription = this.websSocketService.onMessage.subscribe((message) => {
      console.log({ message });

      const { type, payload } = message;

      switch (type) {
        case 'PARTIES_LIST':
          this.parties.set(payload);
          break;

        case 'PARTY_UPDATED':
        case 'VOTES_UPDATED':
          this.parties.update((parties) =>
            parties.map((party) => (party.id === payload.id ? payload : party)),
          );
          break;

        case 'PARTY_DELETED':
          this.parties.update((parties) => parties.filter((party) => party.id !== payload.id));
          break;

        case 'PARTY_ADDED':
          this.parties.update((parties) => [...parties, payload]);
          break;

        default:
          console.warn('Unknown message type: ', type);
      }
    });
  }

  ngOnDestroy(): void {
    this.onMessageSubscription?.unsubscribe();
  }
}
