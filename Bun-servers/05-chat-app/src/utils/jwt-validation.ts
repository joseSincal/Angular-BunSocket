import * as jose from 'jose';

interface JwtPayload {
    userId: string;
}

export const generateJwToken = async (userId: string) => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = new jose.SignJWT({
        userId,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('2h')
        .sign(secret);

    return token;
};

export const validateJwToken = async (token: string) => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    return payload;
};
