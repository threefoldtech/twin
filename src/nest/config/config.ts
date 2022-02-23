import { parseInt } from 'lodash';

export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    node_env: process.env.NODE_ENV || 'development',
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        db: parseInt(process.env.REDIS_DB) || 0,
        password: process.env.REDIS_PASSWORD || 'password',
        keyPrefix: process.env.REDIS_PRIFIX || '',
    },
});
