import { prisma } from '../prisma/db';
import * as Bun from 'bun';
import { generateJwToken } from '../utils/jwt-validation';

export const handleApiRequest = async (req: Request) => {
    const url = new URL(req.url);

    if (req.method === 'POST' && url.pathname === '/api/login') {
        return handleLogin(req);
    }
};

const handleLogin = async (req: Request): Promise<Response> => {
    try {
        const body = await req.json();
        const { email = '', password = '' } = body as {
            email: string;
            password: string;
        };

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const isPasswordValid = Bun.password.verifySync(
            `${password}`,
            user.password,
        );

        if (!isPasswordValid) {
            return new Response(JSON.stringify({ error: 'Invalid password' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const token = await generateJwToken(user.id);
        return new Response(
            JSON.stringify({
                token,
                user: { id: user.id, name: user.name, email: user.email },
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    } catch (error) {
        console.log({ error });
        return new Response(JSON.stringify({ error: 'Unknown error' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
