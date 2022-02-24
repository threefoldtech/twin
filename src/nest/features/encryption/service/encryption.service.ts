import { Injectable } from '@nestjs/common';
import { sign, box, hash, BoxKeyPair, SignKeyPair } from 'tweetnacl';

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
     * @param {Uint8Array} seed.
     * @return {SignKeyPair} - The generated signed key pair values.
     */
    getKeyPair(seed: Uint8Array): SignKeyPair {
        return sign.keyPair.fromSeed(seed);
    }

    /**
     * Gets the encryption key pair.
     * @param {Uint8Array} key.
     * @return {BoxKeyPair} - The generated encryption key pair values.
     */
    getEncryptionKeyPair(key: Uint8Array): BoxKeyPair {
        return box.keyPair.fromSecretKey(key);
    }

    /**
     * Creates a hash from given seed
     * @param {string} seed - Seed to make hash from.
     * @return {Uint8Array} - The generated hash in Uint8Array format.
     */
    generateHashFromSeed(seed: string): Uint8Array {
        return hash(Buffer.from(seed)).slice(0, 32);
    }
}
