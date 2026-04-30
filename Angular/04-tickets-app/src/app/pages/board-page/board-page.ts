import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { WeatherWidget } from '../../components/weather-widget/weather-widget';
import { YouTubePlayer } from '../../components/youtube-player/youtube-player';
import { Ticket } from '../../types';
import { TicketService } from '../../services/ticket.service';

@Component({
  selector: 'app-board-page',
  imports: [WeatherWidget, YouTubePlayer],
  templateUrl: './board-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardPage {
  private readonly ticketService = inject(TicketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly weatherLatitude = 14.6686309;
  protected readonly weatherLongitude = -91.0107563;
  protected readonly weatherLabel = 'Patzún, Chimaltenango';

  protected readonly videoId = 'dQw4w9WgXcQ';
  protected readonly videoTitle = 'Video informativo';

  protected readonly isMuted = signal(true);

  private readonly nowMs = signal<number>(Date.now());
  protected readonly timeText = computed(() => formatTimeEs(this.nowMs()));
  protected readonly dateText = computed(() => formatDateEs(this.nowMs()));

  protected readonly attendedTickets = computed(() => this.ticketService.recentTickets());

  constructor() {
    if (!this.isBrowser) return;

    const intervalId = window.setInterval(() => {
      this.nowMs.set(Date.now());
    }, 1000);

    this.destroyRef.onDestroy(() => window.clearInterval(intervalId));
  }

  protected toggleMute(): void {
    this.isMuted.update((prev) => !prev);
  }
}

interface AttendedTicket {
  id: string;
  desk: string;
}

function formatTimeEs(epochMs: number): string {
  const formatter = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(epochMs);
}

function formatDateEs(epochMs: number): string {
  const formatter = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  const raw = formatter.format(epochMs);
  return capitalizeFirstLetter(raw);
}

function capitalizeFirstLetter(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
