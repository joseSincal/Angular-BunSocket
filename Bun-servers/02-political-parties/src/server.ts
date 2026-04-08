import { SERVER_CONFIG } from './config/server.config';

import indexHtml from '../public/index.html';
import { generateUUID } from './utils/generate-uuid';
import type { WebSocketData } from './types';
import { handleGetParties, handleMessage } from './handlers/message.handler';

export const createServer = () => {
    const server = Bun.serve<WebSocketData>({
        port: SERVER_CONFIG.port,
        routes: {
            '/': indexHtml,
        },
        fetch(req, server) {
            // Identificar nuestros clientes
            const clientId = generateUUID();

            const upgraded = server.upgrade(req, { data: { clientId } });

            if (upgraded) {
                return undefined;
            }
            return new Response('Upgrade failed', { status: 500 });
        },
        websocket: {
            open(ws) {
                console.log(`Cliente: ${ws.data.clientId}`);
                ws.subscribe(SERVER_CONFIG.defaultChannelName);

                //! emitir el listado actual de los partidos politicos
                const partyListMessage = handleGetParties();
                ws.send(JSON.stringify(partyListMessage));
            },
            message(ws, message: string) {
                const response = handleMessage(message);
                const responseString = JSON.stringify(response);

                if (response.type === 'ERROR') {
                    ws.send(responseString);
                    return;
                }

                if (response.type === 'PARTIES_LIST') {
                    ws.send(responseString);
                    return;
                }

                ws.send(responseString);
                ws.publish(SERVER_CONFIG.defaultChannelName, responseString);
            },
            close(ws, code, message) {
                console.log(`Cliente desconectado: ${ws.data.clientId}`);
                ws.unsubscribe(SERVER_CONFIG.defaultChannelName);
            },
        },
    });

    return server;
};
