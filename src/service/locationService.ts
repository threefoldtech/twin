import axios from "axios";
import {config} from '../config/config';
import nacl from 'tweetnacl';
import {getKeyPair} from "./encryptionService";

const {exec} = require('child_process');

export const getMyLocation = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        //@ts-ignore
        exec(
            "yggdrasilctl  -v getSelf | sed -n -e 's/^.*IPv6 address.* //p'",
            (error: any, stdout: any, stderr: any) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return reject();
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return reject();
                }
                const address = stdout.replace(/(\r\n|\n|\r)/gm, '').trim();
                resolve(address);
            }
        );
    });
};


export const registerDigitaltwin = async (doubleName: string, derivedSeed: string, yggdrasilAddress: string) => {
    const keyPair = getKeyPair(derivedSeed);
    const data = new Uint8Array(Buffer.from(yggdrasilAddress));
    const signedAddress = Buffer.from(nacl.sign(data, keyPair.secretKey)).toString('base64')
    await axios.put(`${config.appBackend}/api/users/digitaltwin/${doubleName}`, {
        app_id: config.appId,
        signed_yggdrasil_ip_address: signedAddress
    });

}
