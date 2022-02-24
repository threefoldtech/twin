import { Injectable } from '@nestjs/common';
import nacl, { SignKeyPair } from 'tweetnacl';
import { decodeBase64 } from 'tweetnacl-util';

@Injectable()
export class EncryptionService {
    /**
     * Generates a new signed key pair from user seed.
     * @param {string} userSeed - Users seed string.
     * @return {SignKeyPair} - The generated signed key pair values.
     */
    getKeyPair(userSeed: string): SignKeyPair {
        const seed = new Uint8Array(decodeBase64(userSeed));
        return nacl.sign.keyPair.fromSeed(seed);
    }
}
