import { uuidv4 } from '../common';
import { config } from '../config/config';
import Contact from '../models/contact';
import Message from '../models/message';
import { contacts } from '../store/contacts';
import { ContactRequest, DtIdInterface, MessageBodyTypeInterface, MessageInterface, MessageTypes } from '../types';
import { sendMessageToApi } from './apiService';
import { addChat } from './chatService';
import { appendSignatureToMessage } from './keyService';
import { getMyLocation } from './locationService';
import { parseMessage } from './messageService';
import { sendEventToConnectedSockets } from './socketService';

export const addContact = async (username: string, location: string, addMessage: Message<MessageBodyTypeInterface>) => {
    // sendAddContact(username, location, addMessage);

    const contact = new Contact(username, location);

    // console.log(`Adding contact  ${contact.id}`);
    contacts.push(contact);

    const message: MessageInterface<MessageBodyTypeInterface> = parseMessage(addMessage);
    console.log(`creating chat`);
    const myLocation = await getMyLocation();
    const chat = addChat(
        contact.id,
        [contact, new Contact(config.userid, myLocation)],
        false,
        [message],
        contact.id,
        true,
        contact.id
    );

    // // TODO clean this up
    // if (!chat) {
    //     res.sendStatus(200);
    //     return;
    // }

    const url = `/api/messages`;
    const data: Message<ContactRequest> = {
        id: uuidv4(),
        to: contact.id,
        body: {
            id: <DtIdInterface>contact.id,
            location: <string>myLocation,
        },
        from: config.userid,
        type: MessageTypes.CONTACT_REQUEST,
        timeStamp: new Date(),
        replies: [],
        signatures: [],
        subject: null,
    };
    console.log('sending to ', url);
    console.log(data);
    appendSignatureToMessage(data);
    await sendMessageToApi(contact.location, data);
    sendEventToConnectedSockets('connectionRequest', chat);
};
