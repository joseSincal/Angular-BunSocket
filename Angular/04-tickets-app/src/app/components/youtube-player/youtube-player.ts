import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';

type YouTubePlayerVars = {
  autoplay?: 0 | 1;
  mute?: 0 | 1;
  controls?: 0 | 1 | 2;
  modestbranding?: 0 | 1;
  rel?: 0 | 1;
  playsinline?: 0 | 1;
  loop?: 0 | 1;
  playlist?: string;
};

type YouTubePlayerInstance = {
  destroy: () => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  playVideo: () => void;
};

type YouTubePlayerEvent = {
  target: YouTubePlayerInstance;
};

type YouTubePlayerOptions = {
  videoId: string;
  playerVars?: YouTubePlayerVars;
  events?: {
    onReady?: (event: YouTubePlayerEvent) => void;
  };
};

type YouTubeApi = {
  Player: new (
    element: HTMLElement | string,
    options: YouTubePlayerOptions
  ) => YouTubePlayerInstance;
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YouTubeApiLoadState = 'idle' | 'loading' | 'ready' | 'error';

let youtubeApiLoadState: YouTubeApiLoadState = 'idle';
let youtubeApiReadyPromise: Promise<void> | null = null;

function ensureYouTubeIframeApiReady(): Promise<void> {
  if (youtubeApiLoadState === 'ready') return Promise.resolve();
  if (youtubeApiReadyPromise) return youtubeApiReadyPromise;

  youtubeApiLoadState = 'loading';

  youtubeApiReadyPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      youtubeApiLoadState = 'error';
      reject(new Error('YouTube IFrame API requires a browser environment.'));
      return;
    }

    if (window.YT?.Player) {
      youtubeApiLoadState = 'ready';
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-youtube-iframe-api="true"]'
    );

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.dataset['youtubeIframeApi'] = 'true';
      script.onerror = () => {
        youtubeApiLoadState = 'error';
        reject(new Error('Failed to load YouTube IFrame API.'));
      };
      document.head.appendChild(script);
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      youtubeApiLoadState = 'ready';
      resolve();
    };
  });

  return youtubeApiReadyPromise;
}

@Component({
  selector: 'youtube-player',
  imports: [],
  templateUrl: './youtube-player.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YouTubePlayer {
  public videoId = input.required<string>();
  public title = input.required<string>();
  public isMuted = input.required<boolean>();
  public fill = input<boolean>(false);
  public className = input<string | undefined>(undefined);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly playerContainer = viewChild<ElementRef<HTMLDivElement>>('playerContainer');

  private player: YouTubePlayerInstance | null = null;
  private isPlayerReady = false;

  public containerClass = computed(() => {
    const extraClass = (this.className() ?? '').trim();

    return [
      'relative w-full overflow-hidden rounded-3xl bg-black/40 ring-1 ring-white/10',
      this.fill() ? 'h-full' : 'aspect-video',
      extraClass.length > 0 ? extraClass : null,
    ]
      .filter(Boolean)
      .join(' ');
  });

  constructor() {
    effect((onCleanup) => {
      const videoId = this.videoId();
      const containerRef = this.playerContainer();
      const container = containerRef?.nativeElement;

      if (!this.isBrowser) return;
      if (!container) return;

      let isCancelled = false;

      void ensureYouTubeIframeApiReady()
        .then(() => {
          if (isCancelled) return;
          if (!window.YT?.Player) return;

          this.destroyPlayer();

          this.player = new window.YT.Player(container, {
            videoId,
            playerVars: {
              autoplay: 1,
              mute: 1,
              controls: 0,
              modestbranding: 1,
              rel: 0,
              playsinline: 1,
              loop: 1,
              playlist: videoId,
            },
            events: {
              onReady: (event: YouTubePlayerEvent) => {
                this.isPlayerReady = true;

                event.target.mute();
                event.target.playVideo();

                this.applyMuteState();
              },
            },
          });
        })
        .catch(() => {
          // Si falla la carga del API, se mantiene el contenedor negro.
        });

      onCleanup(() => {
        isCancelled = true;
        this.destroyPlayer();
      });
    });

    effect(() => {
      if (!this.isBrowser) return;
      this.applyMuteState();
    });
  }

  private toggleAudioEffect = effect(() => {
    // console.log('toggleAudioEffect', this.isMuted());
    if (this.isMuted()) {
      this.player?.mute();
      return;
    }

    this.player?.unMute();
    this.player?.setVolume(70);
    this.player?.playVideo();
  });

  private applyMuteState(): void {
    if (!this.isPlayerReady) return;

    const player = this.player;
    if (!player) return;

    if (this.isMuted()) {
      player.mute();
      return;
    }

    player.unMute();
    player.setVolume(70);
    player.playVideo();
  }

  private destroyPlayer(): void {
    this.player?.destroy();
    this.player = null;
    this.isPlayerReady = false;
  }
}
