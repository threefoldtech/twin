import { Injectable } from '@nestjs/common';
import { box, BoxKeyPair, hash, sign, SignKeyPair } from 'tweetnacl';
import { decodeBase64 } from 'tweetnacl-util';

@Injectable()
export class EncryptionService {
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

    /**
     * Generates a base64 string from a Uint8Array.
     * @param {Uint8Array} uint8array - The Uint8Array.
     * @return {string} base64 - The generated base64.
     */
    uint8ToBase64(uint8array: Uint8Array): string {
        return Buffer.from(uint8array).toString('base64');
    }

    /**
     * Encodes a Uint8Array to string.
     * @param {Uint8Array} bytes - the HEX to encode.
     * @return {string} - The encoded HEX.
     */
    encodeHex(bytes: Uint8Array): string {
        return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
    }

    /**
     * Decodes a string to a Uint8Array.
     * @param {string} hexString - the string to decode to HEX.
     * @return {Uint8Array} - The decoded HEX string.
     */
    decodeHex(hexString: string): Uint8Array {
        return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    }

    decodeSeed(seed: string): Uint8Array {
        return new Uint8Array(decodeBase64(seed));
    }

    decodeAddress(address: string): Uint8Array {
        return new Uint8Array(Buffer.from(address));
    }

    signAddress(data: Uint8Array, secretKey: Uint8Array): string {
        return Buffer.from(sign(data, secretKey)).toString('base64');
    }
}
