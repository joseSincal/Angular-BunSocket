import { effect, Injectable, signal } from '@angular/core';
import { ClientMessage, ServerMessage } from '../types';
import { Subject } from 'rxjs';

type ConnectionState = 'connecting' | 'connected' | 'disconnected';

@Injectable({
  providedIn: 'root',
})
export class WebSocketConnectionService {
  private socket: WebSocket | null = null;
  public connectionStatus = signal<ConnectionState>('connecting');
  public onMessage = new Subject<ServerMessage>();

  constructor() {
    this.connectWebSocket();
  }

  // Mecanismo de re-conexión automática
  private reconnectInterval: number | null = null;
  private reconnectEffect = effect(() => {
    if (this.connectionStatus() === 'disconnected') {
      if (this.reconnectInterval) return;

      this.reconnectInterval = setInterval(() => {
        console.log('Reconnecting...');
        this.connectWebSocket();
      }, 1000); // Reconnect every 5 seconds
    }

    if (this.connectionStatus() === 'connected') {
      clearInterval(this.reconnectInterval || 0);
      this.reconnectInterval = null;
    }
  });

  public connectWebSocket() {
    this.socket = new WebSocket('ws://localhost:3200'); // Replace with your
    if (!this.socket) {
      throw new Error('Failed to create WebSocket connection');
    }

    this.socket.addEventListener('open', () => {
      console.log('Connected');
      this.connectionStatus.set('connected');
    });

    this.socket.addEventListener('close', () => {
      console.log('Disconnected');
      this.connectionStatus.set('disconnected');
    });

    this.socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // ! On Message
    this.socket.addEventListener('message', (event) => {
      const data: ServerMessage = JSON.parse(event.data);
      this.onMessage.next(data);
    });
  }

  public sendMessage(message: ClientMessage) {
    if (!this.socket) throw new Error('WebSocket connection is not established');

    this.socket.send(JSON.stringify(message));
  }
}
