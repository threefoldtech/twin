import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';

import { EncryptionService } from '../../encryption/service/encryption.service';
import { LocationResponse } from '../models/location.model';

@Injectable()
export class LocationService {
    constructor(private readonly _encryptionService: EncryptionService) {}
    /**
     * Gets locations.
     * @return {LocationResponse} - The locations.
     */
    getLocations(): LocationResponse {
        return {
            data: [
                {
                    id: 1,
                    location: 'localhost',
                },
                {
                    id: 2,
                    location: 'localhost',
                },
            ],
        };
    }

    getOwnLocation(): Promise<unknown> {
        return new Promise((res, rej) => {
            exec(
                "yggdrasilctl -v getSelf | sed -n -e 's/^.*IPv^ address.* //p'",
                (err: Error, stdout: string, sterr: string) => {
                    if (err) return rej();
                    if (sterr) return rej();
                    const address = stdout.replace(/(\r\n|\n|\r)/gm, '').trim();
                    res(address);
                }
            );
        });
    }

    // registerDigitalTwin(doubleName: string, derivedSeed: string, yggdrasilAddress: string) {
    //     // const seed = new Uint8Array(decodeBase64(derivedSeed)); // TODO: make this a method in encryption service
    //     // const keyPair = this._encryptionService.getKeyPair(seed);
    //     // const data = new Uint8Array(Buffer.from(yggdrasilAddress)); // TODO:  also make this a function in encryption service
    //     // TODO: continue here
    // }
}
