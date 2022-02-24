import { Injectable } from '@nestjs/common';
import nacl, { SignKeyPair } from 'tweetnacl';
import { decodeBase64 } from 'tweetnacl-util';

@Injectable()
export class EncryptionService {
    /**
     * Generates a base64 string from a Uint8Array.
     * @param {Uint8Array} uint8array - The Uint8Array.
     * @return {string} base64 - The generated base64.
     */
    uint8ToBase64(uint8array: Uint8Array): string {
        return Buffer.from(uint8array).toString('base64');
    }

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
