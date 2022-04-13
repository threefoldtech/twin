import axios from 'axios';

import { config } from '../config/config';
import Chat from '../models/chat';
import Contact from '../models/contact';
import Message from '../models/message';
import { SystemMessageType } from '../types';
import { sendMessageToApi } from './apiService';
import { persistMessage } from './chatService';
import { deleteChat, persistChat } from './dataService';
import { sendEventToConnectedSockets } from './socketService';
import { getFullIPv6ApiLocation } from './urlService';

export const handleSystemMessage = (message: Message<{ contact: Contact; type: string }>, chat: Chat) => {
    if (message.body.type !== SystemMessageType.USER_LEFT_GROUP && chat.adminId !== message.from) {
        throw Error('not allowed');
    }

    switch (message.body.type) {
        case SystemMessageType.ADDUSER: {
            const path = getFullIPv6ApiLocation(message.body.contact.location, '/v1/group/invite');
            chat.contacts.push(message.body.contact);
            //@todo send message request to invited 3 bot
            try {
                axios
                    .put(path, chat)
                    .then(() => {
                        sendEventToConnectedSockets('chat_updated', chat);
                        sendMessageToApi(message.body.contact.location, message);
                    })
                    .catch(() => {
                        console.log('failed to send group request');
                    });
            } catch (e) {
                console.log('failed to send group request');
            }

            break;
        }
        case SystemMessageType.USER_LEFT_GROUP: {
            chat.contacts = chat.contacts.filter(c => c.id !== message.body.contact.id);
            sendEventToConnectedSockets('chat_updated', chat);
            break;
        }
        case SystemMessageType.REMOVEUSER:
            if (message.body.contact.id === config.userid) {
                deleteChat(<string>chat.chatId);
                sendEventToConnectedSockets('chat_removed', chat.chatId);
                return;
            }
            chat.contacts = chat.contacts.filter(c => c.id !== message.body.contact.id);

            sendEventToConnectedSockets('chat_updated', chat);
            sendMessageToApi(message.body.contact.location, message);
            break;
        case SystemMessageType.JOINED_VIDEOROOM: {
            persistMessage(chat.chatId, message);
            return;
        }
        case SystemMessageType.CONTACT_REQUEST_SEND: {
            persistMessage(chat.chatId, message);
            return;
        }
        default:
            throw Error(`not implemented type: ${message.body.type}`);
    }

    persistChat(chat);
};
