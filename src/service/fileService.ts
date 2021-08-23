import crypto from "crypto"
const fs = require('fs');

export const getDocumentBrowserKey = (canWrite : boolean, path: string) => {
    const fileBuffer = fs.readFileSync(path);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const hex = hashSum.digest('hex');
    return crypto.createHash('sha1').update(`${canWrite?'write':'read'}${path}${hex}`).digest('hex')
}