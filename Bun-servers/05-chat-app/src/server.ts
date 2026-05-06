import { SERVER_CONFIG } from './config/server-config';

import indexHtml from '../public/index.html';
import { generateUuid } from './utils/generate-uuid';
import type { WebSocketData } from './types';
import { handleMessage } from './handlers/message.handler';
import { handleApiRequest } from './handlers-rest';
import { validateJwToken } from './utils/jwt-validation';
import type { Sender } from './types/chat-message.types';
import { userService } from './services/user.service';
import { handleGetGroupMessages } from './handlers/group-message.handlers';

export const createServer = () => {
    const server = Bun.serve<WebSocketData>({
        port: SERVER_CONFIG.port,

        routes: {
            '/': indexHtml,
        },

        async fetch(req, server) {
            const response = await handleApiRequest(req);
            if (response) {
                return response;
            }

            //! Identificar nuestros clientes/usuarios
            const cookies = new Bun.CookieMap(req.headers.get('Cookie') || '');
            const jwt = cookies.get('X-Token');

            if (!jwt) {
                return new Response('Unauthorized', { status: 401 });
            }

            const { userId } = await validateJwToken(jwt);
            if (!userId) {
                return new Response('Unauthorized', { status: 401 });
            }

            const user = await userService.getSenderById(userId);
            if (!user) {
                return new Response('Unauthorized', { status: 401 });
            }

            //* Identificar nuestros clientes
            const clientId = generateUuid();
            const upgraded = server.upgrade(req, {
                data: { clientId, email: user.email, name: user.name, userId },
            });

            if (upgraded) {
                return undefined;
            }

            return new Response('Upgrade failed', { status: 500 });
        },
        websocket: {
            async open(ws) {
                //! Una nueva conexión
                //! Suscribir el cliente a un canal por defecto
                ws.subscribe(SERVER_CONFIG.defaultChannelName);
                ws.subscribe(ws.data.userId);

                //! Cuando nos conectamos
                const groupMessages = await handleGetGroupMessages();
                ws.send(JSON.stringify(groupMessages));

                // TODO: notificar que este usuario se conecto al chat
            },
            async message(ws, message: string) {
                //* Todos los mensajes que llegan al servidor de la misma forma
                // Se envía a un Handler General
                const response = await handleMessage(message, ws.data);

                for (const message of response.personal) {
                    ws.send(JSON.stringify(message));
                }

                for (const message of response.broadcast) {
                    ws.publish(
                        SERVER_CONFIG.defaultChannelName,
                        JSON.stringify(message),
                    );
                }
            },
            close(ws, code, message) {
                //! Una vez que el cliente se desconecta, "de-suscribir" del canal por defecto

                ws.unsubscribe(SERVER_CONFIG.defaultChannelName);
                ws.unsubscribe(ws.data.userId);

                // TODO: Notificar que un usuario salio del chat
            }, // a socket is closed
        }, // handlers
    });

    return server;
};
