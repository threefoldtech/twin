import { parseInt } from 'lodash';

export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    node_env: process.env.NODE_ENV || 'development',
    redis: {
        url: process.env.REDIS_URL,
    },
});
