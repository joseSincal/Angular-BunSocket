export const SERVER_CONFIG = {
    port: Number(process.env.PORT) || 3000,
    defaultChannelName: process.env.DEFAULT_CHANNEL || 'political-parties',
} as const;
