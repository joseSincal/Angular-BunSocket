import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';

type WeatherStatus = 'idle' | 'loading' | 'success' | 'error';

type WeatherData = {
  temperatureC: number;
  weatherCode: number;
  observedAtIso?: string;
};

type OpenMeteoResponse = {
  current_weather?: {
    temperature?: number;
    weathercode?: number;
    weather_code?: number;
    time?: string;
  };
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    time?: string;
  };
};

function getWeatherLabelEs(weatherCode: number): string {
  if (weatherCode === 0) return 'Despejado';
  if (weatherCode === 1) return 'Mayormente despejado';
  if (weatherCode === 2) return 'Parcialmente nublado';
  if (weatherCode === 3) return 'Nublado';
  if (weatherCode === 45 || weatherCode === 48) return 'Niebla';
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return 'Llovizna';
  if ([61, 63, 65, 66, 67].includes(weatherCode)) return 'Lluvia';
  if ([71, 73, 75, 77].includes(weatherCode)) return 'Nieve';
  if ([80, 81, 82].includes(weatherCode)) return 'Chubascos';
  if ([85, 86].includes(weatherCode)) return 'Chubascos de nieve';
  if (weatherCode === 95) return 'Tormenta';
  if (weatherCode === 96 || weatherCode === 99) return 'Tormenta con granizo';
  return 'Clima';
}

function formatTemperatureC(temperatureC: number): string {
  const rounded = Math.round(temperatureC);
  return `${rounded}°C`;
}

async function fetchOpenMeteoCurrentWeather(
  latitude: number,
  longitude: number,
  signal: AbortSignal
): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current_weather', 'true');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Weather request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OpenMeteoResponse;

  const temperatureC = data.current_weather?.temperature ?? data.current?.temperature_2m;

  const weatherCode =
    data.current_weather?.weathercode ??
    data.current_weather?.weather_code ??
    data.current?.weather_code;

  const observedAtIso = data.current_weather?.time ?? data.current?.time;

  if (typeof temperatureC !== 'number' || typeof weatherCode !== 'number') {
    throw new Error('Weather response missing required fields.');
  }

  return { temperatureC, weatherCode, observedAtIso };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

@Component({
  selector: 'weather-widget',
  imports: [],
  templateUrl: './weather-widget.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherWidget {
  public latitude = input.required<number>();
  public longitude = input.required<number>();
  public label = input<string | undefined>(undefined);
  public refreshIntervalMs = input<number>(10 * 60 * 1000);

  public status = signal<WeatherStatus>('idle');
  public weather = signal<WeatherData | null>(null);

  public locationText = computed(() => {
    const rawLabel = this.label();
    if (!rawLabel) return null;
    const trimmed = rawLabel.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

  public isLoading = computed(() => {
    const status = this.status();
    return status === 'idle' || status === 'loading';
  });

  public temperatureText = computed(() => {
    const weather = this.weather();
    return weather ? formatTemperatureC(weather.temperatureC) : null;
  });

  public weatherLabel = computed(() => {
    const weather = this.weather();
    return weather ? getWeatherLabelEs(weather.weatherCode) : null;
  });

  constructor() {
    effect((onCleanup) => {
      const latitude = this.latitude();
      const longitude = this.longitude();
      const refreshIntervalMs = this.refreshIntervalMs();

      let isCancelled = false;
      let intervalId: number | null = null;
      let activeController: AbortController | null = null;

      const run = async () => {
        activeController?.abort();

        const controller = new AbortController();
        activeController = controller;

        try {
          this.status.update((prev) => (prev === 'success' ? prev : 'loading'));

          const nextWeather = await fetchOpenMeteoCurrentWeather(
            latitude,
            longitude,
            controller.signal
          );

          if (isCancelled) return;

          this.weather.set(nextWeather);
          this.status.set('success');
        } catch (error) {
          if (isCancelled || isAbortError(error)) return;
          this.status.set('error');
        }
      };

      void run();
      intervalId = window.setInterval(() => void run(), refreshIntervalMs);

      onCleanup(() => {
        isCancelled = true;

        if (intervalId !== null) {
          window.clearInterval(intervalId);
        }

        activeController?.abort();
        activeController = null;
      });
    });
  }
}
