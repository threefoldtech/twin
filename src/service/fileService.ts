import crypto from "crypto"

export const getDocumentBrowserKey = (canWrite : boolean, path: string) => {
    return crypto.createHash('sha1').update(`${canWrite?'write':'read'}${path}${Buffer.from(path).toString('base64')}`).digest('hex')
}