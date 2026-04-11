import { Component, ElementRef, inject, OnInit, output, viewChild } from '@angular/core';
import { WebSocketService } from '../../../web-sockets/services/websocket.service';
import type { Client, LatLng } from '../../../types';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import Cookies from 'js-cookie';

mapboxgl.accessToken = 'my-access-token';

@Component({
  selector: 'custom-map',
  imports: [],
  templateUrl: './custom-map.html',
  styles: `
    .map {
      width: 100vw;
      height: 100vh;
    }
  `,
})
export class CustomMap implements OnInit {
  private websocketService = inject(WebSocketService);

  private readonly mapElement = viewChild<ElementRef<HTMLDivElement>>('map');
  private map: mapboxgl.Map | null = null;
  private markers = new Map<string, mapboxgl.Marker>();
  public center = output<LatLng>();

  private onMessage$ = this.websocketService.onMessage.subscribe((message) => {
    switch (message.type) {
      case 'WELCOME':
        this.createMarkers([message.payload], true);
        break;

      case 'CLIENT_JOINED':
        this.createMarkers([message.payload]);
        break;

      case 'CLIENTS_STATE':
        this.createMarkers(message.payload);
        break;

      case 'CLIENT_MOVED':
        this.updateMarkerCoords(message.payload.clientId, message.payload.coords);
        break;

      case 'CLIENT_LEFT':
        this.removeMarker(message.payload.clientId);
        break;
    }
  });

  ngOnInit(): void {
    if (!this.mapElement()) throw new Error('Map element not found');

    this.map = new mapboxgl.Map({
      container: this.mapElement()!.nativeElement,
      center: [-122.473043, 37.8033],
      zoom: 16, // starting zoom
    });

    this.center.emit({
      lat: 37.8033,
      lng: -122.473043,
    });
    this.map.on('moveend', () => {
      const currentCenter = this.map!.getCenter();
      this.center.emit({
        lat: currentCenter.lat,
        lng: currentCenter.lng,
      });
    });
  }

  private createMarkers(clients: Client[], isDraggable = false) {
    if (!this.map) return;

    for (const client of clients) {
      const marker = new mapboxgl.Marker({ color: client.color, draggable: isDraggable })
        .setLngLat({
          lat: client.coords.lat,
          lng: client.coords.lng,
        })
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>${client.name}</h3>`))
        .on('dragend', () => {
          Cookies.set('coords', JSON.stringify(marker.getLngLat()));
        })
        .on('drag', () => {
          const coords = marker.getLngLat();
          this.websocketService.sendMessage({
            type: 'CLIENT_MOVE',
            payload: {
              clientId: client.clientId,
              coords: {
                lat: coords.lat,
                lng: coords.lng,
              },
            },
          });
        })
        .addTo(this.map);

      this.markers.set(client.clientId, marker);
    }
  }

  private updateMarkerCoords(clientId: string, latLng: LatLng) {
    if (!this.map) return;
    const marker = this.markers.get(clientId);
    if (!marker) return;

    marker.setLngLat(latLng);
  }

  private removeMarker(clientId: string) {
    if (!this.map) return;
    const marker = this.markers.get(clientId);
    if (!marker) return;

    marker.remove();
    this.markers.delete(clientId);
  }
}
