import { Component, inject, signal } from '@angular/core';
import { ConnectForm } from '../../components/connect-form/connect-form';
import { CustomMap } from '../../components/custom-map/custom-map';
import { LatLng } from '../../../types';
import { WebSocketService } from '../../../web-sockets/services/websocket.service';

@Component({
  selector: 'map-page',
  imports: [ConnectForm, CustomMap],
  templateUrl: './map-page.html',
})
export class MapPage {
  public webSocketService = inject(WebSocketService);

  public currentCenter = signal<LatLng>({ lat: 0, lng: 0 });

  connectForm(formData: { name: string; color: string }) {
    // console.log({ formData });
    // console.log({ currentCenter: this.currentCenter() });
    this.webSocketService.login(formData.name, formData.color, this.currentCenter());
  }
}
