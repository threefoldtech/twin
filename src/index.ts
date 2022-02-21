import { initKeys, updatePrivateKey, updatePublicKey } from './store/keyStore';
import { initUserData } from './store/user';
import { initTokens } from './store/tokenStore';
import { initYggdrasil, isInitialized as yggdrasilIsInitialized, setupYggdrasil } from './service/yggdrasilService';
import routes from './routes';
import errorMiddleware from './middlewares/errorHandlingMiddleware';
import { httpLogger } from './logger';
import './utils/extensions';
import { startSocketIo } from './service/socketService';
import { getKeyPair } from './service/encryptionService';
import { initRmb } from './service/rmbService';

const initAll = () => {
    initKeys();
    initUserData();
    initTokens();
    initYggdrasil();
    initRmb();
};

export {
    initAll,
    routes,
    errorMiddleware,
    httpLogger,
    startSocketIo,
    updatePrivateKey,
    updatePublicKey,
    yggdrasilIsInitialized,
    setupYggdrasil,
    getKeyPair,
};
