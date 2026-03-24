import index from '../public/index.html';

type WebSocketData = {
    channelId: string;
    xToken: string;
    session: Session;
};

type Session = {
    id: number;
    sessionId: string;
};

const server = Bun.serve({
    port: 3100,
    routes: {
        '/': index,
    },
    fetch(req, server) {
        const cookies = new Bun.CookieMap(req.headers.get('cookie')!);
        const channelId =
            new URL(req.url).searchParams.get('channelId') || 'general-chat';
        const xToken = cookies.get('X-Token');
        const session = cookies.get('session')
            ? JSON.parse(cookies.get('session')!)
            : {};
        // console.log({ channelId, xToken, session });

        if (!xToken || !session) return; // Validar el JWT contra su forma de firmar los tokens

        server.upgrade(req, { data: { channelId, xToken, session } }); // upgrade the request to a WebSocket

        return undefined;

        // upgrade the request to a WebSocket
        // if (server.upgrade(req)) {
        //     return; // do not return a Response
        // }
        // return new Response('Upgrade failed', { status: 500 });
    },
    websocket: {
        data: {} as WebSocketData,
        message(ws, message: string) {
            // console.log({ ws, message });
            // ws.send(message.toUpperCase()); // Send solo manda el mensaje a ese cliente
            ws.publish('general-chat', message); // Publish manda el mensaje a todos los clientes conectados
        }, // a message is received
        open(ws) {
            console.log('Cliente conectado');
            ws.subscribe('general-chat'); // Subscribe hace que el cliente se suscriba a un canal, en este caso "general-chat"
        }, // a socket is opened
        close(ws, code, message) {
            console.log('Cliente desconectado');
        }, // a socket is closed
        // drain(ws) {}, // the socket is ready to receive more data
    }, // handlers
});

console.log(`Escuchando puerto ${server.url}`);
