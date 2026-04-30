import { effect, Injectable, signal } from '@angular/core';
import type { ClientMessage, ServerMessage } from '../types';
import { Subject } from 'rxjs';

type ConnectionStatus = 'offline' | 'connecting' | 'connected' | 'disconnected';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  public connectionStatus = signal<ConnectionStatus>('disconnected');
  public onMessage = new Subject<ServerMessage>();

  constructor() {
    this.connectWebSocket();
  }

  // Mecanismo de re-conexión
  private reconnectInterval: number | null = null;
  private reconnectEffect = effect(() => {
    if (this.connectionStatus() === 'disconnected') {
      if (this.reconnectInterval) return;

      this.reconnectInterval = setInterval(() => {
        console.log('Reconnecting...');
        this.connectWebSocket();
      }, 1000); // crear un valor random...
    }

    if (this.connectionStatus() === 'connected') {
      clearInterval(this.reconnectInterval || 0);
      this.reconnectInterval = null;
    }
  });

  public login() {
    if (this.connectionStatus() === 'connecting' || this.connectionStatus() === 'connected') return;

    this.connectWebSocket();
  }

  private connectWebSocket() {
    this.socket = new WebSocket('ws://localhost:3200');
    if (!this.socket) {
      throw new Error('Failed to connect to the server');
    }

    this.socket.addEventListener('open', () => {
      console.log('Connected');
      this.connectionStatus.set('connected');
    });

    this.socket.addEventListener('close', () => {
      console.log('Disconnected');
      this.connectionStatus.set('disconnected');
    });

    this.socket.addEventListener('error', (event) => {
      console.log('Error: ', event);
    });

    // ! On Message
    this.socket.addEventListener('message', (event) => {
      const data: ServerMessage = JSON.parse(event.data);
      console.log(data);
      this.onMessage.next(data);
    });
  }

  public sendMessage(message: ClientMessage) {
    if (!this.socket) throw new Error('Socket not connected');

    this.socket.send(JSON.stringify(message));
  }
}
