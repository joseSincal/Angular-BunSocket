import { SERVER_CONFIG } from '../src/config/server-config';
import { prisma } from '../src/prisma/db';
import * as Bun from 'bun';

const seedUsers = [
    {
        name: 'Juan Perez',
        email: 'juan@google.com',
        password: '123456',
    },
    {
        name: 'Maria Gomez',
        email: 'maria@google.com',
        password: '123456',
    },
    {
        name: 'Pedro Rodriguez',
        email: 'pedro@google.com',
        password: '123456',
    },
    {
        name: 'Ana Lopez',
        email: 'ana@google.com',
        password: '123456',
    },
    {
        name: 'Luis Martinez',
        email: 'luis@google.com',
        password: '123456',
    },
];

const main = async () => {
    console.log('Seeding database...');

    await prisma.directMessage.deleteMany();
    await prisma.groupMessage.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();

    // ! Crear Usuarios
    const userWithHashedPassword = seedUsers.map((user) => ({
        ...user,
        password: Bun.password.hashSync(user.password),
    }));
    await prisma.user.createMany({
        data: userWithHashedPassword,
    });

    // ! Crear el grupo por defecto
    await prisma.group.create({
        data: {
            name: SERVER_CONFIG.defaultChannelName,
        },
    });

    const user = await prisma.user.findUnique({
        where: {
            email: 'juan@google.com',
        },
    });
    console.log({ user });
    console.log(
        'Password valid:',
        Bun.password.verifySync('123456', user?.password || ``),
    );

    console.log('Process finished...');
};

main();
