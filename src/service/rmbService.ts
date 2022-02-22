import { createClient } from 'redis';
import { uuidv4 } from '../common';
import { config } from '../config/config';

enum RmbQueue {
    Local = 'msgbus.system.local',
    Reply = 'msgbus.system.reply',
}

enum TwinCommand {
    AddMessage = 'twin.message.add',
}

interface IMessage {
    ver: number;
    cmd: string;
    exp: number;
    try: number;
    dat: string;
    src: number;
    dst: Array<number>;
    ret: string;
    shm: string;
    now: number;
    pxy: boolean;
    err: string;
}

export interface IIdentifiedMessage extends IMessage {
    uid: string;
}

interface ITaggedMessage extends IMessage {
    tag: number;
}

const getQueue = (command: string) => `msgbus.${command}`;

const createData = (data: any) =>
    !data ? undefined : Buffer.from(typeof data === 'string' ? data : JSON.stringify(data), 'utf8').toString('base64');

const getData = (data: string) => (!data ? undefined : Buffer.from(data, 'base64').toString('utf8'));

const createRequest = (data: any) => {
    return {
        tag: 1, // dunno
        ver: 1, // version identifier (always 1 for now)
        uid: '', // unique id (filled by server)
        cmd: 'twin.message.add', // command to call (aka function name)
        exp: 3600, // expiration in seconds (relative to 'now')
        try: 4, // amount of retry if remote cannot be joined
        dat: createData(data), // data base64 encoded
        src: 0, // source twin id (filled by server)
        dst: [2], // list of twin destination id (filled by client)
        ret: uuidv4(), // return queue expected (please use uuid4)
        shm: '', // schema definition (not used now)
        now: Date.now(), // sent timestamp (filled by client)
        err: '', // optional error (would be set by server)
    };
};

const log = (msg: string, channel?: string) => {
    console.log(`[RMB]`, channel ? `[${channel}]` : '', msg);
};

const handleAddMessage = (message: IIdentifiedMessage) => {
    console.log(message);
};

type CallbackReturnType = void;
type OnEventCallback = (msg: IIdentifiedMessage) => Promise<CallbackReturnType> | CallbackReturnType;

interface IEventListener<T extends string> {
    on(event: T | RmbQueue, callback: OnEventCallback): void;
    emit(event: string, msg: IIdentifiedMessage): void;
}

interface ISubscriber {
    event: string;
    callback: OnEventCallback;
}

// Ripoff of Node EventEmitter. EventEmitter does not return original event, which is needed for reply
// Custom implementation, could be beter
abstract class EventListener<T extends string> implements IEventListener<T> {
    private subscribers: Array<ISubscriber>;

    constructor() {
        this.subscribers = [];
    }

    on(event: T | RmbQueue, callback: OnEventCallback) {
        //TODO: Priority?
        let e = event.toString();
        if (!e.startsWith('msgbus.')) e = `msgbus.${event}`;
        this.subscribers.push({
            event: e,
            callback: callback,
        });
    }

    emit(event: string, msg: IIdentifiedMessage): Error | undefined {
        if (!event.startsWith('msgbus.')) event = `msgbus.${event}`;
        const subs = this.subscribers.filter(s => s.event === event);
        let error: Error | undefined;
        Promise.all(
            subs.map(async s => {
                try {
                    //TODO: Add result?
                    await s.callback(msg);
                } catch (e: any) {
                    //TODO: Retry?
                    //Don't want to block other listeners becasue of error
                    error = new Error(e);
                }
            })
        );

        return error;
    }
}

class TwinEventListener extends EventListener<TwinCommand> {}
export const twinEventListener = new TwinEventListener();

const createReply = (msg: IIdentifiedMessage, data?: string) => {
    const reply = { ...msg };
    const dst = reply.src;
    const src = reply.dst[0];
    reply.src = src;
    reply.dst = [dst];
    reply.now = Date.now();
    reply.dat = data ?? '';
    return reply;
};

let interval: any = undefined;

export const initRmb = async () => {
    const client = createClient();
    client.on('error', err => console.log('Redis Client Error', err));
    await client.connect();
    const subscriber = client.duplicate();
    await subscriber.connect();

    await subscriber.pSubscribe('msgbus.*', async (message: string, channel: string) => {
        console.log(channel);
        if (!message) {
            log('Undefined incoming message', channel);
            return;
        }

        const msg = JSON.parse(message) as IIdentifiedMessage;
        if (!msg) {
            log('Could not parse message', channel);
            return;
        }

        const error = twinEventListener.emit(channel, msg);
        if (channel === RmbQueue.Reply) return;
        const errorBase64 = createData(error?.toString());
        const reply = createReply(msg, errorBase64);
        await client.rPush(msg.ret, JSON.stringify(reply));
    });

    twinEventListener.on(RmbQueue.Reply, msg => {
        //TODO: Do something with replies?
    });

    twinEventListener.on(TwinCommand.AddMessage, handleAddMessage);

    console.log('a moeder');
    const request = createRequest({ data: 'test' });
    if (interval) clearInterval(interval);
    interval = setInterval(async () => {
        if (config.twinId === 1) await client.rPush(RmbQueue.Local, JSON.stringify(request));
    }, 10000);
};
