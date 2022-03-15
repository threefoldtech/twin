import { MessageDTO } from '../dtos/message.dto';

/* State pattern used for handling different types of messages */
export interface MessageState {
    handle<T>(message: MessageDTO<T>): Promise<unknown>;
}

export class ContactRequestMessageState implements MessageState {
    handle<T>(message: MessageDTO<T>): Promise<unknown> {
        throw new Error('Method not implemented.');
    }
}

export class SystemMessageState implements MessageState {
    handle(): Promise<unknown> {
        throw new Error('Method not implemented.');
    }
}

export class AddUserMessageState implements MessageState {
    handle(): Promise<unknown> {
        throw new Error('Method not implemented.');
    }
}
